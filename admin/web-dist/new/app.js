// PylaGram Admin — new design frontend.
// Consumes the Rust admin API (same contract as gram/srv admin console).

const NAV = [
  { path: "/api/dashboard", title: "Dashboard", icon: "📊" },
  { path: "/api/accounts", title: "Accounts", icon: "👥" },
  { path: "/api/bots", title: "Bots", icon: "🤖" },
  { path: "/api/stars/top", title: "Stars", icon: "⭐" },
  { path: "/api/gifts", title: "Gifts", icon: "🎁" },
  { path: "/api/moderation/cases", title: "Moderation", icon: "🛡" },
  { path: "/api/storage/stats", title: "Storage", icon: "💾" },
  { path: "/api/server/status", title: "Server", icon: "🖥" },
];

async function apiGet(path) {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) throw new Error("HTTP " + res.status + " on " + path);
  return res.json();
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === "class") node.className = attrs[k];
    else if (k === "text") node.textContent = attrs[k];
    else if (k === "onclick") node.onclick = attrs[k];
    else node.setAttribute(k, attrs[k]);
  }
  if (children) for (const c of [].concat(children)) {
    if (c) node.append(c instanceof HTMLElement ? c : document.createTextNode(String(c)));
  }
  return node;
}

function text(t) { const e = document.createElement("div"); e.className = "muted"; e.textContent = t; return e; }

async function renderDashboard() {
  const d = await apiGet("/api/dashboard");
  const c = d && d.counts ? d.counts : {};
  const cards = [
    ["Users", c.Users], ["Online", c.OnlineUsers], ["Bots", c.Bots],
    ["BroadcastChannels", c.BroadcastChannels], ["Supergroups", c.Supergroups],
    ["StickerSets", c.StickerSets], ["EmojiSets", c.EmojiSets], ["Gifs", c.Gifs],
    ["PendingReports", c.PendingReports], ["PendingVerifications", c.PendingVerifications],
  ];
  const grid = el("div", { class: "grid" });
  for (const [label, value] of cards) {
    const card = el("div", { class: "card" });
    card.append(el("div", { class: "label", text: label }));
    card.append(el("div", { class: "value", text: String(value ?? 0) }));
    grid.append(card);
  }
  return grid;
}

function renderTable(container, path) {
  return apiGet(path).then((data) => {
    const panel = el("div", { class: "panel" });
    panel.append(el("h2", { text: path }));
    const rows = (data && (data.rows || data.Gifts || data.cases || data.Auctions)) || [];
    if (!Array.isArray(rows) || rows.length === 0) {
      panel.append(text("empty"));
      return panel;
    }
    const keys = Object.keys(rows[0]);
    const table = el("table");
    const thead = el("thead");
    const tr = el("tr");
    for (const k of keys) tr.append(el("th", { text: k }));
    thead.append(tr);
    table.append(thead);
    const tbody = el("tbody");
    for (const row of rows) {
      const tr2 = el("tr");
      for (const k of keys) tr2.append(el("td", { text: String(row[k] ?? "") }));
      tbody.append(tr2);
    }
    table.append(tbody);
    panel.append(table);
    return panel;
  });
}

async function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const aside = el("aside", { class: "sidebar" });
  const brand = el("div", { class: "brand" });
  brand.append(el("span", { text: "PylaGram" }));
  aside.append(brand);
  const navWrap = el("div");
  NAV.forEach((n) => {
    const item = el("div", { class: "nav-item", onclick: `nav('${n.path}')` });
    item.append(el("span", { text: n.icon }));
    const label = el("span", { class: "label-text", text: n.title });
    item.append(label);
    navWrap.append(item);
  });
  aside.append(navWrap);
  app.append(aside);

  const main = el("div", { class: "main" });
  const topbar = el("div", { class: "topbar" });
  const title = el("h1", { text: "Dashboard" });
  const health = el("div", { class: "muted" });
  topbar.append(title);
  topbar.append(health);
  main.append(topbar);
  const content = el("div");
  main.append(content);
  app.append(main);

  let currentPath = "/api/dashboard";
  let currentTitle = "Dashboard";

  async function nav(path) {
    currentPath = path;
    const n = NAV.find((x) => x.path === path);
    if (n) currentTitle = n.title;
    title.textContent = currentTitle;
    content.innerHTML = "";
    const holder = el("div");
    content.append(holder);
    try {
      if (path === "/api/dashboard") {
        const holder2 = el("div");
        holder2.append(await renderDashboard());
        holder.append(holder2);
      } else {
        holder.append(await renderTable(null, path));
      }
    } catch (e) {
      holder.append(text("load_error: " + e.message));
    }
  }

  window.nav = nav;
  await nav(currentPath);
}

document.addEventListener("DOMContentLoaded", render);
