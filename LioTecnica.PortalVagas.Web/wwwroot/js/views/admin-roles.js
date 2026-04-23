const ROLES_DATA = window.__adminRolesData || [];

const state = {
  roles: ROLES_DATA.map(r => ({
    id: r.id,
    name: r.name,
    desc: r.description,
    isActive: !!r.isActive
  })),
  filters: { q: "", status: "all" }
};

function apiFetchJson(url, opts) {
  return fetch(url, {
    headers: { "Accept": "application/json", ...(opts?.headers || {}) },
    ...opts
  }).then(async (res) => {
    const contentType = res.headers.get("content-type") || "";
    let bodyText = "";
    let bodyJson = null;

    try { bodyText = await res.text(); } catch { bodyText = ""; }

    if (bodyText && contentType.includes("application/json")) {
      try { bodyJson = JSON.parse(bodyText); } catch { bodyJson = null; }
    }

    if (res.status === 204) return null;

    if (!res.ok) {
      const msg =
        bodyJson?.message ||
        bodyJson?.title ||
        (bodyText ? bodyText.slice(0, 300) : "") ||
        `Erro HTTP ${res.status}`;

      const err = new Error(msg);
      err.status = res.status;
      err.url = url;
      err.body = bodyJson ?? bodyText;
      err.headers = Object.fromEntries(res.headers.entries());
      throw err;
    }

    if (contentType.includes("application/json")) {
      try { return bodyJson ?? JSON.parse(bodyText || "null"); } catch { return null; }
    }

    return bodyText || null;
  });
}

function renderKPIs() {
  const total = state.roles.length;
  const active = state.roles.filter(r => r.isActive).length;
  const inactive = total - active;
  const adminCount = state.roles.filter(r => /admin|gestao|manage/i.test(r.name || "")).length;

  $("#kpiRolesTotal").textContent = total;
  $("#kpiRolesActive").textContent = active;
  $("#kpiRolesInactive").textContent = inactive;
  $("#kpiRolesAdmin").textContent = adminCount;
}

function applyFilters(list) {
  const q = (state.filters.q || "").trim().toLowerCase();
  const status = state.filters.status;

  return list.filter(r => {
    if (status === "active" && !r.isActive) return false;
    if (status === "inactive" && r.isActive) return false;
    if (!q) return true;
    const blob = [r.name, r.desc].join(" ").toLowerCase();
    return blob.includes(q);
  });
}

function statusTag(isActive) {
  if (isActive) return '<span class="tag ok"><i class="bi bi-check2-circle"></i>Ativo</span>';
  return '<span class="tag bad"><i class="bi bi-slash-circle"></i>Inativo</span>';
}

function renderRoles() {
  const tbody = $("#rolesTbody");
  const filtered = applyFilters(state.roles.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")));

  $("#rolesCount").textContent = filtered.length;
  $("#rolesHint").textContent = filtered.length
    ? "Dica: use os filtros para refinar a busca."
    : "Nenhum perfil com os filtros atuais.";

  tbody.replaceChildren();

  if (!filtered.length) {
    const row = cloneTemplate("tpl-role-empty");
    if (row) tbody.appendChild(row);
    return;
  }

  filtered.forEach(r => {
    const row = cloneTemplate("tpl-role-row");
    if (!row) return;

    const nameEl = row.querySelector('[data-role="role-name"]');
    if (nameEl) nameEl.textContent = r.name || "-";
    const idEl = row.querySelector('[data-role="role-id"]');
    if (idEl) idEl.textContent = r.id ? r.id.slice(0, 8) : "-";
    const descEl = row.querySelector('[data-role="role-desc"]');
    if (descEl) descEl.textContent = r.desc || "-";

    const statusEl = row.querySelector('[data-role="role-status"]');
    if (statusEl) statusEl.innerHTML = statusTag(r.isActive);

    row.dataset.id = r.id;
    tbody.appendChild(row);
  });
}

function openDetailsModal(roleId) {
  const role = state.roles.find(r => r.id === roleId);
  if (!role) return;

  const modal = new bootstrap.Modal($("#modalAdminRoleDetails"));
  const nameEl = $("#modalAdminRoleDetails [data-role=\"detail-name\"]");
  const idEl = $("#modalAdminRoleDetails [data-role=\"detail-id\"]");
  const descEl = $("#modalAdminRoleDetails [data-role=\"detail-desc\"]");
  const statusEl = $("#modalAdminRoleDetails [data-role=\"detail-status\"]");
  const createdEl = $("#modalAdminRoleDetails [data-role=\"detail-created\"]");
  const updatedEl = $("#modalAdminRoleDetails [data-role=\"detail-updated\"]");

  if (nameEl) nameEl.textContent = role.name || "-";
  if (idEl) idEl.textContent = role.id || "-";
  if (descEl) descEl.textContent = role.desc || "-";
  if (statusEl) statusEl.innerHTML = statusTag(role.isActive);
  if (createdEl) createdEl.textContent = "-";
  if (updatedEl) updatedEl.textContent = "-";

  apiFetchJson(`/UsuariosPerfis/_api/roles/${roleId}`, { method: "GET" })
    .then(detail => {
      if (!detail) return;
      if (createdEl) createdEl.textContent = detail.createdAtUtc ? fmtDate(detail.createdAtUtc) : "-";
      if (updatedEl) updatedEl.textContent = detail.updatedAtUtc ? fmtDate(detail.updatedAtUtc) : "-";
    })
    .catch(() => {});

  modal.show();
}

async function openEditModal(roleId) {
  const detail = await apiFetchJson(`/UsuariosPerfis/_api/roles/${roleId}`, { method: "GET" });
  if (!detail) return;

  $("#adminRoleId").value = detail.id;
  $("#adminRoleName").value = detail.name || "";
  $("#adminRoleDesc").value = detail.description || "";
  $("#adminRoleStatus").value = detail.isActive ? "active" : "inactive";

  const modal = new bootstrap.Modal($("#modalAdminRole"));
  modal.show();
}

async function saveRole() {
  const id = ($("#adminRoleId").value || "").trim();
  const name = ($("#adminRoleName").value || "").trim();
  const desc = ($("#adminRoleDesc").value || "").trim();
  const status = $("#adminRoleStatus").value;

  if (!id || !name) return;

  await apiFetchJson(`/UsuariosPerfis/_api/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, description: desc, isActive: status === "active" })
  });

  const entry = state.roles.find(r => r.id === id);
  if (entry) {
    entry.name = name;
    entry.desc = desc;
    entry.isActive = status === "active";
  }

  renderKPIs();
  renderRoles();
  bootstrap.Modal.getInstance($("#modalAdminRole")).hide();
}

async function deleteRole(roleId) {
  const role = state.roles.find(r => r.id === roleId);
  const ok = confirm(`Excluir perfil "${role?.name || roleId}"?`);
  if (!ok) return;

  await apiFetchJson(`/UsuariosPerfis/_api/roles/${roleId}`, { method: "DELETE" });
  state.roles = state.roles.filter(r => r.id !== roleId);
  renderKPIs();
  renderRoles();
}

function wireFilters() {
  $("#rSearch").addEventListener("input", () => {
    state.filters.q = $("#rSearch").value || "";
    renderRoles();
  });
  $("#rStatus").addEventListener("change", () => {
    state.filters.status = $("#rStatus").value;
    renderRoles();
  });
}

function wireGlobalSearch() {
  const input = $("#globalSearchRoles");
  if (!input) return;
  input.addEventListener("input", () => {
    $("#rSearch").value = input.value;
    state.filters.q = input.value || "";
    renderRoles();
  });
}

function wireClock() {
  const label = $("#nowLabel");
  if (!label) return;
  const tick = () => {
    const d = new Date();
    label.textContent = d.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };
  tick();
  setInterval(tick, 1000 * 15);
}

function wireRowActions() {
  const tbody = $("#rolesTbody");
  tbody.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-act]");
    if (!btn) return;
    const tr = event.target.closest("tr");
    const roleId = tr?.dataset?.id;
    if (!roleId) return;

    const act = btn.dataset.act;
    if (act === "detail") openDetailsModal(roleId);
    if (act === "edit") openEditModal(roleId);
    if (act === "del") deleteRole(roleId);
  });
}

(function init() {
  renderKPIs();
  renderRoles();
  wireFilters();
  wireGlobalSearch();
  wireClock();
  wireRowActions();
  $("#btnAdminRoleSave").addEventListener("click", saveRole);
})();
