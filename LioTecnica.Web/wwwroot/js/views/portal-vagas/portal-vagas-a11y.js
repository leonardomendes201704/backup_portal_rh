(() => {
  if (window.__pvA11yInit) return;
  window.__pvA11yInit = true;

const A11Y_STORAGE_KEY = "liotec_portal_a11y_v1";
const A11Y_API_BASE = "/PortalVagas/Accessibility";

const SA11y = (window.PortalVagasStrings || {}).a11y || {};
const SCommon = (window.PortalVagasStrings || {}).common || { cancel: "Cancelar", confirm: "Confirmar" };

let a11yCache = null;
let a11yLoaded = false;
let a11yLoading = false;
let __a11yHydratedOnce = false;
let __a11ySaveTimer = null;

function defaultA11y() {
  return {
    language: "",
    channel: "",
    bestTime: "",
    commNotes: "",

    needCaptions: false,
    needInterpreter: false,
    needScreenReader: false,
    needLowStim: false,
    needMobility: false,
    needExtraTime: false,
    needsDetails: "",

    pcdConsent: false,
    pcdYesNo: "",
    pcdType: "",
    pcdProof: "",
    pcdNotes: "",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mapA11yDto(dto) {
  if (!dto) return null;
  return {
    language: dto.idioma || "",
    channel: dto.canal || "",
    bestTime: dto.melhorHorario || "",
    commNotes: dto.observacoesComunicacao || "",

    needCaptions: !!dto.precisaLegendas,
    needInterpreter: !!dto.precisaInterprete,
    needScreenReader: !!dto.precisaLeitorTela,
    needLowStim: !!dto.precisaBaixaEstimulo,
    needMobility: !!dto.precisaMobilidade,
    needExtraTime: !!dto.precisaTempoExtra,
    needsDetails: dto.detalhesNecessidades || "",

    pcdConsent: !!dto.consentimentoPcd,
    pcdYesNo: dto.pcdIdentificacao || "",
    pcdType: dto.pcdTipo || "",
    pcdProof: dto.pcdComprovacao || "",
    pcdNotes: dto.pcdObservacoes || "",

    createdAt: dto.updatedAtUtc || new Date().toISOString(),
    updatedAt: dto.updatedAtUtc || new Date().toISOString()
  };
}

async function ensureA11yLoaded() {
  if (STORAGE_ENABLED || a11yLoaded || a11yLoading) return;
  a11yLoading = true;
  try {
    const res = await fetch(A11Y_API_BASE, { headers: { "Accept": "application/json" }, credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      a11yCache = mapA11yDto(data) || defaultA11y();
    }
  } catch {
    // ignore
  } finally {
    a11yLoaded = true;
    a11yLoading = false;
  }
}

function loadA11y() {
  if (!STORAGE_ENABLED) return a11yCache;
  try {
    const raw = storageGet(A11Y_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveA11yToStorage(obj) {
  if (!STORAGE_ENABLED) {
    a11yCache = obj;
    return;
  }
  try { storageSet(A11Y_STORAGE_KEY, JSON.stringify(obj)); } catch { }
}

function hydrateA11y() {
  if (__a11yHydratedOnce) return;
  __a11yHydratedOnce = true;

  const a = loadA11y() || defaultA11y();
  saveA11yToStorage(a);

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ""; };
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

  setVal("a11yLanguage", a.language);
  setVal("a11yChannel", a.channel);
  setVal("a11yBestTime", a.bestTime);
  setVal("a11yCommNotes", a.commNotes);

  setChk("a11yNeedCaptions", a.needCaptions);
  setChk("a11yNeedInterpreter", a.needInterpreter);
  setChk("a11yNeedScreenReader", a.needScreenReader);
  setChk("a11yNeedLowStim", a.needLowStim);
  setChk("a11yNeedMobility", a.needMobility);
  setChk("a11yNeedExtraTime", a.needExtraTime);
  setVal("a11yNeedsDetails", a.needsDetails);

  setChk("a11yPcdConsent", a.pcdConsent);
  setVal("a11yPcdYesNo", a.pcdYesNo);
  setVal("a11yPcdType", a.pcdType);
  setVal("a11yPcdProof", a.pcdProof);
  setVal("a11yPcdNotes", a.pcdNotes);

  toggleA11yPcdFields(true);
  renderA11yPcdBadge(a);
}

function getA11yFromUI() {
  const val = (id) => (document.getElementById(id)?.value || "").trim();
  const chk = (id) => !!document.getElementById(id)?.checked;

  return {
    language: val("a11yLanguage"),
    channel: val("a11yChannel"),
    bestTime: val("a11yBestTime"),
    commNotes: val("a11yCommNotes"),

    needCaptions: chk("a11yNeedCaptions"),
    needInterpreter: chk("a11yNeedInterpreter"),
    needScreenReader: chk("a11yNeedScreenReader"),
    needLowStim: chk("a11yNeedLowStim"),
    needMobility: chk("a11yNeedMobility"),
    needExtraTime: chk("a11yNeedExtraTime"),
    needsDetails: val("a11yNeedsDetails"),

    pcdConsent: chk("a11yPcdConsent"),
    pcdYesNo: val("a11yPcdYesNo"),
    pcdType: val("a11yPcdType"),
    pcdProof: val("a11yPcdProof"),
    pcdNotes: val("a11yPcdNotes")
  };
}

function saveA11y() {
  const existing = loadA11y() || defaultA11y();
  const ui = getA11yFromUI();

  const merged = {
    ...existing,
    ...ui,
    updatedAt: new Date().toISOString()
  };

  // se não tem consentimento, zera campos PcD por segurança
  if (!merged.pcdConsent) {
    merged.pcdYesNo = "";
    merged.pcdType = "";
    merged.pcdProof = "";
    merged.pcdNotes = "";
  }

  if (STORAGE_ENABLED) {
    saveA11yToStorage(merged);
    renderA11yPcdBadge(merged);
    return;
  }

  const body = {
    idioma: merged.language || null,
    canal: merged.channel || null,
    melhorHorario: merged.bestTime || null,
    observacoesComunicacao: merged.commNotes || null,
    precisaLegendas: !!merged.needCaptions,
    precisaInterprete: !!merged.needInterpreter,
    precisaLeitorTela: !!merged.needScreenReader,
    precisaBaixaEstimulo: !!merged.needLowStim,
    precisaMobilidade: !!merged.needMobility,
    precisaTempoExtra: !!merged.needExtraTime,
    detalhesNecessidades: merged.needsDetails || null,
    consentimentoPcd: !!merged.pcdConsent,
    pcdIdentificacao: merged.pcdYesNo || null,
    pcdTipo: merged.pcdType || null,
    pcdComprovacao: merged.pcdProof || null,
    pcdObservacoes: merged.pcdNotes || null
  };

  fetch(A11Y_API_BASE, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body)
  })
    .then(r => r.json().catch(() => ({})).then(d => ({ ok: r.ok, data: d })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data?.message || SA11y.saveFail);
      const saved = mapA11yDto(data) || merged;
      saveA11yToStorage(saved);
      renderA11yPcdBadge(saved);
    })
    .catch(() => {
      Swal.fire({ icon: "error", title: SA11y.saveFailTitle || "Falha ao salvar", text: SA11y.saveFail || "Falha ao salvar acessibilidade.", confirmButtonColor: "#004aad" });
    });
}

function saveA11yDebounced() {
  clearTimeout(__a11ySaveTimer);
  __a11ySaveTimer = setTimeout(saveA11y, 350);
}

function toggleA11yPcdFields(forceRender) {
  const consent = !!document.getElementById("a11yPcdConsent")?.checked;
  const fields = document.getElementById("a11yPcdFields");
  if (fields) fields.style.display = consent ? "block" : "none";

  if (!consent) {
    if (forceRender !== true) saveA11y();
    renderA11yPcdBadge(loadA11y() || defaultA11y());
    return;
  }

  if (forceRender !== true) saveA11y();
  renderA11yPcdBadge(loadA11y() || defaultA11y());
}

function renderA11yPcdBadge(a) {
  const badge = document.getElementById("a11yPcdBadge");
  if (!badge) return;

  if (!a?.pcdConsent) {
    badge.textContent = "Não informado";
    badge.className = "badge rounded-pill bg-secondary";
    return;
  }

  let label = "Consentido (sem detalhes)";
  if (a.pcdType) label = `PcD: ${a.pcdType}`;
  else if (a.pcdYesNo) label = `PcD: ${a.pcdYesNo}`;

  badge.textContent = label;
  badge.className = "badge rounded-pill bg-success";
}

function renderA11y() {
  hydrateA11y();
}

function resetA11y() {
  Swal.fire({
    title: SA11y.clearTitle || "Limpar Acessibilidade & Inclusão?",
    text: "Esta ação vai limpar as informações deste formulário.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#004aad",
    confirmButtonText: SCommon.confirm || "Confirmar",
    cancelButtonText: SCommon.cancel || "Cancelar"
  }).then(r => {
    if (!r.isConfirmed) return;
    const fresh = defaultA11y();
    saveA11yToStorage(fresh);
    __a11yHydratedOnce = false;
    hydrateA11y();
  });
}

async function seedA11y() {
  if (!STORAGE_ENABLED && !a11yLoaded) {
    await ensureA11yLoaded();
  }
  const payload = {
    language: "Português",
    channel: "WhatsApp",
    bestTime: "Tarde",
    commNotes: "Prefiro mensagens curtas e diretas.",
    needCaptions: true,
    needInterpreter: false,
    needScreenReader: false,
    needLowStim: true,
    needMobility: false,
    needExtraTime: true,
    needsDetails: "Entrevistas online com pausas entre etapas.",
    pcdConsent: true,
    pcdYesNo: "Sim",
    pcdType: "Neurodiversidade",
    pcdProof: "Prefiro não dizer",
    pcdNotes: "Acomodações simples ajudam bastante.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveA11yToStorage(payload);
  __a11yHydratedOnce = false;
  hydrateA11y();
  saveA11y();
}

function downloadA11ySummary() {
  const a = loadA11y() || defaultA11y();
  const fallback = "Não informado";
  const lines = [
    "Resumo de Acessibilidade & Inclusão",
    "===================================",
    "",
    `Idioma: ${a.language || fallback}`,
    `Meio preferido: ${a.channel || fallback}`,
    `Melhor horário: ${a.bestTime || fallback}`,
    `Observações: ${a.commNotes || fallback}`,
    "",
    "Recursos e acomodações:",
    `- Legendas: ${a.needCaptions ? "Sim" : "Não"}`,
    `- Intérprete de Libras: ${a.needInterpreter ? "Sim" : "Não"}`,
    `- Leitor de tela: ${a.needScreenReader ? "Sim" : "Não"}`,
    `- Baixa estimulação: ${a.needLowStim ? "Sim" : "Não"}`,
    `- Mobilidade: ${a.needMobility ? "Sim" : "Não"}`,
    `- Tempo extra: ${a.needExtraTime ? "Sim" : "Não"}`,
    `- Detalhes: ${a.needsDetails || fallback}`,
    "",
    "PcD (opcional):",
    `- Consentimento: ${a.pcdConsent ? "Sim" : "Não"}`,
    `- Identificação: ${a.pcdYesNo || fallback}`,
    `- Tipo: ${a.pcdType || fallback}`,
    `- Comprovação: ${a.pcdProof || fallback}`,
    `- Notas: ${a.pcdNotes || fallback}`
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const dl = document.createElement("a");
  dl.href = URL.createObjectURL(blob);
  dl.download = "resumo-acessibilidade-liotecnica.txt";
  document.body.appendChild(dl);
  dl.click();
  URL.revokeObjectURL(dl.href);
  dl.remove();
}

})();
