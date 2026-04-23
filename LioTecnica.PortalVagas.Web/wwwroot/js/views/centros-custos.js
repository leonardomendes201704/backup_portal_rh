const COST_CENTERS_API_BASE = "/CentrosCustos/_api";
const DEPARTMENTS_API_URL = "/CentrosCustos/_api/departments";
const EMPTY_TEXT = "-";

const state = {
  centrosCustos: [],
  departments: [],
  filters: { q: "", status: "all", link: "all" }
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

function setText(root, role, value, fallback = EMPTY_TEXT) {
  if (!root) return;
  const el = root.querySelector(`[data-role="${role}"]`);
  if (!el) return;
  el.textContent = value ?? fallback;
}

function fromApiStatus(raw) {
  const v = (raw || "").toString().trim().toLowerCase();
  if (v === "active" || v === "ativo" || v === "true" || v === "1") return "ativo";
  if (v === "inactive" || v === "inativo" || v === "false" || v === "0") return "inativo";
  return v || "inativo";
}

function normalizeCostCenterRow(c) {
  c = c || {};
  const pick = (...vals) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  };

  return {
    id: pick(c.id, c.Id),
    codigo: pick(c.codigo, c.code),
    nome: pick(c.nome, c.name),
    descricao: pick(c.descricao, c.description),
    grupo: pick(c.grupo, c.groupName),
    unidade: pick(c.unidade, c.unitName),
    status: fromApiStatus(pick(c.status, c.isActive ? "ativo" : "inativo"))
  };
}

async function loadCostCentersFromApi() {
  const data = await apiFetchJson(COST_CENTERS_API_BASE, { method: "GET" });
  const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  state.centrosCustos = items.map(normalizeCostCenterRow);
}

async function loadDepartmentsFromApi() {
  const data = await apiFetchJson(`${DEPARTMENTS_API_URL}?page=1&pageSize=300`, { method: "GET" });
  const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  state.departments = items.map(d => ({
    id: d.id || d.Id,
    codigo: d.code || d.codigo,
    nome: d.name || d.nome,
    costCenter: d.costCenter || d.centroCusto,
    headcount: Number.isFinite(+d.headcount) ? +d.headcount : 0
  }));
}

function buildStatusBadge(status) {
  const map = {
    ativo: { text: "Ativo", cls: "success" },
    inativo: { text: "Inativo", cls: "secondary" }
  };
  const meta = map[status] || { text: status || "-", cls: "secondary" };
  const span = document.createElement("span");
  span.className = `badge text-bg-${meta.cls} rounded-pill`;
  span.textContent = meta.text;
  return span;
}

function getLinkedDepartments(cc) {
  const codeKey = normalizeText(cc?.codigo || "");
  const nameKey = normalizeText(cc?.nome || "");
  return (state.departments || []).filter(d => {
    const dc = normalizeText(d.costCenter || "");
    return (codeKey && dc === codeKey) || (nameKey && dc === nameKey);
  });
}

function updateKpis() {
  const total = state.centrosCustos.length;
  const ativos = state.centrosCustos.filter(c => c.status === "ativo").length;
  const linkedDeptCount = state.centrosCustos.reduce((acc, c) => acc + getLinkedDepartments(c).length, 0);
  const headcount = state.centrosCustos.reduce((acc, c) => {
    const sum = getLinkedDepartments(c).reduce((s, d) => s + (parseInt(d.headcount, 10) || 0), 0);
    return acc + sum;
  }, 0);

  $("#kpiCcTotal").textContent = total;
  $("#kpiCcActive").textContent = ativos;
  $("#kpiCcDepartments").textContent = linkedDeptCount;
  $("#kpiCcHeadcount").textContent = headcount;
}

function getFiltered() {
  const q = normalizeText(state.filters.q || "");
  const st = state.filters.status;
  const link = state.filters.link;

  return state.centrosCustos.filter(c => {
    if (st !== "all" && (c.status || "") !== st) return false;
    if (!q) {
      // continue
    } else {
      const blob = normalizeText([c.nome, c.codigo, c.descricao, c.grupo, c.unidade].join(" "));
      if (!blob.includes(q)) return false;
    }

    if (link !== "all") {
      const hasLink = getLinkedDepartments(c).length > 0;
      if (link === "linked" && !hasLink) return false;
      if (link === "unlinked" && hasLink) return false;
    }

    return true;
  });
}

function renderTable() {
  const tbody = $("#ccTbody");
  if (!tbody) return;
  tbody.replaceChildren();

  const rows = getFiltered();
  const countEl = $("#ccCount");
  const hintEl = $("#ccHint");
  if (countEl) countEl.textContent = rows.length;
  if (hintEl) hintEl.textContent = rows.length ? `${rows.length} centros de custo encontrados.` : "Nenhum centro de custo encontrado.";

  if (!rows.length) {
    const empty = cloneTemplate("tpl-cc-empty-row");
    if (empty) tbody.appendChild(empty);
    return;
  }

  rows.forEach(c0 => {
    const c = normalizeCostCenterRow(c0);
    const tr = cloneTemplate("tpl-cc-row");
    if (!tr) return;

    setText(tr, "cc-name", c.nome || EMPTY_TEXT);
    setText(tr, "cc-code", c.codigo || EMPTY_TEXT);
    setText(tr, "cc-desc", c.descricao || EMPTY_TEXT);

    const linked = getLinkedDepartments(c);
    const deptCount = linked.length;
    const headcount = linked.reduce((acc, d) => acc + (parseInt(d.headcount, 10) || 0), 0);

    setText(tr, "cc-depts", String(deptCount));
    setText(tr, "cc-headcount", String(headcount));

    const statusHost = tr.querySelector('[data-role="cc-status-host"]');
    if (statusHost) statusHost.replaceChildren(buildStatusBadge(c.status));

    tr.querySelectorAll("button[data-act]").forEach(btn => {
      btn.dataset.id = c.id;
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const act = btn.dataset.act;
        if (act === "detail") openCostCenterDetail(c.id);
        if (act === "edit") openCostCenterModal("edit", c.id);
        if (act === "del") deleteCostCenter(c.id);
      });
    });

    tbody.appendChild(tr);
  });
}

function findCostCenter(id) {
  return state.centrosCustos.find(c => c.id === id) || null;
}

async function openCostCenterModal(mode, id) {
  const modal = bootstrap.Modal.getOrCreateInstance($("#modalCostCenter"));
  const isEdit = mode === "edit";
  $("#modalCostCenterTitle").textContent = isEdit ? "Editar centro de custo" : "Novo centro de custo";

  if (isEdit) {
    try {
      const apiCc = await apiFetchJson(`${COST_CENTERS_API_BASE}/${id}`, { method: "GET" });
      const c = normalizeCostCenterRow(apiCc || findCostCenter(id) || {});

      $("#ccId").value = c.id || "";
      $("#ccCodigo").value = c.codigo || "";
      $("#ccNome").value = c.nome || "";
      $("#ccStatus").value = c.status || "ativo";
      $("#ccDescricao").value = c.descricao || "";
      if ($("#ccGrupo")) $("#ccGrupo").value = c.grupo || "";
      if ($("#ccUnidade")) $("#ccUnidade").value = c.unidade || "";
    } catch (err) {
      console.error(err);
      toast("Falha ao carregar centro de custo para edicao.");
      return;
    }
  } else {
    $("#ccId").value = "";
    $("#ccCodigo").value = "";
    $("#ccNome").value = "";
    $("#ccStatus").value = "ativo";
    $("#ccDescricao").value = "";
    if ($("#ccGrupo")) $("#ccGrupo").value = "";
    if ($("#ccUnidade")) $("#ccUnidade").value = "";
  }

  modal.show();
}

async function saveCostCenterFromModal() {
  const id = ($("#ccId").value || "").trim() || null;
  const codigo = ($("#ccCodigo").value || "").trim();
  const nome = ($("#ccNome").value || "").trim();
  const status = ($("#ccStatus").value || "ativo").trim();
  const descricao = ($("#ccDescricao").value || "").trim();
  const grupo = ($("#ccGrupo") ? ($("#ccGrupo").value || "").trim() : "");
  const unidade = ($("#ccUnidade") ? ($("#ccUnidade").value || "").trim() : "");

  if (!codigo || !nome) {
    toast("Informe codigo e nome do centro de custo.");
    return;
  }

  const payload = {
    code: codigo,
    name: nome,
    description: descricao,
    groupName: grupo,
    unitName: unidade,
    isActive: status === "ativo"
  };

  const btn = $("#btnSaveCostCenter");
  if (btn) btn.disabled = true;

  try {
    if (id) {
      await apiFetchJson(`${COST_CENTERS_API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      toast("Centro de custo atualizado.");
    } else {
      await apiFetchJson(COST_CENTERS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      toast("Centro de custo criado.");
    }

    await loadCostCentersFromApi();
    updateKpis();
    renderTable();
    bootstrap.Modal.getOrCreateInstance($("#modalCostCenter")).hide();
  } catch (err) {
    console.error(err);
    toast("Falha ao salvar centro de custo.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteCostCenter(id) {
  const c = findCostCenter(id);
  if (!c) return;
  const ok = confirm(`Excluir o centro de custo "${c.nome}"?`);
  if (!ok) return;

  try {
    await apiFetchJson(`${COST_CENTERS_API_BASE}/${id}`, { method: "DELETE" });
    toast("Centro de custo removido.");

    await loadCostCentersFromApi();
    updateKpis();
    renderTable();
  } catch (err) {
    console.error(err);
    toast("Falha ao excluir centro de custo.");
  }
}

function openCostCenterDetail(id) {
  const c = findCostCenter(id);
  if (!c) return;

  const root = $("#modalCostCenterDetalhes");
  if (!root) {
    openCostCenterModal("edit", id);
    return;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(root);

  setText(root, "cc-name", c.nome || EMPTY_TEXT);
  setText(root, "cc-code", c.codigo || EMPTY_TEXT);
  setText(root, "cc-desc", c.descricao || EMPTY_TEXT);
  setText(root, "cc-group", c.grupo || EMPTY_TEXT);
  setText(root, "cc-unit", c.unidade || EMPTY_TEXT);

  const statusHost = root.querySelector('[data-role="cc-status-host"]');
  if (statusHost) statusHost.replaceChildren(buildStatusBadge(c.status));

  const linked = getLinkedDepartments(c);
  const countEl = $("#ccVagasCount");
  if (countEl) countEl.textContent = linked.length;

  modal.show();
}

function exportCsv() {
  const headers = ["Codigo", "CentroDeCusto", "Status", "Grupo", "Unidade", "Descricao"];
  const rows = state.centrosCustos.map(c => [
    c.codigo, c.nome, c.status, c.grupo, c.unidade, c.descricao
  ]);
  const csv = [
    headers.map(h => `"${String(h).replaceAll('"', '""')}"`).join(";"),
    ...rows.map(r => r.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(";"))
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "centros_custo_liotecnica.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function wireFilters() {
  const apply = () => {
    state.filters.q = ($("#ccSearch").value || "").trim();
    state.filters.status = $("#ccStatusFilter").value || "all";
    state.filters.link = $("#ccLink").value || "all";
    renderTable();
  };

  $("#ccSearch").addEventListener("input", apply);
  $("#ccStatusFilter").addEventListener("change", apply);
  $("#ccLink").addEventListener("change", apply);

  const global = $("#globalSearchCostCenter");
  if (global) {
    global.addEventListener("input", () => {
      $("#ccSearch").value = global.value;
      apply();
    });
  }
}

function wireButtons() {
  $("#btnNewCostCenter").addEventListener("click", () => openCostCenterModal("new"));
  $("#btnSaveCostCenter").addEventListener("click", saveCostCenterFromModal);
  $("#btnExportCostCenter").addEventListener("click", exportCsv);
}

(async function init() {
  try {
    await loadCostCentersFromApi();
    await loadDepartmentsFromApi();
  } catch (err) {
    console.error(err);
    toast("Falha ao carregar dados da API.");
    state.centrosCustos = [];
    state.departments = [];
  }

  updateKpis();
  renderTable();

  wireFilters();
  wireButtons();
})();
