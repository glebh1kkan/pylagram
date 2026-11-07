//! PylaGram — RPC dispatch: entry point resolving an inbound RPC body to a handler outcome.

use crate::errors::RpcError;
use crate::router::Router;

/// Terminal outcome of one inbound RPC dispatch.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RpcOutcome {
    /// Whether the handler completed successfully.
    pub ok: bool,
    /// Successful payload bytes (empty for stub handlers that only fail).
    pub payload: Vec<u8>,
    /// Failure error, if the dispatch did not complete.
    pub error: Option<RpcError>,
}

impl RpcOutcome {
    /// Builds a successful outcome carrying `payload`.
    pub fn success(payload: &[u8]) -> Self {
        Self {
            ok: true,
            payload: payload.to_vec(),
            error: None,
        }
    }

    /// Builds a failed outcome from a domain [`RpcError`].
    pub fn failure(error: RpcError) -> Self {
        Self {
            ok: false,
            payload: Vec::new(),
            error: Some(error),
        }
    }

    /// Builds a `NOT_IMPLEMENTED` outcome for unknown / unhandled methods.
    pub fn not_implemented() -> Self {
        Self::failure(crate::errors::RpcError::new(crate::errors::ERR_NOT_IMPLEMENTED))
    }
}

/// Dispatches an inbound RPC by method name to a registered handler.
pub fn dispatch(router: &Router, method: &str, rpc: &[u8]) -> RpcOutcome {
    router.dispatch_method(method, rpc)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn success_outcome_carries_payload() {
        let outcome = RpcOutcome::success(b"payload");
        assert!(outcome.ok);
        assert_eq!(outcome.payload, b"payload".to_vec());
        assert!(outcome.error.is_none());
    }

    #[test]
    fn failure_outcome_keeps_error() {
        let outcome = RpcOutcome::failure(crate::errors::RpcError::new(crate::errors::ERR_NOT_IMPLEMENTED));
        assert!(!outcome.ok);
        assert!(outcome.error.is_some());
    }
}

