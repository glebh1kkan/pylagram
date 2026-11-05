//! PylaGram — RPC dispatch: entry point resolving an RPC function id to a handler.

use crate::errors::RpcError;
use crate::router::Router;

pub fn dispatch(router: &Router, rpc_id: u32) -> Result<(), RpcError> {
    router.dispatch(rpc_id)
}
