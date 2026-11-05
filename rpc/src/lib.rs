//! PylaGram — RPC layer: TL dispatch router, layer binding, error mapping,
//! feature services — Rust rewrite of `telesrv/internal/rpc`.

pub mod router;
pub mod dispatch;
pub mod errors;
pub mod layers;
pub mod services;
