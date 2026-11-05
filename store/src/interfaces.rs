//! PylaGram — storage layer interfaces.

/// Generic persistence contract used by the layers above (rpc/app).
pub trait Store {
    /// Returns the value for `key`, if present.
    fn get(&self, key: &str) -> Option<Vec<u8>>;
    /// Inserts or overwrites the value for `key`.
    fn set(&self, key: &str, value: &[u8]);
}
