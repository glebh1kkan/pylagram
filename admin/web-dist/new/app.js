// PylaGram Admin — custom control center frontend.
// Emerald theme, inline SVG iconography, live admin-edge telemetry.

(() => {
  "use strict";

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
        else if (key.startsWith("on") && typeof value === "function")
          node.addEventListener(key.slice(2).toLowerCase(), value);
        else node.setAttribute(key, value === true ? "" : value);
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

  /* ----------------------------------------------------------------------
     Formatting
     ---------------------------------------------------------------------- */

  const numberFmt = new Intl.NumberFormat("en-US");

  function fmtNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? numberFmt.format(n) : String(value ?? "0");
  }

  function fmtCompact(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0";
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(Math.round(n));
  }

  function fmtBytes(value) {
    if (value === null || value === undefined || value === "") return "0 B";
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let v = Math.abs(n);
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i += 1;
    }
    const sign = n < 0 ? "-" : "";
    return sign + (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)) + " " + units[i];
  }

  function fmtDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const d = Math.floor(total / 86400);
    const hr = Math.floor((total % 86400) / 3600);
    const min = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    if (d > 0) return d + "d " + hr + "h";
    if (hr > 0) return hr + "h " + min + "m";
    if (min > 0) return min + "m " + sec + "s";
    return sec + "s";
  }

  function timeLabel(ts) {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function humanize(key) {
    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function animateCount(node, value) {
    const target = Number(value);
    if (!Number.isFinite(target)) {
      node.textContent = String(value ?? "0");
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.textContent = fmtNumber(target);
      return;
    }
    const duration = 900;
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = fmtNumber(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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

  async function apiGet(path) {
    const res = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || "HTTP " + res.status, res.status);
    return data;
  }

  async function apiPost(path, payload) {
    const res = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || "HTTP " + res.status, res.status);
    return data;
  }

  /* ----------------------------------------------------------------------
     Toasts & boot
     ---------------------------------------------------------------------- */

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
    actor: "admin",
    route: null,
    renderToken: 0,
    els: null,
    trafficTimer: null,
    traffic: [],
    chartRender: null,
    chartAnimated: false,
  };

  const ROUTES = [
    {
      id: "dashboard",
      hash: "#/dashboard",
      title: "Dashboard",
      group: "Overview",
      icon: "dashboard",
    },
    {
      id: "accounts",
      hash: "#/accounts",
      title: "Accounts",
      group: "Community",
      icon: "users",
      endpoint: "/api/accounts",
      rowsKeys: ["rows"],
      searchPlaceholder: "Search accounts",
      emptyTitle: "No accounts yet",
      emptyText:
        "Registered accounts, active sessions and restrictions will appear here once the MTProto core starts serving clients.",
    },
    {
      id: "channels",
      hash: "#/channels",
      title: "Channels",
      group: "Community",
      icon: "broadcast",
      endpoint: "/api/channels",
      rowsKeys: ["rows"],
      searchPlaceholder: "Search channels",
      emptyTitle: "No channels yet",
      emptyText:
        "Broadcast channels and supergroups from the message layer will be listed here with their visibility settings.",
    },
    {
      id: "bots",
      hash: "#/bots",
      title: "Bots",
      group: "Community",
      icon: "bot",
      endpoint: "/api/bots",
      rowsKeys: ["rows"],
      searchPlaceholder: "Search bots",
      emptyTitle: "No bots yet",
      emptyText:
        "Bot accounts, their owners and descriptions will appear here after the bot services are connected.",
    },
    {
      id: "stars",
      hash: "#/stars",
      title: "Stars",
      group: "Content",
      icon: "star",
      endpoint: "/api/stars/top",
      rowsKeys: ["rows"],
      searchPlaceholder: "Search balances",
      emptyTitle: "No star balances",
      emptyText:
        "Top star balances and the ledger will be shown here once the payments layer reports activity.",
    },
    {
      id: "gifts",
      hash: "#/gifts",
      title: "Gifts",
      group: "Content",
      icon: "gift",
      endpoint: "/api/gifts",
      rowsKeys: ["Gifts", "gifts"],
      searchPlaceholder: "Search gifts",
      emptyTitle: "No gifts issued",
      emptyText:
        "Issued and collected gifts from the gift catalog will appear here with their ownership metadata.",
    },
    {
      id: "moderation",
      hash: "#/moderation",
      title: "Moderation",
      group: "Trust & Safety",
      icon: "shield",
      endpoint: "/api/moderation/cases",
      rowsKeys: ["cases"],
      searchPlaceholder: "Search cases",
      emptyTitle: "No moderation cases",
      emptyText:
        "Reports, enforcement decisions and appeals will be collected here for the safety team to review.",
    },
    {
      id: "storage",
      hash: "#/storage",
      title: "Storage",
      group: "Infrastructure",
      icon: "database",
    },
    {
      id: "server",
      hash: "#/server",
      title: "Server",
      group: "Infrastructure",
      icon: "server",
    },
  ];

  function resolveRoute() {
    const hash = window.location.hash || "#/dashboard";
    const route = ROUTES.find((r) => r.hash === hash);
    if (route) return route;
    history.replaceState(null, "", "#/dashboard");
    return ROUTES[0];
  }

  /* ----------------------------------------------------------------------
     Shell
     ---------------------------------------------------------------------- */

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
        "aria-label": "PylaGram dashboard",
        onclick: () => navigate("#/dashboard"),
      },
      brandMark(),
      h(
        "span",
        { class: "brand__text" },
        h("span", { class: "brand__name", text: "PylaGram" }),
        h("span", { class: "brand__sub", text: "Admin Console" })
      )
    );

    const nav = h("nav", { class: "nav", "aria-label": "Primary navigation" });
    const groups = new Map();
    for (const route of ROUTES) {
      if (!groups.has(route.group)) groups.set(route.group, []);
      groups.get(route.group).push(route);
    }
    for (const [groupName, routes] of groups) {
      const group = h(
        "div",
        { class: "nav-group" },
        h("div", { class: "nav-label", text: groupName })
      );
      for (const route of routes) {
        const item = h(
          "button",
          {
            class: "nav-item",
            type: "button",
            dataset: { route: route.id },
            onclick: () => navigate(route.hash),
          },
          icon(route.icon),
          h("span", { text: route.title })
        );
        group.append(item);
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
          h("strong", { text: "All systems nominal" }),
          h("span", { text: "Admin edge online" })
        )
      ),
      h(
        "div",
        { class: "sidebar__version" },
        h("span", { text: "PylaGram" }),
        h("span", { class: "mono", text: "v0.1.0" })
      )
    );

    sidebar.append(brand, nav, foot);

    const kicker = h("div", { class: "kicker", text: "Overview" });
    const title = h("h1", { class: "page-title", text: "Dashboard" });
    const menuBtn = h(
      "button",
      {
        class: "icon-btn menu-btn",
        type: "button",
        "aria-label": "Open navigation",
        onclick: openSidebar,
      },
      icon("menu")
    );

    const refreshBtn = h(
      "button",
      {
        class: "icon-btn",
        type: "button",
        title: "Refresh data",
        "aria-label": "Refresh data",
        onclick: () => {
          refreshBtn.classList.add("is-spinning");
          setTimeout(() => refreshBtn.classList.remove("is-spinning"), 750);
          renderRoute(state.route || resolveRoute());
        },
      },
      icon("refresh")
    );

    const userChip = h(
      "div",
      { class: "user-chip" },
      h("div", { class: "avatar", text: avatarLetter() }),
      h(
        "div",
        { class: "user-meta" },
        h("strong", { text: state.actor }),
        h("span", { text: "Owner" })
      ),
      h(
        "button",
        {
          class: "icon-btn",
          type: "button",
          title: "Sign out",
          "aria-label": "Sign out",
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
        h("div", { class: "status-pill" }, h("span", { class: "dot-live" }), "Live"),
        refreshBtn,
        userChip
      )
    );

    const content = h("main", { class: "content", id: "content" });
    const main = h("div", { class: "main" }, topbar, content);
    const scrim = h("div", { class: "scrim", id: "scrim", onclick: closeSidebar });

    app.append(sidebar, main, scrim);

    state.els = { sidebar, nav, kicker, title, content, scrim, refreshBtn };
    state.view = "app";
  }

  function avatarLetter() {
    const name = String(state.actor || "A").trim();
    return (name.charAt(0) || "A").toUpperCase();
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
    if (state.view !== "app") return;
    closeSidebar();
    if (window.location.hash === hash) {
      renderRoute(resolveRoute());
    } else {
      window.location.hash = hash;
    }
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
    state.els.kicker.textContent = route.group;
    state.els.title.textContent = route.title;
    document.title = route.title + " · PylaGram Admin";
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
    if (opts && opts.scroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    try {
      const page = h("div", { class: "page" });
      await renderPage(page, target);
      if (token !== state.renderToken || state.view !== "app") return;
      clear(content);
      content.append(page);
    } catch (err) {
      if (token !== state.renderToken) return;
      if (err instanceof ApiError && err.status === 401) {
        showLogin(true);
        return;
      }
      clear(content);
      content.append(errorPage(err));
    }
  }

  async function renderPage(page, route) {
    if (route.id === "dashboard") return renderDashboard(page);
    if (route.id === "storage") return renderStorage(page);
    if (route.id === "server") return renderServer(page);
    return renderList(page, route);
  }

  function errorPage(err) {
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
          h("h2", { text: "Could not load this page" }),
          h("p", { text: (err && err.message) || "The admin API returned an unexpected response." }),
          h(
            "button",
            {
              class: "btn btn--ghost",
              type: "button",
              onclick: () => renderRoute(state.route, { scroll: false }),
            },
            icon("refresh"),
            "Try again"
          )
        )
      )
    );
  }

  /* ----------------------------------------------------------------------
     Dashboard
     ---------------------------------------------------------------------- */

  const STAT_DEFS = [
    { key: "Users", label: "Users", icon: "users", foot: "Registered accounts" },
    { key: "OnlineUsers", label: "Online", icon: "activity", foot: "Active sessions" },
    { key: "Bots", label: "Bots", icon: "bot", foot: "Connected bots" },
    { key: "BroadcastChannels", label: "Channels", icon: "broadcast", foot: "Broadcast channels" },
    { key: "Supergroups", label: "Supergroups", icon: "group", foot: "Community spaces" },
    { key: "StickerSets", label: "Sticker sets", icon: "layers", foot: "Sticker catalog" },
    { key: "EmojiSets", label: "Emoji sets", icon: "sparkle", foot: "Emoji catalog" },
    { key: "Gifs", label: "GIFs", icon: "film", foot: "Animated media" },
    { key: "PendingReports", label: "Reports", icon: "flag", foot: "Pending review" },
    { key: "PendingVerifications", label: "Verifications", icon: "shieldCheck", foot: "Awaiting review" },
  ];

  async function renderDashboard(page) {
    const [stats, dashboard, status] = await Promise.all([
      apiGet("/admin/stats").catch(() => ({})),
      apiGet("/api/dashboard"),
      apiGet("/api/server/status").catch(() => ({})),
    ]);

    const counts = dashboard.counts || {};
    const storage = dashboard.storage || {};
    const host = (status && status.host) || {};
    const uptime = Number(stats.started_at) || 0;
    const requests = Number(stats.requests) || 0;

    page.append(buildHero(uptime, requests));

    const statsGrid = h("div", { class: "stats", "aria-label": "Dashboard counters" });
    STAT_DEFS.forEach((def, index) => {
      const card = h(
        "article",
        { class: "stat", style: "--i:" + index },
        h("div", { class: "stat__icon" }, icon(def.icon)),
        h("div", { class: "stat__label", text: def.label }),
        h("div", { class: "stat__value", text: "0" }),
        h("div", { class: "stat__foot", text: def.foot })
      );
      statsGrid.append(card);
      animateCount(card.querySelector(".stat__value"), counts[def.key] || 0);
    });
    page.append(statsGrid);

    const chartPanel = buildChartPanel(requests);
    page.append(chartPanel);
    page.append(
      h(
        "div",
        { class: "trio" },
        buildHealthPanel(host, uptime, requests),
        buildStoragePanel(storage),
        buildQuickPanel()
      )
    );

    startTraffic();
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
          "Rust control plane"
        ),
        h(
          "h1",
          { class: "hero__title" },
          "Everything is ",
          h("em", { text: "under control" }),
          "."
        ),
        h("p", {
          class: "hero__sub",
          text:
            "PylaGram Admin brings accounts, channels, gifts and infrastructure into one calm control surface — powered by the Rust rewrite of the MTProto server.",
        }),
        h(
          "div",
          { class: "hero__actions" },
          h(
            "button",
            { class: "btn", type: "button", onclick: () => navigate("#/server") },
            icon("server"),
            "Server overview"
          ),
          h(
            "button",
            { class: "btn btn--ghost", type: "button", onclick: () => navigate("#/accounts") },
            icon("users"),
            "Manage accounts"
          )
        ),
        h(
          "div",
          { class: "hero__meta" },
          meta("Uptime", fmtDuration(uptime)),
          meta("Requests", fmtNumber(requests)),
          meta("MTProto layer", "65")
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

  function buildChartPanel(initialRequests) {
    state.traffic = [
      { t: Date.now() - 5000, v: initialRequests },
      { t: Date.now(), v: initialRequests },
    ];
    state.chartAnimated = false;

    const rateChip = h("span", { class: "chip chip--muted", id: "trafficRate", text: "idle" });
    const totalValue = h("div", {
      class: "chart-stat__value",
      id: "trafficTotal",
      text: fmtNumber(initialRequests),
    });
    const tip = h("div", { class: "chart-tip", id: "chartTip" });
    const svgHost = h("div");

    const wrap = h("div", { class: "chart-wrap" }, tip, svgHost);

    const panel = h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "panel__head" },
        h(
          "div",
          null,
          h("h2", { class: "panel__title" }, icon("activity"), "Request traffic"),
          h("p", {
            class: "panel__sub",
            text: "Requests observed by the admin edge since it started.",
          })
        ),
        h(
          "div",
          { class: "panel__actions" },
          rateChip,
          h(
            "div",
            { class: "chart-stat" },
            totalValue,
            h("div", { class: "chart-stat__label", text: "Total requests" })
          )
        )
      ),
      wrap,
      h(
        "div",
        { class: "chart-legend" },
        "Live telemetry · refreshed every 5 seconds"
      )
    );

    const render = (animate) => {
      clear(svgHost);
      svgHost.append(buildChartSvg(state.traffic, tip, animate));
    };
    state.chartRender = () => render(false);
    render(!state.chartAnimated);
    state.chartAnimated = true;
    return panel;
  }

  function niceStep(value) {
    if (value <= 1) return 1;
    const exp = Math.floor(Math.log10(value));
    const base = Math.pow(10, exp);
    const frac = value / base;
    const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
    return nice * base;
  }

  function smoothPath(points) {
    if (!points.length) return "";
    if (points.length === 1) return "M" + points[0].x + "," + points[0].y;
    let d = "M" + points[0].x.toFixed(2) + "," + points[0].y.toFixed(2);
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d +=
        " C" + c1x.toFixed(2) + "," + c1y.toFixed(2) +
        " " + c2x.toFixed(2) + "," + c2y.toFixed(2) +
        " " + p2.x.toFixed(2) + "," + p2.y.toFixed(2);
    }
    return d;
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

    const values = points.map((p) => Number(p.v) || 0);
    const max = niceStep(Math.max(4, ...values) / 4) * 4;
    const min = 0;
    const step = points.length > 1 ? innerW / (points.length - 1) : innerW;

    const coords = points.map((p, i) => ({
      x: points.length > 1 ? L + i * step : L + innerW / 2,
      y: T + innerH - ((Number(p.v) - min) / (max - min)) * innerH,
      t: p.t,
      v: Number(p.v) || 0,
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
    for (let i = 0; i <= 4; i += 1) {
      const y = T + innerH - (i / 4) * innerH;
      const value = min + ((max - min) * i) / 4;
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
    for (const idx of labelIndexes) {
      const p = coords[idx];
      if (!p) continue;
      const anchor = idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle";
      xLabels +=
        '<text class="chart__axis" x="' + p.x + '" y="' + (H - 9) +
        '" text-anchor="' + anchor + '">' + timeLabel(p.t) + "</text>";
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
    svg.setAttribute("aria-label", "Request traffic over time");
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
        let idx = Math.round(ratio * (coords.length - 1));
        idx = Math.max(0, Math.min(coords.length - 1, idx));
        const point = coords[idx];
        tip.innerHTML =
          "<strong>" + fmtNumber(point.v) + "</strong><span>" + timeLabel(point.t) + "</span>";
        const screen = svg.createSVGPoint();
        screen.x = point.x;
        screen.y = point.y;
        const pos = screen.matrixTransform(ctm);
        const box = svg.getBoundingClientRect();
        tip.style.left = pos.x - box.left + "px";
        tip.style.top = pos.y - box.top + "px";
        tip.classList.add("is-visible");
      });
      overlay.addEventListener("pointerleave", () => tip.classList.remove("is-visible"));
    }

    return svg;
  }

  function buildHealthPanel(host, uptime, requests) {
    const platform =
      [host.distro, host.arch].filter(Boolean).join(" · ") || "linux · amd64";
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
          h("h2", { class: "panel__title" }, icon("server"), "System health"),
          h("p", { class: "panel__sub", text: "Admin edge and host telemetry." })
        ),
        h("span", { class: "chip" }, "Healthy")
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("globe", "Hostname", host.hostname || "pylagram"),
        kvRow("cpu", "Platform", platform),
        kvRow("clock", "Uptime", fmtDuration(hostUptime)),
        kvRow("activity", "Requests served", fmtNumber(requests))
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
          h("h2", { class: "panel__title" }, icon("database"), "Storage"),
          h("p", { class: "panel__sub", text: "Media layer footprint." })
        ),
        h(
          "button",
          {
            class: "icon-btn",
            type: "button",
            title: "Open storage",
            "aria-label": "Open storage",
            onclick: () => navigate("#/storage"),
          },
          icon("arrowRight")
        )
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("database", "Physical size", fmtBytes(storage.PhysicalBytes)),
        kvRow("box", "Logical size", fmtBytes(storage.LogicalBytes)),
        kvRow("layers", "Stored objects", fmtNumber(objects))
      ),
      h("div", {
        class: "panel__sub",
        style: "margin-top:14px",
        text: objects === 0 ? "No objects stored yet." : "Storage layer is populated.",
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
          h("h2", { class: "panel__title" }, icon("sparkle"), "Quick actions"),
          h("p", { class: "panel__sub", text: "Jump straight into the work." })
        )
      ),
      h(
        "div",
        { class: "quick-list" },
        quickLink("accounts", "Review accounts", "#/accounts"),
        quickLink("moderation", "Open moderation queue", "#/moderation"),
        quickLink("server", "Inspect server", "#/server")
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

  function kvRow(iconName, label, value) {
    return h(
      "div",
      { class: "kv-row" },
      h("div", { class: "tile" }, icon(iconName)),
      h(
        "div",
        { class: "kv-row__body" },
        h("div", { class: "kv-row__label", text: label }),
        h("div", { class: "kv-row__value", text: value })
      )
    );
  }

  function startTraffic() {
    clearInterval(state.trafficTimer);
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

        const totalEl = document.getElementById("trafficTotal");
        if (totalEl) totalEl.textContent = fmtNumber(total);

        const rateEl = document.getElementById("trafficRate");
        if (rateEl) {
          const delta = previous ? total - previous.v : 0;
          const seconds = previous ? Math.max((now - previous.t) / 1000, 1) : 5;
          const rate = delta / seconds;
          const active = rate > 0.05;
          rateEl.textContent = active ? rate.toFixed(1) + " req/s" : "idle";
          rateEl.classList.toggle("chip--muted", !active);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearInterval(state.trafficTimer);
          state.trafficTimer = null;
          showLogin(true);
        }
      }
    };
    state.trafficTimer = setInterval(tick, 5000);
  }

  function stopTraffic() {
    if (state.trafficTimer) {
      clearInterval(state.trafficTimer);
      state.trafficTimer = null;
    }
    state.chartRender = null;
  }

  /* ----------------------------------------------------------------------
     Generic list pages
     ---------------------------------------------------------------------- */

  function extractRows(data, keys) {
    if (!data || typeof data !== "object") return [];
    for (const key of keys || []) {
      if (Array.isArray(data[key])) return data[key];
    }
    return Array.isArray(data) ? data : [];
  }

  async function renderList(page, route) {
    const data = await apiGet(route.endpoint);
    const rows = extractRows(data, route.rowsKeys);
    const countChip = h("span", { class: "chip chip--muted" });
    const searchInput = h("input", {
      type: "search",
      placeholder: rows.length ? route.searchPlaceholder || "Filter records" : "No records to filter",
      "aria-label": "Filter records",
      disabled: rows.length === 0,
    });
    const search = h("div", { class: "search" }, icon("search"), searchInput);
    const body = h("div");

    const refreshBtn = h(
      "button",
      {
        class: "icon-btn",
        type: "button",
        title: "Refresh",
        "aria-label": "Refresh",
        onclick: () => renderRoute(route),
      },
      icon("refresh")
    );

    const panel = h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "toolbar" },
        h(
          "div",
          { class: "toolbar__meta" },
          h("h2", { class: "panel__title" }, icon(route.icon), route.title),
          countChip
        ),
        h("div", { class: "toolbar__meta" }, search, refreshBtn)
      ),
      body
    );

    const updateCount = (shown) => {
      countChip.textContent =
        shown === rows.length ? rows.length + " records" : shown + " of " + rows.length;
    };

    const draw = () => {
      const query = searchInput.value.trim().toLowerCase();
      const filtered = query
        ? rows.filter((row) => JSON.stringify(row || {}).toLowerCase().includes(query))
        : rows;

      updateCount(filtered.length);
      clear(body);
      if (rows.length === 0) {
        body.append(
          emptyState("inbox", route.emptyTitle || "Nothing here yet", route.emptyText || "No records were returned by the admin API.")
        );
        return;
      }
      if (filtered.length === 0) {
        body.append(
          emptyState(
            "search",
            "No matches",
            'Nothing matches "' + searchInput.value.trim() + '". Try a different search.'
          )
        );
        return;
      }
      body.append(buildTable(filtered));
    };

    searchInput.addEventListener("input", draw);
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        searchInput.value = "";
        draw();
      }
    });

    draw();
    page.append(panel);
  }

  function buildTable(rows) {
    const keys = [];
    for (const row of rows.slice(0, 30)) {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        for (const key of Object.keys(row)) {
          if (!keys.includes(key)) keys.push(key);
        }
      }
    }
    if (keys.length === 0) keys.push("value");

    const wrap = h("div", { class: "table-wrap" });
    const table = document.createElement("table");
    table.append(h("caption", { class: "sr-only", text: "API records" }));

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const key of keys) headRow.append(h("th", { text: humanize(key) }));
    thead.append(headRow);
    table.append(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.style.animation = "fadeIn .35s var(--ease) " + Math.min(index, 12) * 22 + "ms both";
      for (const key of keys) {
        const cell = h("td");
        cell.append(renderCell(row && typeof row === "object" ? row[key] : row));
        tr.append(cell);
      }
      tbody.append(tr);
    });
    table.append(tbody);
    wrap.append(table);
    return wrap;
  }

  function renderCell(value) {
    if (value === null || value === undefined || value === "") {
      return h("span", { class: "cell-empty", text: "—" });
    }
    if (typeof value === "boolean") {
      return h("span", {
        class: "badge " + (value ? "badge--ok" : "badge--muted"),
        text: value ? "true" : "false",
      });
    }
    if (typeof value === "number") {
      return h("span", { class: "mono", text: String(value) });
    }
    if (typeof value === "object") {
      const json = JSON.stringify(value);
      const short = json.length > 120 ? json.slice(0, 117) + "..." : json;
      return h("span", { class: "cell-truncate mono", title: json, text: short });
    }
    const str = String(value);
    if (str.length > 90) {
      return h("span", { class: "cell-truncate", title: str, text: str });
    }
    return h("span", { text: str });
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
     Storage page
     ---------------------------------------------------------------------- */

  async function renderStorage(page) {
    const data = await apiGet("/api/storage/stats");
    const defs = [
      { label: "Physical size", icon: "database", value: fmtBytes(data.PhysicalBytes), foot: "On disk" },
      { label: "Logical size", icon: "box", value: fmtBytes(data.LogicalBytes), foot: "Referenced bytes" },
      { label: "Objects", icon: "layers", value: fmtNumber(data.ObjectCount), foot: "Stored objects" },
      { label: "References", icon: "hash", value: fmtNumber(data.ReferenceCount), foot: "Object references" },
      { label: "Documents", icon: "file", value: fmtNumber(data.DocumentCount), foot: "Files and media" },
      { label: "Photos", icon: "image", value: fmtNumber(data.PhotoCount), foot: "Image objects" },
    ];

    const grid = h("div", { class: "stats stats--fixed" });
    defs.forEach((def, index) => {
      grid.append(
        h(
          "article",
          { class: "stat", style: "--i:" + index },
          h("div", { class: "stat__icon" }, icon(def.icon)),
          h("div", { class: "stat__label", text: def.label }),
          h("div", { class: "stat__value", text: def.value }),
          h("div", { class: "stat__foot", text: def.foot })
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
          h("h2", { class: "panel__title" }, icon("database"), "Backends"),
          h("span", { class: "chip chip--muted", text: backends.length + " configured" })
        )
      )
    );

    if (backends.length === 0) {
      panel.append(
        emptyState(
          "database",
          "No storage backends",
          "The storage layer has not reported any backends yet. Postgres and Redis adapters will be listed here once connected."
        )
      );
    } else {
      panel.append(buildTable(backends));
    }

    page.append(panel);
  }

  /* ----------------------------------------------------------------------
     Server page
     ---------------------------------------------------------------------- */

  async function renderServer(page) {
    const [status, identity, stats] = await Promise.all([
      apiGet("/api/server/status").catch(() => ({})),
      apiGet("/api/server/identity").catch(() => ({})),
      apiGet("/admin/stats").catch(() => ({})),
    ]);

    const host = (status && status.host) || {};
    const uptime = Number(stats.started_at) || Number(host.uptime_seconds) || 0;
    const requests = Number(stats.requests) || 0;

    const cards = [
      { label: "Hostname", icon: "globe", value: host.hostname || "pylagram", foot: "Server identity" },
      {
        label: "Platform",
        icon: "cpu",
        value: [host.distro, host.arch].filter(Boolean).join(" · ") || "linux · amd64",
        foot: "Distribution and arch",
      },
      { label: "OS", icon: "server", value: host.os || "linux", foot: "Operating system" },
      {
        label: "CPU cores",
        icon: "activity",
        value: host.cpu_cores ? String(host.cpu_cores) : "—",
        foot: "Reported by host",
      },
      { label: "Uptime", icon: "clock", value: fmtDuration(uptime), foot: "Admin edge process" },
      { label: "Requests", icon: "activity", value: fmtNumber(requests), foot: "Since process start" },
    ];

    const grid = h("div", { class: "stats stats--fixed" });
    cards.forEach((def, index) => {
      grid.append(
        h(
          "article",
          { class: "stat", style: "--i:" + index },
          h("div", { class: "stat__icon" }, icon(def.icon)),
          h("div", { class: "stat__label", text: def.label }),
          h("div", { class: "stat__value", text: def.value }),
          h("div", { class: "stat__foot", text: def.foot })
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
          h("h2", { class: "panel__title" }, icon("sparkle"), "Server identity"),
          h("p", { class: "panel__sub", text: "Branding served to clients." })
        )
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("globe", "Name", identity.name || "PylaGram"),
        kvRow("file", "Description", identity.description || "Not configured"),
        kvRow(
          "image",
          "Custom icon",
          identity.icon_ext ? "Configured · " + identity.icon_ext : "Not configured"
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
          h("h2", { class: "panel__title" }, icon("layers"), "Protocol surface"),
          h("p", { class: "panel__sub", text: "What this admin edge is serving." })
        )
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("layers", "MTProto layer", "65"),
        kvRow("server", "Transport", "TCP"),
        kvRow("shield", "Admin API", "Rust HTTP edge"),
        kvRow("lock", "Session", "HttpOnly cookie")
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
          h("h2", { class: "panel__title" }, icon("activity"), "Edge telemetry"),
          h("p", { class: "panel__sub", text: "Live counters from the admin edge." })
        ),
        h("span", { class: "chip" }, "Live")
      ),
      h(
        "div",
        { class: "kv-list" },
        kvRow("globe", "Admin origin", window.location.origin),
        kvRow("clock", "Process uptime", fmtDuration(uptime)),
        kvRow("activity", "Requests served", fmtNumber(requests)),
        kvRow("sparkle", "Interface build", "Emerald · v5")
      )
    );
    page.append(telemetry);
  }

  /* ----------------------------------------------------------------------
     Login / logout / boot flow
     ---------------------------------------------------------------------- */

  function showLogin(expired) {
    if (state.view === "login") return;
    state.view = "login";
    stopTraffic();
    state.els = null;
    state.route = null;

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
    });
    const passInput = h("input", {
      type: "password",
      id: "login-pass",
      name: "password",
      autocomplete: "current-password",
      placeholder: "Enter your password",
    });
    const submitLabel = h("span", { text: "Sign in" });
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
        h("label", { for: "login-user", text: "Username" }),
        h("div", { class: "input" }, icon("user"), userInput)
      ),
      h(
        "div",
        { class: "field" },
        h("label", { for: "login-pass", text: "Password" }),
        h("div", { class: "input" }, icon("key"), passInput)
      ),
      error,
      submit
    );

    if (expired) {
      error.append(icon("alert"), "Your session expired. Sign in to continue.");
    }

    let busy = false;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;
      const username = userInput.value.trim();
      const secret = passInput.value;
      if (!username || !secret) {
        error.replaceChildren(icon("alert"), "Enter both username and password.");
        shakeLogin();
        return;
      }
      busy = true;
      submit.disabled = true;
      submitLabel.textContent = "Signing in...";
      error.replaceChildren();
      try {
        const result = await apiPost("/api/login", { username, secret });
        state.actor = result.actor || username;
        toast("Welcome back", "Signed in as " + state.actor);
        buildShell();
        const target = resolveRoute();
        renderRoute(target, { scroll: false });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          error.replaceChildren(icon("alert"), "Invalid username or password.");
        } else {
          error.replaceChildren(icon("alert"), "Could not reach the admin API. Try again.");
        }
        shakeLogin();
        passInput.select();
      } finally {
        busy = false;
        submit.disabled = false;
        submitLabel.textContent = "Sign in";
      }
    });

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
            null,
            h("span", { class: "login__brand-name", text: "PylaGram" }),
            h("span", { class: "login__brand-sub", text: "Admin Console" })
          )
        ),
        h("h1", { class: "login__title", text: "Welcome back" }),
        h("p", {
          class: "login__sub",
          text:
            "Sign in to the control center for accounts, content, moderation and infrastructure.",
        }),
        form,
        h(
          "div",
          { class: "login__hint" },
          icon("shieldCheck"),
          "Session secured with an HttpOnly cookie"
        ),
        h(
          "div",
          { class: "login__foot" },
          h("span", { text: "PylaGram control plane" }),
          h("span", { class: "mono", text: "RUST · v0.1.0" })
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
    showLogin(false);
    toast("Signed out", "Your admin session has been closed.");
  }

  async function init() {
    try {
      // /api/session is public and only reports whether any server-side token
      // exists. Probe a protected endpoint instead so a browser without the
      // HttpOnly cookie is sent to the login screen, not into an expired app.
      await apiGet("/api/dashboard");
      const session = await apiGet("/api/session").catch(() => ({}));
      state.actor = session.actor || "admin";
      buildShell();
      const target = resolveRoute();
      renderRoute(target, { scroll: false });
    } catch {
      showLogin(false);
    } finally {
      hideBoot();
    }
  }

  /* ----------------------------------------------------------------------
     Global events
     ---------------------------------------------------------------------- */

  window.addEventListener("hashchange", () => {
    if (state.view !== "app") return;
    renderRoute(resolveRoute(), { scroll: true });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
    const tag = document.activeElement ? document.activeElement.tagName : "";
    if (event.key === "/" && state.view === "app" && tag !== "INPUT" && tag !== "TEXTAREA") {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
