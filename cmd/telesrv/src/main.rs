use std::io;
use std::net::SocketAddr;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use pylagram_mtprotoedge::framing;
use pylagram_mtprotoedge::session::Session;
use pylagram_mtprotoedge::transport;
use pylagram_mtprotoedge::wrappers::{MsgKind, MsgWrapper};
use pylagram_admin::server::{self, AdminState};
use pylagram_rpc::dispatch::{self, RpcOutcome};
use pylagram_rpc::errors::{self, RpcError};
use pylagram_rpc::layers;
use pylagram_rpc::router::Router;
use pylagram_rpc::services::AuthService;
use tokio::net::TcpStream;

/// Builds an MTProto `rpc_error` body from a domain RPC error code.
fn rpc_error_body(code: i32) -> Vec<u8> {
    let mut body = Vec::new();
    body.extend_from_slice(&framing::MSG_TYPE_RPC_ERROR.to_be_bytes());
    body.extend_from_slice(&code.to_be_bytes());
    // error message string (small): len + text + zero padding up to multiple of 4
    let msg = b"RPC_ERROR";
    body.push(msg.len() as u8);
    body.extend_from_slice(msg);
    let total = msg.len() + 1;
    body.extend(std::iter::repeat(0u8).take((4 - (total % 4)) % 4));
    body
}

/// Handles a single MTProto client connection: session -> frame -> decrypt ->
/// unwrap -> dispatch -> encrypt -> frame.
pub async fn handle_connection(mut stream: TcpStream, peer: SocketAddr) -> io::Result<()> {
    let mut session = Session::new();
    let hello = session.begin();
    let _phase = session.phase();
    let _ = peer;
    let _ = hello;

    let mut session_key = [0u8; 32];
    session.accept_client_hello(0, [0u8; 32]);
    session_key = session.derive_session_key().unwrap_or(session_key);

    let mut router = Router::new();
    // Feature services register their method families here as they are ported.
    router.register_method("auth", Box::new(AuthService));

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

        // Wire: decrypt -> classify wrapper -> extract rpc -> dispatch -> respond.
        let kind = MsgKind::from_msg_type(msg_type);
        let wrapper = match MsgWrapper::decode(&plaintext, kind) {
            Some(wrapper) => wrapper,
            None => break,
        };

        let outcome = match wrapper.rpc() {
            Some(rpc) => {
                let outcome = match layers::method_name(rpc) {
                    Some(method) => dispatch::dispatch(&router, method, rpc),
                    None => RpcOutcome::failure(RpcError::new(errors::ERR_INPUT_REQUEST_INVALID)),
                };
                outcome
            }
            None => RpcOutcome::not_implemented(),
        };

        let response_type = if outcome.ok {
            msg_type
        } else {
            framing::MSG_TYPE_RPC_ERROR
        };
        let response_body = if outcome.ok {
            outcome.payload
        } else {
            rpc_error_body(outcome.error.map(|e| e.code).unwrap_or(errors::ERR_INPUT_REQUEST_INVALID))
        };

        let response_ciphertext = session
            .encrypt_message(&session_key, &nonce, &response_body)
            .unwrap_or_default();

        let mut frame = Vec::new();
        frame.extend_from_slice(&response_type.to_be_bytes());
        frame.extend_from_slice(&msg_id.to_be_bytes());
        frame.extend_from_slice(&seqno.to_be_bytes());
        frame.extend_from_slice(&seq.to_be_bytes());
        frame.extend_from_slice(&(response_ciphertext.len() as i32).to_be_bytes());
        frame.extend_from_slice(&response_ciphertext);
        stream.write_all(&frame).await?;
    }

    Ok(())
}

/// Binds the MTProto TCP listener and accepts client connections.
pub async fn serve(addr: SocketAddr) -> std::io::Result<()> {
    let listener = transport::bind(addr).await?;
    let admin_state = std::sync::Arc::new(AdminState::new());
    tokio::spawn(async move {
        let _ = server::serve(SocketAddr::from(([0, 0, 0, 0], 2599)), admin_state).await;
    });
    loop {
        let (stream, peer) = transport::accept(&listener).await?;
        tokio::spawn(async move { handle_connection(stream, peer).await });
    }
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    println!("PylaGram server — Rust rewrite of gram/srv (telesrv). Starting...");
    serve(SocketAddr::from(([0, 0, 0, 0], 2398))).await
}
