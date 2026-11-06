//! PylaGram — admin layer: minimal HTTP admin API + dashboard UI.

use std::io;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;

use serde_json;
use serde_json::json;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

use super::api;
use super::service::AdminService;

const WEB_DIST_DIR: &str = "/root/PylaGram/admin/web-dist";

#[derive(Debug)]
pub struct AdminState {
    pub service: Arc<AdminService>,
    started_at: Instant,
    requests: AtomicU64,
}

impl AdminState {
    pub fn new() -> Self {
        let service = AdminService::new();
        service.seed();
        Self {
            service,
            started_at: Instant::now(),
            requests: AtomicU64::new(0),
        }
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
        tokio::spawn(async move { handle(stream, state).await });
    }
}

async fn handle(mut stream: TcpStream, state: Arc<AdminState>) -> io::Result<()> {
    let mut buf = vec![0u8; 8192];
    let n = stream.read(&mut buf).await? as usize;
    let req = String::from_utf8_lossy(&buf[..n]).to_string();
    let (method, path, _version) = parse_request_line(&req);
    let path_only = path.split('?').next().unwrap_or(&path).to_string();
    let query = path
        .split('?')
        .nth(1)
        .unwrap_or("")
        .to_string();
    let content_len = content_length(&req);
    let head_end = req.find("\r\n\r\n").map(|i| i + 4).unwrap_or(req.len());
    let body_raw = &req[head_end..];
    let body = if content_len > 0 && content_len < body_raw.len() {
        &body_raw[..content_len]
    } else {
        body_raw
    };
    state.requests.fetch_add(1, Ordering::Relaxed);

    let mut login_token: Option<String> = None;
    let (status, ctype, response_body) = if path == "/admin" && method == "GET" {
        (
            "200 OK".to_string(),
            "text/html; charset=utf-8".to_string(),
            DASHBOARD_HTML.as_bytes().to_vec(),
        )
    } else if path == "/admin/health" && method == "GET" {
        (
            "200 OK".to_string(),
            "application/json".to_string(),
            r#"{"ok":true}"#.as_bytes().to_vec(),
        )
    } else if path == "/admin/stats" && method == "GET" {
        (
            "200 OK".to_string(),
            "application/json".to_string(),
            format!(
                r#"{{"started_at":"{}","requests":{}}}"#,
                state.started_at.elapsed().as_secs(),
                state.requests.load(Ordering::Relaxed)
            )
            .into_bytes(),
        )
    } else if path.starts_with("/api") {
        if !api::is_public(&path_only) {
            let token = extract_token(&req);
            let stored = state.service.get("admin_session_token");
            let stored_str = stored.as_str().unwrap_or("");
            if token.is_empty() || token != stored_str {
                let body = serde_json::to_vec(&json!({ "error": "unauthorized" })).unwrap();
                let resp = format!(
                    "HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                    body.len()
                );
                let mut resp = resp.into_bytes();
                resp.extend_from_slice(&body);
                stream.write_all(&resp).await?;
                return Ok(());
            }
        }
        let (s, value) = api::handle(&method, &path_only, Some(query.as_str()), Some(body), &state);
        if method == "POST" && path_only == "/api/login" {
            login_token = value.get("csrf_token").and_then(|t| t.as_str()).map(|s| s.to_string());
        }
        let status_text = match s {
            200 => "200 OK",
            401 => "401 Unauthorized",
            404 => "404 Not Found",
            _ => "200 OK",
        };
        (
            status_text.to_string(),
            "application/json".to_string(),
            serde_json::to_vec(&value).unwrap_or_else(|_| b"{}".to_vec()),
        )
    } else {
        match serve_static(&path_only) {
            Some((ct, bytes)) => ("200 OK".to_string(), ct, bytes),
            None => (
                "404 Not Found".to_string(),
                "text/plain; charset=utf-8".to_string(),
                b"not_found".to_vec(),
            ),
        }
    };

    let mut head = format!(
        "HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n",
        status, ctype, response_body.len()
    );
    if let Some(token) = &login_token {
        head.push_str(&format!("Set-Cookie: telesrv_admin_session={}; Path=/; Max-Age=86400\r\n", token));
    }
    head.push_str("\r\n");
    let mut resp = head.into_bytes();
    resp.extend_from_slice(&response_body);
    stream.write_all(&resp).await?;
    Ok(())
}

fn content_length(req: &str) -> usize {
    for line in req.split("\r\n") {
        if let Some((key, value)) = line.split_once(':') {
            if key.trim().eq_ignore_ascii_case("content-length") {
                if let Ok(n) = value.trim().parse::<usize>() {
                    return n;
                }
            }
        }
    }
    0
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
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

fn serve_static(path: &str) -> Option<(String, Vec<u8>)> {
    let rel = path.trim_start_matches('/');
    let rel = rel.split('?').next().unwrap_or(rel);
    let trimmed = rel.trim_end_matches('/');
    let safe_rel = if trimmed.is_empty() {
        "index.html".to_string()
    } else if rel.ends_with('/') {
        format!("{}/index.html", trimmed)
    } else {
        trimmed.to_string()
    };
    let full = std::path::Path::new(WEB_DIST_DIR).join(&safe_rel);
    if full.components().any(|c| {
        let s = c.as_os_str().to_string_lossy().to_string();
        s == ".."
    }) {
        return None;
    }
    let bytes = std::fs::read(&full).ok()?;
    let ct = content_type_for(&safe_rel).to_string();
    Some((ct, bytes))
}

fn parse_request_line(req: &str) -> (String, String, String) {
    let mut parts = req.splitn(3, ' ');
    let method = parts.next().unwrap_or("").to_string();
    let path = parts.next().unwrap_or("").to_string();
    let version = parts.next().unwrap_or("").to_string();
    (method, path, version)
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
}
