//! PylaGram — MTProto container framing: message header types and encoding.
//!
//! MTProto message container header:
//! - type: int (function id for RPC results/errors, or container flag for updates)
//! - msg_id: long (message id)
//! - seqno: int (sequence number of the message in the container)
//! - seq: int (service message seq for resending)
//! - size: int (payload size)
//! (Rust rewrite of the framing layer of `telesrv/internal/mtprotoedge`.)

/// MTProto message type container flag (carries a vector of inner messages).
pub const MSG_TYPE_MESSAGE_CONTAINER: i32 = 1945237724;
/// MTProto RPC result envelope (`rpc_result#f35c6d01`).
pub const MSG_TYPE_RPC_RESULT: i32 = -212046591;
/// MTProto GZIP envelope used to compress inner RPC payloads.
pub const MSG_TYPE_GZIP: i32 = 812830625;
/// MTProto RPC error envelope (`rpc_error#2144ca19`).
pub const MSG_TYPE_RPC_ERROR: i32 = 558156313;
/// MTProto initConnection envelope (`initConnection#c1cd5ea9`).
pub const MSG_TYPE_INIT_CONNECTION: i32 = -1043505495;
/// MTProto invokeWithLayer envelope (`invokeWithLayer#da9b0d0d`).
pub const MSG_TYPE_INVOKE_WITH_LAYER: i32 = -627372787;
/// MTProto invokeWithoutUpdates envelope (`invokeWithoutUpdates#bf9459b7`).
pub const MSG_TYPE_INVOKE_WITHOUT_UPDATES: i32 = -1080796745;
/// MTProto invokeAfterMsg envelope (`invokeAfterMsg#cb9f372d`).
pub const MSG_TYPE_INVOKE_AFTER: i32 = -878758099;
/// MTProto invokeAfterMsgs envelope (`invokeAfterMsgs#3dc4b4f0`).
pub const MSG_TYPE_INVOKE_AFTER_MSGS: i32 = 1036301552;

/// MTProto message container header as transmitted on the wire.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MsgHeader {
    pub r#type: i32,
    pub msg_id: u64,
    pub seqno: i32,
    pub seq: i32,
    pub size: i32,
}

impl MsgHeader {
    pub fn new(r#type: i32, msg_id: u64, seqno: i32, seq: i32, size: i32) -> Self {
        Self { r#type, msg_id, seqno, seq, size }
    }

    /// Encodes the header into the MTProto wire format.
    pub fn encode(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(20);
        buf.extend_from_slice(&self.r#type.to_be_bytes());
        buf.extend_from_slice(&self.msg_id.to_be_bytes());
        buf.extend_from_slice(&self.seqno.to_be_bytes());
        buf.extend_from_slice(&self.seq.to_be_bytes());
        buf.extend_from_slice(&self.size.to_be_bytes());
        buf
    }

    /// Decodes a header from the MTProto wire format.
    pub fn decode(buf: &[u8]) -> Result<Self, String> {
        if buf.len() < 20 {
            return Err(format!("short buffer: {} bytes", buf.len()));
        }
        let r#type = i32::from_be_bytes(buf[0..4].try_into().unwrap());
        let msg_id = u64::from_be_bytes(buf[4..12].try_into().unwrap());
        let seqno = i32::from_be_bytes(buf[12..16].try_into().unwrap());
        let seq = i32::from_be_bytes(buf[16..20].try_into().unwrap());
        let size = i32::from_be_bytes(buf[20..24].try_into().unwrap());
        Ok(Self { r#type, msg_id, seqno, seq, size })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encode_decode_roundtrip() {
        let h = MsgHeader::new(1234, 0x0102_0304_0506_0708, 1, 0, 42);
        let buf = h.encode();
        assert_eq!(buf.len(), 24);
        let decoded = MsgHeader::decode(&buf).unwrap();
        assert_eq!(decoded, h);
    }

    #[test]
    fn decode_rejects_short_buffer() {
        assert!(MsgHeader::decode(&[0u8; 10]).is_err());
    }

    #[test]
    fn message_type_constants_are_stable() {
        assert_eq!(MSG_TYPE_MESSAGE_CONTAINER, 1945237724);
        assert_eq!(MSG_TYPE_RPC_RESULT, -212046591);
        assert_eq!(MSG_TYPE_GZIP, 812830625);
        assert_eq!(MSG_TYPE_RPC_ERROR, 558156313);
        assert_eq!(MSG_TYPE_INIT_CONNECTION, -1043505495);
        assert_eq!(MSG_TYPE_INVOKE_WITH_LAYER, -627372787);
        assert_eq!(MSG_TYPE_INVOKE_WITHOUT_UPDATES, -1080796745);
        assert_eq!(MSG_TYPE_INVOKE_AFTER, -878758099);
        assert_eq!(MSG_TYPE_INVOKE_AFTER_MSGS, 1036301552);
    }
}
