//! PylaGram — services module: feature business logic behind the RPC layer.

use crate::dispatch::RpcOutcome;

/// Feature service handler: business logic bound to one RPC method family.
pub trait FeatureHandler: Send + Sync {
    /// Handles an inbound RPC; returns the terminal outcome.
    fn handle(&self, method: &str, rpc: &[u8]) -> RpcOutcome;
}

/// Auth feature service. Business methods of the auth family are not ported
/// into the Rust rewrite yet, so handled requests resolve to `NOT_IMPLEMENTED`.
#[derive(Debug, Clone)]
pub struct AuthService;

impl FeatureHandler for AuthService {
    fn handle(&self, method: &str, _rpc: &[u8]) -> RpcOutcome {
        if method == "auth" || method.starts_with("auth.") {
            return RpcOutcome::not_implemented();
        }
        RpcOutcome::not_implemented()
    }
}

impl AuthService {
    pub fn new() -> Self {
        Self
    }
}

impl Default for AuthService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn auth_service_reports_not_implemented_for_auth_methods() {
        let service = AuthService::new();
        let outcome = service.handle("auth.checkPhoneNumber", b"rpc-body");
        assert!(!outcome.ok);
    }

    #[test]
    fn auth_service_handles_empty_method_fallback() {
        let service = AuthService::default();
        let outcome = service.handle("whatever", b"rpc-body");
        assert!(!outcome.ok);
    }
}
