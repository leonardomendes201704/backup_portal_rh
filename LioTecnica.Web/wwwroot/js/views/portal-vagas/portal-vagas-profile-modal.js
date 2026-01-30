(function () {
  const S = window.PortalVagasStrings || { common: { ok: "Ok" } };

  const sectionMap = {
    perfil: "tabProfile",
    testes: "tabTests",
    comp: "tabSkills",
    formacao: "tabEdu",
    exp: "tabExperience",
    lgpd: "tabLgpd",
    pref: "tabPref",
    docs: "tabDocs",
    refs: "tabRefs",
    acess: "tabA11y",
    agenda: "tabAgenda",
    hist: "tabApps",
    notif: "tabNotify",
    match: "tabMatch"
  };

  const sectionsCards = document.getElementById("profileSectionsCards");
  const sectionsContent = document.getElementById("profileSectionsContent");
  const backButtons = Array.from(document.querySelectorAll(".profile-back-to-cards"));

  const leftCol = document.getElementById("profileLeftPanelCol");
  const rightCol = document.getElementById("profileSectionsCol");

  function showCardsView() {
    sectionsCards?.classList.remove("d-none");
    sectionsContent?.classList.add("d-none");
    backButtons.forEach(btn => btn.classList.add("d-none"));
    selectedKey = null;
    const grid = document.getElementById("profileTopicsGrid");
    if (grid) {
      grid.querySelectorAll(".topic-card").forEach(card => card.classList.remove("is-selected"));
    }
    if (leftCol) leftCol.classList.remove("d-none");
    if (rightCol) {
      rightCol.classList.remove("col-lg-12");
      if (!rightCol.classList.contains("col-lg-7")) rightCol.classList.add("col-lg-7");
    }
  }

  function showSectionView(key) {
    if (!key) return;
    const paneId = sectionMap[key];
    if (!paneId) return;

    const panes = document.querySelectorAll("#profileTabsContent .tab-pane");
    panes.forEach(p => p.classList.remove("show", "active"));
    const target = document.getElementById(paneId);
    if (target) {
      target.classList.add("show", "active");
    }

    sectionsCards?.classList.add("d-none");
    sectionsContent?.classList.remove("d-none");
    backButtons.forEach(btn => btn.classList.remove("d-none"));
    if (leftCol) leftCol.classList.add("d-none");
    if (rightCol) {
      rightCol.classList.remove("col-lg-7");
      if (!rightCol.classList.contains("col-lg-12")) rightCol.classList.add("col-lg-12");
    }

    if (key === "pref" && typeof window.renderPreferences === "function") {
      window.renderPreferences();
    }
    if (key === "lgpd" && typeof window.renderLgpd === "function") {
      window.renderLgpd();
    }
    if (key === "agenda" && typeof window.renderAgenda === "function") {
      window.renderAgenda();
    }
    if (key === "notif" && typeof window.renderNotify === "function") {
      window.renderNotify();
    }
  }

  const TOPICS = [
    { key: "perfil", name: "Perfil", icon: "bi-person" },
    { key: "testes", name: "Testes", icon: "bi-clipboard-check" },
    { key: "comp", name: "Competências & Portfólio", icon: "bi-lightning-charge" },
    { key: "formacao", name: "Formação & Educação", icon: "bi-mortarboard" },
    { key: "exp", name: "Experiência & Projetos", icon: "bi-briefcase" },
    { key: "lgpd", name: "Privacidade (LGPD)", icon: "bi-shield-lock" },
    { key: "pref", name: "Preferências / Objetivos", icon: "bi-bullseye" },
    { key: "docs", name: "Documentos & Anexos", icon: "bi-paperclip" },
    { key: "refs", name: "Referências", icon: "bi-people" },
    { key: "acess", name: "Acessibilidade & Inclusão", icon: "bi-universal-access" },
    { key: "agenda", name: "Disponibilidade & Agenda", icon: "bi-calendar-week" },
    { key: "hist", name: "Histórico de Candidaturas", icon: "bi-clock-history" },
    { key: "notif", name: "Notificações & Comunicação", icon: "bi-bell" },
    { key: "match", name: "Vagas sugeridas", icon: "bi-stars" },
    { key: "clear", name: "Limpar Perfil", icon: "bi-eraser" }
  ];

  const progressByKey = Object.create(null);
  TOPICS.forEach(t => {
    progressByKey[t.key] = 0;
  });

  let selectedKey = null;
  let rendered = false;

  function classFromPercent(pct) {
    if (pct >= 75) return "is-green";
    if (pct >= 50) return "is-blue";
    if (pct >= 25) return "is-yellow";
    return "is-red";
  }

  function randomPercent() {
    const r = Math.random();
    if (r < 0.08) return 0;
    if (r > 0.92) return 100;
    return Math.floor(10 + Math.random() * 86);
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function getCssNumber(varName) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  // 0..100 -> matiz (vermelho/laranja -> amarelo -> verde)
  function hueFromPercent(pct) {
    const p = clamp(pct, 0, 100);
    if (p <= 50) {
      const t = p / 50;
      return lerp(getCssNumber("--c-low"), getCssNumber("--c-mid"), t);
    }
    const t = (p - 50) / 50;
    return lerp(getCssNumber("--c-mid"), getCssNumber("--c-high"), t);
  }

  function renderGrid() {
    const grid = document.getElementById("profileTopicsGrid");
    if (!grid) return;

    grid.innerHTML = "";
    TOPICS.forEach(topic => {
      const pct = progressByKey[topic.key];
      const hue = Math.round(hueFromPercent(pct));

      const item = document.createElement("div");
      item.className = "topic-item";

      const card = document.createElement("button");
      card.type = "button";
      card.className = "topic-card";
      card.setAttribute("data-key", topic.key);
      card.setAttribute("data-hue", hue);
      card.style.setProperty("--h", hue);
      card.setAttribute("aria-label", topic.name);
      card.classList.add(classFromPercent(pct));

      const badge = document.createElement("span");
      badge.className = "topic-badge";
      badge.textContent = pct + "%";

      const icon = document.createElement("i");
      icon.className = `topic-icon bi ${topic.icon}`;

      const prog = document.createElement("div");
      prog.className = "topic-progress";
      const fill = document.createElement("span");
      fill.style.width = clamp(pct, 0, 100) + "%";
      prog.appendChild(fill);

      card.appendChild(badge);
      card.appendChild(icon);
      card.appendChild(prog);

      const label = document.createElement("div");
      label.className = "topic-label";
      label.textContent = topic.name;

      const sub = document.createElement("div");
      sub.className = "topic-sub";
      sub.textContent = "";

      item.appendChild(card);
      item.appendChild(label);
      item.appendChild(sub);

      grid.appendChild(item);
    });
  }
  function showDetail(key) {
    selectedKey = key;
    const grid = document.getElementById("profileTopicsGrid");
    if (!grid) return;
    const cards = grid.querySelectorAll(".topic-card");
    cards.forEach(card => {
      card.classList.toggle("is-selected", card.getAttribute("data-key") === key);
    });
  }

  function applyCompletion(data) {
    const sections = data?.sections || data?.Sections;
    if (!sections || typeof sections !== "object") return;
    Object.keys(progressByKey).forEach(key => {
      const value = sections[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        progressByKey[key] = Math.max(0, Math.min(100, Math.round(value)));
      }
    });
    renderGrid();
    if (selectedKey) showDetail(selectedKey);
  }

  function showSuggestionsModal(data) {
    const suggestions = data?.suggestions || data?.Suggestions;
    if (!Array.isArray(suggestions) || !suggestions.length || !window.Swal) return;

    const impactLabel = (value) => {
      const v = (value || "").toString().toLowerCase();
      if (v === "alta") return "Alta";
      if (v === "media") return "Média";
      if (v === "baixa") return "Baixa";
      return value || "";
    };

    const esc = (s) => String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const labelByKey = TOPICS.reduce((acc, t) => {
      acc[t.key] = t.name;
      return acc;
    }, {});

    const items = suggestions.map(s => {
      const rawKey = (s.section || "").toString().toLowerCase();
      const sectionLabel = labelByKey[rawKey] || s.section || "";
      const section = esc(sectionLabel);
      const text = esc(s.text || "");
      const impact = esc(impactLabel(s.impact));
      return `<li class="mb-2"><strong>${section}</strong> • ${text}<div class="small text-muted">Impacto: ${impact}</div></li>`;
    }).join("");

    const modalToken = Date.now().toString();
    window.__portalSuggestionsModalToken = modalToken;

    Swal.fire({
      icon: "info",
      title: "Sugestoes para melhorar seu perfil",
      html: `<ul class="text-start ps-3">${items}</ul>`,
      confirmButtonText: S.common.ok,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.dataset.modalToken = modalToken;
      },
      willClose: () => {
        const container = Swal.getContainer();
        if (container?.dataset?.modalToken === modalToken) {
          delete window.__portalSuggestionsModalToken;
        }
      }
    });
  }

  async function openJobMatches() {
    let loadingToken = null;
    if (window.Swal) {
      loadingToken = Date.now().toString();
      Swal.fire({
        title: "Buscando vagas sugeridas",
        html: "Aguarde...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          const container = Swal.getContainer();
          if (container) container.dataset.modalToken = loadingToken;
          Swal.showLoading();
        },
        willClose: () => {
          const container = Swal.getContainer();
          if (container?.dataset?.modalToken === loadingToken) {
            loadingToken = null;
          }
        }
      });
    }

    try {
      const response = await fetch("/PortalVagas/Jobs/Matches", {
        method: "GET",
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (loadingToken) Swal.close();
        renderMatchesError(data?.message || "Tente novamente.");
        return;
      }

      const matches = data?.matches || data?.Matches || [];
      if (!Array.isArray(matches) || matches.length === 0) {
        if (loadingToken) Swal.close();
        renderMatchesEmpty();
        return;
      }

      const scores = matches
        .map(m => Number(m.score))
        .filter(n => Number.isFinite(n));
      if (scores.length) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        progressByKey.match = Math.max(0, Math.min(100, avg));
        renderGrid();
        if (selectedKey) showDetail(selectedKey);
      }

      const esc = (s) => String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const items = matches.map((m) => {
        const title = esc(m.title || "Vaga");
        const area = esc(m.area || "");
        const city = esc(m.city || "");
        const uf = esc(m.uf || "");
        const level = esc(m.level || "");
        const modeRaw = (m.mode || "").toString();
        const mode = esc(modeRaw);
        const reason = esc(m.reason || "");
        const score = Number.isFinite(m.score) ? m.score : 0;
        const scoreClass = score >= 75 ? "job-score-high"
          : score >= 50 ? "job-score-mid"
            : score >= 25 ? "job-score-low"
              : "job-score-zero";
        const modeKey = modeRaw.trim().toLowerCase();
        const modeIcon = modeKey.includes("remoto")
          ? "bi-laptop"
          : modeKey.includes("hibri")
            ? "bi-arrow-repeat"
            : "bi-building";

        const metaParts = [area, level, mode, city, uf].filter(Boolean);
        const meta = metaParts.length ? `<div class="job-match-meta">${metaParts.join(" &bull; ")}</div>` : "";
        const reasonHtml = reason
          ? `<div class="job-match-reason"><i class="bi bi-graph-up-arrow me-1"></i>${reason}</div>`
          : "";
        return `
          <div class="job-match-card ${scoreClass}">
            <div class="job-match-icon"><i class="bi ${modeIcon}"></i></div>
            <div class="job-match-info">
              <div class="job-match-title">${title}</div>
              ${meta}
              ${reasonHtml}
            </div>
            <div class="job-match-score">${score}%</div>
          </div>`;
      }).join("");

      if (loadingToken) Swal.close();
      const updatedAt = document.getElementById("profileJobMatchesUpdatedAt");
      if (updatedAt) {
        const now = new Date();
        const pad = (v) => String(v).padStart(2, "0");
        updatedAt.textContent = `Atualizado em ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      }
      renderMatchesList(items);
    } catch (err) {
      console.error(err);
      if (loadingToken) Swal.close();
      renderMatchesError("Tente novamente.");
    }
  }

  function renderMatchesList(html) {
    const container = document.getElementById("profileJobMatchesList");
    const empty = document.getElementById("profileJobMatchesEmpty");
    const error = document.getElementById("profileJobMatchesError");
    if (container) {
      container.innerHTML = html;
      container.classList.remove("d-none");
    }
    empty?.classList.add("d-none");
    error?.classList.add("d-none");
  }

  function renderMatchesEmpty() {
    const container = document.getElementById("profileJobMatchesList");
    const empty = document.getElementById("profileJobMatchesEmpty");
    const error = document.getElementById("profileJobMatchesError");
    container?.classList.add("d-none");
    empty?.classList.remove("d-none");
    error?.classList.add("d-none");
  }

  function renderMatchesError(message) {
    const container = document.getElementById("profileJobMatchesList");
    const empty = document.getElementById("profileJobMatchesEmpty");
    const error = document.getElementById("profileJobMatchesError");
    container?.classList.add("d-none");
    empty?.classList.add("d-none");
    if (error) {
      error.classList.remove("d-none");
      error.textContent = message || "Nao foi possivel carregar.";
    }
  }

  function showCompletionCountdown(maxSeconds) {
    if (!window.Swal) return { close: () => {} };
    let remaining = Math.max(1, Math.floor(maxSeconds || 10));
    let timerId = null;

    Swal.fire({
      title: "Calculando percentuais do perfil",
      html: `Aguarde... <b>${remaining}</b>s`,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
        const container = Swal.getHtmlContainer();
        const counter = container ? container.querySelector("b") : null;
        timerId = setInterval(() => {
          remaining -= 1;
          if (counter) counter.textContent = String(Math.max(0, remaining));
          if (remaining <= 0 && timerId) clearInterval(timerId);
        }, 1000);
      },
      willClose: () => {
        if (timerId) clearInterval(timerId);
      }
    });

    return {
      close: () => {
        if (window.__portalSuggestionsModalToken) return;
        Swal.close();
      }
    };
  }

  async function fetchProfileCompletion() {
    const handler = showCompletionCountdown(10);
    try {
      const response = await fetch("/PortalVagas/Profile/Completion", {
        method: "GET",
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        handler.close();
        Swal.fire({
          icon: "warning",
          title: "Nao foi possivel calcular",
          text: data?.message || "Tente novamente.",
          confirmButtonText: S.common.ok
        });
        return;
      }
      handler.close();
      applyCompletion(data);
      showSuggestionsModal(data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "warning",
        title: "Nao foi possivel calcular",
        text: "Tente novamente.",
        confirmButtonText: S.common.ok
      });
    } finally {
      handler.close();
    }
  }

  window.PortalVagasProfileCompletion = {
    refresh: fetchProfileCompletion
  };

  function wireEvents() {
    const grid = document.getElementById("profileTopicsGrid");
    if (grid && !grid.__wired) {
      grid.addEventListener("click", ev => {
        const btn = ev.target.closest(".topic-card");
        if (!btn) return;
        const key = btn.getAttribute("data-key");
        if (key === "match") {
          showDetail(key);
          showSectionView(key);
          openJobMatches();
          return;
        }
        if (key === "clear") {
          if (typeof window.resetCandidateProfile === "function") {
            window.resetCandidateProfile();
          } else {
            Swal.fire({
              icon: "warning",
              title: "Acao indisponivel",
              text: "Funcao de limpeza nao carregada.",
              confirmButtonText: S.common.ok
            });
          }
          return;
        }
        showDetail(key);
        showSectionView(key);
      });
      grid.__wired = true;
    }

    backButtons.forEach(btn => {
      if (!btn.__wired) {
        btn.addEventListener("click", showCardsView);
        btn.__wired = true;
      }
    });

    const btnRandomize = document.getElementById("profileBtnRandomize");
    if (btnRandomize && !btnRandomize.__wired) {
      btnRandomize.addEventListener("click", () => {
        TOPICS.forEach(t => {
          progressByKey[t.key] = t.key === "clear" ? 0 : randomPercent();
        });
        renderGrid();
        if (selectedKey) showDetail(selectedKey);
      });
      btnRandomize.__wired = true;
    }

    const btnDone = document.getElementById("profileBtnMarkDone");
    if (btnDone && !btnDone.__wired) {
      btnDone.addEventListener("click", () => {
        if (!selectedKey) return;
        progressByKey[selectedKey] = 100;
        renderGrid();
        showDetail(selectedKey);
      });
      btnDone.__wired = true;
    }

    const btnOpen = document.getElementById("profileBtnOpenSection");
    if (btnOpen && !btnOpen.__wired) {
      btnOpen.addEventListener("click", () => {
        if (!selectedKey) return;

        // Integre aqui com sua navegacao/rotas reais
        // Ex.: window.location.href = `/candidato/${selectedKey}`;
        // Por enquanto: apenas feedback visual.
        Swal.fire({
          icon: "info",
          title: "Abrir secao",
          text: "Secao: " + selectedKey,
          confirmButtonText: S.common.ok
        });
      });
      btnOpen.__wired = true;
    }

    const btnRefreshMatches = document.getElementById("profileRefreshMatchesBtn");
    if (btnRefreshMatches && !btnRefreshMatches.__wired) {
      btnRefreshMatches.addEventListener("click", () => {
        openJobMatches();
      });
      btnRefreshMatches.__wired = true;
    }
  }

  function initIfNeeded() {
    if (rendered) return;
    renderGrid();
    wireEvents();
    rendered = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const modalEl = document.getElementById("profileModal");
    if (!modalEl) return;

    // Renderiza quando o modal abrir (evita render desnecessÃ¡rio)
    modalEl.addEventListener("shown.bs.modal", () => {
      initIfNeeded();
      showCardsView();
      if (window.PortalVagasProfileCompletion?.refresh) {
        window.PortalVagasProfileCompletion.refresh();
      }
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      if (document.querySelector(".modal.show")) return;
      showCardsView();
    });

    // se o modal jÃ¡ estiver visÃ­vel por algum motivo
    if (modalEl.classList.contains("show")) initIfNeeded();
  });
})();




