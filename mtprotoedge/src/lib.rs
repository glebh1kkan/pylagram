//! PylaGram — MTProto edge: TCP/WS transport, handshake, crypto, framing,
//! wrapper handling (invokeWithLayer/initConnection/invokeAfter) for the Rust rewrite of `telesrv/internal/mtprotoedge`.

pub mod transport;
pub mod handshake;
pub mod crypto;
pub mod framing;
pub mod wrappers;
