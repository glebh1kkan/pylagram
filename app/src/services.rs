//! PylaGram — application layer: feature business logic behind the RPC layer.

/// Marker trait for feature business services behind the RPC layer.
pub trait FeatureService {
    /// Short service name, used for logging/diagnostics.
    fn name(&self) -> &'static str;
}

/// In-memory registry of feature business services.
#[derive(Default)]
pub struct App {
    services: Vec<Box<dyn FeatureService>>,
}

impl App {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, service: Box<dyn FeatureService>) {
        self.services.push(service);
    }

    pub fn len(&self) -> usize {
        self.services.len()
    }

    pub fn is_empty(&self) -> bool {
        self.services.is_empty()
    }
}

/// Simple named feature service used as the first app-layer implementation.
#[derive(Debug, Clone)]
pub struct AuthService;

impl FeatureService for AuthService {
    fn name(&self) -> &'static str {
        "auth"
    }
}

impl App {
    pub fn with_auth() -> Self {
        let mut app = Self::new();
        app.register(Box::new(AuthService));
        app
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_registers_and_counts_services() {
        let mut app = App::with_auth();
        assert_eq!(app.len(), 1);
        assert!(!app.is_empty());
        assert_eq!(app.services[0].name(), "auth");
    }

    #[test]
    fn app_empty_by_default() {
        let app = App::new();
        assert!(app.is_empty());
        assert_eq!(app.len(), 0);
    }
}
