use std::net::SocketAddr;

use pylagram_mtprotoedge::{session::Session, transport};

/// Binds the MTProto TCP listener and accepts client connections.
/// Frame-level integration (read frame → handshake → encrypt → dispatch) is the
/// next step after hardening the transport read path.
pub async fn serve(addr: SocketAddr) -> std::io::Result<()> {
    let listener = transport::bind(addr).await?;
    loop {
        let (stream, peer) = transport::accept(listener).await?;
        tokio::spawn(async move {
            let mut session = Session::new();
            let hello = session.begin();
            let _phase = session.phase();
            let _ = (stream, peer, hello);
        });
    }
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    println!("PylaGram server — Rust rewrite of gram/srv (telesrv). Starting...");
    serve(SocketAddr::from(([127, 0, 0, 1], 2398))).await
}
