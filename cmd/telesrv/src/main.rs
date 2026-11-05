use std::io;
use std::net::SocketAddr;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use pylagram_mtprotoedge::session::Session;
use pylagram_mtprotoedge::transport;
use tokio::net::TcpStream;

/// Handles a single MTProto client connection: session -> frame -> decrypt ->
/// encrypt -> frame.
pub async fn handle_connection(mut stream: TcpStream, peer: SocketAddr) -> io::Result<()> {
    let mut session = Session::new();
    let hello = session.begin();
    let _phase = session.phase();
    let _ = peer;
    let _ = hello;

    let mut session_key = [0u8; 32];
    session.accept_client_hello(0, [0u8; 32]);
    session_key = session.derive_session_key().unwrap_or(session_key);

    loop {
        let mut header = [0u8; 24];
        stream.read_exact(&mut header).await?;
        let msg_type = i32::from_be_bytes([header[0], 0, 0, 0]);
        let msg_id = u64::from_be_bytes([
            header[4], 0, 0, 0, 0, 0, 0, 0,
        ]);
        let seqno = i32::from_be_bytes(header[12..16].try_into().unwrap());
        let seq = i32::from_be_bytes(header[16..20].try_into().unwrap());
        let size = i32::from_be_bytes(header[20..24].try_into().unwrap());

        let mut body = vec![0u8; size.max(0) as usize];
        if size > 0 {
            stream.read_exact(&mut body).await?;
        }

        let nonce = msg_id.to_be_bytes();
        let plaintext = session.decrypt_message(&session_key, &nonce, &body);
        let Some(plaintext) = plaintext else {
            break;
        };
        let ciphertext = session
            .encrypt_message(&session_key, &nonce, &plaintext)
            .unwrap_or_default();

        let mut frame = Vec::new();
        frame.extend_from_slice(&msg_type.to_be_bytes());
        frame.extend_from_slice(&msg_id.to_be_bytes());
        frame.extend_from_slice(&seqno.to_be_bytes());
        frame.extend_from_slice(&seq.to_be_bytes());
        frame.extend_from_slice(&size.to_be_bytes());
        frame.extend_from_slice(&ciphertext);
        stream.write_all(&frame).await?;
    }

    Ok(())
}

/// Binds the MTProto TCP listener and accepts client connections.
pub async fn serve(addr: SocketAddr) -> std::io::Result<()> {
    let listener = transport::bind(addr).await?;
    loop {
        let (stream, peer) = transport::accept(&listener).await?;
        tokio::spawn(async move { handle_connection(stream, peer).await });
    }
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    println!("PylaGram server — Rust rewrite of gram/srv (telesrv). Starting...");
    serve(SocketAddr::from(([127, 0, 0, 1], 2398))).await
}
