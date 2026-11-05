//! PylaGram — MTProto session: composes handshake + crypto into one server session.
//!
//! A session owns a [`ServerHandshake`] and provides message-level
//! encrypt/decrypt via the derived session key and MTProto message nonce.

use crate::crypto::{decrypt_message, derive_msg_key, encrypt_message};
use crate::handshake::ServerHandshake;

/// A server-side MTProto session: handshake state + session crypto.
#[derive(Clone)]
pub struct Session {
    handshake: ServerHandshake,
}

impl Session {
    pub fn new() -> Self {
        Self {
            handshake: ServerHandshake::new(),
        }
    }

    pub fn begin(&mut self) -> crate::handshake::ServerHello {
        self.handshake.begin()
    }

    pub fn accept_client_hello(&mut self, client_nonce: i64, client_key: [u8; 32]) -> bool {
        self.handshake.accept_client_hello(client_nonce, client_key)
    }

    pub fn derive_session_key(&mut self) -> Option<[u8; 32]> {
        self.handshake.derive_session_key()
    }

    pub fn phase(&self) -> crate::handshake::HandshakePhase {
        self.handshake.phase()
    }

    /// Encrypts an application payload as an MTProto message body.
    pub fn encrypt_message(&self, session_key: &[u8; 32], nonce: &[u8], plaintext: &[u8]) -> Option<Vec<u8>> {
        Some(encrypt_message(session_key, nonce, plaintext))
    }

    /// Decrypts an MTProto message body (placeholder for the read loop).
    pub fn decrypt_message(&self, session_key: &[u8; 32], nonce: &[u8], ciphertext: &[u8]) -> Option<Vec<u8>> {
        decrypt_message(session_key, nonce, ciphertext)
    }

    /// Derives the per-message key from the session key + nonce (SHA256).
    pub fn msg_key(&self, session_key: &[u8; 32], nonce: &[u8]) -> [u8; 32] {
        derive_msg_key(session_key, nonce)
    }
}

impl Default for Session {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn full_handshake_to_encrypted_message() {
        let mut session = Session::new();
        let hello = session.begin();
        assert_eq!(hello.server_key.len(), 32);
        assert!(session.accept_client_hello(42, [9u8; 32]));
        let session_key = session.derive_session_key().unwrap();
        assert_eq!(session_key.len(), 32);

        let plaintext = b"hello from client";
        let ciphertext = session.encrypt_message(&session_key, &[7u8; 8], plaintext).unwrap();
        assert_eq!(ciphertext.len(), plaintext.len() + 16); // GCM appends tag
        let decrypted = session.decrypt_message(&session_key, &[7u8; 8], &ciphertext).unwrap();
        assert_eq!(decrypted, plaintext);
    }
}
