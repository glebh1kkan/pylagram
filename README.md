# PylaGram

**Собственный Telegram-сервер на Rust. Форк `gram/srv`, переписываем полностью под Rust, свой стек — свой код.**

## Что это

PylaGram — форк и полный переписывание [gram/srv](https://github.com/iamxvbaba/gramsrv) (оригинальный upstream, Go, module `telesrv`) в Rust.

Мы берём базу (CemixGram — rebrand графа/srv) и полностью переходим на собственный Rust-код: свой MTProto runtime, свой storage layer, свой deployment.

## Цель

- Свой Telegram-сервер, который говорит настоящий MTProto и работает с реальными Telegram-клиентами (Telegram Desktop и др.).
- Полностью Rust-экосистема: `cargo`, tokio, собственные реализации.
- Своё ядро, свои форки, без upstream-зависимостей в проде.

## База

- Upstream: `gram/srv` — Go, module `telesrv`, binary `telesrv`. Branches: `main` (monolith), `v2` (microservices).
- Checkout `main` + rebrand CemixGram.

## Roadmap

1. Cargo workspace: `domain / mtprotoedge / rpc / app / store`
2. MTProto runtime: transport (TCP/WS), handshake, crypto, framing, wrappers
3. RPC dispatch и feature services
4. Storage: Postgres + Redis (+ in-memory for tests)
5. Bot API, Admin, Web, SFU/TURN, OTP и остальное из `internal/*`

## Status

🚧 **Инициализация.** Репо создано, README — черновик.

---

*gram/srv — open-source Telegram-compatible server. Rust-rewrite in progress.*
