//! PylaGram — admin layer: minimal HTTP admin API + dashboard UI.

use std::collections::{hash_map::DefaultHasher, HashMap, VecDeque};
use std::hash::{Hash, Hasher};
use std::io;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use flate2::write::GzEncoder;
use flate2::Compression;
use serde_json::{json, Value};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

use super::api;
use super::service::AdminService;

const WEB_DIST_DIR: &str = "/root/PylaGram/admin/web-dist";
const MAX_HEADER_BYTES: usize = 128 * 1024;
const READ_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Clone, Debug)]
pub struct ActivityEntry {
    pub at: u64,
    pub method: String,
    pub path: String,
    pub status: u16,
}

impl ActivityEntry {
    fn to_json(&self) -> Value {
        json!({
            "at": self.at,
            "method": self.method,
            "path": self.path,
            "status": self.status,
            "level": if self.status >= 500 {
                "error"
            } else if self.status >= 400 {
                "warn"
            } else {
                "ok"
            },
        })
    }
}

#[derive(Debug)]
pub struct AdminState {
    pub service: Arc<AdminService>,
    started_at: Instant,
    requests: AtomicU64,
    activity: Mutex<VecDeque<ActivityEntry>>,
}

impl AdminState {
    pub fn new() -> Self {
        let service = AdminService::new();
        service.seed();
        let state = Self {
            service,
            started_at: Instant::now(),
            requests: AtomicU64::new(0),
            activity: Mutex::new(VecDeque::new()),
        };
        state.record_activity("SYSTEM", "admin edge started", 200);
        state
    }

    pub fn uptime_seconds(&self) -> u64 {
        self.started_at.elapsed().as_secs()
    }

    pub fn request_count(&self) -> u64 {
        self.requests.load(Ordering::Relaxed)
    }

    pub fn stats_json(&self) -> Value {
        json!({
            "started_at": self.uptime_seconds(),
            "requests": self.request_count(),
        })
    }

    pub fn record_activity(&self, method: &str, path: &str, status: u16) {
        let now = unix_now();
        let mut log = self
            .activity
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if let Some(last) = log.back() {
            if last.method == method
                && last.path == path
                && last.status == status
                && now.saturating_sub(last.at) < 2
            {
                return;
            }
        }
        log.push_back(ActivityEntry {
            at: now,
            method: method.to_string(),
            path: path.to_string(),
            status,
        });
        while log.len() > 250 {
            log.pop_front();
        }
    }

    pub fn activity_json(&self, limit: usize) -> Value {
        let log = self
            .activity
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let rows: Vec<Value> = log
            .iter()
            .rev()
            .take(limit.clamp(1, 200))
            .map(ActivityEntry::to_json)
            .collect();
        json!({ "rows": rows })
    }
}

const DASHBOARD_HTML: &str = r#"<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PylaGram Admin</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; background: #0e0e12; color: #eee; }
    h1 { color: #7aa2ff; }
    button { padding: 8px 16px; margin: 4px; cursor: pointer; }
    pre { background: #16161d; padding: 12px; border-radius: 8px; overflow: auto; }
  </style>
</head>
<body>
  <h1>PylaGram Admin</h1>
  <button onclick="f('/admin/stats')">Stats</button>
  <button onclick="f('/admin/health')">Health</button>
  <pre id="out">loading...</pre>
  <script>
    async function f(p) {
      const r = await fetch(p);
      document.getElementById('out').innerText = JSON.stringify(await r.json());
    }
    f('/admin/stats');
  </script>
</body>
</html>"#;

pub async fn serve(addr: SocketAddr, state: Arc<AdminState>) -> io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    loop {
        let (stream, _) = listener.accept().await?;
        let state = state.clone();
        tokio::spawn(async move {
            let _ = handle(stream, state).await;
        });
    }
}

struct Response {
    status: u16,
    ctype: String,
    body: Vec<u8>,
    headers: Vec<(String, String)>,
}

impl Response {
    fn new(status: u16, ctype: &str, body: Vec<u8>) -> Self {
        Self {
            status,
            ctype: ctype.to_string(),
            body,
            headers: Vec::new(),
        }
    }

    fn json(status: u16, value: &Value) -> Self {
        Self::new(
            status,
            "application/json; charset=utf-8",
            serde_json::to_vec(value).unwrap_or_else(|_| b"{}".to_vec()),
        )
    }

    fn header(mut self, key: &str, value: impl Into<String>) -> Self {
        self.headers.push((key.to_string(), value.into()));
        self
    }
}

async fn handle(mut stream: TcpStream, state: Arc<AdminState>) -> io::Result<()> {
    let _ = stream.set_nodelay(true);
    let mut buf: Vec<u8> = Vec::with_capacity(8192);
    loop {
        let head_end = loop {
            if let Some(pos) = find_bytes(&buf, b"\r\n\r\n") {
                break pos + 4;
            }
            if !read_more(&mut stream, &mut buf).await? {
                return Ok(());
            }
            if buf.len() > MAX_HEADER_BYTES {
                return Ok(());
            }
        };

        let content_len = content_length_bytes(&buf[..head_end]);
        while buf.len() < head_end + content_len {
            if !read_more(&mut stream, &mut buf).await? {
                return Ok(());
            }
        }

        let raw = String::from_utf8_lossy(&buf[..head_end + content_len]).to_string();
        buf.drain(..head_end + content_len);

        let (method, path, _version) = parse_request_line(&raw);
        let path_only = path.split('?').next().unwrap_or(&path).to_string();
        let query = path.split('?').nth(1).unwrap_or("").to_string();
        let body_raw = &raw[head_end..];
        let body = if content_len > 0 {
            &body_raw[..content_len.min(body_raw.len())]
        } else {
            ""
        };
        let keep_alive = wants_keep_alive(&raw);
        state.requests.fetch_add(1, Ordering::Relaxed);

        let response = route_request(&method, &path, &path_only, &query, body, &raw, &state);

        if path_only.starts_with("/api") && path_only != "/api/activity" {
            state.record_activity(&method, &path_only, response.status);
        }

        let mut head = format!(
            "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: {}\r\nX-Content-Type-Options: nosniff\r\n",
            response.status,
            status_text(response.status),
            response.ctype,
            response.body.len(),
            if keep_alive { "keep-alive" } else { "close" }
        );
        for (key, value) in &response.headers {
            head.push_str(key);
            head.push_str(": ");
            head.push_str(value);
            head.push_str("\r\n");
        }
        head.push_str("\r\n");
        stream.write_all(head.as_bytes()).await?;
        if !response.body.is_empty() {
            stream.write_all(&response.body).await?;
        }
        if !keep_alive {
            return Ok(());
        }
    }
}

fn route_request(
    method: &str,
    path: &str,
    path_only: &str,
    query: &str,
    body: &str,
    raw: &str,
    state: &AdminState,
) -> Response {
    if path_only == "/admin" && method == "GET" {
        return Response::new(
            200,
            "text/html; charset=utf-8",
            DASHBOARD_HTML.as_bytes().to_vec(),
        );
    }
    if path_only == "/admin/health" && method == "GET" {
        return Response::new(
            200,
            "application/json",
            r#"{"ok":true}"#.as_bytes().to_vec(),
        );
    }
    if path_only == "/admin/stats" && method == "GET" {
        return Response::json(200, &state.stats_json());
    }
    if path_only.starts_with("/api") {
        if !api::is_public(path_only) {
            let token = extract_token(raw);
            let stored = state.service.get("admin_session_token");
            let stored_str = stored.as_str().unwrap_or("");
            if token.is_empty() || token != stored_str {
                return Response::json(401, &json!({ "error": "unauthorized" }));
            }
        }
        let (status, value) = api::handle(method, path_only, Some(query), Some(body), state);
        let mut response = Response::json(status, &value);
        if method == "POST" && path_only == "/api/login" {
            if let Some(token) = value.get("csrf_token").and_then(|t| t.as_str()) {
                response = response.header(
                    "Set-Cookie",
                    format!(
                        "telesrv_admin_session={}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax",
                        token
                    ),
                );
            }
        }
        if method == "POST" && path_only == "/api/logout" {
            response = response.header(
                "Set-Cookie",
                "telesrv_admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
            );
        }
        return response;
    }

    let accept_encoding = header_value(raw, "accept-encoding").unwrap_or_default();
    let if_none_match = header_value(raw, "if-none-match").unwrap_or_default();
    static_response(path, path_only, &accept_encoding, &if_none_match)
        .unwrap_or_else(|| Response::new(404, "text/plain; charset=utf-8", b"not_found".to_vec()))
}

async fn read_more(stream: &mut TcpStream, buf: &mut Vec<u8>) -> io::Result<bool> {
    let mut chunk = [0u8; 16384];
    match tokio::time::timeout(READ_TIMEOUT, stream.read(&mut chunk)).await {
        Ok(Ok(0)) => Ok(false),
        Ok(Ok(n)) => {
            buf.extend_from_slice(&chunk[..n]);
            Ok(true)
        }
        Ok(Err(err)) => Err(err),
        Err(_) => Ok(false),
    }
}

fn find_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || haystack.len() < needle.len() {
        return None;
    }
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

fn content_length_bytes(head: &[u8]) -> usize {
    let text = String::from_utf8_lossy(head);
    content_length(&text)
}

fn content_length(req: &str) -> usize {
    header_value(req, "content-length")
        .and_then(|value| value.trim().parse::<usize>().ok())
        .unwrap_or(0)
}

fn header_value(req: &str, name: &str) -> Option<String> {
    for line in req.split("\r\n") {
        if let Some((key, value)) = line.split_once(':') {
            if key.trim().eq_ignore_ascii_case(name) {
                return Some(value.trim().to_string());
            }
        }
    }
    None
}

fn wants_keep_alive(req: &str) -> bool {
    let connection = header_value(req, "connection")
        .unwrap_or_default()
        .to_ascii_lowercase();
    if connection.contains("close") {
        return false;
    }
    let version = req.split(' ').nth(2).unwrap_or("");
    if version.starts_with("HTTP/1.0") {
        connection.contains("keep-alive")
    } else {
        true
    }
}

fn extract_token(req: &str) -> String {
    for line in req.split("\r\n") {
        if let Some((key, value)) = line.split_once(':') {
            let k = key.trim().to_lowercase();
            let v = value.trim();
            if k == "authorization" {
                if let Some(rest) = v.strip_prefix("Bearer ") {
                    return rest.trim().to_string();
                }
            }
            if k == "cookie" {
                for pair in v.split(',') {
                    if let Some((ck, cv)) = pair.split_once('=') {
                        if ck.trim() == "telesrv_admin_session" {
                            return cv.trim().to_string();
                        }
                    }
                }
            }
        }
    }
    String::new()
}

fn content_type_for(path: &str) -> &'static str {
    let ext = path.rsplit('.').next().unwrap_or("");
    match ext {
        "html" => "text/html; charset=utf-8",
        "js" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

fn is_compressible(ctype: &str) -> bool {
    ctype.starts_with("text/")
        || ctype.contains("javascript")
        || ctype.contains("json")
        || ctype.contains("svg")
}

#[derive(Clone)]
struct CachedAsset {
    mtime: SystemTime,
    ctype: &'static str,
    etag: String,
    bytes: Arc<Vec<u8>>,
    gzip: Option<Arc<Vec<u8>>>,
}

type AssetCache = Mutex<HashMap<String, Arc<CachedAsset>>>;
static ASSET_CACHE: OnceLock<AssetCache> = OnceLock::new();

fn resolve_static(path: &str) -> Option<(String, PathBuf)> {
    let rel = path.trim_start_matches('/');
    let rel = rel.split('?').next().unwrap_or(rel);
    let trimmed = rel.trim_end_matches('/');
    let safe_rel = if trimmed.is_empty() {
        // The panel entry is the custom PylaGram design (web-dist/new), not the
        // upstream gram/srv prebuilt SPA that used to live at the web-dist root.
        "new/index.html".to_string()
    } else if rel.ends_with('/') {
        format!("{}/index.html", trimmed)
    } else {
        trimmed.to_string()
    };
    let full = Path::new(WEB_DIST_DIR).join(&safe_rel);
    if full.components().any(|component| {
        let part = component.as_os_str().to_string_lossy();
        part == ".."
    }) {
        return None;
    }
    Some((safe_rel, full))
}

fn load_asset(path: &str) -> Option<Arc<CachedAsset>> {
    let (safe_rel, full) = resolve_static(path)?;
    let metadata = std::fs::metadata(&full).ok()?;
    if !metadata.is_file() {
        return None;
    }
    let mtime = metadata.modified().ok()?;
    let cache = ASSET_CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let mut map = cache
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    if let Some(asset) = map.get(&safe_rel) {
        if asset.mtime == mtime {
            return Some(asset.clone());
        }
    }
    let bytes = std::fs::read(&full).ok()?;
    let ctype = content_type_for(&safe_rel);
    let etag = format!("\"{:x}-{:x}\"", bytes.len(), hash_bytes(&bytes));
    let gzip = if is_compressible(ctype) && bytes.len() > 1024 {
        gzip_bytes(&bytes).map(Arc::new)
    } else {
        None
    };
    let asset = Arc::new(CachedAsset {
        mtime,
        ctype,
        etag,
        bytes: Arc::new(bytes),
        gzip,
    });
    if map.len() > 256 {
        map.clear();
    }
    map.insert(safe_rel, asset.clone());
    Some(asset)
}

fn static_response(
    path: &str,
    path_only: &str,
    accept_encoding: &str,
    if_none_match: &str,
) -> Option<Response> {
    let asset = load_asset(path_only)?;
    let cache_control = if path.contains("?v=")
        || path_only.starts_with("/new/fonts/")
        || path_only.starts_with("/assets/")
    {
        "public, max-age=31536000, immutable"
    } else {
        "no-cache"
    };

    if !if_none_match.is_empty()
        && (if_none_match.trim() == asset.etag
            || if_none_match.trim() == format!("W/{}", asset.etag))
    {
        return Some(
            Response::new(304, asset.ctype, Vec::new())
                .header("ETag", asset.etag.clone())
                .header("Cache-Control", cache_control),
        );
    }

    let use_gzip = accept_encoding
        .to_ascii_lowercase()
        .split(',')
        .any(|part| part.trim().split(';').next() == Some("gzip"))
        && asset.gzip.is_some();

    let body = if use_gzip {
        asset
            .gzip
            .as_ref()
            .map(|g| g.as_ref().clone())
            .unwrap_or_default()
    } else {
        asset.bytes.as_ref().clone()
    };

    let mut response = Response::new(200, asset.ctype, body)
        .header("ETag", asset.etag.clone())
        .header("Cache-Control", cache_control)
        .header("Vary", "Accept-Encoding");
    if use_gzip {
        response = response.header("Content-Encoding", "gzip");
    }
    let _ = path; // path (with query) only matters for cache-control above
    Some(response)
}

fn gzip_bytes(bytes: &[u8]) -> Option<Vec<u8>> {
    use std::io::Write;
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(bytes).ok()?;
    encoder.finish().ok()
}

fn hash_bytes(bytes: &[u8]) -> u64 {
    let mut hasher = DefaultHasher::new();
    bytes.hash(&mut hasher);
    hasher.finish()
}

#[cfg(test)]
fn serve_static(path: &str) -> Option<(String, Vec<u8>)> {
    let asset = load_asset(path)?;
    Some((asset.ctype.to_string(), asset.bytes.as_ref().clone()))
}

fn parse_request_line(req: &str) -> (String, String, String) {
    let mut parts = req.splitn(3, ' ');
    let method = parts.next().unwrap_or("").to_string();
    let path = parts.next().unwrap_or("").to_string();
    let version = parts.next().unwrap_or("").to_string();
    (method, path, version)
}

fn status_text(status: u16) -> &'static str {
    match status {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
        304 => "Not Modified",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        409 => "Conflict",
        422 => "Unprocessable Entity",
        500 => "Internal Server Error",
        _ => "OK",
    }
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_health_path() {
        let (m, p, v) = parse_request_line("GET /admin/health HTTP/1.1");
        assert_eq!(m, "GET");
        assert_eq!(p, "/admin/health");
        assert_eq!(v, "HTTP/1.1");
    }

    #[test]
    fn api_unknown_route_is_not_found() {
        let state = Arc::new(AdminState::new());
        let (status, value) = api::handle("GET", "/api/does-not-exist", None, None, &state);
        assert_eq!(status, 404);
        assert_eq!(value["error"], "not_found");
    }

    #[test]
    fn static_serves_index_for_root() {
        let (ct, bytes) = serve_static("/").unwrap();
        assert!(ct.starts_with("text/html"));
        assert!(!bytes.is_empty());
    }

    #[test]
    fn static_serves_asset() {
        let (ct, bytes) = serve_static("/assets/index-CUtowJ4h.js").unwrap();
        assert_eq!(ct, "text/javascript; charset=utf-8");
        assert!(!bytes.is_empty());
    }

    #[test]
    fn static_blocks_traversal() {
        assert!(serve_static("/../etc/passwd").is_none());
    }

    #[test]
    fn keep_alive_defaults() {
        assert!(wants_keep_alive("GET / HTTP/1.1\r\nHost: x\r\n\r\n"));
        assert!(!wants_keep_alive(
            "GET / HTTP/1.1\r\nConnection: close\r\n\r\n"
        ));
    }

    #[test]
    fn activity_is_recorded_newest_first() {
        let state = AdminState::new();
        state.record_activity("GET", "/api/accounts", 200);
        let value = state.activity_json(10);
        assert_eq!(value["rows"][0]["path"], "/api/accounts");
    }
}
