// PylaGram Admin — custom control center frontend.
// Emerald theme, inline SVG iconography, live telemetry, EN/RU localization.

(() => {
  "use strict";

  const DICT = window.PG_I18N || { en: {}, ru: {} };
  const STORE_PREFS = "pylagram.prefs.v1";
  const STORE_ACTOR = "pylagram.actor.v1";
  const STORE_SEEN = "pylagram.activitySeen.v1";
  const BUILD_LABEL = "Emerald · v6";

  /* ----------------------------------------------------------------------
     Preferences & localization
     ---------------------------------------------------------------------- */

  function detectLocale() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_PREFS) || "{}");
      if (raw && (raw.locale === "en" || raw.locale === "ru")) return raw.locale;
    } catch {
      /* ignore malformed preferences */
    }
    return String(navigator.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
  }

  const DEFAULT_PREFS = {
    locale: detectLocale(),
    refresh: 5000,
    density: "comfortable",
    motion: "system",
  };

  function loadPrefs() {
    const result = { ...DEFAULT_PREFS };
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_PREFS) || "{}");
      if (raw && (raw.locale === "en" || raw.locale === "ru")) result.locale = raw.locale;
      if (raw && [0, 5000, 15000, 60000].includes(Number(raw.refresh))) {
        result.refresh = Number(raw.refresh);
      }
      if (raw && (raw.density === "compact" || raw.density === "comfortable")) {
        result.density = raw.density;
      }
      if (raw && (raw.motion === "reduced" || raw.motion === "system")) {
        result.motion = raw.motion;
      }
    } catch {
      /* ignore malformed preferences */
    }
    return result;
  }

  const prefs = loadPrefs();

  function savePrefs() {
    try {
      localStorage.setItem(STORE_PREFS, JSON.stringify(prefs));
    } catch {
      /* storage may be unavailable in private mode */
    }
  }

  function applyPrefs() {
    document.documentElement.lang = prefs.locale;
    document.body.dataset.locale = prefs.locale;
    document.body.classList.toggle("is-compact", prefs.density === "compact");
    document.body.classList.toggle("reduce-motion", prefs.motion === "reduced");
  }

  function t(key, vars) {
    const dict = DICT[prefs.locale] || {};
    let value = dict[key];
    if (value === undefined) value = (DICT.en || {})[key];
    if (value === undefined) value = key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.split("{" + name + "}").join(String(replacement));
      }
    }
    return value;
  }

  function localeTag() {
    return prefs.locale === "ru" ? "ru-RU" : "en-GB";
  }

  let localeFmt = null;
  let numberFmt = null;

  function fmtNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "0");
    if (!numberFmt || localeFmt !== prefs.locale) {
      localeFmt = prefs.locale;
      numberFmt = new Intl.NumberFormat(localeTag());
    }
    return numberFmt.format(number);
  }

  function fmtCompact(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "0";
    if (Math.abs(number) >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (Math.abs(number) >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(number) >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(Math.round(number));
  }

  function fmtBytes(value) {
    if (value === null || value === undefined || value === "") return "0 B";
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return String(value);
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let size = Math.abs(number);
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }
    const sign = number < 0 ? "-" : "";
    return sign + (size >= 100 || index === 0 ? Math.round(size) : size.toFixed(1)) + " " + units[index];
  }

  function fmtDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (days > 0) return days + "d " + hours + "h";
    if (hours > 0) return hours + "h " + minutes + "m";
    if (minutes > 0) return minutes + "m " + secs + "s";
    return secs + "s";
  }

  function timeLabel(ts) {
    return new Date(ts).toLocaleTimeString(localeTag(), {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function relativeTime(at) {
    const diff = Math.max(0, Math.floor(Date.now() / 1000) - Number(at || 0));
    if (diff < 10) return t("common.justNow");
    if (diff < 60) return t("common.secondsAgo", { count: diff });
    if (diff < 3600) return t("common.minutesAgo", { count: Math.floor(diff / 60) });
    if (diff < 86400) return t("common.hoursAgo", { count: Math.floor(diff / 3600) });
    return t("common.daysAgo", { count: Math.floor(diff / 86400) });
  }

  function humanize(key) {
    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function columnLabel(key) {
    const translated = t("columns." + key);
    return translated === "columns." + key ? humanize(key) : translated;
  }

  function recordsLabel(count) {
    return count === 1 ? t("common.recordsOne", { count }) : t("common.records", { count });
  }

  /* ----------------------------------------------------------------------
     Icon library (24x24, stroke-based, currentColor)
     ---------------------------------------------------------------------- */

  const ICON_PATHS = {
    dashboard:
      '<rect x="3" y="3" width="7.5" height="7.5" rx="1.7"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.7"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.7"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.7"/>',
    users:
      '<path d="M16.5 20.5v-1.7a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.8v1.7"/><circle cx="9.8" cy="8" r="3.4"/><path d="M21 20.5v-1.7a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.4 4.9a3.4 3.4 0 0 1 0 6.2"/>',
    user:
      '<path d="M20 21v-1.8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V21"/><circle cx="12" cy="7" r="4"/>',
    group:
      '<circle cx="9" cy="8.2" r="3.3"/><path d="M2.8 20.2v-1.6a3.5 3.5 0 0 1 3.5-3.5h5.4a3.5 3.5 0 0 1 3.5 3.5v1.6"/><circle cx="17.4" cy="9.2" r="2.6"/><path d="M21.2 20.2v-1.3a3 3 0 0 0-2.2-2.9"/>',
    bot:
      '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4.7"/><circle cx="12" cy="3.6" r="1.1"/><path d="M8.6 12.2h.01M15.4 12.2h.01"/><path d="M9.2 16h5.6"/>',
    broadcast:
      '<path d="M21.5 2.5L2.5 10.2l6.7 2.7 2.7 6.7 9.6-17.1z"/><path d="M9.2 12.9l5.3-5.3"/>',
    star:
      '<path d="M12 3.4l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.4z"/>',
    gift:
      '<rect x="3" y="8" width="18" height="4" rx="1.2"/><path d="M5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12"/><path d="M12 8v13"/><path d="M12 8C11 4.5 8.5 3 7 4.2 5.4 5.5 7.5 8 12 8z"/><path d="M12 8c1-3.5 3.5-5 5-3.8C18.6 5.5 16.5 8 12 8z"/>',
    shield:
      '<path d="M12 3l7.5 3v5.4c0 4.5-3.2 7.7-7.5 9.1-4.3-1.4-7.5-4.6-7.5-9.1V6L12 3z"/>',
    shieldCheck:
      '<path d="M12 3l7.5 3v5.4c0 4.5-3.2 7.7-7.5 9.1-4.3-1.4-7.5-4.6-7.5-9.1V6L12 3z"/><path d="M9 12.2l2.1 2.1 4.1-4.3"/>',
    database:
      '<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/><path d="M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>',
    server:
      '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M7 7h.01M7 17h.01"/><path d="M11 7h4M11 17h4"/>',
    search:
      '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    refresh:
      '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    logout:
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    menu:
      '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:
      '<path d="M6 6l12 12M18 6L6 18"/>',
    arrowRight:
      '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevronRight:
      '<path d="M9 6l6 6-6 6"/>',
    chevronLeft:
      '<path d="M15 6l-6 6 6 6"/>',
    chevronDown:
      '<path d="M6 9l6 6 6-6"/>',
    arrowUp:
      '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowDown:
      '<path d="M12 5v14M18 13l-6 6-6-6"/>',
    sort:
      '<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>',
    activity:
      '<path d="M3 12h4l2.5-7 4.5 14 3-7H21"/>',
    clock:
      '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    cpu:
      '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
    globe:
      '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.4 2.4 14.6 0 17M12 3.5c-2.4 2.4-2.4 14.6 0 17"/>',
    key:
      '<circle cx="8" cy="15.5" r="3.5"/><path d="M10.5 13L20.5 3M17.5 6l2.5 2.5M14.5 9l2.5 2.5"/>',
    lock:
      '<rect x="4.5" y="10" width="15" height="10.5" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>',
    flag:
      '<path d="M5.5 21V4"/><path d="M5.5 4.5h11l-1.6 4 1.6 4h-11"/>',
    inbox:
      '<path d="M4 13l2.3-6.9a2 2 0 0 1 1.9-1.4h7.6a2 2 0 0 1 1.9 1.4L20 13"/><path d="M4 13v4.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V13"/><path d="M4 13h4.5l1.8 2.8h3.4L15.5 13H20"/>',
    alert:
      '<path d="M12 3.2L21 19.5H3L12 3.2z"/><path d="M12 9.5v4.5M12 17.2h.01"/>',
    check:
      '<path d="M20 6.5L9.2 17.3l-5.2-5.2"/>',
    info:
      '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    layers:
      '<path d="M12 3l9 4.8-9 4.8-9-4.8L12 3z"/><path d="M3 12.2l9 4.8 9-4.8"/><path d="M3 16.8l9 4.8 9-4.8"/>',
    film:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    image:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15.5l-4.5-4.5L6 21"/>',
    box:
      '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    hash:
      '<path d="M9.5 3.5L7.5 20.5M16.5 3.5l-2 17M4 8.5h16.5M3.5 15.5H20"/>',
    file:
      '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8l-5-5z"/><path d="M14 3v5h5"/>',
    sparkle:
      '<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M19 15.5l.8 2.2 2.2.8-2.2.8L19 21.5l-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
    sliders:
      '<path d="M4 6h9M18 6h2M4 12h2M10 12h10M4 18h7M16 18h4"/><circle cx="15.5" cy="6" r="2.2"/><circle cx="7.5" cy="12" r="2.2"/><circle cx="13.5" cy="18" r="2.2"/>',
    bell:
      '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
    copy:
      '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    download:
      '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    eye:
      '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
    eyeOff:
      '<path d="M3 3l18 18"/><path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.6"/><path d="M6.6 6.7A17.6 17.6 0 0 0 2 12s3.5 6 10 6a10.9 10.9 0 0 0 4.4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    keyboard:
      '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
  };

  const LOGO_SVG =
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
    '<path d="M11 23V9h6a5 5 0 0 1 0 10h-3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
    '<path d="M20.5 8.5c2.4 1.4 3.5 3.8 3.5 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>' +
    "</svg>";

  function icon(name, cls) {
    const span = document.createElement("span");
    span.className = "icon" + (cls ? " " + cls : "");
    span.setAttribute("aria-hidden", "true");
    const path = ICON_PATHS[name] || ICON_PATHS.dot;
    span.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" focusable="false">' + path + "</svg>";
    return span;
  }

  function brandMark() {
    const mark = document.createElement("div");
    mark.className = "brand__mark";
    mark.innerHTML = LOGO_SVG;
    return mark;
  }

  /* ----------------------------------------------------------------------
     DOM helpers
     ---------------------------------------------------------------------- */

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key === "html") node.innerHTML = value;
        else if (key === "dataset") Object.assign(node.dataset, value);
        else if (key === "for") node.htmlFor = value;
        else if (key.startsWith("on") && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else node.setAttribute(key, value === true ? "" : value);
      }
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    for (const child of children.flat(Infinity)) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function meta(label, value) {
    return h(
      "div",
      { class: "meta" },
      h("span", { class: "meta__value", text: value }),
      h("span", { class: "meta__label", text: label })
    );
  }

  function kvRow(iconName, label, value, opts) {
    const options = opts || {};
    const row = h(
      "div",
      { class: "kv-row" },
      h("div", { class: "tile" }, icon(iconName)),
      h(
        "div",
        { class: "kv-row__body" },
        h("div", { class: "kv-row__label", text: label }),
        h("div", {
          class: "kv-row__value" + (options.mono ? " mono" : ""),
          text: value,
          title: options.title || String(value ?? ""),
        })
      )
    );
    if (options.copy) {
      row.append(
        h(
          "button",
          {
            class: "icon-btn icon-btn--sm",
            type: "button",
            title: t("common.copy"),
            "aria-label": t("common.copy"),
            onclick: () => copyText(String(value ?? "")),
          },
          icon("copy")
        )
      );
    }
    return row;
  }

  /* ----------------------------------------------------------------------
     API
     ---------------------------------------------------------------------- */

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }

  const inflight = new Map();

  function apiGet(path) {
    if (inflight.has(path)) return inflight.get(path);
    const request = fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new ApiError(data.error || "HTTP " + response.status, response.status);
      return data;
    });
    inflight.set(path, request);
    request.catch(() => {}).finally(() => inflight.delete(path));
    return request;
  }

  async function apiPost(path, payload) {
    const response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(data.error || "HTTP " + response.status, response.status);
    return data;
  }

  /* ----------------------------------------------------------------------
     Clipboard, toasts, boot
     ---------------------------------------------------------------------- */

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      toast(t("toast.copied"), "");
    } catch {
      toast(t("common.copy"), String(text).slice(0, 120), "error");
    }
  }

  function toast(title, message, kind) {
    const host = document.getElementById("toasts");
    if (!host) return;
    const node = h(
      "div",
      { class: "toast" + (kind === "error" ? " is-error" : ""), role: "status" },
      icon(kind === "error" ? "alert" : "check"),
      h(
        "div",
        { class: "toast__body" },
        h("strong", { text: title }),
        message ? h("span", { text: message }) : null
      )
    );
    host.append(node);
    const remove = () => {
      node.classList.add("is-leaving");
      setTimeout(() => node.remove(), 260);
    };
    const timer = setTimeout(remove, 4200);
    node.addEventListener("click", () => {
      clearTimeout(timer);
      remove();
    });
  }

  function hideBoot() {
    const boot = document.getElementById("boot");
    if (!boot) return;
    boot.classList.add("is-hidden");
    setTimeout(() => boot.remove(), 520);
  }

  /* ----------------------------------------------------------------------
     State & routes
     ---------------------------------------------------------------------- */

  const state = {
    view: "boot",
    actor: localStorage.getItem(STORE_ACTOR) || "admin",
    route: null,
    renderToken: 0,
    els: null,
    trafficTimer: null,
    traffic: [],
    chartRender: null,
    chartAnimated: false,
    tickCount: 0,
    tables: {},
    activityPreviewHost: null,
    latestActivityAt: 0,
    loginDraft: { username: "", password: "" },
    loginExpired: false,
    palette: { open: false, index: 0, items: [], previousFocus: null },
  };

  const ROUTES = [
    {
      id: "dashboard",
      hash: "#/dashboard",
      group: "overview",
      icon: "dashboard",
    },
    {
      id: "accounts",
      hash: "#/accounts",
      group: "community",
      icon: "users",
      endpoint: "/api/accounts",
      rowsKeys: ["rows"],
      emptyKey: "list.accounts",
    },
    {
      id: "channels",
      hash: "#/channels",
      group: "community",
      icon: "broadcast",
      endpoint: "/api/channels",
      rowsKeys: ["rows"],
      emptyKey: "list.channels",
    },
    {
      id: "bots",
      hash: "#/bots",
      group: "community",
      icon: "bot",
      endpoint: "/api/bots",
      rowsKeys: ["rows"],
      emptyKey: "list.bots",
    },
    {
      id: "stars",
      hash: "#/stars",
      group: "content",
      icon: "star",
      endpoint: "/api/stars/top",
      rowsKeys: ["rows"],
      emptyKey: "list.stars",
    },
    {
      id: "gifts",
      hash: "#/gifts",
      group: "content",
      icon: "gift",
      endpoint: "/api/gifts",
      rowsKeys: ["Gifts", "gifts"],
      emptyKey: "list.gifts",
    },
    {
      id: "moderation",
      hash: "#/moderation",
      group: "trust",
      icon: "shield",
      endpoint: "/api/moderation/cases",
      rowsKeys: ["cases"],
      emptyKey: "list.moderation",
    },
    {
      id: "storage",
      hash: "#/storage",
      group: "infra",
      icon: "database",
    },
    {
      id: "server",
      hash: "#/server",
      group: "infra",
      icon: "server",
    },
    {
      id: "settings",
      hash: "#/settings",
      group: "infra",
      icon: "sliders",
    },
  ];

  function resolveRoute() {
    const hash = window.location.hash || "#/dashboard";
    const route = ROUTES.find((entry) => entry.hash === hash);
    if (route) return route;
    history.replaceState(null, "", "#/dashboard");
    return ROUTES[0];
  }

  function extractRows(data, keys) {
    if (!data || typeof data !== "object") return [];
    for (const key of keys || []) {
      if (Array.isArray(data[key])) return data[key];
    }
    return Array.isArray(data) ? data : [];
  }

  function emptyState(iconName, title, text) {
    return h(
      "div",
      { class: "empty" },
      h("div", { class: "empty__art" }, icon(iconName)),
      h("h3", { class: "empty__title", text: title }),
      h("p", { class: "empty__text", text: text })
    );
  }

  /* ----------------------------------------------------------------------
     Shell
     ---------------------------------------------------------------------- */

  function cmdLabel() {
    return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
  }

  function avatarLetter() {
    const name = String(state.actor || "A").trim();
    return (name.charAt(0) || "A").toUpperCase();
  }

  function buildShell() {
    const app = document.getElementById("app");
    clear(app);
    app.className = "app";
    app.hidden = false;

    const sidebar = h("aside", { class: "sidebar", id: "sidebar" });

    const brand = h(
      "button",
      {
        class: "brand",
        type: "button",
        "aria-label": t("nav.dashboard"),
        onclick: () => navigate("#/dashboard"),
      },
      brandMark(),
      h(
        "span",
        { class: "brand__text" },
        h("span", { class: "brand__name", text: t("common.appName") }),
        h("span", { class: "brand__sub", text: t("common.adminConsole") })
      )
    );

    const nav = h("nav", { class: "nav", "aria-label": t("nav.primary") });
    const groups = new Map();
    for (const route of ROUTES) {
      if (!groups.has(route.group)) groups.set(route.group, []);
      groups.get(route.group).push(route);
    }
    for (const [groupName, routes] of groups) {
      const group = h(
        "div",
        { class: "nav-group" },
        h("div", { class: "nav-label", text: t("nav.group." + groupName) })
      );
      for (const route of routes) {
        group.append(
          h(
            "button",
            {
              class: "nav-item",
              type: "button",
              dataset: { route: route.id },
              onclick: () => navigate(route.hash),
            },
            icon(route.icon),
            h("span", { text: t("nav." + route.id) })
          )
        );
      }
      nav.append(group);
    }

    const foot = h(
      "div",
      { class: "sidebar__foot" },
      h(
        "div",
        { class: "sys-card" },
        h("span", { class: "dot-live" }),
        h(
          "div",
          null,
          h("strong", { text: t("sidebar.healthy") }),
          h("span", { text: t("sidebar.online") })
        )
      ),
      h(
        "div",
        { class: "sidebar__version" },
        h("span", { text: t("common.appName") }),
        h("span", { class: "mono", text: "v0.1.0" })
      )
    );

    sidebar.append(brand, nav, foot);

    const kicker = h("div", { class: "kicker", text: t("nav.group.overview") });
    const title = h("h1", { class: "page-title", text: t("nav.dashboard") });

    const menuBtn = h(
      "button",
      {
        class: "icon-btn menu-btn",
        type: "button",
        "aria-label": t("common.open"),
        onclick: openSidebar,
      },
      icon("menu")
    );

    const searchTrigger = h(
      "button",
      {
        class: "search-trigger",
        type: "button",
        title: t("shortcuts.palette") + " (" + cmdLabel() + " K)",
        onclick: openPalette,
      },
      icon("search"),
      h("span", { class: "search-trigger__label", text: t("common.search") }),
      h("kbd", { class: "kbd", text: cmdLabel() + " K" })
    );

    const refreshBtn = h(
      "button",
      {
        class: "icon-btn",
        type: "button",
        title: t("common.refresh"),
        "aria-label": t("common.refresh"),
        onclick: () => {
          refreshBtn.classList.add("is-spinning");
          setTimeout(() => refreshBtn.classList.remove("is-spinning"), 750);
          renderRoute(state.route || resolveRoute(), { scroll: false });
        },
      },
      icon("refresh")
    );

    const langBtn = h(
      "button",
      {
        class: "lang-toggle",
        type: "button",
        title: t("login.language"),
        "aria-label": t("login.language"),
        onclick: () => setLocale(prefs.locale === "ru" ? "en" : "ru"),
      },
      icon("globe"),
      h("span", { class: "lang-toggle__label", text: prefs.locale.toUpperCase() })
    );

    const bellDot = h("span", { class: "bell__dot", hidden: true });
    const bellBtn = h(
      "button",
      {
        class: "icon-btn bell",
        type: "button",
        title: t("activity.drawerTitle"),
        "aria-label": t("activity.drawerTitle"),
        onclick: openActivityDrawer,
      },
      icon("bell"),
      bellDot
    );

    const userChip = h(
      "div",
      { class: "user-chip" },
      h("div", { class: "avatar", text: avatarLetter() }),
      h(
        "div",
        { class: "user-meta" },
        h("strong", { text: state.actor }),
        h("span", { text: t("common.owner") })
      ),
      h(
        "button",
        {
          class: "icon-btn",
          type: "button",
          title: t("common.logout") || "Sign out",
          "aria-label": t("settings.signOut"),
          onclick: logout,
        },
        icon("logout")
      )
    );

    const topbar = h(
      "header",
      { class: "topbar" },
      menuBtn,
      h("div", { class: "topbar__titles" }, kicker, title),
      h(
        "div",
        { class: "topbar__actions" },
        searchTrigger,
        h("div", { class: "status-pill" }, h("span", { class: "dot-live" }), t("common.live")),
        langBtn,
        bellBtn,
        refreshBtn,
        userChip
      )
    );

    const content = h("main", { class: "content", id: "content" });
    const main = h("div", { class: "main" }, topbar, content);
    const scrim = h("div", { class: "scrim", id: "scrim", onclick: closeSidebar });

    app.append(sidebar, main, scrim);

    state.els = { sidebar, nav, kicker, title, content, scrim, refreshBtn, bellDot };
    state.view = "app";
    refreshBell();
  }

  function openSidebar() {
    if (!state.els) return;
    state.els.sidebar.classList.add("is-open");
    state.els.scrim.classList.add("is-visible");
  }

  function closeSidebar() {
    if (!state.els) return;
    state.els.sidebar.classList.remove("is-open");
    state.els.scrim.classList.remove("is-visible");
  }

  function navigate(hash) {
    closeOverlays();
    if (state.view !== "app") return;
    closeSidebar();
    if (window.location.hash === hash) renderRoute(resolveRoute());
    else window.location.hash = hash;
  }

  function setActiveNav(route) {
    if (!state.els) return;
    for (const item of state.els.nav.querySelectorAll(".nav-item")) {
      const active = item.dataset.route === route.id;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    }
  }

  function updateChrome(route) {
    if (!state.els) return;
    state.els.kicker.textContent = t("nav.group." + route.group);
    state.els.title.textContent = t("nav." + route.id);
    document.title = t("nav." + route.id) + " · " + t("common.appName") + " " + t("common.adminConsole");
  }

  /* ----------------------------------------------------------------------
     Layers, palette, shortcuts, drawers
     ---------------------------------------------------------------------- */

  function layer(id, className) {
    let element = document.getElementById(id);
    if (!element) {
      element = h("div", { id, class: className });
      document.body.append(element);
    }
    return element;
  }

  function closeOverlays() {
    const palette = document.getElementById("paletteOverlay");
    if (palette && !palette.hidden) {
      palette.hidden = true;
      const previous = state.palette.previousFocus;
      if (previous && typeof previous.focus === "function") {
        try {
          previous.focus();
        } catch {
          /* element may be gone */
        }
      }
    }
    state.palette.open = false;
    for (const id of ["shortcutsOverlay", "drawerScrim", "activityDrawer", "recordDrawer"]) {
      const element = document.getElementById(id);
      if (element) element.hidden = true;
    }
    document.body.classList.remove("has-layer");
  }

  function paletteItems() {
    const pages = ROUTES.map((route) => ({
      group: "palette.pages",
      title: t("nav." + route.id),
      hint: t("nav.group." + route.group),
      icon: route.icon,
      keywords: route.id + " " + t("nav." + route.id) + " " + t("nav.group." + route.group),
      run: () => navigate(route.hash),
    }));
    const actions = [
      {
        group: "palette.actions",
        title: t("palette.openActivity"),
        icon: "bell",
        keywords: "activity log журнал события",
        run: openActivityDrawer,
      },
      {
        group: "palette.actions",
        title: t("palette.openSettings"),
        icon: "sliders",
        keywords: "settings настройки",
        run: () => navigate("#/settings"),
      },
      {
        group: "palette.actions",
        title: t("palette.refresh"),
        icon: "refresh",
        keywords: "refresh reload обновить",
        run: () => renderRoute(state.route, { scroll: false }),
      },
      {
        group: "palette.actions",
        title: prefs.locale === "ru" ? t("palette.switchToEn") : t("palette.switchToRu"),
        icon: "globe",
        keywords: "language locale english russian язык",
        run: () => setLocale(prefs.locale === "ru" ? "en" : "ru"),
      },
      {
        group: "palette.actions",
        title: t("palette.toggleDensity"),
        icon: "sliders",
        keywords: "compact density плотность компактно",
        run: toggleDensity,
      },
      {
        group: "palette.actions",
        title: t("palette.shortcuts"),
        icon: "keyboard",
        keywords: "keyboard shortcuts горячие клавиши",
        run: openShortcuts,
      },
      {
        group: "palette.actions",
        title: t("palette.signOut"),
        icon: "logout",
        keywords: "logout sign out выйти",
        run: logout,
      },
    ];
    return pages.concat(actions);
  }

  function openPalette() {
    if (state.view !== "app") return;
    closeOverlays();
    const overlay = layer("paletteOverlay", "palette-overlay");
    clear(overlay);
    overlay.hidden = false;
    document.body.classList.add("has-layer");

    const input = h("input", {
      type: "text",
      placeholder: t("palette.placeholder"),
      autocomplete: "off",
      spellcheck: "false",
      "aria-label": t("palette.placeholder"),
    });
    const list = h("div", { class: "palette__list", role: "listbox" });
    const footer = h(
      "div",
      { class: "palette__foot" },
      h("span", null, h("kbd", { text: "↑" }), h("kbd", { text: "↓" }), " " + t("palette.navigate")),
      h("span", null, h("kbd", { text: "↵" }), " " + t("palette.open")),
      h("span", null, h("kbd", { text: "Esc" }), " " + t("palette.close"))
    );
    const dialog = h(
      "div",
      { class: "palette", role: "dialog", "aria-modal": "true", "aria-label": t("shortcuts.palette") },
      h("div", { class: "palette__search" }, icon("search"), input, h("kbd", { text: "Esc" })),
      list,
      footer
    );
    overlay.append(dialog);
    overlay.onclick = (event) => {
      if (event.target === overlay) closeOverlays();
    };

    state.palette = {
      open: true,
      index: 0,
      items: paletteItems(),
      filtered: [],
      previousFocus: document.activeElement,
    };

    function paintActive() {
      const rows = list.querySelectorAll(".palette__item");
      rows.forEach((row, index) => row.classList.toggle("is-active", index === state.palette.index));
      const active = rows[state.palette.index];
      if (active && typeof active.scrollIntoView === "function") {
        active.scrollIntoView({ block: "nearest" });
      }
    }

    function renderList() {
      const query = input.value.trim().toLowerCase();
      const items = state.palette.items.filter((item) => {
        const haystack = [item.title, item.hint || "", item.keywords || ""].join(" ").toLowerCase();
        return !query || haystack.includes(query);
      });
      state.palette.filtered = items;
      if (state.palette.index >= items.length) state.palette.index = Math.max(0, items.length - 1);
      clear(list);
      let lastGroup = null;
      if (!items.length) {
        list.append(h("div", { class: "palette__empty", text: t("palette.noResults", { query: input.value.trim() }) }));
        return;
      }
      items.forEach((item, index) => {
        if (item.group !== lastGroup) {
          list.append(h("div", { class: "palette__group", text: t(item.group) }));
          lastGroup = item.group;
        }
        const row = h(
          "button",
          {
            class: "palette__item" + (index === state.palette.index ? " is-active" : ""),
            type: "button",
            role: "option",
          },
          icon(item.icon),
          h("span", { class: "palette__item-title", text: item.title }),
          item.hint ? h("span", { class: "palette__item-hint", text: item.hint }) : null
        );
        row.addEventListener("mouseenter", () => {
          state.palette.index = index;
          paintActive();
        });
        row.addEventListener("click", () => runPalette(item));
        list.append(row);
      });
    }

    function runPalette(item) {
      closeOverlays();
      if (item && typeof item.run === "function") item.run();
    }

    input.addEventListener("input", () => {
      state.palette.index = 0;
      renderList();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!state.palette.filtered.length) return;
        state.palette.index = (state.palette.index + 1) % state.palette.filtered.length;
        paintActive();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!state.palette.filtered.length) return;
        state.palette.index =
          (state.palette.index - 1 + state.palette.filtered.length) % state.palette.filtered.length;
        paintActive();
      } else if (event.key === "Enter") {
        event.preventDefault();
        runPalette(state.palette.filtered[state.palette.index]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeOverlays();
      }
    });

    renderList();
    setTimeout(() => input.focus(), 30);
  }

  function openShortcuts() {
    closeOverlays();
    const overlay = layer("shortcutsOverlay", "modal-overlay");
    clear(overlay);
    overlay.hidden = false;
    document.body.classList.add("has-layer");

    const shortcuts = [
      [cmdLabel() + " K", t("shortcuts.palette")],
      ["/", t("shortcuts.search")],
      ["?", t("shortcuts.help")],
      ["Esc", t("shortcuts.close")],
      ["Alt R", t("shortcuts.refresh")],
      ["Alt L", t("shortcuts.language")],
      ["Alt S", t("shortcuts.settings")],
      ["↑ ↓", t("shortcuts.arrows")],
      ["↵", t("shortcuts.enter")],
    ];

    const modal = h(
      "div",
      { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": t("shortcuts.title") },
      h(
        "div",
        { class: "modal__head" },
        h("h2", { class: "modal__title" }, icon("keyboard"), t("shortcuts.title")),
        h(
          "button",
          {
            class: "icon-btn",
            type: "button",
            title: t("common.close"),
            "aria-label": t("common.close"),
            onclick: closeOverlays,
          },
          icon("close")
        )
      ),
      h(
        "div",
        { class: "shortcut-list" },
        shortcuts.map(([keys, label]) =>
          h(
            "div",
            { class: "shortcut-row" },
            h("span", { class: "shortcut-row__label", text: label }),
            h("kbd", { class: "kbd", text: keys })
          )
        )
      )
    );
    overlay.append(modal);
    overlay.onclick = (event) => {
      if (event.target === overlay) closeOverlays();
    };
  }

  function markActivitySeen(at) {
    const seen = Math.max(Number(localStorage.getItem(STORE_SEEN) || 0), Number(at) || 0);
    try {
      localStorage.setItem(STORE_SEEN, String(seen));
    } catch {
      /* ignore */
    }
    if (state.els && state.els.bellDot) state.els.bellDot.hidden = true;
  }

  async function refreshBell() {
    try {
      const data = await apiGet("/api/activity?limit=1");
      const latest = data && data.rows && data.rows[0] ? Number(data.rows[0].at) || 0 : 0;
      state.latestActivityAt = Math.max(state.latestActivityAt, latest);
      const seen = Number(localStorage.getItem(STORE_SEEN) || 0);
      if (state.els && state.els.bellDot) state.els.bellDot.hidden = latest <= seen;
    } catch {
      /* activity is optional chrome */
    }
  }

  function openActivityDrawer() {
    if (state.view !== "app") return;
    closeOverlays();
    const scrim = layer("drawerScrim", "drawer-scrim");
    scrim.hidden = false;
    scrim.onclick = closeOverlays;
    document.body.classList.add("has-layer");

    const drawer = layer("activityDrawer", "drawer");
    clear(drawer);
    drawer.hidden = false;

    const body = h("div", { class: "drawer__body" });
    const refresh = h(
      "button",
      {
        class: "icon-btn",
        type: "button",
        title: t("common.refresh"),
        "aria-label": t("common.refresh"),
        onclick: () => loadActivity(true),
      },
      icon("refresh")
    );
    const head = h(
      "div",
      { class: "drawer__head" },
      h(
        "div",
        null,
        h("h2", { class: "drawer__title" }, icon("activity"), t("activity.drawerTitle")),
        h("p", { class: "drawer__sub", text: t("activity.drawerSub") })
      ),
      h(
        "div",
        { class: "drawer__actions" },
        refresh,
        h(
          "button",
          {
            class: "icon-btn",
            type: "button",
            title: t("common.close"),
            "aria-label": t("common.close"),
            onclick: closeOverlays,
          },
          icon("close")
        )
      )
    );
    drawer.append(head, body);

    async function loadActivity(showSkeleton) {
      if (showSkeleton) {
        clear(body);
        body.append(h("div", { class: "drawer__loading", text: t("common.loading") }));
      }
      refresh.classList.add("is-spinning");
      try {
        const data = await apiGet("/api/activity?limit=50");
        const rows = (data && data.rows) || [];
        renderActivityList(body, rows);
        if (rows.length) {
          state.latestActivityAt = Math.max(state.latestActivityAt, Number(rows[0].at) || 0);
          markActivitySeen(rows[0].at);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          showLogin(true);
          return;
        }
        clear(body);
        body.append(emptyState("alert", t("error.title"), error.message || t("error.title")));
      } finally {
        refresh.classList.remove("is-spinning");
      }
    }

    loadActivity(true);
  }

  function statusLabel(status) {
    const code = Number(status) || 0;
    if (code >= 500) return t("activity.statusError");
    if (code >= 400) return t("activity.statusWarn");
    return t("activity.statusOk");
  }

  function activitySpecial(row) {
    if (row.path === "admin edge started") return t("activity.started");
    if (row.path === "/api/login") return t("activity.loggedIn");
    if (row.path === "/api/logout") return t("activity.loggedOut");
    return null;
  }

  function renderActivityList(host, rows) {
    clear(host);
    if (!rows || !rows.length) {
      host.append(emptyState("activity", t("activity.emptyTitle"), t("activity.emptyText")));
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const code = Number(row.status) || 0;
      const level = row.level || (code >= 500 ? "error" : code >= 400 ? "warn" : "ok");
      const special = activitySpecial(row);
      const title = special
        ? h("div", { class: "activity-row__title", text: special })
        : h(
            "div",
            { class: "activity-row__title" },
            h("span", {
              class: "method method--" + String(row.method || "").toLowerCase(),
              text: row.method || "",
            }),
            h("span", { class: "mono activity-path", text: row.path || "" })
          );
      const metaRow = h(
        "div",
        { class: "activity-row__meta" },
        h("span", { text: relativeTime(row.at) }),
        h("span", { class: "activity-sep", text: "·" }),
        h("span", { class: "status-pill status-pill--" + level, text: statusLabel(row.status) })
      );
      fragment.append(
        h(
          "div",
          { class: "activity-row" },
          h("span", { class: "activity-dot activity-dot--" + level }),
          h("div", { class: "activity-row__body" }, title, metaRow)
        )
      );
    }
    host.append(fragment);
  }

  function openRecordDrawer(row) {
    closeOverlays();
    const scrim = layer("drawerScrim", "drawer-scrim");
    scrim.hidden = false;
    scrim.onclick = closeOverlays;
    document.body.classList.add("has-layer");

    const drawer = layer("recordDrawer", "drawer drawer--record");
    clear(drawer);
    drawer.hidden = false;

    const entries = row && typeof row === "object" ? Object.entries(row) : [["value", row]];
    const details = h("div", { class: "record-list" });
    for (const [key, value] of entries) {
      const cell = h("div", { class: "record-row__value" });
      cell.append(renderCell(value, key));
      details.append(
        h(
          "div",
          { class: "record-row" },
          h("div", { class: "record-row__label", text: columnLabel(key) }),
          cell
        )
      );
    }

    const raw = h("pre", { class: "raw-json", text: JSON.stringify(row, null, 2) });
    const rawSection = h(
      "details",
      { class: "raw-section" },
      h("summary", null, icon("file"), t("common.rawJson")),
      raw
    );

    drawer.append(
      h(
        "div",
        { class: "drawer__head" },
        h(
          "div",
          null,
          h("h2", { class: "drawer__title" }, icon("layers"), t("table.recordDetails")),
          h("p", { class: "drawer__sub", text: t("table.rowHint") })
        ),
        h(
          "div",
          { class: "drawer__actions" },
          h(
            "button",
            {
              class: "icon-btn",
              type: "button",
              title: t("table.copyRow"),
              "aria-label": t("table.copyRow"),
              onclick: () => copyText(JSON.stringify(row, null, 2)),
            },
            icon("copy")
          ),
          h(
            "button",
            {
              class: "icon-btn",
              type: "button",
              title: t("common.close"),
              "aria-label": t("common.close"),
              onclick: closeOverlays,
            },
            icon("close")
          )
        )
      ),
      h("div", { class: "drawer__body" }, details, rawSection)
    );
  }

  /* ----------------------------------------------------------------------
     Routing / rendering
     ---------------------------------------------------------------------- */

  function skeletonPage() {
    return h(
      "div",
      { class: "page", "aria-busy": "true" },
      h("div", { class: "sk sk--hero" }),
      h(
        "div",
        { class: "skeleton-grid" },
        Array.from({ length: 8 }, () => h("div", { class: "sk sk--stat" }))
      ),
      h("div", { class: "sk sk--panel" })
    );
  }

  async function renderRoute(route, opts) {
    if (state.view !== "app" || !state.els) return;
    const target = route || resolveRoute();
    const token = ++state.renderToken;
    state.route = target;
    stopTraffic();
    closeSidebar();
    setActiveNav(target);
    updateChrome(target);

    const content = state.els.content;
    clear(content);
    content.append(skeletonPage());
    if (opts && opts.scroll) window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const page = h("div", { class: "page" });
      await renderPage(page, target);
      if (token !== state.renderToken || state.view !== "app") return;
      clear(content);
      content.append(page);
      setTimeout(refreshBell, 800);
    } catch (error) {
      if (token !== state.renderToken) return;
      if (error instanceof ApiError && error.status === 401) {
        showLogin(true);
        return;
      }
      clear(content);
      content.append(errorPage(error));
    }
  }

  async function renderPage(page, route) {
    if (route.id === "dashboard") return renderDashboard(page);
    if (route.id === "storage") return renderStorage(page);
    if (route.id === "server") return renderServer(page);
    if (route.id === "settings") return renderSettings(page);
    return renderList(page, route);
  }

  function errorPage(error) {
    return h(
      "div",
      { class: "page" },
      h(
        "section",
        { class: "panel" },
        h(
          "div",
          { class: "error-page" },
          h("div", { class: "empty__art" }, icon("alert")),
          h("h2", { text: t("error.title") }),
          h("p", { text: (error && error.message) || t("error.title") }),
          h(
            "button",
            {
              class: "btn btn--ghost",
              type: "button",
              onclick: () => renderRoute(state.route, { scroll: false }),
            },
            icon("refresh"),
            t("common.retry")
          )
        )
      )
    );
  }

  /* ----------------------------------------------------------------------
     Dashboard
     ---------------------------------------------------------------------- */

  const STAT_DEFS = [
    { key: "Users", labelKey: "stats.users", footKey: "stats.usersFoot", icon: "users" },
    { key: "OnlineUsers", labelKey: "stats.online", footKey: "stats.onlineFoot", icon: "activity" },
    { key: "Bots", labelKey: "stats.bots", footKey: "stats.botsFoot", icon: "bot" },
    { key: "BroadcastChannels", labelKey: "stats.channels", footKey: "stats.channelsFoot", icon: "broadcast" },
    { key: "Supergroups", labelKey: "stats.supergroups", footKey: "stats.supergroupsFoot", icon: "group" },
    { key: "StickerSets", labelKey: "stats.stickers", footKey: "stats.stickersFoot", icon: "layers" },
    { key: "EmojiSets", labelKey: "stats.emoji", footKey: "stats.emojiFoot", icon: "sparkle" },
    { key: "Gifs", labelKey: "stats.gifs", footKey: "stats.gifsFoot", icon: "film" },
    { key: "PendingReports", labelKey: "stats.reports", footKey: "stats.reportsFoot", icon: "flag" },
    { key: "PendingVerifications", labelKey: "stats.verifications", footKey: "stats.verificationsFoot", icon: "shieldCheck" },
  ];

  async function renderDashboard(page) {
    const overview = await apiGet("/api/overview");
    const dashboard = overview.dashboard || {};
    const stats = overview.stats || {};
    const status = overview.status || {};
    const counts = dashboard.counts || {};
    const storage = dashboard.storage || {};
    const host = status.host || {};
    const uptime = Number(stats.started_at) || 0;
    const requests = Number(stats.requests) || 0;
    const activityRows = (overview.activity && overview.activity.rows) || [];

    page.append(buildHero(uptime, requests));

    const statsGrid = h("div", { class: "stats", "aria-label": t("nav.dashboard") });
    STAT_DEFS.forEach((definition, index) => {
      const card = h(
        "article",
        { class: "stat", style: "--i:" + index },
        h("div", { class: "stat__icon" }, icon(definition.icon)),
        h("div", { class: "stat__label", text: t(definition.labelKey) }),
        h("div", { class: "stat__value", text: "0" }),
        h("div", { class: "stat__foot", text: t(definition.footKey) })
      );
      statsGrid.append(card);
      animateCount(card.querySelector(".stat__value"), counts[definition.key] || 0);
    });
    page.append(statsGrid);

    page.append(buildChartPanel(requests));
    page.append(
      h(
        "div",
        { class: "trio" },
        buildHealthPanel(host, uptime, requests),
        buildStoragePanel(storage),
        buildQuickPanel()
      )
    );
    page.append(buildActivityPanel(activityRows));

    startTraffic();
  }

  function animateCount(node, value) {
    const target = Number(value);
    if (!Number.isFinite(target)) {
      node.textContent = String(value ?? "0");
      return;
    }
    if (
      prefs.motion === "reduced" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      node.textContent = fmtNumber(target);
      return;
    }
    const duration = 900;
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = fmtNumber(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function buildHero(uptime, requests) {
    return h(
      "section",
      { class: "hero" },
      h(
        "div",
        { class: "hero__copy" },
        h(
          "span",
          { class: "hero__badge" },
          h("span", { class: "dot-live" }),
          t("hero.badge")
        ),
        h(
          "h1",
          { class: "hero__title" },
          t("hero.titleA") + " ",
          h("em", { text: t("hero.titleEm") }),
          t("hero.titleB")
        ),
        h("p", { class: "hero__sub", text: t("hero.sub") }),
        h(
          "div",
          { class: "hero__actions" },
          h(
            "button",
            { class: "btn", type: "button", onclick: () => navigate("#/server") },
            icon("server"),
            t("hero.server")
          ),
          h(
            "button",
            { class: "btn btn--ghost", type: "button", onclick: () => navigate("#/accounts") },
            icon("users"),
            t("hero.accounts")
          )
        ),
        h(
          "div",
          { class: "hero__meta" },
          meta(t("meta.uptime"), fmtDuration(uptime)),
          meta(t("meta.requests"), fmtNumber(requests)),
          meta(t("meta.layer"), "65")
        )
      ),
      h(
        "div",
        { class: "orbit", "aria-hidden": "true" },
        h("span", { class: "orbit__ring orbit__ring--1" }),
        h("span", { class: "orbit__ring orbit__ring--2" }),
        h("span", { class: "orbit__ring orbit__ring--3" }),
        h("span", { class: "orbit__pulse" }),
        h("span", { class: "orbit__pulse orbit__pulse--2" }),
        h("div", { class: "orbit__core", html: LOGO_SVG })
      )
    );
  }

  function chartIntervalKey() {
    return String(Math.round((Number(prefs.refresh) || 0) / 1000));
  }

  function chartLegendText() {
    return t("chart.legend", { interval: t("chart.interval." + chartIntervalKey()) });
  }

  function buildChartPanel(initialRequests) {
    state.traffic = [
      { t: Date.now() - 5000, v: initialRequests },
      { t: Date.now(), v: initialRequests },
    ];
    state.chartAnimated = false;

    const rateChip = h("span", { class: "chip chip--muted", id: "trafficRate", text: t("chart.idle") });
    const totalValue = h("div", {
      class: "chart-stat__value",
      id: "trafficTotal",
      text: fmtNumber(initialRequests),
    });
    const tip = h("div", { class: "chart-tip", id: "chartTip" });
    const svgHost = h("div");
    const wrap = h("div", { class: "chart-wrap" }, tip, svgHost);

    const intervalSelect = h(
      "select",
      {
        class: "select select--sm",
        "aria-label": t("settings.refresh"),
        onchange: (event) => {
          prefs.refresh = Number(event.target.value) || 0;
          savePrefs();
          updateLegend();
          startTraffic();
        },
      },
      [
        { value: "5000", label: "5s" },
        { value: "15000", label: "15s" },
        { value: "60000", label: "1m" },
        { value: "0", label: t("common.off") },
      ].map((option) =>
        h("option", {
          value: option.value,
          text: option.label,
          selected: Number(option.value) === Number(prefs.refresh),
        })
      )
    );

    const legendText = h("span", { id: "chartLegend", text: chartLegendText() });
    const updatedText = h("span", {
      class: "chart-updated",
      id: "chartUpdated",
      text: t("chart.updated", { time: timeLabel(Date.now()) }),
    });

    const panel = h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("activity"), t("chart.title")),
          h("p", { class: "panel__sub", text: t("chart.sub") })
        ),
        h(
          "div",
          { class: "panel__actions" },
          intervalSelect,
          rateChip,
          h(
            "div",
            { class: "chart-stat" },
            totalValue,
            h("div", { class: "chart-stat__label", text: t("chart.total") })
          )
        )
      ),
      wrap,
      h("div", { class: "chart-foot" }, h("span", { class: "chart-legend" }, legendText), updatedText)
    );

    const render = () => {
      clear(svgHost);
      svgHost.append(buildChartSvg(state.traffic, tip, state.chartAnimated));
    };
    state.chartRender = render;
    render();
    state.chartAnimated = true;

    function updateLegend() {
      const text = document.getElementById("chartLegend");
      if (text) text.textContent = chartLegendText();
      const updated = document.getElementById("chartUpdated");
      if (updated) updated.textContent = t("chart.updated", { time: timeLabel(Date.now()) });
    }

    return panel;
  }

  function niceStep(value) {
    if (value <= 1) return 1;
    const exponent = Math.floor(Math.log10(value));
    const base = Math.pow(10, exponent);
    const fraction = value / base;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return nice * base;
  }

  function smoothPath(points) {
    if (!points.length) return "";
    if (points.length === 1) return "M" + points[0].x + "," + points[0].y;
    let path = "M" + points[0].x.toFixed(2) + "," + points[0].y.toFixed(2);
    for (let index = 0; index < points.length - 1; index += 1) {
      const p0 = points[index - 1] || points[index];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[index + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      path +=
        " C" + c1x.toFixed(2) + "," + c1y.toFixed(2) +
        " " + c2x.toFixed(2) + "," + c2y.toFixed(2) +
        " " + p2.x.toFixed(2) + "," + p2.y.toFixed(2);
    }
    return path;
  }

  function buildChartSvg(points, tip, animate) {
    const W = 720;
    const H = 230;
    const L = 46;
    const R = 16;
    const T = 16;
    const B = 30;
    const innerW = W - L - R;
    const innerH = H - T - B;

    const values = points.map((point) => Number(point.v) || 0);
    const max = niceStep(Math.max(4, ...values) / 4) * 4;
    const min = 0;
    const step = points.length > 1 ? innerW / (points.length - 1) : innerW;

    const coords = points.map((point, index) => ({
      x: points.length > 1 ? L + index * step : L + innerW / 2,
      y: T + innerH - ((Number(point.v) - min) / (max - min)) * innerH,
      t: point.t,
      v: Number(point.v) || 0,
    }));

    const line = smoothPath(coords);
    const baseY = T + innerH;
    const area =
      coords.length > 0
        ? line +
          " L" + coords[coords.length - 1].x.toFixed(2) + "," + baseY +
          " L" + coords[0].x.toFixed(2) + "," + baseY + " Z"
        : "";

    let grid = "";
    for (let index = 0; index <= 4; index += 1) {
      const y = T + innerH - (index / 4) * innerH;
      const value = min + ((max - min) * index) / 4;
      grid +=
        '<line x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '"/>' +
        '<text class="chart__axis" x="' + (L - 10) + '" y="' + (y + 3) +
        '" text-anchor="end">' + fmtCompact(value) + "</text>";
    }

    const labelIndexes =
      points.length > 2
        ? [0, Math.floor((points.length - 1) / 2), points.length - 1]
        : points.length === 2
        ? [0, 1]
        : [0];
    let xLabels = "";
    for (const index of labelIndexes) {
      const point = coords[index];
      if (!point) continue;
      const anchor = index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
      xLabels +=
        '<text class="chart__axis" x="' + point.x + '" y="' + (H - 9) +
        '" text-anchor="' + anchor + '">' + timeLabel(point.t) + "</text>";
    }

    const last = coords[coords.length - 1];
    const dot = last
      ? '<circle class="chart__dot-halo" cx="' + last.x + '" cy="' + last.y + '" r="7"/>' +
        '<circle class="chart__dot" cx="' + last.x + '" cy="' + last.y + '" r="3.6"/>'
      : "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "chart");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", t("chart.title"));
    svg.innerHTML =
      "<defs>" +
      '<linearGradient id="pgLineGrad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#0f9f6e"/><stop offset="55%" stop-color="#35e6a0"/><stop offset="100%" stop-color="#8df7b6"/>' +
      "</linearGradient>" +
      '<linearGradient id="pgAreaGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(53,230,160,.26)"/><stop offset="100%" stop-color="rgba(53,230,160,0)"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<g class="chart__grid">' + grid + "</g>" +
      '<path class="chart__area" d="' + area + '"/>' +
      '<path class="chart__line' + (animate ? " is-animated" : "") + '" pathLength="1" d="' + line + '"/>' +
      dot +
      xLabels +
      '<rect class="chart__overlay" x="' + L + '" y="' + T + '" width="' + innerW + '" height="' + innerH + '" fill="transparent"/>';

    const overlay = svg.querySelector(".chart__overlay");
    if (overlay && coords.length > 0) {
      overlay.addEventListener("pointermove", (event) => {
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const cursor = svg.createSVGPoint();
        cursor.x = event.clientX;
        cursor.y = event.clientY;
        const local = cursor.matrixTransform(ctm.inverse());
        const ratio = (local.x - L) / innerW;
        let index = Math.round(ratio * (coords.length - 1));
        index = Math.max(0, Math.min(coords.length - 1, index));
        const point = coords[index];
        tip.innerHTML =
          "<strong>" + fmtNumber(point.v) + "</strong><span>" + timeLabel(point.t) + "</span>";
        const screen = svg.createSVGPoint();
        screen.x = point.x;
        screen.y = point.y;
        const position = screen.matrixTransform(ctm);
        const box = svg.getBoundingClientRect();
        tip.style.left = position.x - box.left + "px";
        tip.style.top = position.y - box.top + "px";
        tip.classList.add("is-visible");
      });
      overlay.addEventListener("pointerleave", () => tip.classList.remove("is-visible"));
    }

    return svg;
  }

  function buildHealthPanel(host, uptime, requests) {
    const platform = [host.distro, host.arch].filter(Boolean).join(" · ") || "linux · amd64";
    const hostUptime = Number(host.uptime_seconds) || uptime;
    return h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("server"), t("health.title")),
          h("p", { class: "panel__sub", text: t("health.sub") })
        ),
        h("span", { class: "chip" }, t("common.healthy"))
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("globe", t("health.hostname"), host.hostname || "pylagram"),
        kvRow("cpu", t("health.platform"), platform),
        kvRow("clock", t("health.uptime"), fmtDuration(hostUptime)),
        kvRow("activity", t("health.requests"), fmtNumber(requests))
      )
    );
  }

  function buildStoragePanel(storage) {
    const objects = Number(storage.ObjectCount) || 0;
    return h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("database"), t("storageCard.title")),
          h("p", { class: "panel__sub", text: t("storageCard.sub") })
        ),
        h(
          "button",
          {
            class: "icon-btn",
            type: "button",
            title: t("storageCard.open"),
            "aria-label": t("storageCard.open"),
            onclick: () => navigate("#/storage"),
          },
          icon("arrowRight")
        )
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("database", t("storageCard.physical"), fmtBytes(storage.PhysicalBytes)),
        kvRow("box", t("storageCard.logical"), fmtBytes(storage.LogicalBytes)),
        kvRow("layers", t("storageCard.objects"), fmtNumber(objects))
      ),
      h("div", {
        class: "panel__sub",
        style: "margin-top:14px",
        text: objects === 0 ? t("storageCard.noObjects") : t("storageCard.populated"),
      })
    );
  }

  function buildQuickPanel() {
    return h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("sparkle"), t("quick.title")),
          h("p", { class: "panel__sub", text: t("quick.sub") })
        )
      ),
      h(
        "div",
        { class: "quick-list" },
        quickLink("accounts", t("quick.accounts"), "#/accounts"),
        quickLink("moderation", t("quick.moderation"), "#/moderation"),
        quickLink("server", t("quick.server"), "#/server"),
        quickLink("settings", t("quick.settings"), "#/settings")
      )
    );
  }

  function quickLink(iconName, label, hash) {
    return h(
      "button",
      { class: "quick-link", type: "button", onclick: () => navigate(hash) },
      icon(iconName),
      label,
      icon("chevronRight", "quick-link__arrow")
    );
  }

  function buildActivityPanel(rows) {
    const host = h("div", { class: "activity-list" });
    renderActivityList(host, rows);
    state.activityPreviewHost = host;
    return h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("activity"), t("activity.title")),
          h("p", { class: "panel__sub", text: t("activity.sub") })
        ),
        h(
          "button",
          { class: "btn btn--ghost btn--sm", type: "button", onclick: openActivityDrawer },
          h("span", { text: t("activity.viewAll") }),
          icon("arrowRight")
        )
      ),
      host
    );
  }

  function refreshActivityPreview() {
    if (!state.activityPreviewHost || !state.route || state.route.id !== "dashboard") return;
    apiGet("/api/activity?limit=6")
      .then((data) => {
        if (state.activityPreviewHost && data && data.rows) {
          renderActivityList(state.activityPreviewHost, data.rows);
        }
      })
      .catch(() => {});
  }

  function startTraffic() {
    if (state.trafficTimer) {
      clearInterval(state.trafficTimer);
      state.trafficTimer = null;
    }
    if (state.view !== "app" || !state.route || state.route.id !== "dashboard") return;
    if (!prefs.refresh) return;
    state.tickCount = 0;
    const tick = async () => {
      if (state.view !== "app" || !state.route || state.route.id !== "dashboard") return;
      try {
        const stats = await apiGet("/admin/stats");
        const total = Number(stats.requests) || 0;
        const previous = state.traffic[state.traffic.length - 1];
        const now = Date.now();
        state.traffic.push({ t: now, v: total });
        if (state.traffic.length > 24) state.traffic.shift();
        if (state.chartRender) state.chartRender();

        const totalElement = document.getElementById("trafficTotal");
        if (totalElement) totalElement.textContent = fmtNumber(total);

        const rateElement = document.getElementById("trafficRate");
        if (rateElement) {
          const delta = previous ? total - previous.v : 0;
          const seconds = previous ? Math.max((now - previous.t) / 1000, 1) : 5;
          const rate = delta / seconds;
          const active = rate > 0.05;
          rateElement.textContent = active
            ? t("chart.rate", { rate: rate.toFixed(1) })
            : t("chart.idle");
          rateElement.classList.toggle("chip--muted", !active);
        }

        const updated = document.getElementById("chartUpdated");
        if (updated) updated.textContent = t("chart.updated", { time: timeLabel(now) });

        state.tickCount += 1;
        if (state.tickCount % 3 === 0) refreshActivityPreview();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearInterval(state.trafficTimer);
          state.trafficTimer = null;
          showLogin(true);
        }
      }
    };
    state.trafficTimer = setInterval(tick, prefs.refresh);
  }

  function stopTraffic() {
    if (state.trafficTimer) {
      clearInterval(state.trafficTimer);
      state.trafficTimer = null;
    }
    state.chartRender = null;
  }

  /* ----------------------------------------------------------------------
     Tables & list pages
     ---------------------------------------------------------------------- */

  function tableState(route) {
    if (!state.tables[route.id]) {
      state.tables[route.id] = {
        query: "",
        sortKey: null,
        sortDir: "asc",
        page: 1,
        perPage: 25,
      };
    }
    return state.tables[route.id];
  }

  function compareRows(left, right, key) {
    const a = left ? left[key] : null;
    const b = right ? right[key] : null;
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
    return String(a ?? "").localeCompare(String(b ?? ""), localeTag(), {
      numeric: true,
      sensitivity: "base",
    });
  }

  function processedRows(rows, ts) {
    const query = ts.query.trim().toLowerCase();
    let filtered = query
      ? rows.filter((row) => JSON.stringify(row || {}).toLowerCase().includes(query))
      : rows.slice();
    if (ts.sortKey) {
      filtered.sort((left, right) => {
        const result = compareRows(left, right, ts.sortKey);
        return ts.sortDir === "asc" ? result : -result;
      });
    }
    return filtered;
  }

  function renderList(page, route) {
    return apiGet(route.endpoint).then((data) => {
      const rows = extractRows(data, route.rowsKeys);
      const ts = tableState(route);
      const countChip = h("span", { class: "chip chip--muted", text: recordsLabel(rows.length) });
      const searchInput = h("input", {
        type: "search",
        value: ts.query,
        placeholder: rows.length ? t(route.emptyKey + ".search") : t("common.searchShort"),
        "aria-label": t("common.search"),
        disabled: rows.length === 0,
      });
      const search = h("div", { class: "search" }, icon("search"), searchInput);
      const body = h("div");
      const foot = h("div", { class: "table-foot" });

      const exportButton = h(
        "button",
        {
          class: "btn btn--ghost btn--sm",
          type: "button",
          disabled: rows.length === 0,
          onclick: () => {
            const keys = collectKeys(processedRows(rows, ts));
            exportCsv(processedRows(rows, ts), keys, route.id + "-" + new Date().toISOString().slice(0, 10));
          },
        },
        icon("download"),
        h("span", { class: "btn-label", text: t("common.export") })
      );

      const refreshButton = h(
        "button",
        {
          class: "icon-btn",
          type: "button",
          title: t("common.refresh"),
          "aria-label": t("common.refresh"),
          onclick: () => renderRoute(route, { scroll: false }),
        },
        icon("refresh")
      );

      const panel = h(
        "section",
        { class: "panel list-panel" },
        h(
          "div",
          { class: "toolbar" },
          h(
            "div",
            { class: "toolbar__meta" },
            h("h2", { class: "panel__title" }, icon(route.icon), t("nav." + route.id)),
            countChip
          ),
          h("div", { class: "toolbar__meta toolbar__meta--actions" }, search, exportButton, refreshButton)
        ),
        body,
        foot
      );

      function draw() {
        const filtered = processedRows(rows, ts);
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / ts.perPage));
        if (ts.page > pages) ts.page = pages;
        if (ts.page < 1) ts.page = 1;
        const start = (ts.page - 1) * ts.perPage;
        const visible = filtered.slice(start, start + ts.perPage);
        const from = total ? start + 1 : 0;
        const to = Math.min(start + ts.perPage, total);
        countChip.textContent = ts.query.trim()
          ? total + " / " + rows.length
          : recordsLabel(rows.length);

        clear(body);
        clear(foot);

        if (!rows.length) {
          body.append(emptyState("inbox", t(route.emptyKey + ".emptyTitle"), t(route.emptyKey + ".emptyText")));
          foot.hidden = true;
          return;
        }
        if (!filtered.length) {
          body.append(
            emptyState(
              "search",
              t("table.noMatchesTitle"),
              t("table.noMatchesText", { query: ts.query.trim() })
            )
          );
          foot.hidden = true;
          return;
        }

        body.append(
          buildTable(visible, {
            sortKey: ts.sortKey,
            sortDir: ts.sortDir,
            onSort: (key) => {
              if (ts.sortKey === key) ts.sortDir = ts.sortDir === "asc" ? "desc" : "asc";
              else {
                ts.sortKey = key;
                ts.sortDir = "asc";
              }
              draw();
            },
            onRow: openRecordDrawer,
          })
        );

        foot.hidden = false;
        foot.append(h("div", { class: "table-foot__info", text: t("common.showing", { from, to, total }) }));

        const perPage = h(
          "label",
          { class: "table-foot__per" },
          h("span", { text: t("common.perPage") }),
          h(
            "select",
            {
              class: "select select--sm",
              "aria-label": t("common.perPage"),
              onchange: (event) => {
                ts.perPage = Number(event.target.value) || 25;
                ts.page = 1;
                draw();
              },
            },
            [25, 50, 100].map((count) =>
              h("option", {
                value: String(count),
                text: String(count),
                selected: count === ts.perPage,
              })
            )
          )
        );

        const pagination = h(
          "div",
          { class: "table-foot__nav" },
          h(
            "button",
            {
              class: "btn btn--ghost btn--sm",
              type: "button",
              disabled: ts.page <= 1,
              onclick: () => {
                ts.page = Math.max(1, ts.page - 1);
                draw();
              },
            },
            icon("chevronLeft"),
            h("span", { class: "btn-label", text: t("common.prev") })
          ),
          h("span", { class: "table-foot__page", text: ts.page + " / " + pages }),
          h(
            "button",
            {
              class: "btn btn--ghost btn--sm",
              type: "button",
              disabled: ts.page >= pages,
              onclick: () => {
                ts.page = Math.min(pages, ts.page + 1);
                draw();
              },
            },
            h("span", { class: "btn-label", text: t("common.next") }),
            icon("chevronRight")
          )
        );

        foot.append(h("div", { class: "table-foot__controls" }, perPage, pagination));
      }

      let searchTimer = null;
      searchInput.addEventListener("input", () => {
        ts.query = searchInput.value;
        ts.page = 1;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(draw, 90);
      });
      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          searchInput.value = "";
          ts.query = "";
          ts.page = 1;
          draw();
        }
      });

      draw();
      page.append(panel);
    });
  }

  function collectKeys(rows) {
    const keys = [];
    for (const row of rows) {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        for (const key of Object.keys(row)) {
          if (!keys.includes(key)) keys.push(key);
        }
      }
    }
    if (!keys.length) keys.push("value");
    return keys;
  }

  function buildTable(rows, opts) {
    const options = opts || {};
    const keys = collectKeys(rows);
    const wrap = h("div", { class: "table-wrap" });
    const table = document.createElement("table");
    table.append(h("caption", { class: "sr-only", text: t("common.records", { count: rows.length }) }));

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const key of keys) {
      const th = document.createElement("th");
      const sorted = options.sortKey === key;
      if (sorted) th.setAttribute("aria-sort", options.sortDir === "asc" ? "ascending" : "descending");
      if (typeof options.onSort === "function") {
        th.append(
          h(
            "button",
            {
              class: "th-sort" + (sorted ? " is-sorted" : ""),
              type: "button",
              title: sorted && options.sortDir === "asc" ? t("table.sortDesc") : t("table.sortAsc"),
              onclick: () => options.onSort(key),
            },
            h("span", { text: columnLabel(key) }),
            icon(sorted ? (options.sortDir === "asc" ? "arrowUp" : "arrowDown") : "sort", "th-sort__icon")
          )
        );
      } else {
        th.textContent = columnLabel(key);
      }
      headRow.append(th);
    }
    if (typeof options.onRow === "function") {
      headRow.append(h("th", { class: "row-open" }, h("span", { class: "sr-only", text: t("common.actions") })));
    }
    thead.append(headRow);
    table.append(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      if (prefs.motion !== "reduced") {
        tr.style.animation = "fadeIn .35s var(--ease) " + Math.min(index, 12) * 22 + "ms both";
      }
      for (const key of keys) {
        const cell = h("td");
        cell.append(renderCell(row && typeof row === "object" ? row[key] : row, key));
        tr.append(cell);
      }
      if (typeof options.onRow === "function") {
        tr.tabIndex = 0;
        tr.classList.add("row-click");
        tr.title = t("table.rowHint");
        const open = () => options.onRow(row);
        tr.addEventListener("click", open);
        tr.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        });
        tr.append(h("td", { class: "row-open" }, icon("chevronRight")));
      }
      tbody.append(tr);
    });
    table.append(tbody);
    wrap.append(table);
    return wrap;
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
  }

  function formatDateValue(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(localeTag(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function renderCell(value, key) {
    if (value === null || value === undefined || value === "") {
      return h("span", { class: "cell-empty", text: "—" });
    }
    if (typeof value === "boolean") {
      return h("span", {
        class: "badge " + (value ? "badge--ok" : "badge--muted"),
        text: value ? t("common.boolTrue") : t("common.boolFalse"),
      });
    }
    if (typeof value === "number") {
      const isIdentifier = key === "id" || String(key).endsWith("_id");
      return h("span", { class: "mono", text: isIdentifier ? String(value) : fmtNumber(value) });
    }
    if (typeof value === "object") {
      const json = JSON.stringify(value);
      const short = json.length > 120 ? json.slice(0, 117) + "..." : json;
      return h("span", { class: "cell-truncate mono", title: json, text: short });
    }
    const text = String(value);
    if (isIsoDate(text)) {
      return h("span", { class: "mono cell-date", title: text, text: formatDateValue(text) });
    }
    if (text.length > 90) {
      return h("span", { class: "cell-truncate", title: text, text });
    }
    return h("span", { text });
  }

  function csvCell(value) {
    if (value === null || value === undefined) return "";
    let text = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (text.includes('"')) text = text.split('"').join('""');
    if (/[",\n\r]/.test(text)) text = '"' + text + '"';
    return text;
  }

  function exportCsv(rows, keys, baseName) {
    const lines = [keys.map((key) => csvCell(columnLabel(key))).join(",")];
    for (const row of rows) {
      lines.push(keys.map((key) => csvCell(row && typeof row === "object" ? row[key] : row)).join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = baseName + ".csv";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t("toast.exported"), t("common.records", { count: rows.length }));
  }

  /* ----------------------------------------------------------------------
     Storage page
     ---------------------------------------------------------------------- */

  async function renderStorage(page) {
    const data = await apiGet("/api/storage/stats");
    const defs = [
      { labelKey: "storagePage.physical", footKey: "storagePage.physicalFoot", icon: "database", value: fmtBytes(data.PhysicalBytes) },
      { labelKey: "storagePage.logical", footKey: "storagePage.logicalFoot", icon: "box", value: fmtBytes(data.LogicalBytes) },
      { labelKey: "storagePage.objects", footKey: "storagePage.objectsFoot", icon: "layers", value: fmtNumber(data.ObjectCount) },
      { labelKey: "storagePage.references", footKey: "storagePage.referencesFoot", icon: "hash", value: fmtNumber(data.ReferenceCount) },
      { labelKey: "storagePage.documents", footKey: "storagePage.documentsFoot", icon: "file", value: fmtNumber(data.DocumentCount) },
      { labelKey: "storagePage.photos", footKey: "storagePage.photosFoot", icon: "image", value: fmtNumber(data.PhotoCount) },
    ];

    const grid = h("div", { class: "stats stats--fixed" });
    defs.forEach((definition, index) => {
      grid.append(
        h(
          "article",
          { class: "stat", style: "--i:" + index },
          h("div", { class: "stat__icon" }, icon(definition.icon)),
          h("div", { class: "stat__label", text: t(definition.labelKey) }),
          h("div", { class: "stat__value", text: definition.value }),
          h("div", { class: "stat__foot", text: t(definition.footKey) })
        )
      );
    });
    page.append(grid);

    const backends = Array.isArray(data.Backends) ? data.Backends : [];
    const panel = h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "toolbar" },
        h(
          "div",
          { class: "toolbar__meta" },
          h("h2", { class: "panel__title" }, icon("database"), t("storagePage.backends")),
          h("span", {
            class: "chip chip--muted",
            text: t("storagePage.configured", { count: backends.length }),
          })
        )
      )
    );

    if (!backends.length) {
      panel.append(
        emptyState(
          "database",
          t("storagePage.noBackendsTitle"),
          t("storagePage.noBackendsText")
        )
      );
    } else {
      panel.append(buildTable(backends, { onRow: openRecordDrawer }));
    }
    page.append(panel);
  }

  /* ----------------------------------------------------------------------
     Server page
     ---------------------------------------------------------------------- */

  async function renderServer(page) {
    const overview = await apiGet("/api/overview");
    const status = overview.status || {};
    const identity = overview.identity || {};
    const stats = overview.stats || {};
    const host = status.host || {};
    const uptime = Number(stats.started_at) || Number(host.uptime_seconds) || 0;
    const requests = Number(stats.requests) || 0;

    const cards = [
      { labelKey: "serverPage.hostname", icon: "globe", value: host.hostname || "pylagram", footKey: "serverPage.hostnameFoot" },
      {
        labelKey: "serverPage.platform",
        icon: "cpu",
        value: [host.distro, host.arch].filter(Boolean).join(" · ") || "linux · amd64",
        footKey: "serverPage.platformFoot",
      },
      { labelKey: "serverPage.os", icon: "server", value: host.os || "linux", footKey: "serverPage.osFoot" },
      {
        labelKey: "serverPage.cores",
        icon: "activity",
        value: host.cpu_cores ? String(host.cpu_cores) : "—",
        footKey: "serverPage.coresFoot",
      },
      { labelKey: "serverPage.uptime", icon: "clock", value: fmtDuration(uptime), footKey: "serverPage.uptimeFoot" },
      { labelKey: "serverPage.requests", icon: "activity", value: fmtNumber(requests), footKey: "serverPage.requestsFoot" },
    ];

    const grid = h("div", { class: "stats stats--fixed" });
    cards.forEach((definition, index) => {
      grid.append(
        h(
          "article",
          { class: "stat", style: "--i:" + index },
          h("div", { class: "stat__icon" }, icon(definition.icon)),
          h("div", { class: "stat__label", text: t(definition.labelKey) }),
          h("div", { class: "stat__value", text: definition.value }),
          h("div", { class: "stat__foot", text: t(definition.footKey) })
        )
      );
    });
    page.append(grid);

    const identityPanel = h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("sparkle"), t("serverPage.identity")),
          h("p", { class: "panel__sub", text: t("serverPage.identitySub") })
        )
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("globe", t("serverPage.name"), identity.name || "PylaGram"),
        kvRow("file", t("serverPage.description"), identity.description || t("serverPage.notConfigured")),
        kvRow(
          "image",
          t("serverPage.customIcon"),
          identity.icon_ext
            ? t("serverPage.configured") + " · " + identity.icon_ext
            : t("serverPage.notConfigured")
        )
      )
    );

    const protocolPanel = h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("layers"), t("serverPage.protocol")),
          h("p", { class: "panel__sub", text: t("serverPage.protocolSub") })
        )
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("layers", t("serverPage.mtprotoLayer"), "65"),
        kvRow("server", t("serverPage.transport"), "TCP"),
        kvRow("shield", t("serverPage.adminApi"), t("serverPage.adminApiValue")),
        kvRow("lock", t("serverPage.session"), t("serverPage.sessionValue"))
      )
    );

    page.append(h("div", { class: "dash-grid" }, identityPanel, h("div", { class: "dash-col" }, protocolPanel)));

    const telemetry = h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("activity"), t("serverPage.telemetry")),
          h("p", { class: "panel__sub", text: t("serverPage.telemetrySub") })
        ),
        h("span", { class: "chip" }, t("common.live"))
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("globe", t("serverPage.origin"), window.location.origin, { mono: true, copy: true }),
        kvRow("clock", t("serverPage.processUptime"), fmtDuration(uptime)),
        kvRow("activity", t("serverPage.requestsServed"), fmtNumber(requests)),
        kvRow("sparkle", t("serverPage.interfaceBuild"), BUILD_LABEL)
      )
    );
    page.append(telemetry);
  }

  /* ----------------------------------------------------------------------
     Settings page
     ---------------------------------------------------------------------- */

  function segmented(options, current, onChange) {
    const group = h("div", { class: "segmented", role: "group" });
    const buttons = options.map((option) => {
      const active = String(option.value) === String(current);
      const button = h(
        "button",
        {
          class: "segmented__btn" + (active ? " is-active" : ""),
          type: "button",
          "aria-pressed": active ? "true" : "false",
        },
        h("span", { text: option.label })
      );
      button.addEventListener("click", () => {
        if (button.classList.contains("is-active")) return;
        buttons.forEach((entry) => {
          entry.classList.toggle("is-active", entry === button);
          entry.setAttribute("aria-pressed", entry === button ? "true" : "false");
        });
        onChange(option.value);
      });
      return button;
    });
    group.append(...buttons);
    return group;
  }

  function settingsSection(iconName, title, sub, ...children) {
    return h(
      "section",
      { class: "panel settings-card" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon(iconName), title),
          sub ? h("p", { class: "panel__sub", text: sub }) : null
        )
      ),
      h("div", { class: "settings-body" }, children)
    );
  }

  function settingRow(label, control, hint) {
    return h(
      "div",
      { class: "settings-row" },
      h(
        "div",
        { class: "settings-row__copy" },
        h("div", { class: "settings-row__label", text: label }),
        hint ? h("div", { class: "settings-row__hint", text: hint }) : null
      ),
      h("div", { class: "settings-row__control" }, control)
    );
  }

  function updatePreference(patch, message) {
    Object.assign(prefs, patch);
    savePrefs();
    applyPrefs();
    toast(message || t("settings.saved"), "");
  }

  async function renderSettings(page) {
    const session = await apiGet("/api/session").catch(() => ({}));
    const actor = session.actor || state.actor || "admin";

    const languagePanel = settingsSection(
      "globe",
      t("settings.language"),
      t("settings.languageDesc"),
      settingRow(
        t("settings.language"),
        segmented(
          [
            { value: "en", label: "English" },
            { value: "ru", label: "Русский" },
          ],
          prefs.locale,
          (value) => setLocale(value)
        )
      )
    );

    const refreshSelect = h(
      "select",
      {
        class: "select",
        "aria-label": t("settings.refresh"),
        onchange: (event) => {
          updatePreference({ refresh: Number(event.target.value) || 0 });
          if (state.route && state.route.id === "dashboard") startTraffic();
        },
      },
      [
        { value: "5000", label: "5s" },
        { value: "15000", label: "15s" },
        { value: "60000", label: "1m" },
        { value: "0", label: t("common.off") },
      ].map((option) =>
        h("option", {
          value: option.value,
          text: option.label,
          selected: Number(option.value) === Number(prefs.refresh),
        })
      )
    );

    const densityControl = segmented(
      [
        { value: "comfortable", label: t("settings.comfortable") },
        { value: "compact", label: t("settings.compact") },
      ],
      prefs.density,
      (value) => {
        updatePreference({ density: value });
        if (state.view === "app") renderRoute(state.route || resolveRoute(), { scroll: false });
      }
    );

    const motionControl = segmented(
      [
        { value: "system", label: t("settings.motionSystem") },
        { value: "reduced", label: t("settings.motionReduced") },
      ],
      prefs.motion,
      (value) => updatePreference({ motion: value })
    );

    const resetButton = h(
      "button",
      {
        class: "btn btn--ghost btn--sm settings-reset",
        type: "button",
        onclick: () => {
          prefs.refresh = 5000;
          prefs.density = "comfortable";
          prefs.motion = "system";
          savePrefs();
          applyPrefs();
          toast(t("toast.prefsReset"), "");
          renderRoute(state.route || resolveRoute(), { scroll: false });
        },
      },
      icon("refresh"),
      t("settings.reset")
    );

    const preferencesPanel = settingsSection(
      "sliders",
      t("settings.preferences"),
      null,
      settingRow(t("settings.refresh"), refreshSelect, t("settings.refreshDesc")),
      settingRow(t("settings.density"), densityControl, t("settings.densityDesc")),
      settingRow(t("settings.motion"), motionControl, t("settings.motionDesc")),
      h("div", { class: "settings-actions" }, resetButton)
    );

    const sessionPanel = settingsSection(
      "lock",
      t("settings.session"),
      null,
      h(
        "div",
        { class: "kv-list" },
        kvRow("user", t("settings.signedInAs"), actor, { mono: true }),
        kvRow("globe", t("settings.currentOrigin"), window.location.origin, {
          mono: true,
          copy: true,
        }),
        kvRow("sparkle", t("settings.interfaceBuild"), BUILD_LABEL)
      ),
      h(
        "div",
        { class: "settings-actions" },
        h(
          "button",
          { class: "btn btn--ghost btn--sm", type: "button", onclick: logout },
          icon("logout"),
          t("settings.signOut")
        )
      )
    );

    const shortcutsPanel = settingsSection(
      "keyboard",
      t("settings.shortcuts"),
      t("settings.shortcutsDesc"),
      h(
        "div",
        { class: "settings-actions" },
        h(
          "button",
          { class: "btn btn--ghost btn--sm", type: "button", onclick: openShortcuts },
          icon("keyboard"),
          t("settings.openShortcuts")
        )
      )
    );

    const aboutPanel = settingsSection(
      "info",
      t("settings.about"),
      null,
      h("p", { class: "settings-about", text: t("settings.aboutText") }),
      h(
        "div",
        { class: "settings-tags" },
        h("span", { class: "chip chip--muted", text: "Rust" }),
        h("span", { class: "chip chip--muted", text: "MTProto" }),
        h("span", { class: "chip chip--muted", text: BUILD_LABEL })
      )
    );

    page.append(
      h(
        "div",
        { class: "settings-grid" },
        h("div", { class: "settings-col" }, languagePanel, preferencesPanel),
        h("div", { class: "settings-col" }, sessionPanel, shortcutsPanel, aboutPanel)
      )
    );
  }

  /* ----------------------------------------------------------------------
     Login
     ---------------------------------------------------------------------- */

  function showLogin(expired, force) {
    if (state.view === "login" && !force) return;
    state.view = "login";
    state.loginExpired = Boolean(expired);
    stopTraffic();
    state.els = null;
    state.route = null;
    document.title = t("common.appName") + " · " + t("common.adminConsole");

    const app = document.getElementById("app");
    clear(app);
    app.className = "";
    app.hidden = false;

    const error = h("div", { class: "login__error", role: "alert" });
    const userInput = h("input", {
      type: "text",
      id: "login-user",
      name: "username",
      autocomplete: "username",
      placeholder: "admin",
      spellcheck: "false",
      value: state.loginDraft.username || "",
    });
    const passInput = h("input", {
      type: "password",
      id: "login-pass",
      name: "password",
      autocomplete: "current-password",
      placeholder: "••••••••",
      value: state.loginDraft.password || "",
    });
    userInput.addEventListener("input", () => {
      state.loginDraft.username = userInput.value;
    });
    passInput.addEventListener("input", () => {
      state.loginDraft.password = passInput.value;
    });

    let passwordVisible = false;
    const passwordToggle = h(
      "button",
      {
        class: "input__action",
        type: "button",
        title: t("login.showPassword"),
        "aria-label": t("login.showPassword"),
        onclick: () => {
          passwordVisible = !passwordVisible;
          passInput.type = passwordVisible ? "text" : "password";
          passwordToggle.replaceChildren(icon(passwordVisible ? "eyeOff" : "eye"));
          passwordToggle.title = t(passwordVisible ? "login.hidePassword" : "login.showPassword");
          passwordToggle.setAttribute("aria-label", passwordToggle.title);
          passInput.focus();
        },
      },
      icon("eye")
    );

    const submitLabel = h("span", { text: t("login.signIn") });
    const submit = h(
      "button",
      { class: "btn", type: "submit" },
      icon("lock"),
      submitLabel,
      icon("arrowRight")
    );

    const form = h("form", { novalidate: true });
    form.append(
      h(
        "div",
        { class: "field" },
        h("label", { for: "login-user", text: t("login.username") }),
        h("div", { class: "input" }, icon("user"), userInput)
      ),
      h(
        "div",
        { class: "field" },
        h("label", { for: "login-pass", text: t("login.password") }),
        h("div", { class: "input" }, icon("key"), passInput, passwordToggle)
      ),
      error,
      submit
    );

    if (expired) {
      error.append(icon("alert"), t("login.expired"));
    }

    let busy = false;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;
      const username = userInput.value.trim();
      const secret = passInput.value;
      if (!username || !secret) {
        error.replaceChildren(icon("alert"), t("login.required"));
        shakeLogin();
        return;
      }
      busy = true;
      submit.disabled = true;
      submitLabel.textContent = t("login.signingIn");
      error.replaceChildren();
      try {
        const result = await apiPost("/api/login", { username, secret });
        state.actor = result.actor || username;
        state.loginDraft = { username: "", password: "" };
        try {
          localStorage.setItem(STORE_ACTOR, state.actor);
        } catch {
          /* ignore */
        }
        buildShell();
        toast(t("toast.welcome"), t("toast.welcomeBody", { actor: state.actor }));
        const target = resolveRoute();
        renderRoute(target, { scroll: false });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          error.replaceChildren(icon("alert"), t("login.invalid"));
        } else {
          error.replaceChildren(icon("alert"), t("login.unreachable"));
        }
        shakeLogin();
        passInput.select();
      } finally {
        busy = false;
        submit.disabled = false;
        submitLabel.textContent = t("login.signIn");
      }
    });

    const loginLang = h(
      "button",
      {
        class: "lang-toggle lang-toggle--login",
        type: "button",
        title: t("login.language"),
        "aria-label": t("login.language"),
        onclick: () => setLocale(prefs.locale === "ru" ? "en" : "ru"),
      },
      icon("globe"),
      h("span", { class: "lang-toggle__label", text: prefs.locale.toUpperCase() })
    );

    const login = h(
      "div",
      { class: "login" },
      h(
        "div",
        { class: "login__card" },
        h(
          "div",
          { class: "login__brand" },
          brandMark(),
          h(
            "span",
            { class: "login__brand-text" },
            h("span", { class: "login__brand-name", text: t("common.appName") }),
            h("span", { class: "login__brand-sub", text: t("common.adminConsole") })
          ),
          loginLang
        ),
        h("h1", { class: "login__title", text: t("login.title") }),
        h("p", { class: "login__sub", text: t("login.sub") }),
        form,
        h(
          "div",
          { class: "login__hint" },
          icon("shieldCheck"),
          t("login.hint")
        ),
        h(
          "div",
          { class: "login__foot" },
          h("span", { text: t("login.foot") }),
          h("span", { class: "mono", text: BUILD_LABEL })
        )
      )
    );

    app.append(login);

    function shakeLogin() {
      login.classList.add("is-shaking");
      setTimeout(() => login.classList.remove("is-shaking"), 460);
    }

    setTimeout(() => userInput.focus(), 320);
  }

  async function logout() {
    try {
      await apiPost("/api/logout", {});
    } catch {
      /* The local view is reset regardless of the server response. */
    }
    state.actor = "admin";
    state.loginDraft = { username: "", password: "" };
    try {
      localStorage.removeItem(STORE_ACTOR);
    } catch {
      /* ignore */
    }
    showLogin(false);
    toast(t("toast.signedOut"), t("toast.signedOutBody"));
  }

  /* ----------------------------------------------------------------------
     Locale / density
     ---------------------------------------------------------------------- */

  function setLocale(locale) {
    if (locale !== "en" && locale !== "ru") return;
    if (prefs.locale === locale) return;
    prefs.locale = locale;
    savePrefs();
    applyPrefs();
    toast(t("toast.language"), locale === "ru" ? "Русский" : "English");
    if (state.view === "app") {
      buildShell();
      renderRoute(state.route || resolveRoute(), { scroll: false });
    } else if (state.view === "login") {
      showLogin(state.loginExpired, true);
    }
  }

  function toggleDensity() {
    prefs.density = prefs.density === "compact" ? "comfortable" : "compact";
    savePrefs();
    applyPrefs();
    toast(
      t("settings.saved"),
      prefs.density === "compact" ? t("settings.compact") : t("settings.comfortable")
    );
    if (state.view === "app") renderRoute(state.route || resolveRoute(), { scroll: false });
  }

  /* ----------------------------------------------------------------------
     Init & global events
     ---------------------------------------------------------------------- */

  function isTyping() {
    const active = document.activeElement;
    if (!active) return false;
    return (
      active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.tagName === "SELECT" ||
      active.isContentEditable
    );
  }

  function overlayOpen() {
    return document.body.classList.contains("has-layer") || state.palette.open;
  }

  async function init() {
    applyPrefs();
    try {
      // /api/session is public and only reports whether any server-side token
      // exists. Probe a protected endpoint instead so a browser without the
      // HttpOnly cookie is sent to the login screen, not into an expired app.
      await apiGet("/api/dashboard");
      const session = await apiGet("/api/session").catch(() => ({}));
      state.actor = session.actor || localStorage.getItem(STORE_ACTOR) || "admin";
      try {
        localStorage.setItem(STORE_ACTOR, state.actor);
      } catch {
        /* ignore */
      }
      buildShell();
      const target = resolveRoute();
      renderRoute(target, { scroll: false });
    } catch {
      showLogin(false);
    } finally {
      hideBoot();
    }
  }

  window.addEventListener("hashchange", () => {
    if (state.view !== "app") return;
    renderRoute(resolveRoute(), { scroll: true });
  });

  window.addEventListener("keydown", (event) => {
    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (state.view === "app") openPalette();
      return;
    }

    if (event.key === "Escape") {
      if (overlayOpen()) closeOverlays();
      else closeSidebar();
      return;
    }

    if (state.view !== "app" || isTyping()) return;

    if (event.altKey && event.key.toLowerCase() === "r") {
      event.preventDefault();
      renderRoute(state.route || resolveRoute(), { scroll: false });
      return;
    }
    if (event.altKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      setLocale(prefs.locale === "ru" ? "en" : "ru");
      return;
    }
    if (event.altKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      navigate("#/settings");
      return;
    }
    if (event.key === "?") {
      event.preventDefault();
      openShortcuts();
      return;
    }
    if (event.key === "/") {
      const input = document.querySelector(".search input:not(:disabled)");
      if (input) {
        event.preventDefault();
        input.focus();
      }
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1020) closeSidebar();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORE_PREFS && state.view === "app") {
      const next = loadPrefs();
      if (next.locale !== prefs.locale || next.density !== prefs.density || next.motion !== prefs.motion) {
        Object.assign(prefs, next);
        applyPrefs();
        buildShell();
        renderRoute(state.route || resolveRoute(), { scroll: false });
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
