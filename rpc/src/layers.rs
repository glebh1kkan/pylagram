//! PylaGram — layers module: RPC layer binding, TL method resolution and layer support.

/// Highest MTProto RPC layer supported by this server build.
pub const MAX_SUPPORTED_LAYER: i32 = 65;
/// Layer applied to naked inbound invokes before dispatch.
pub const DEFAULT_LAYER: i32 = 65;

/// Returns true when the given layer may be used for RPC dispatch.
pub fn supported_layer(layer: i32) -> bool {
    layer > 0 && layer <= MAX_SUPPORTED_LAYER
}

/// Extracts the Telegram method name from a TL RPC request body
/// (`method#hash param...` -> `Some("method")`).
pub fn method_name(rpc: &[u8]) -> Option<&str> {
    if rpc.is_empty() {
        return None;
    }
    let name_len = rpc[0] as usize;
    if name_len == 0 || rpc.len() < 1 + name_len + 1 {
        return None;
    }
    let name = std::str::from_utf8(&rpc[1..1 + name_len]).ok()?;
    if rpc[1 + name_len] != b'#' {
        return None;
    }
    Some(name)
}

/// Maps a domain RPC error onto the MTProto RPC error code space.
pub fn error_code(error: &crate::errors::RpcError) -> i32 {
    error.code
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn supported_layer_accepts_positive_layers_up_to_cap() {
        assert!(supported_layer(1));
        assert!(supported_layer(65));
        assert!(!supported_layer(0));
        assert!(!supported_layer(-1));
        assert!(!supported_layer(66));
    }

    #[test]
    fn method_name_parses_tl_rpc_header() {
        // "auth.checkPhoneNumber" + "#" + 4-byte hash + params.
        let name = b"auth.checkPhoneNumber";
        let mut body = Vec::new();
        body.push(name.len() as u8);
        body.extend_from_slice(name);
        body.push(b'#');
        body.extend_from_slice(&0xc0e202f7u32.to_be_bytes());
        body.extend_from_slice(&[0u8; 8]); // params
        assert_eq!(method_name(&body).unwrap(), "auth.checkPhoneNumber");
    }

    #[test]
    fn method_name_rejects_empty_body() {
        assert!(method_name(&[]).is_none());
    }

    #[test]
    fn method_name_rejects_missing_hash_separator() {
        let body = [3u8, b'a', b'b', b'c', 0x00];
        assert!(method_name(&body).is_none());
    }

    #[test]
    fn error_code_passes_through_domain_code() {
        let error = crate::errors::RpcError::new(501);
        assert_eq!(error_code(&error), 501);
    }
}
