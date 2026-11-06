//! PylaGram — admin layer: minimal HTTP admin API + dashboard UI.

use std::io;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;

use serde_json;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

use super::api;
use super::service::AdminService;

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

    let (status, ctype, response_body) = if path == "/admin" && method == "GET" {
        (
            "200 OK",
            "text/html; charset=utf-8",
            DASHBOARD_HTML.to_string(),
        )
    } else if path == "/admin/health" && method == "GET" {
        ("200 OK", "application/json", r#"{"ok":true}"#.to_string())
    } else if path == "/admin/stats" && method == "GET" {
        (
            "200 OK",
            "application/json",
            format!(
                r#"{{"started_at":"{}","requests":{}}}"#,
                state.started_at.elapsed().as_secs(),
                state.requests.load(Ordering::Relaxed)
            ),
        )
    } else {
        let (s, value) = api::handle(&method, &path_only, Some(query.as_str()), Some(body), &state);
        let status_text = match s {
            200 => "200 OK",
            401 => "401 Unauthorized",
            404 => "404 Not Found",
            _ => "200 OK",
        };
        (
            status_text,
            "application/json",
            serde_json::to_string(&value).unwrap_or_else(|_| "{}".to_string()),
        )
    };

    let resp = format!(
        "HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        status,
        ctype,
        response_body.len(),
        response_body
    );
    stream.write_all(resp.as_bytes()).await?;
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
        let (status, value) = api::handle("GET", "/api/does-not-exist", None, &state);
        assert_eq!(status, 404);
        assert_eq!(value["error"], "not_found");
    }
}
