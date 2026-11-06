//! PylaGram — admin API: HTTP handlers mirroring the gram/srv admin console API.

use serde_json::{json, Value};
use std::collections::HashMap;

use super::server::AdminState;

type HandlerResult = (u16, Value);

fn query_params(query: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for pair in query.split('&') {
        if pair.is_empty() {
            continue;
        }
        let mut parts = pair.splitn(2, '=');
        let key = parts.next().unwrap_or("");
        let value = parts.next().unwrap_or("");
        if !key.is_empty() {
            map.insert(key.to_string(), value.to_string());
        }
    }
    map
}

fn param<'a>(segments: &'a [String], idx: usize) -> Option<&'a str> {
    segments.get(idx).map(|s| s.as_str())
}

fn normalize_key(segments: &[String]) -> String {
    let parts: Vec<String> = segments
        .iter()
        .map(|s| {
            if !s.is_empty() && s.chars().all(|c| c.is_ascii_digit()) {
                "{id}".to_string()
            } else {
                s.clone()
            }
        })
        .collect();
    format!("/{}", parts.join("/"))
}

pub fn handle(
    method: &str,
    path: &str,
    query: Option<&str>,
    body: Option<&str>,
    state: &AdminState,
) -> HandlerResult {
    let path_only = path.split('?').next().unwrap_or(path);
    let segments: Vec<String> = path_only
        .split('/')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();
    let key = normalize_key(&segments);
    let method = method.to_uppercase();
    let query = query.unwrap_or("").to_string();

    let result = match (method.as_str(), key.as_str()) {
        ("POST", "/api/login") => handle_login(state, body.unwrap_or("")),
        ("GET", "/api/session") => handle_session(state),
        ("POST", "/api/logout") => handle_logout(state),
        ("GET", "/api/dashboard") => handle_dashboard(state),
        ("GET", "/api/accounts") => handle_accounts(state, &query),
        ("GET", "/api/accounts/shared-devices") => handle_shared_devices(state, &query),
        ("GET", "/api/accounts/{id}") => handle_account_detail(state, &segments),
        ("GET", "/api/channels") => handle_channels(state, &query),
        ("GET", "/api/channels/{id}") => handle_channel_detail(state, &segments),
        ("GET", "/api/bots") => handle_bots(state, &query),
        ("GET", "/api/bots/{id}") => handle_bot_detail(state, &segments),
        ("GET", "/api/broadcasts") => handle_broadcasts(state, &query),
        ("GET", "/api/stars/top") => handle_stars_top(state, &query),
        ("GET", "/api/stars/ledger/{id}") => handle_stars_ledger(state, &segments, &query),
        ("GET", "/api/gifts") => handle_gifts(state),
        ("GET", "/api/auctions") => handle_auctions(state),
        ("GET", "/api/nft-gifts") => handle_nft_gifts(state, &query),
        ("GET", "/api/official-gifts") => handle_official_gifts(state),
        ("GET", "/api/messages") => handle_messages(state, &query),
        ("GET", "/api/messages/detail") => handle_message_detail(state, &query),
        ("GET", "/api/messages/groups") => handle_group_messages(state, &query),
        ("GET", "/api/messages/groups/detail") => handle_group_message_detail(state, &query),
        ("GET", "/api/storage/stats") => handle_storage_stats(state),
        ("GET", "/api/premium/plans") => handle_premium_plans(state),
        ("GET", "/api/emoji") => handle_emoji(state, &query),
        ("GET", "/api/stickers") => handle_stickers(state, &query),
        ("GET", "/api/gif-catalog") => handle_gif_catalog(state, &query),
        ("GET", "/api/admin-users") => handle_admin_users(state),
        ("GET", "/api/audit-logs") => handle_audit_logs(state, &query),
        ("GET", "/api/server/status") => handle_server_status(state),
        ("GET", "/api/server/identity") => handle_server_identity(state),
        ("GET", "/api/server/env") => handle_server_env(state),
        ("GET", "/api/server/icon") => handle_server_icon(state),
        ("GET", "/api/moderation/cases") => handle_moderation_cases(state, &query),
        ("GET", "/api/moderation/cases/{id}") => handle_moderation_case(state, &segments),
        ("GET", "/api/moderation/reports/{id}") => handle_moderation_report(state, &segments),
        ("GET", "/api/verification/applications") => handle_verification_applications(state, &query),
        ("GET", "/api/verification/applications/{id}") => handle_verification_application(state, &segments),
        ("GET", "/api/verification/counts") => handle_verification_counts(state),
        ("GET", "/api/botverification/verifiers") => handle_bot_verifiers(state, &query),
        ("GET", "/api/botverification/icons") => handle_bot_verification_icons(state, &query),
        ("GET", "/api/botverification/marks") => handle_bot_verification_marks(state, &query),
        ("GET", "/api/botverification/requests") => handle_bot_verification_requests(state, &query),
        ("GET", "/api/botverification/requests/{id}") => handle_bot_verification_request(state, &segments),
        ("GET", "/api/botverification/counts") => handle_bot_verification_counts(state),
        _ => (404, json!({ "error": "not_found" })),
    };

    result
}

fn handle_login(state: &AdminState, body: &str) -> HandlerResult {
    let v: Value = serde_json::from_str(body).unwrap_or(Value::Null);
    let username = v.get("username").and_then(|x| x.as_str()).unwrap_or("");
    let secret = v.get("secret").and_then(|x| x.as_str()).unwrap_or("");
    let expected_user = "admin";
    let expected_pass = std::env::var("TELESRV_ADMIN_UI_PASSWORD")
        .unwrap_or_else(|_| "admin".to_string());
    if username == expected_user && secret == expected_pass {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let token = format!("tok_{}", nanos);
        state.service.insert("admin_session_token", &json!(&token));
        return (
            200,
            json!({ "actor": username, "permissions": ["*"], "csrf_token": token }),
        );
    }
    (401, json!({ "error": "invalid_credentials" }))
}

fn handle_session(state: &AdminState) -> HandlerResult {
    let token_value = state.service.get("admin_session_token");
    let token = token_value.as_str().unwrap_or("");
    if token.is_empty() {
        return (401, json!({ "error": "unauthorized" }));
    }
    (
        200,
        json!({ "actor": "admin", "permissions": ["*"] }),
    )
}

fn handle_logout(state: &AdminState) -> HandlerResult {
    state.service.insert("admin_session_token", &json!(""));
    (200, json!({ "ok": true }))
}

fn handle_dashboard(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/dashboard"))
}

fn handle_accounts(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/accounts"))
}

fn handle_account_detail(state: &AdminState, segments: &[String]) -> HandlerResult {
    let _id = param(segments, 2).unwrap_or("0");
    (200, state.service.get(&format!("resp/accounts/{}", _id)))
}

fn handle_shared_devices(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/accounts/shared-devices"))
}

fn handle_channels(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/channels"))
}

fn handle_channel_detail(state: &AdminState, segments: &[String]) -> HandlerResult {
    let _id = param(segments, 2).unwrap_or("0");
    (200, state.service.get(&format!("resp/channels/{}", _id)))
}

fn handle_bots(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/bots"))
}

fn handle_bot_detail(state: &AdminState, segments: &[String]) -> HandlerResult {
    let _id = param(segments, 2).unwrap_or("0");
    (200, state.service.get(&format!("resp/bots/{}", _id)))
}

fn handle_broadcasts(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/broadcasts"))
}

fn handle_stars_top(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/stars/top"))
}

fn handle_stars_ledger(state: &AdminState, segments: &[String], query: &str) -> HandlerResult {
    let user_id = param(segments, 3).unwrap_or("0");
    let _params = query_params(query);
    (200, state.service.get(&format!("resp/stars/ledger/{}", user_id)))
}

fn handle_gifts(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/gifts"))
}

fn handle_auctions(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/auctions"))
}

fn handle_nft_gifts(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/nft_gifts"))
}

fn handle_official_gifts(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/official_gifts"))
}

fn handle_messages(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/messages"))
}

fn handle_message_detail(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/messages/detail"))
}

fn handle_group_messages(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/messages/groups"))
}

fn handle_group_message_detail(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/messages/groups/detail"))
}

fn handle_storage_stats(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/storage/stats"))
}

fn handle_premium_plans(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/premium/plans"))
}

fn handle_emoji(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/emoji"))
}

fn handle_stickers(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/stickers"))
}

fn handle_gif_catalog(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/gif_catalog"))
}

fn handle_admin_users(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/admin-users"))
}

fn handle_audit_logs(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/audit-logs"))
}

fn handle_server_status(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/server/status"))
}

fn handle_server_identity(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/server/identity"))
}

fn handle_server_env(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/server/env"))
}

fn handle_server_icon(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/server/icon"))
}

fn handle_moderation_cases(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/moderation/cases"))
}

fn handle_moderation_case(state: &AdminState, segments: &[String]) -> HandlerResult {
    let _id = param(segments, 2).unwrap_or("0");
    (200, state.service.get(&format!("resp/moderation/cases/{}", _id)))
}

fn handle_moderation_report(state: &AdminState, segments: &[String]) -> HandlerResult {
    let _id = param(segments, 2).unwrap_or("0");
    (
        200,
        state.service.get(&format!("resp/moderation/reports/{}", _id)),
    )
}

fn handle_verification_applications(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/verification/applications"))
}

fn handle_verification_application(state: &AdminState, segments: &[String]) -> HandlerResult {
    let _id = param(segments, 2).unwrap_or("0");
    (200, state.service.get(&format!("resp/verification/applications/{}", _id)))
}

fn handle_verification_counts(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/verification/counts"))
}

fn handle_bot_verifiers(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/botverification/verifiers"))
}

fn handle_bot_verification_icons(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/botverification/icons"))
}

fn handle_bot_verification_marks(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/botverification/marks"))
}

fn handle_bot_verification_requests(state: &AdminState, query: &str) -> HandlerResult {
    let _params = query_params(query);
    (200, state.service.get("resp/botverification/requests"))
}

fn handle_bot_verification_request(state: &AdminState, segments: &[String]) -> HandlerResult {
    let _id = param(segments, 2).unwrap_or("0");
    (200, state.service.get(&format!("resp/botverification/requests/{}", _id)))
}

fn handle_bot_verification_counts(state: &AdminState) -> HandlerResult {
    (200, state.service.get("resp/botverification/counts"))
}
