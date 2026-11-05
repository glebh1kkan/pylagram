//! PylaGram — RPC error mapping: error codes from the business layer to RPC error domain.

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
