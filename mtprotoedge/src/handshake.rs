//! PylaGram — MTProto v2 server handshake state machine.
//!
//! Server side flow: generate ephemeral keypair -> send ServerHello ->
//! receive ClientHello -> derive session key via DH -> establish session.
//! (Rust rewrite of the handshake layer of `telesrv/internal/mtprotoedge`.)

use sha2::{Digest, Sha256};
use x25519_dalek::{PublicKey, StaticSecret};

/// ServerHello: server nonce + ephemeral server public key.
#[derive(Debug, Clone)]
pub struct ServerHello {
    pub server_nonce: i64,
    pub server_key: [u8; 32],
}

/// Phases of the server-side handshake.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HandshakePhase {
    /// Waiting for ClientHello.
    Initial,
    /// ServerHello sent, waiting for ClientHello.
    ServerHelloSent,
    /// ClientHello accepted, session key derived, waiting for AuthKeyEncrypted.
    AuthKeyPending,
    /// Session established.
    Complete,
}

/// Server-side handshake session.
#[derive(Clone)]
pub struct ServerHandshake {
    phase: HandshakePhase,
    ephemeral_public: PublicKey,
    ephemeral_secret: StaticSecret,
    client_hello: Option<(i64, [u8; 32])>,
    session_key: Option<[u8; 32]>,
}

impl ServerHandshake {
    pub fn new() -> Self {
        Self {
            phase: HandshakePhase::Initial,
            ephemeral_public: PublicKey::from(&StaticSecret::from([0u8; 32])),
            ephemeral_secret: StaticSecret::from([0u8; 32]),
            client_hello: None,
            session_key: None,
        }
    }

    /// Starts handshake: generates ephemeral keypair and returns ServerHello.
    pub fn begin(&mut self) -> ServerHello {
        let (public, secret) = crate::crypto::generate_ephemeral_keypair();
        self.ephemeral_public = public;
        self.ephemeral_secret = secret;
        self.phase = HandshakePhase::ServerHelloSent;
        ServerHello {
            server_nonce: 1,
            server_key: public.to_bytes().into(),
        }
    }

    /// Accepts ClientHello (client nonce + client ephemeral public key).
    pub fn accept_client_hello(&mut self, client_nonce: i64, client_key: [u8; 32]) -> bool {
        if self.phase != HandshakePhase::ServerHelloSent {
            return false;
        }
        self.client_hello = Some((client_nonce, client_key));
        self.phase = HandshakePhase::AuthKeyPending;
        true
    }

    /// Derives the session key via DH with the client ephemeral key.
    pub fn derive_session_key(&mut self) -> Option<[u8; 32]> {
        let (_client_nonce, client_key) = self.client_hello?;
        let shared = self
            .ephemeral_secret
            .diffie_hellman(&PublicKey::from(&StaticSecret::from(client_key)));
        let session_key: [u8; 32] = Sha256::digest(shared.to_bytes()).into();
        self.session_key = Some(session_key);
        self.phase = HandshakePhase::Complete;
        Some(session_key)
    }

    pub fn phase(&self) -> HandshakePhase {
        self.phase
    }

    pub fn session_key(&self) -> Option<[u8; 32]> {
        self.session_key
    }
}

impl Default for ServerHandshake {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn phase_lifecycle() {
        let mut hs = ServerHandshake::new();
        assert_eq!(hs.phase(), HandshakePhase::Initial);
        let hello = hs.begin();
        assert_eq!(hs.phase(), HandshakePhase::ServerHelloSent);
        assert_eq!(hello.server_key.len(), 32);
        assert!(hs.accept_client_hello(42, [9u8; 32]));
        assert_eq!(hs.phase(), HandshakePhase::AuthKeyPending);
        let key = hs.derive_session_key().unwrap();
        assert_eq!(hs.phase(), HandshakePhase::Complete);
        assert_eq!(key.len(), 32);
    }

    #[test]
    fn client_hello_rejected_in_wrong_phase() {
        let mut hs = ServerHandshake::new();
        assert!(!hs.accept_client_hello(42, [9u8; 32]));
    }
}
