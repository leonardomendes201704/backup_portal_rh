(() => {
  const btnProfile = document.getElementById("btnProfile");
  const modalEl = document.getElementById("profileModal");
  const form = document.getElementById("profileForm");
  const saveBtn = document.getElementById("profileSaveBtn");
  const nameInput = document.getElementById("profileName");
  const emailInput = document.getElementById("profileEmail");
  const phoneInput = document.getElementById("profilePhone");
  const citySelect = document.getElementById("profileCity");
  const ufSelect = document.getElementById("profileUf");
  const linkedinInput = document.getElementById("profileLinkedin");
  const resumoInput = document.getElementById("profileResumo");
  const detailNameInput = document.getElementById("profileDetailNameInput");
  const detailEmailInput = document.getElementById("profileDetailEmailInput");
  const detailPhoneInput = document.getElementById("profileDetailPhoneInput");
  const avatarInput = document.getElementById("profileAvatarInput");
  const avatarImg = document.getElementById("profileAvatarImg");
  const avatarFallback = document.getElementById("profileAvatarFallback");
  const avatarName = document.getElementById("profileAvatarName");
  const cvInput = document.getElementById("cvFileInput");
  const cvParseBtn = document.getElementById("cvParseBtn");
  const cvName = document.getElementById("cvFileName");
  const cvDate = document.getElementById("cvFileDate");
  const userName = document.getElementById("portalUserName");
  const userEmail = document.getElementById("portalUserEmail");
  const userAvatar = document.getElementById("portalUserAvatar");
  const downloadPdfBtn = document.getElementById("profileDownloadPdfBtn");
  const viewHtmlBtn = document.getElementById("profileViewHtmlBtn");

  if (!btnProfile || !modalEl || !form || !saveBtn || !window.bootstrap) return;

  const modal = new bootstrap.Modal(modalEl, { backdrop: true });
  const LOCATION_BASE = "/PortalVagas/Locations";
  let cachedUfs = null;
  const cityCache = new Map();
  let parseRequested = false;

  const showSwal = (icon, title, text) => {
    window.Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: "Ok"
    });
  };

  const setLoading = (isLoading) => {
    if (!saveBtn) return;
    saveBtn.disabled = isLoading;
    saveBtn.textContent = isLoading ? "Salvando..." : "Salvar";
  };

  const setDownloadLoading = (isLoading) => {
    if (!downloadPdfBtn) return;
    downloadPdfBtn.disabled = isLoading;
    downloadPdfBtn.innerHTML = isLoading
      ? `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Aguarde...`
      : `<i class="bi bi-file-earmark-pdf me-1"></i>Baixar curriculo`;
  };

  const setViewLoading = (isLoading) => {
    if (!viewHtmlBtn) return;
    viewHtmlBtn.disabled = isLoading;
    viewHtmlBtn.innerHTML = isLoading
      ? `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Aguarde...`
      : `<i class="bi bi-eye me-1"></i>Visualizar curriculo`;
  };

  const setParseLoading = (isLoading) => {
    if (!cvParseBtn) return;
    cvParseBtn.disabled = isLoading;
    cvParseBtn.innerHTML = isLoading
      ? `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Analisando...`
      : `<i class="fas fa-magic me-1"></i> Preencher com curr&iacute;culo`;
  };

  const digitsOnly = (value) => (value || "").replace(/\D/g, "");

  const formatPhone = (value) => {
    const digits = digitsOnly(value).slice(0, 11);
    if (!digits) return "";
    const ddd = digits.slice(0, 2);
    const part1 = digits.length > 2 ? digits.slice(2, digits.length > 6 ? 7 : 6) : "";
    const part2 = digits.length > 6 ? digits.slice(7) : "";
    if (digits.length <= 6) return `(${ddd}) ${digits.slice(2)}`;
    return `(${ddd}) ${part1}-${part2}`;
  };

  const setSelectLoading = (select, label, disabled = true) => {
    if (!select) return;
    select.disabled = disabled;
    select.required = !disabled;
    select.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = label;
    select.appendChild(opt);
  };

  const fetchUfs = async () => {
    if (cachedUfs) return cachedUfs;
    const res = await fetch(`${LOCATION_BASE}/Ufs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = (Array.isArray(data) ? data : [])
      .map(uf => (uf || "").toString().trim().toUpperCase())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    cachedUfs = list;
    return list;
  };

  const populateUfSelect = async (selectedUf = "") => {
    if (!ufSelect) return;
    setSelectLoading(ufSelect, "Carregando UFs...", true);
    try {
      const list = await fetchUfs();
      ufSelect.disabled = false;
      ufSelect.required = true;
      ufSelect.innerHTML = '<option value="" selected>Selecione</option>';
      list.forEach(uf => {
        const opt = document.createElement("option");
        opt.value = uf;
        opt.textContent = uf;
        if (uf === selectedUf) opt.selected = true;
        ufSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      setSelectLoading(ufSelect, "Nao foi possivel carregar UFs", true);
    }
  };

  const fetchCitiesForUf = async (uf) => {
    const key = (uf || "").trim().toUpperCase();
    if (!key) return [];
    if (cityCache.has(key)) return cityCache.get(key);
    const res = await fetch(`${LOCATION_BASE}/Ufs/${encodeURIComponent(key)}/Cities`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = (Array.isArray(data) ? data : [])
      .map(city => (city || "").toString().trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    cityCache.set(key, list);
    return list;
  };

  const populateCitySelect = async (uf, selectedCity = "") => {
    if (!citySelect) return;
    if (!uf) {
      setSelectLoading(citySelect, "Selecione a UF primeiro", true);
      return;
    }
    setSelectLoading(citySelect, "Carregando municipios...", true);
    try {
    const list = await fetchCitiesForUf(uf);
    citySelect.disabled = false;
    citySelect.required = true;
    citySelect.innerHTML = '<option value="" selected>Selecione</option>';
      list.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        if (city === selectedCity) opt.selected = true;
        citySelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      setSelectLoading(citySelect, "Nao foi possivel carregar cidades", true);
    }
  };

  const buildInitials = (name) => {
    const parts = (name || "")
      .trim()
      .split(" ")
      .filter(Boolean);
    if (!parts.length) return "US";
    const first = parts[0][0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
    return (first + last).toUpperCase() || "US";
  };

  const formatDateTimeBr = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR");
  };

  const base64ToBlob = (base64, contentType) => {
    const sliceSize = 1024;
    const byteChars = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
      const slice = byteChars.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType || "application/pdf" });
  };

  const setAvatar = (url, name) => {
    if (avatarName) avatarName.textContent = name || "";
    if (!avatarImg || !avatarFallback) return;
    if (url) {
      avatarImg.src = url;
      avatarImg.style.display = "block";
      avatarFallback.style.display = "none";
      return;
    }
    avatarImg.removeAttribute("src");
    avatarImg.style.display = "none";
    avatarFallback.textContent = buildInitials(name || "U");
    avatarFallback.style.display = "inline";
  };

  const getCurrentAvatarUrl = () => {
    if (!avatarImg) return "";
    const src = (avatarImg.getAttribute("src") || "").trim();
    return src && avatarImg.style.display !== "none" ? src : "";
  };

  const setCurriculo = (curriculo) => {
    if (!cvName || !cvDate) return;
    if (!curriculo) {
      cvName.textContent = "";
      cvDate.textContent = "";
      return;
    }
    cvName.textContent = curriculo.nomeArquivo || "";
    cvDate.textContent = curriculo.createdAtUtc ? `Enviado em ${formatDateTimeBr(curriculo.createdAtUtc)}` : "";
  };

  const buildUid = () => `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

  const splitBullets = (text) => {
    if (!text) return [];
    return String(text)
      .split(/\n|•|·|-/)
      .map(x => x.trim())
      .filter(Boolean);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const applyParsedResume = async (parsed) => {
    if (!parsed || typeof parsed !== "object") return;
    const errors = [];

    const candidate = parsed.candidate || {};
    const safeSet = (el, value) => {
      if (!el) return;
      const current = (el.value || "").trim();
      if (!current && value) el.value = value;
    };

    if (candidate.name) {
      if (nameInput) nameInput.value = candidate.name;
      if (detailNameInput) detailNameInput.value = candidate.name;
      setAvatar(getCurrentAvatarUrl(), candidate.name);
    }
    safeSet(emailInput, candidate.email);
    safeSet(detailEmailInput, candidate.email);
    if (candidate.phone) {
      const formatted = formatPhone(candidate.phone);
      safeSet(phoneInput, formatted);
      safeSet(detailPhoneInput, formatted);
    }
    safeSet(linkedinInput, candidate.linkedin);
    if (candidate.summary && resumoInput) {
      resumoInput.value = candidate.summary;
    }

    // Education
    if (Array.isArray(parsed.education) && typeof persistEducationItem === "function") {
      if (typeof ensureEducationLoaded === "function") await ensureEducationLoaded();
      const existing = (typeof loadEducation === "function") ? loadEducation().items || [] : [];
      const existingKey = new Set(existing.map(x => `${(x.course || "").toLowerCase()}|${(x.institution || "").toLowerCase()}`));

      const items = parsed.education
        .map(e => ({
          id: buildUid(),
          course: (e.course || "").trim(),
          institution: (e.institution || "").trim(),
          type: (e.level || "").trim(),
          status: (e.end || "").trim() ? "Concluído" : "Cursando",
          start: (e.start || "").trim(),
          end: (e.end || "").trim(),
          notes: "",
          link: "",
          updatedAt: new Date().toISOString()
        }))
        .filter(e => e.course || e.institution)
        .filter(e => !existingKey.has(`${e.course.toLowerCase()}|${e.institution.toLowerCase()}`));

      for (const item of items) {
        try {
          await persistEducationItem(item);
        } catch {
          errors.push("education");
        }
      }

      if (typeof renderEducation === "function") renderEducation();
    }

    // Experience
    if (Array.isArray(parsed.experience) && typeof persistExperience === "function") {
      if (typeof ensureExpProjLoaded === "function") await ensureExpProjLoaded();
      const existing = (typeof loadExpProj === "function") ? loadExpProj().experiences || [] : [];
      const existingKey = new Set(existing.map(x => `${(x.company || "").toLowerCase()}|${(x.role || "").toLowerCase()}`));

      const items = parsed.experience
        .map(e => ({
          id: buildUid(),
          company: (e.company || "").trim(),
          role: (e.role || "").trim(),
          start: (e.start || "").trim(),
          end: (e.end || "").trim(),
          place: "",
          bullets: splitBullets(e.description),
          updatedAt: new Date().toISOString()
        }))
        .filter(e => e.company && e.role)
        .filter(e => !existingKey.has(`${e.company.toLowerCase()}|${e.role.toLowerCase()}`));

      for (const item of items) {
        try {
          await persistExperience(item);
        } catch {
          errors.push("experience");
        }
      }

      if (typeof renderExperienceProjects === "function") renderExperienceProjects();
    }

    // Skills
    if (Array.isArray(parsed.skills) && typeof persistSkill === "function") {
      if (typeof ensureSkillsPortfolioLoaded === "function") await ensureSkillsPortfolioLoaded();
      const existing = (typeof loadSkillsPortf === "function") ? loadSkillsPortf().skills || [] : [];
      const existingKey = new Set(existing.map(x => (x.name || "").toLowerCase()));

      let items = parsed.skills
        .map(s => (s || "").toString().trim())
        .filter(Boolean)
        .filter(name => !existingKey.has(name.toLowerCase()))
        .map(name => ({
          id: buildUid(),
          type: "Hard",
          name,
          level: "Intermediário",
          evidence: "",
          updatedAt: new Date().toISOString()
        }));

      if (items.length > 15) {
        const resp = await window.Swal.fire({
          icon: "info",
          title: "Muitas compet\u00eancias encontradas",
          html: `Foram encontradas <strong>${items.length}</strong> skills. Isso pode demorar alguns minutos.<br/>Deseja importar todas?`,
          showCancelButton: true,
          confirmButtonText: "Importar todas",
          cancelButtonText: "Limitar a 15"
        });
        if (!resp.isConfirmed) {
          items = items.slice(0, 15);
        }
      }

      let skillErrors = 0;
      for (const item of items) {
        try {
          await persistSkill(item);
        } catch {
          skillErrors++;
        } finally {
          await sleep(150);
        }
      }
      if (skillErrors) errors.push("skills");

      if (typeof renderSkillsPortfolio === "function") renderSkillsPortfolio();
    }

    // Certifications
    if (Array.isArray(parsed.certifications) && typeof persistCertification === "function") {
      if (typeof ensureSkillsPortfolioLoaded === "function") await ensureSkillsPortfolioLoaded();
      const existing = (typeof loadSkillsPortf === "function") ? loadSkillsPortf().certs || [] : [];
      const existingKey = new Set(existing.map(x => (x.name || "").toLowerCase()));

      const items = parsed.certifications
        .map(s => (s || "").toString().trim())
        .filter(Boolean)
        .filter(name => !existingKey.has(name.toLowerCase()))
        .map(name => ({
          id: buildUid(),
          name,
          org: "",
          year: "",
          link: "",
          updatedAt: new Date().toISOString()
        }));

      for (const item of items) {
        try {
          await persistCertification(item);
        } catch {
          errors.push("certifications");
        }
      }

      if (typeof renderSkillsPortfolio === "function") renderSkillsPortfolio();
    }

    if (errors.length) {
      const unique = Array.from(new Set(errors));
      window.Swal.fire({
        icon: "warning",
        title: "Importa\u00e7\u00e3o parcial",
        text: `Alguns itens nao puderam ser importados (${unique.join(", ")}). Tente novamente mais tarde.`,
        confirmButtonText: "Ok"
      });
    }
  };

  const parseResume = async (file) => {
    if (!file) return;
    setParseLoading(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", file);
      const response = await fetch("/PortalVagas/Profile/ParseResume", {
        method: "POST",
        credentials: "same-origin",
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = data?.message || data?.error || "";
        const raw = details
          ? `<div class="small text-muted mt-2">Detalhes:</div><pre class="text-start small" style="white-space:pre-wrap;">${details}</pre>`
          : "";
        window.Swal.fire({
          icon: "error",
          title: "Nao foi possivel analisar",
          html: raw || "Tente novamente.",
          confirmButtonText: "Ok"
        });
        return;
      }

      const warnings = Array.isArray(data.warnings) ? data.warnings : [];
      const missing = Array.isArray(data.missing_fields) ? data.missing_fields : [];
      const skillNote = Array.isArray(data.skills) && data.skills.length
        ? "Niveis de competencias serao definidos como Intermediario."
        : "";

      const warningText = [
        warnings.length ? `Avisos: ${warnings.join(", ")}` : "",
        missing.length ? `Campos ausentes: ${missing.join(", ")}` : "",
        skillNote
      ].filter(Boolean).join("<br/>");

      const confirm = await window.Swal.fire({
        icon: "info",
        title: "Importar dados do curriculo?",
        html: warningText || "Os dados encontrados serao aplicados ao seu perfil.",
        showCancelButton: true,
        confirmButtonText: "Aplicar agora",
        cancelButtonText: "Cancelar"
      });

      if (!confirm.isConfirmed) return;
        try {
          await applyParsedResume(data);
          showSwal("success", "Perfil atualizado", "Confira os dados e clique em Salvar.");
        } catch (err) {
          console.error(err);
          const msg = (err && err.message) ? err.message : "Falha ao importar os dados do curriculo.";
          window.Swal.fire({
            icon: "error",
            title: "Erro inesperado",
            html: `<div class="small text-muted mt-2">Detalhes:</div><pre class="text-start small" style="white-space:pre-wrap;">${msg}</pre>`,
            confirmButtonText: "Ok"
          });
        }
    } catch (err) {
      console.error(err);
      showSwal("error", "Erro inesperado", "Nao foi possivel analisar o curriculo.");
    } finally {
      setParseLoading(false);
    }
  };

  const resetProfile = async () => {
    const confirm = await window.Swal.fire({
      icon: "warning",
      title: "Limpar perfil?",
      html: "Isso vai apagar todos os dados do seu perfil, inclusive curriculo e LGPD.<br/>Notificacoes e Agenda serao mantidas.",
      showCancelButton: true,
      confirmButtonText: "Sim, limpar",
      cancelButtonText: "Cancelar"
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch("/PortalVagas/Profile/Reset", {
        method: "POST",
        credentials: "same-origin"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.Swal.fire({
          icon: "error",
          title: "Nao foi possivel limpar",
          text: data.message || "Tente novamente."
        });
        return;
      }

      await window.Swal.fire({
        icon: "success",
        title: "Perfil limpo",
        text: "Atualizando dados..."
      });
      const fresh = await loadProfile();
      if (fresh) await applyProfileData(fresh);
    } catch (err) {
      console.error(err);
      showSwal("error", "Erro inesperado", "Nao foi possivel limpar o perfil.");
    }
  };

  window.resetCandidateProfile = resetProfile;

  const downloadResumePdf = async () => {
    if (!downloadPdfBtn) return;
    setDownloadLoading(true);
    try {
      const response = await fetch("/PortalVagas/Profile/ResumePdf", {
        method: "GET",
        headers: { "Accept": "application/json" },
        credentials: "same-origin"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showSwal("error", "Nao foi possivel gerar o PDF", data.message || "Tente novamente.");
        return;
      }
      const base64 = data.base64 || data.Base64;
      if (!base64) {
        showSwal("error", "PDF indisponivel", "Conteudo nao retornado.");
        return;
      }
      const blob = base64ToBlob(base64, data.contentType || data.ContentType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName || data.FileName || "curriculo.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      showSwal("error", "Falha ao baixar", "Tente novamente.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const openResumeHtml = async () => {
    if (!viewHtmlBtn) return;
    setViewLoading(true);
    try {
      const response = await fetch("/PortalVagas/Profile/ResumeHtml", {
        method: "GET",
        headers: { "Accept": "application/json" },
        credentials: "same-origin"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showSwal("error", "Nao foi possivel gerar o curriculo", data.message || "Tente novamente.");
        return;
      }
      const html = data.html || data.Html;
      if (!html) {
        showSwal("error", "Curriculo indisponivel", "Conteudo nao retornado.");
        return;
      }
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener");
      if (!win) {
        showSwal("warning", "Pop-up bloqueado", "Permita pop-ups para visualizar o curriculo.");
        return;
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error(err);
      showSwal("error", "Falha ao abrir", "Tente novamente.");
    } finally {
      setViewLoading(false);
    }
  };

  const loadProfile = async () => {
    const response = await fetch("/PortalVagas/Profile", {
      method: "GET",
      headers: { "Accept": "application/json" },
      credentials: "same-origin"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showSwal("error", "Nao foi possivel carregar", data.message || "Tente novamente.");
      return null;
    }

    return data;
  };

  const applyProfileData = async (data) => {
    if (!data) return;
    nameInput.value = data.nome || "";
    emailInput.value = data.email || "";
    phoneInput.value = formatPhone(data.fone || "");
    if (detailNameInput) detailNameInput.value = data.nome || "";
    if (detailEmailInput) detailEmailInput.value = data.email || "";
    if (detailPhoneInput) detailPhoneInput.value = formatPhone(data.fone || "");
    if (linkedinInput) linkedinInput.value = data.linkedinUrl || "";
    if (resumoInput) resumoInput.value = data.resumoProfissional || "";
    setAvatar(data.avatarUrl || "", data.nome || "");
    setCurriculo(data.curriculo);
    if (phoneInput) {
      const digits = digitsOnly(phoneInput.value);
      phoneInput.setCustomValidity(digits.length === 11 ? "" : "Telefone invalido.");
    }

    await populateUfSelect((data.uf || "").toUpperCase());
    await populateCitySelect((data.uf || "").toUpperCase(), data.cidade || "");
    form.classList.remove("was-validated");
  };

  btnProfile.addEventListener("click", async () => {
    try {
      const data = await loadProfile();
      if (!data) return;
      await applyProfileData(data);
      modal.show();
    } catch (err) {
      console.error(err);
      showSwal("error", "Erro inesperado", "Tente novamente em alguns instantes.");
    }
  });

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      downloadResumePdf();
    });
  }

  if (viewHtmlBtn) {
    viewHtmlBtn.addEventListener("click", () => {
      openResumeHtml();
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid && typeof firstInvalid.focus === "function") {
        firstInvalid.focus();
      }
      return;
    }

    const payload = {
      nome: nameInput.value.trim(),
      fone: phoneInput.value.trim(),
      cidade: citySelect.value.trim(),
      uf: ufSelect.value.trim().toUpperCase(),
      linkedinUrl: (linkedinInput?.value || "").trim(),
      resumoProfissional: (resumoInput?.value || "").trim()
    };

    setLoading(true);
    try {
      const response = await fetch("/PortalVagas/Profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showSwal("error", "Nao foi possivel atualizar", data.message || "Verifique seus dados e tente novamente.");
        return;
      }

      if (userName) userName.textContent = data.nome || payload.nome;
      if (userEmail) userEmail.textContent = data.email || emailInput.value;
      if (userAvatar) userAvatar.textContent = buildInitials(data.nome || payload.nome);
      if (detailNameInput) detailNameInput.value = data.nome || payload.nome;
      if (detailEmailInput) detailEmailInput.value = data.email || emailInput.value;
      if (detailPhoneInput) detailPhoneInput.value = formatPhone(data.fone || payload.fone);
      if (linkedinInput && data.linkedinUrl !== undefined) linkedinInput.value = data.linkedinUrl || "";
      if (resumoInput && data.resumoProfissional !== undefined) resumoInput.value = data.resumoProfissional || "";
      setAvatar(data.avatarUrl || "", data.nome || payload.nome);
      setCurriculo(data.curriculo);

      showSwal("success", "Perfil atualizado", "Seus dados foram salvos.");
      if (window.PortalVagasProfileCompletion?.refresh) {
        window.PortalVagasProfileCompletion.refresh();
      }
    } catch (err) {
      console.error(err);
      showSwal("error", "Erro inesperado", "Nao foi possivel salvar seu perfil.");
    } finally {
      setLoading(false);
    }
  });

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      const formatted = formatPhone(phoneInput.value);
      phoneInput.value = formatted;
      const digits = digitsOnly(formatted);
      phoneInput.setCustomValidity(digits.length === 11 ? "" : "Telefone invalido.");
    });
  }

  if (ufSelect) {
    ufSelect.addEventListener("change", async () => {
      await populateCitySelect(ufSelect.value, "");
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("arquivo", file);
      try {
        const response = await fetch("/PortalVagas/Profile/Avatar", {
          method: "POST",
          credentials: "same-origin",
          body: formData
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          showSwal("error", "Nao foi possivel salvar foto", data.message || "Tente novamente.");
          return;
        }
        setAvatar(data.avatarUrl || "", nameInput.value.trim());
      } catch (err) {
        console.error(err);
        showSwal("error", "Erro inesperado", "Nao foi possivel salvar sua foto.");
      } finally {
        avatarInput.value = "";
      }
    });
  }

  if (cvParseBtn) {
    cvParseBtn.addEventListener("click", () => {
      parseRequested = true;
      cvInput?.click();
    });
  }

  if (cvInput) {
    cvInput.addEventListener("change", async () => {
      const file = cvInput.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("arquivo", file);
      try {
        const response = await fetch("/PortalVagas/Profile/Curriculo", {
          method: "POST",
          credentials: "same-origin",
          body: formData
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          showSwal("error", "Nao foi possivel enviar curriculo", data.message || "Tente novamente.");
          return;
        }
        setCurriculo(data);
        if (parseRequested) {
          parseRequested = false;
          await parseResume(file);
        } else {
          const confirm = await window.Swal.fire({
            icon: "question",
            title: "Analisar curriculo?",
            text: "Deseja preencher seu perfil com os dados encontrados?",
            showCancelButton: true,
            confirmButtonText: "Sim, analisar",
            cancelButtonText: "Agora nao"
          });
          if (confirm.isConfirmed) {
            await parseResume(file);
          }
        }
      } catch (err) {
        console.error(err);
        showSwal("error", "Erro inesperado", "Nao foi possivel enviar seu curriculo.");
      } finally {
        cvInput.value = "";
      }
    });
  }
})();
