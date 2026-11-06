//! PylaGram — admin layer: minimal HTTP admin API + dashboard UI.

use std::io;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

#[derive(Debug)]
pub struct AdminState {
    started_at: Instant,
    requests: AtomicU64,
}

impl AdminState {
    pub fn new() -> Self {
        Self {
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
    state.requests.fetch_add(1, Ordering::Relaxed);

    let (status, ctype, body) = match (method.as_str(), path.as_str()) {
        ("GET", "/admin") => (
            "200 OK",
            "text/html; charset=utf-8",
            DASHBOARD_HTML.to_string(),
        ),
        ("GET", "/admin/stats") => (
            "200 OK",
            "application/json",
            format!(
                r#"{{"started_at":"{}","requests":{}}}"#,
                state.started_at.elapsed().as_secs(),
                state.requests.load(Ordering::Relaxed)
            ),
        ),
        ("GET", "/admin/health") => ("200 OK", "application/json", r#"{"ok":true}"#.to_string()),
        _ => ("404 Not Found", "application/json", r#"{"error":"not_found"}"#.to_string()),
    };

    let resp = format!(
        "HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        status,
        ctype,
        body.len(),
        body
    );
    stream.write_all(resp.as_bytes()).await?;
    Ok(())
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
}
