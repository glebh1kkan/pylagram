//! PylaGram — admin service: in-memory collections backing the admin API.

use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Default)]
pub struct AdminService {
    map: Mutex<HashMap<String, Value>>,
}

impl AdminService {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, HashMap<String, Value>> {
        self.map.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    pub fn get(&self, key: &str) -> Value {
        self.lock().get(key).cloned().unwrap_or(Value::Null)
    }

    pub fn insert(&self, key: &str, value: &Value) {
        self.lock().insert(key.to_string(), value.clone());
    }

    pub fn list(&self, key: &str) -> Vec<Value> {
        self.lock()
            .get(key)
            .and_then(|v| v.as_array().cloned())
            .unwrap_or_default()
    }

    pub fn seed(&self) {
        let mut map = self.lock();
        map.insert("admin_session_token".to_string(), json!(""));
        map.insert("admin_permissions".to_string(), json!(["*"]));
        map.insert(
            "resp/dashboard".to_string(),
            json!({
                "counts": {
                    "Users": 0, "OnlineUsers": 0, "Bots": 0, "BroadcastChannels": 0,
                    "Supergroups": 0, "StickerSets": 0, "EmojiSets": 0, "Gifs": 0,
                    "PendingReports": 0, "PendingVerifications": 0
                },
                "storage": {
                    "PhysicalBytes": "0", "LogicalBytes": "0", "ObjectCount": "0",
                    "ReferenceCount": "0", "DocumentCount": "0", "PhotoCount": "0",
                    "Backends": []
                }
            }),
        );
        map.insert("resp/accounts".to_string(), json!({
            "query": "", "limit": 100, "rows": [], "has_more": false,
            "next_before_id": 0, "next_before_active_us": 0, "listing": false
        }));
        map.insert(
            "resp/accounts/shared-devices".to_string(),
            json!({
                "limit": 100, "offset": 0, "rows": [], "has_more": false, "next_offset": 0
            }),
        );
        map.insert(
            "resp/accounts/{id}".to_string(),
            json!({
                "Account": null, "About": "", "LastSeenAt": 0, "Verified": false, "Scam": false,
                "Fake": false, "Support": false, "Bot": false, "LoginEmail": "",
                "StarsBalance": 0, "StarsGranted": false, "Restriction": null,
                "HasRestriction": false, "Authorizations": [], "AuditLogs": []
            }),
        );
        map.insert(
            "resp/channels".to_string(),
            json!({
                "query": "", "limit": 100, "rows": [], "has_more": false,
                "next_before_id": 0, "next_before_updated_us": 0, "listing": false
            }),
        );
        map.insert(
            "resp/channels/{id}".to_string(),
            json!({ "Channel": null, "ChannelJSON": "", "AuditLogs": [] }),
        );
        map.insert(
            "resp/bots".to_string(),
            json!({
                "query": "", "limit": 100, "rows": [], "has_more": false,
                "next_before_id": 0, "listing": false
            }),
        );
        map.insert(
            "resp/bots/{id}".to_string(),
            json!({ "Bot": null, "About": "", "Description": "", "OwnerUsername": "", "AuditLogs": [] }),
        );
        map.insert(
            "resp/broadcasts".to_string(),
            json!({ "limit": 100, "rows": [], "has_more": false, "next_before_id": "" }),
        );
        map.insert(
            "resp/stars/top".to_string(),
            json!({ "rows": [], "has_more": false, "next_before_id": "0" }),
        );
        map.insert(
            "resp/stars/ledger/{user_id}".to_string(),
            json!({ "account": null, "entries": null, "has_more": false, "next_before_id": "0" }),
        );
        map.insert("resp/gifts".to_string(), json!({ "Gifts": [] }));
        map.insert("resp/auctions".to_string(), json!({ "Auctions": [] }));
        map.insert("resp/nft_gifts".to_string(), json!({ "gifts": [] }));
        map.insert("resp/official_gifts".to_string(), json!({ "gifts": [] }));
        map.insert(
            "resp/messages".to_string(),
            json!({
                "owner_user_id": 0, "peer_id": 0, "before_date": 0, "before_id": 0,
                "limit": 50, "rows": []
            }),
        );
        map.insert(
            "resp/messages/detail".to_string(),
            json!({
                "Message": null, "MessageJSON": "", "DialogJSON": "", "PrivateJSON": "",
                "UpdateEvents": [], "Outbox": []
            }),
        );
        map.insert(
            "resp/messages/groups".to_string(),
            json!({
                "channel_id": 0, "before_date": 0, "before_id": 0, "limit": 50, "rows": []
            }),
        );
        map.insert(
            "resp/messages/groups/detail".to_string(),
            json!({ "Message": null, "MessageJSON": "", "ChannelJSON": "", "UpdateEvents": [] }),
        );
        map.insert(
            "resp/storage/stats".to_string(),
            json!({
                "PhysicalBytes": "0", "LogicalBytes": "0", "ObjectCount": "0",
                "ReferenceCount": "0", "DocumentCount": "0", "PhotoCount": "0", "Backends": null
            }),
        );
        map.insert("resp/premium/plans".to_string(), json!({ "plans": [] }));
        map.insert(
            "resp/emoji".to_string(),
            json!({ "query": "", "rows": [], "has_more": false, "next_before_id": 0 }),
        );
        map.insert("resp/stickers".to_string(), json!({ "rows": [], "max_items": 50 }));
        map.insert("resp/gif_catalog".to_string(), json!({ "rows": [], "limit": 100 }));
        map.insert(
            "resp/admin-users".to_string(),
            json!({
                "system": {
                    "username": "admin", "permissions": ["*"], "enabled": true, "system": true
                },
                "rows": [], "available_permissions": []
            }),
        );
        map.insert("resp/audit-logs".to_string(), json!({ "rows": [] }));
        map.insert(
            "resp/server/status".to_string(),
            json!({
                "host": {
                    "hostname": "pylagram", "distro": "linux", "os": "linux", "arch": "amd64",
                    "go_version": "1.25.0", "uptime_seconds": 0, "cpu_cores": 0
                }
            }),
        );
        map.insert(
            "resp/server/identity".to_string(),
            json!({
                "name": "PylaGram", "description": "", "icon_ext": null,
                "welcome_message_phone_template": "", "welcome_message_email_template": "",
                "login_code_message_template": "",
                "default_welcome_message_phone_template": "",
                "default_welcome_message_email_template": "", "default_login_code_message_template": ""
            }),
        );
        map.insert("resp/server/env".to_string(), json!({ "groups": [] }));
        map.insert("resp/server/icon".to_string(), json!({ "data_url": "" }));
        map.insert(
            "resp/moderation/cases".to_string(),
            json!({ "cases": [] }),
        );
        map.insert(
            "resp/moderation/cases/{id}".to_string(),
            json!({
                "Case": null, "ReportIDs": [], "Decisions": [], "Actions": [], "Appeals": []
            }),
        );
        map.insert("resp/moderation/reports/{id}".to_string(), json!({ "Report": null }));
        map.insert(
            "resp/verification/applications".to_string(),
            json!({ "applications": [], "counts": null }),
        );
        map.insert(
            "resp/verification/applications/{id}".to_string(),
            json!({
                "application": null, "events": [], "applicant_controls_target": false,
                "target_verified": false
            }),
        );
        map.insert("resp/verification/counts".to_string(), json!({ "counts": null }));
        map.insert(
            "resp/botverification/verifiers".to_string(),
            json!({ "verifiers": [] }),
        );
        map.insert(
            "resp/botverification/icons".to_string(),
            json!({ "icons": [] }),
        );
        map.insert(
            "resp/botverification/marks".to_string(),
            json!({ "custom_verifications": [] }),
        );
        map.insert(
            "resp/botverification/requests".to_string(),
            json!({ "requests": [] }),
        );
        map.insert(
            "resp/botverification/requests/{id}".to_string(),
            json!({ "request": null }),
        );
        map.insert("resp/botverification/counts".to_string(), json!({ "counts": null }));
    }
}
