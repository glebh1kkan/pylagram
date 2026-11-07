//! PylaGram — MTProto message wrappers: invoke / invokeWithLayer / initConnection / invokeAfter.
//!
//! After the frame layer has decrypted an inbound MTProto body, the server has
//! to apply the MTProto wrapper semantics before dispatching the RPC:
//! plain invokes, layered invokes (msg layer > 0), connection init payloads and
//! msg-id-targeted invokes.
//! (Rust rewrite of the wrappers layer of `telsrv/internal/mtprotoedge`.)

use crate::framing::{
    MSG_TYPE_INIT_CONNECTION, MSG_TYPE_INVOKE_AFTER, MSG_TYPE_INVOKE_AFTER_MSGS, MSG_TYPE_INVOKE_WITH_LAYER,
    MSG_TYPE_INVOKE_WITHOUT_UPDATES,
};

/// Wrapper kinds applied to decrypted inbound MTProto message bodies.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MsgKind {
    /// Plain RPC invoke (msg layer == 0): the body is the RPC message.
    Invoke,
    /// RPC invoke wrapped in an additional message layer (msg layer > 0).
    InvokeWithLayer,
    /// Initial connection setup payload (client -> server).
    InitConnection,
    /// Invoke addressed to / retargeted by a previous msg id.
    InvokeAfter,
}

impl MsgKind {
    /// Short service name, used for logging/diagnostics.
    pub fn name(&self) -> &'static str {
        match self {
            MsgKind::Invoke => "invoke",
            MsgKind::InvokeWithLayer => "invoke_with_layer",
            MsgKind::InitConnection => "init_connection",
            MsgKind::InvokeAfter => "invoke_after",
        }
    }

    /// Maps an inbound MTProto message type onto the wrapper kind that the
    /// RPC dispatch has to apply for the decrypted body.
    ///
    /// - `initConnection` envelopes carry the raw connection init blob;
    /// - `invokeWithLayer` envelopes carry `[layer: i32 BE][rpc]`;
    /// - `invokeWithoutUpdates` / naked invokes carry the plain RPC;
    /// - `invokeAfter` / `invokeAfterMsgs` envelopes carry `[msg_id: u64 BE][rpc]`.
    ///
    /// Any other message type (RPC results, containers, gzip, ...) resolves to
    /// the plain-invoke kind and is handled by the RPC layer as such.
    pub fn from_msg_type(msg_type: i32) -> Self {
        if msg_type == MSG_TYPE_INIT_CONNECTION {
            Self::InitConnection
        } else if msg_type == MSG_TYPE_INVOKE_WITH_LAYER {
            Self::InvokeWithLayer
        } else if msg_type == MSG_TYPE_INVOKE_WITHOUT_UPDATES {
            Self::Invoke
        } else if msg_type == MSG_TYPE_INVOKE_AFTER || msg_type == MSG_TYPE_INVOKE_AFTER_MSGS {
            Self::InvokeAfter
        } else {
            Self::Invoke
        }
    }
}

/// Inbound MTProto message wrapper: how a decrypted body relates to the RPC payload.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MsgWrapper {
    /// Plain RPC invoke (msg layer == 0): body is the RPC message.
    Invoke { rpc: Vec<u8> },
    /// RPC invoke wrapped in an additional message layer (msg layer > 0).
    /// Body layout: `[layer: i32 BE][rpc bytes ...]`.
    InvokeWithLayer { layer: i32, rpc: Vec<u8> },
    /// Initial connection setup payload (client -> server).
    /// Body layout: raw connection init blob.
    InitConnection { inner: Vec<u8> },
    /// Invoke addressed to / retargeted by a previous msg id.
    /// Body layout: `[msg_id: u64 BE][rpc bytes ...]`.
    InvokeAfter { msg_id: u64, rpc: Vec<u8> },
}

impl MsgWrapper {
    /// Builds a plain RPC invoke wrapper from a decrypted body.
    pub fn invoke(rpc: &[u8]) -> Self {
        Self::Invoke { rpc: rpc.to_vec() }
    }

    /// Builds a layered RPC invoke wrapper: `[layer: i32 BE][rpc ...]`.
    pub fn invoke_with_layer(layer: i32, rpc: &[u8]) -> Self {
        Self::InvokeWithLayer { layer, rpc: rpc.to_vec() }
    }

    /// Builds an initConnection wrapper.
    pub fn init_connection(inner: &[u8]) -> Self {
        Self::InitConnection { inner: inner.to_vec() }
    }

    /// Builds an invokeAfter wrapper: `[msg_id: u64 BE][rpc ...]`.
    pub fn invoke_after(msg_id: u64, rpc: &[u8]) -> Self {
        Self::InvokeAfter { msg_id, rpc: rpc.to_vec() }
    }

    /// Encodes the wrapper back into a decrypted wire body.
    pub fn encode(&self) -> Vec<u8> {
        match self {
            Self::Invoke { rpc } => rpc.clone(),
            Self::InvokeWithLayer { layer, rpc } => {
                let mut buf = Vec::with_capacity(4 + rpc.len());
                buf.extend_from_slice(&layer.to_be_bytes());
                buf.extend_from_slice(rpc);
                buf
            }
            Self::InitConnection { inner } => inner.clone(),
            Self::InvokeAfter { msg_id, rpc } => {
                let mut buf = Vec::with_capacity(8 + rpc.len());
                buf.extend_from_slice(&msg_id.to_be_bytes());
                buf.extend_from_slice(rpc);
                buf
            }
        }
    }

    /// Decodes a wrapper from a decrypted body. The `kind` selects the unwrap rule.
    pub fn decode(body: &[u8], kind: MsgKind) -> Option<Self> {
        match kind {
            MsgKind::Invoke => Some(Self::Invoke { rpc: body.to_vec() }),
            MsgKind::InvokeWithLayer => {
                if body.len() < 4 {
                    return None;
                }
                let layer = i32::from_be_bytes([body[0], body[1], body[2], body[3]]);
                if layer <= 0 {
                    return None;
                }
                Some(Self::InvokeWithLayer { layer, rpc: body[4..].to_vec() })
            }
            MsgKind::InitConnection => Some(Self::InitConnection { inner: body.to_vec() }),
            MsgKind::InvokeAfter => {
                if body.len() < 8 {
                    return None;
                }
                let msg_id = u64::from_be_bytes([
                    body[0], body[1], body[2], body[3], body[4], body[5], body[6], body[7],
                ]);
                Some(Self::InvokeAfter { msg_id, rpc: body[8..].to_vec() })
            }
        }
    }

    /// Extracts the concrete RPC payload from the wrapper.
    /// Returns `None` for wrappers that carry no RPC (initConnection).
    pub fn rpc(&self) -> Option<&[u8]> {
        match self {
            Self::Invoke { rpc } => Some(rpc),
            Self::InvokeWithLayer { rpc, .. } => Some(rpc),
            Self::InvokeAfter { rpc, .. } => Some(rpc),
            Self::InitConnection { .. } => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invoke_wrapper_roundtrip() {
        let wrapper = MsgWrapper::invoke(b"rpc-payload");
        assert_eq!(wrapper, MsgWrapper::Invoke { rpc: b"rpc-payload".to_vec() });
        assert_eq!(wrapper.encode(), b"rpc-payload".to_vec());
        assert_eq!(MsgWrapper::decode(b"rpc-payload", MsgKind::Invoke), Some(wrapper));
    }

    #[test]
    fn invoke_with_layer_roundtrip() {
        let wrapper = MsgWrapper::invoke_with_layer(7, b"inner-rpc");
        let encoded = wrapper.encode();
        assert_eq!(encoded.len(), 4 + b"inner-rpc".len());
        assert_eq!(&encoded[0..4], &7i32.to_be_bytes());
        let decoded = MsgWrapper::decode(&encoded, MsgKind::InvokeWithLayer).expect("layered invoke");
        assert_eq!(decoded, wrapper);
        let inner: &[u8] = b"inner-rpc";
        assert_eq!(decoded.rpc(), Some(inner));
    }

    #[test]
    fn invoke_with_layer_rejects_non_positive_layer() {
        let body = {
            let mut buf = Vec::new();
            buf.extend_from_slice(&0i32.to_be_bytes());
            buf.extend_from_slice(b"inner-rpc");
            buf
        };
        assert!(MsgWrapper::decode(&body, MsgKind::InvokeWithLayer).is_none());
        let short = [0u8; 3];
        assert!(MsgWrapper::decode(&short, MsgKind::InvokeWithLayer).is_none());
    }

    #[test]
    fn init_connection_wrapper_roundtrip() {
        let wrapper = MsgWrapper::init_connection(b"init-blob");
        assert_eq!(wrapper, MsgWrapper::InitConnection { inner: b"init-blob".to_vec() });
        assert_eq!(wrapper.encode(), b"init-blob".to_vec());
        assert_eq!(MsgWrapper::decode(b"init-blob", MsgKind::InitConnection), Some(wrapper));
    }

    #[test]
    fn invoke_after_unwraps_msg_id() {
        let wrapper = MsgWrapper::invoke_after(99, b"retarget-rpc");
        let encoded = wrapper.encode();
        assert_eq!(&encoded[0..8], &99u64.to_be_bytes());
        let decoded = MsgWrapper::decode(&encoded, MsgKind::InvokeAfter).expect("invokeAfter");
        assert_eq!(decoded, wrapper);
        let inner: &[u8] = b"retarget-rpc";
        assert_eq!(decoded.rpc(), Some(inner));
    }

    #[test]
    fn invoke_after_rejects_short_body() {
        assert!(MsgWrapper::decode(&[0u8; 7], MsgKind::InvokeAfter).is_none());
    }

    #[test]
    fn kind_names_are_stable() {
        assert_eq!(MsgKind::Invoke.name(), "invoke");
        assert_eq!(MsgKind::InvokeWithLayer.name(), "invoke_with_layer");
        assert_eq!(MsgKind::InitConnection.name(), "init_connection");
        assert_eq!(MsgKind::InvokeAfter.name(), "invoke_after");
    }

    #[test]
    fn msg_kind_from_msg_type_maps_wrappers() {
        assert_eq!(MsgKind::from_msg_type(crate::framing::MSG_TYPE_INIT_CONNECTION), MsgKind::InitConnection);
        assert_eq!(MsgKind::from_msg_type(crate::framing::MSG_TYPE_INVOKE_WITH_LAYER), MsgKind::InvokeWithLayer);
        assert_eq!(MsgKind::from_msg_type(crate::framing::MSG_TYPE_INVOKE_WITHOUT_UPDATES), MsgKind::Invoke);
        assert_eq!(MsgKind::from_msg_type(crate::framing::MSG_TYPE_INVOKE_AFTER), MsgKind::InvokeAfter);
        assert_eq!(MsgKind::from_msg_type(crate::framing::MSG_TYPE_INVOKE_AFTER_MSGS), MsgKind::InvokeAfter);
        // Results / containers / gzip fall back to the plain invoke kind.
        assert_eq!(MsgKind::from_msg_type(crate::framing::MSG_TYPE_RPC_RESULT), MsgKind::Invoke);
        assert_eq!(MsgKind::from_msg_type(crate::framing::MSG_TYPE_GZIP), MsgKind::Invoke);
    }
}
