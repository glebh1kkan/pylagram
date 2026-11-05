//! PylaGram — MTProto crypto primitives.
//!
//! Low-level key material for the handshake: ephemeral X25519 keypair
//! generation and Diffie-Hellman shared secret computation.
//! (Rust rewrite of the crypto layer of `telesrv/internal/mtprotoedge`.)

use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;
use x25519_dalek::{PublicKey, StaticSecret};

/// Generates a fresh ephemeral X25519 keypair for the MTProto handshake.
pub fn generate_ephemeral_keypair() -> (PublicKey, StaticSecret) {
    let mut rng = ChaCha20Rng::from_rng(&mut rand::rng());
    let secret = StaticSecret::random_from_rng(&mut rng);
    let public = PublicKey::from(&secret);
    (public, secret)
}

/// Computes the DH shared secret for an established session.
pub fn shared_secret(private: &StaticSecret, peer_public: &PublicKey) -> [u8; 32] {
    private.diffie_hellman(peer_public).to_bytes()
}
