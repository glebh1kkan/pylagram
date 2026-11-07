//! PylaGram — RPC layer: TL dispatch router.

use crate::dispatch::RpcOutcome;
use crate::services::FeatureHandler;

/// Router dispatching inbound RPCs by their Telegram method name.
pub struct Router {
    handlers: Vec<(String, Box<dyn FeatureHandler + Send + Sync>)>,
}

impl Router {
    pub fn new() -> Self {
        Self { handlers: Vec::new() }
    }

    /// Registers a handler for an exact method or method prefix.
    pub fn register_method(&mut self, method: &str, handler: Box<dyn FeatureHandler>) {
        self.handlers.push((method.to_string(), handler));
    }

    /// Resolves the handler for a method and runs it. Falls back to a
    /// registered method prefix, then to `NOT_IMPLEMENTED` for unknown methods.
    pub fn dispatch_method(&self, method: &str, rpc: &[u8]) -> RpcOutcome {
        for (prefix, handler) in &self.handlers {
            if method == prefix.as_str() || method.starts_with(&format!("{prefix}.")) {
                return handler.handle(method, rpc);
            }
        }
        RpcOutcome::not_implemented()
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
    use crate::dispatch::RpcOutcome;
    use crate::errors::RpcError;

    struct OkHandler;

    impl FeatureHandler for OkHandler {
        fn handle(&self, _method: &str, rpc: &[u8]) -> RpcOutcome {
            let mut outcome = RpcOutcome::success(rpc);
            outcome.payload = rpc.to_vec();
            outcome
        }
    }

    struct ErrHandler;

    impl FeatureHandler for ErrHandler {
        fn handle(&self, _method: &str, _rpc: &[u8]) -> RpcOutcome {
            RpcOutcome::failure(RpcError::new(400))
        }
    }

    #[test]
    fn dispatch_registered_method_returns_handler_outcome() {
        let mut router = Router::new();
        router.register_method("auth.checkPhoneNumber", Box::new(OkHandler));
        let outcome = router.dispatch_method("auth.checkPhoneNumber", b"rpc-body");
        assert!(outcome.ok);
        assert_eq!(outcome.payload, b"rpc-body".to_vec());
        assert!(outcome.error.is_none());
    }

    #[test]
    fn dispatch_falls_back_to_method_prefix() {
        let mut router = Router::new();
        router.register_method("auth", Box::new(ErrHandler));
        let outcome = router.dispatch_method("auth.checkPhoneNumber", b"rpc-body");
        assert!(!outcome.ok);
        assert_eq!(outcome.error, Some(RpcError::new(400)));
    }

    #[test]
    fn dispatch_unknown_method_returns_not_implemented() {
        let router = Router::new();
        let outcome = router.dispatch_method("unknown.method", b"rpc-body");
        assert!(!outcome.ok);
        assert_eq!(outcome.error, Some(RpcError::new(crate::errors::ERR_NOT_IMPLEMENTED)));
    }
}
