//! PylaGram — MTProto transport layer: TCP listener (and later WebSocket).
//!
//! Accepts inbound MTProto client connections. Frame handling, handshake and
//! crypto stay in their own modules; this module owns the listener lifecycle.
//! (Rust rewrite of the transport layer of `telesrv/internal/mtprotoedge`.)

use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};

/// Starts a TCP listener for incoming MTProto client connections.
pub async fn bind(addr: SocketAddr) -> std::io::Result<TcpListener> {
    TcpListener::bind(addr).await
}

/// Accepts connections — placeholder for the accept loop.
pub async fn accept(listener: TcpListener) -> std::io::Result<(TcpStream, SocketAddr)> {
    listener.accept().await
}
