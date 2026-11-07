//! PylaGram — RPC error mapping: error codes from the business layer to RPC error domain.

/// MTProto `INPUT_REQUEST_INVALID` — malformed / rejected RPC request.
pub const ERR_INPUT_REQUEST_INVALID: i32 = 400;
/// MTProto `NOT_AUTHORIZED` — request arrived without a valid session.
pub const ERR_NOT_AUTHORIZED: i32 = 401;
/// MTProto `NOT_IMPLEMENTED` — method exists in the schema but no handler yet.
pub const ERR_NOT_IMPLEMENTED: i32 = 501;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RpcError {
    pub code: i32,
}

impl RpcError {
    pub fn new(code: i32) -> Self {
        Self { code }
    }
}

impl std::fmt::Display for RpcError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "rpc error {}", self.code)
    }
}
