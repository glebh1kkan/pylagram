//! PylaGram — MTProto crypto primitives.
//!
//! Low-level key material for the handshake: ephemeral X25519 keypair
//! generation, Diffie-Hellman shared secret computation, message key
//! derivation and AEAD encryption (AES-256-GCM).
//! (Rust rewrite of the crypto layer of `telesrv/internal/mtprotoedge`.)

use aes_gcm::aead::Aead;
use aes_gcm::{Aes256Gcm, Key, KeyInit, AeadCore};
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;
use sha2::{Digest, Sha256};
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

/// Derives the per-message key: SHA256(session_key[0..32] || nonce).
pub fn derive_msg_key(session_key: &[u8; 32], nonce: &[u8]) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(session_key);
    h.update(nonce);
    h.finalize().into()
}

/// Encrypts `plaintext` with AES-256-GCM under the given message key + nonce.
pub fn encrypt(key: &[u8; 32], nonce: &[u8; 12], plaintext: &[u8]) -> Vec<u8> {
    let key = Key::<Aes256Gcm>::from_slice(key);
    let nonce = aes_gcm::Nonce::<<Aes256Gcm as AeadCore>::NonceSize>::from_slice(nonce);
    let cipher = Aes256Gcm::new(&key);
    cipher
        .encrypt(&nonce, plaintext)
        .expect("aes-gcm encryption failed")
}

/// Decrypts `ciphertext` produced by [`encrypt`] under the same key + nonce.
pub fn decrypt(key: &[u8; 32], nonce: &[u8; 12], ciphertext: &[u8]) -> Option<Vec<u8>> {
    let key = Key::<Aes256Gcm>::from_slice(key);
    let nonce = aes_gcm::Nonce::<<Aes256Gcm as AeadCore>::NonceSize>::from_slice(nonce);
    let cipher = Aes256Gcm::new(&key);
    cipher.decrypt(&nonce, ciphertext).ok()
}

/// Encrypts an application payload as an MTProto message body: derives the
/// message key from the session key + nonce and applies AES-256-GCM.
pub fn encrypt_message(session_key: &[u8; 32], nonce: &[u8], plaintext: &[u8]) -> Vec<u8> {
    let msg_key = derive_msg_key(session_key, nonce);
    let mut nonce12 = [0u8; 12];
    let n = nonce.len().min(12);
    nonce12[..n].copy_from_slice(&nonce[..n]);
    encrypt(&msg_key, &nonce12, plaintext)
}

/// Decrypts an MTProto message body produced by [`encrypt_message`].
pub fn decrypt_message(session_key: &[u8; 32], nonce: &[u8], ciphertext: &[u8]) -> Option<Vec<u8>> {
    let msg_key = derive_msg_key(session_key, nonce);
    let mut nonce12 = [0u8; 12];
    let n = nonce.len().min(12);
    nonce12[..n].copy_from_slice(&nonce[..n]);
    decrypt(&msg_key, &nonce12, ciphertext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aes_gcm_roundtrip() {
        let key = [7u8; 32];
        let nonce = [3u8; 12];
        let plaintext = b"hello pyla gram";
        let ciphertext = encrypt(&key, &nonce, plaintext);
        let decrypted = decrypt(&key, &nonce, &ciphertext).expect("decrypt failed");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn message_roundtrip() {
        let session_key = [9u8; 32];
        let nonce = [5u8; 8];
        let plaintext = b"mtproto payload";
        let ciphertext = encrypt_message(&session_key, &nonce, plaintext);
        let decrypted = decrypt_message(&session_key, &nonce, &ciphertext).expect("decrypt failed");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn message_roundtrip_zero_nonce() {
        let session_key = [1u8; 32];
        let nonce = [0u8; 8];
        let plaintext = b"zero nonce";
        let ciphertext = encrypt_message(&session_key, &nonce, plaintext);
        let decrypted = decrypt_message(&session_key, &nonce, &ciphertext).expect("decrypt failed");
        assert_eq!(decrypted, plaintext);
    }
}


