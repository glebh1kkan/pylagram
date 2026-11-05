//! PylaGram — storage layer: in-memory implementation.

use std::collections::HashMap;
use std::sync::Mutex;

use crate::interfaces::Store;

#[derive(Debug, Default)]
pub struct InMemoryStore {
    data: Mutex<HashMap<String, Vec<u8>>>,
}

impl InMemoryStore {
    pub fn new() -> Self {
        Self::default()
    }
}

impl Store for InMemoryStore {
    fn get(&self, key: &str) -> Option<Vec<u8>> {
        self.data.lock().ok()?.get(key).cloned()
    }

    fn set(&self, key: &str, value: &[u8]) {
        if let Ok(mut guard) = self.data.lock() {
            guard.insert(key.to_string(), value.to_vec());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn store_set_get_roundtrip() {
        let store = InMemoryStore::new();
        assert!(store.get("k").is_none());
        store.set("k", b"v");
        assert_eq!(store.get("k"), Some(b"v".to_vec()));
    }

    #[test]
    fn store_overwrite() {
        let store = InMemoryStore::new();
        store.set("k", b"v1");
        store.set("k", b"v2");
        assert_eq!(store.get("k"), Some(b"v2".to_vec()));
    }
}
