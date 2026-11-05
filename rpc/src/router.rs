//! PylaGram — RPC layer: TL dispatch router.

use std::collections::HashMap;

use crate::errors::RpcError;

type Handler = fn() -> Result<(), RpcError>;

/// Router dispatching inbound RPCs by their Telegram function id.
#[derive(Debug, Clone)]
pub struct Router {
    handlers: HashMap<u32, Handler>,
}

impl Router {
    pub fn new() -> Self {
        Self {
            handlers: HashMap::new(),
        }
    }

    pub fn register(&mut self, rpc_id: u32, handler: Handler) {
        self.handlers.insert(rpc_id, handler);
    }

    pub fn dispatch(&self, rpc_id: u32) -> Result<(), RpcError> {
        let handler = self
            .handlers
            .get(&rpc_id)
            .ok_or(RpcError::new(500))?;
        handler()
    }
}

impl Default for Router {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ok_handler() -> Result<(), RpcError> {
        Ok(())
    }

    fn err_handler() -> Result<(), RpcError> {
        return Err(RpcError::new(400));
    }

    #[test]
    fn dispatch_known_rpc() {
        let mut router = Router::new();
        router.register(42, ok_handler);
        assert!(router.dispatch(42).is_ok());
    }

    #[test]
    fn dispatch_unknown_rpc() {
        let router = Router::new();
        assert_eq!(router.dispatch(999), Err(RpcError::new(500)));
    }
}
