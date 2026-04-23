/**
 * Intenção:
 * - Candidatura completa, com validação e upload opcional.
 * - Sem engolir erro: toda falha relevante resulta em feedback visível.
 * - Mantém a seleção da vaga atual para preencher o modal de candidatura.
 */
(async function () {
  const ctx = window.PortalVagasIndexContext || {};
  const S = window.PortalVagasStrings || {};
  const apiBase = ctx.apiBase || "";
  const tenantId = ctx.tenantId || "";
  const grid = document.getElementById("jobsGrid");
  const gridLoading = document.getElementById("jobsLoading");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");
  const serviceUnavailableState = document.getElementById("serviceUnavailableState");
  const serviceUnavailableMessage = document.getElementById("serviceUnavailableMessage");
  const retryJobsBtn = document.getElementById("retryJobsBtn");

  const filtersForm = document.getElementById("filtersForm");
  const clearBtn = document.getElementById("clearBtn");
  const emptyClearBtn = document.getElementById("emptyClearBtn");
  const filtersDrawerEl = document.getElementById("filtersDrawer");
  const searchBtn = document.getElementById("searchBtn");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const backToTopBtn = document.getElementById("backToTopBtn");

  const jobModalEl = document.getElementById("jobModal");
  const jobModal = new bootstrap.Modal(jobModalEl, { backdrop: true, keyboard: true });
  const jobModalApplyBtn = document.getElementById("jobModalApplyBtn");

  let currentSort = "recent";
  const pageSize = 100;
  let totalItems = 0;
  let currentJob = null;

  const jobsUi = window.PortalVagasJobs || {};
  const showAppAlert = ctx.showAppAlert || function () {};
  const clearAppAlert = ctx.clearAppAlert || function () {};
  const setLoading = ctx.setLoading || function () {};
  const setLoadingMessage = ctx.setLoadingMessage || function () {};

  function setGridLoading(isLoading) {
    if (!gridLoading) return;
    gridLoading.classList.toggle("d-none", !isLoading);
  }

  function closeFiltersDrawer() {
    if (!filtersDrawerEl) return;
    const instance = bootstrap.Offcanvas.getInstance(filtersDrawerEl)
      || new bootstrap.Offcanvas(filtersDrawerEl);
    instance.hide();
  }

  function hideServiceUnavailableState() {
    serviceUnavailableState?.classList.add("d-none");
  }

  function showServiceUnavailableState(message) {
    emptyState?.classList.add("d-none");
    if (serviceUnavailableMessage) {
      serviceUnavailableMessage.textContent = message || "Não foi possível carregar as vagas agora. Tente novamente mais tarde.";
    }
    serviceUnavailableState?.classList.remove("d-none");
  }

  function formatMoney(min, max) {
    if (jobsUi?.formatMoney) return jobsUi.formatMoney(min, max);
    return "";
  }

  function buildJobCard(job, index) {
    if (jobsUi?.buildJobCard) return jobsUi.buildJobCard(job, index);
    return document.createElement("div");
  }

  function getSectionInfo(area) {
    if (jobsUi?.getSectionInfo) return jobsUi.getSectionInfo(area);
    return {
      title: area || "Outras oportunidades",
      image: ""
    };
  }

  function buildSection(info, jobs, startIndex) {
    if (jobsUi?.buildSection) return jobsUi.buildSection(info, jobs, startIndex);
    return document.createElement("section");
  }

  async function loadJobs(reset = false) {
    if (!window.PortalVagasJobsData?.loadJobs) return;

    hideServiceUnavailableState();
    clearAppAlert();
    setLoadingMessage("Atualizando resultados...");

    await window.PortalVagasJobsData.loadJobs({
      apiBase,
      tenantId,
      showAppAlert,
      setGridLoading,
      grid,
      gridLoading,
      buildSection,
      getSectionInfo,
      buildQuery,
      render,
      onRetryAttempt: ({ message }) => {
        setLoading(true);
        hideServiceUnavailableState();
        setLoadingMessage(message);
      },
      onLoadFailure: ({ message }) => {
        setLoading(false);
        showServiceUnavailableState(message);
      },
      onLoadSuccess: () => {
        setLoading(false);
        hideServiceUnavailableState();
        setLoadingMessage("Atualizando resultados...");
      },
      reset
    });

    if (window.PortalVagasJobsData?._state) {
      totalItems = window.PortalVagasJobsData._state.totalItems ?? totalItems;
    }
  }

  function buildQuery(page) {
    if (window.PortalVagasFilters?.buildQuery) {
      return window.PortalVagasFilters.buildQuery(page, currentSort);
    }
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("pageSize", pageSize);
    return params.toString();
  }

  function render() {
    const state = window.PortalVagasJobsData?.getState?.() || {};
    totalItems = state.totalItems ?? totalItems;
    if (jobsUi?.renderResults) {
      jobsUi.renderResults(resultsCount, emptyState, totalItems);
      return;
    }
    if (resultsCount) resultsCount.textContent = String(totalItems);
    if (emptyState) emptyState.classList.toggle("d-none", totalItems !== 0);
  }

  function resetFilters() {
    filtersForm?.reset();
    currentSort = "recent";
  }

  function resetPaging() {
    window.PortalVagasJobsData?.setState?.({ currentPage: 1, totalPages: 1, totalItems: 0 });
  }

  window.PortalVagasJobModal?.init({
    jobModal,
    jobModalApplyBtn,
    grid,
    buildSummary: jobsUi?.buildSummary || (item => item.dataset.title || ""),
    formatMoney,
    onApply: async () => {
      if (!currentJob) {
        showAppAlert("danger", S.index.applyInitFail);
        return;
      }
      if (window.PortalVagasApply?.open) {
        await window.PortalVagasApply.open(
          currentJob,
          `${currentJob.dataset.title} • ${currentJob.dataset.company} • ${currentJob.dataset.mode}`
        );
      }
    },
    onOpen: (item) => {
      currentJob = item;
      if (ctx) ctx.currentJob = item;
    }
  });

  window.PortalVagasFilters?.init({
    filtersForm,
    clearBtn,
    emptyClearBtn,
    searchBtn,
    searchClearBtn,
    setLoading,
    closeFiltersDrawer,
    resetPaging,
    resetFilters,
    loadJobs,
    setSort: (value) => { currentSort = value; }
  });

  retryJobsBtn?.addEventListener("click", async () => {
    resetPaging();
    await loadJobs(true);
  });

  try {
    await loadJobs(true);
    window.PortalVagasAdminNewJob?.init(loadJobs);
    window.PortalVagasApply?.init(ctx);
  } catch (err) {
    console.error(err);
    setLoading(false);
    showServiceUnavailableState("O portal está temporariamente indisponível. Tente novamente mais tarde.");
  }
})();
