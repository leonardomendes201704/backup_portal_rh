(function () {
  if (window.PortalVagasStrings) return;

  window.PortalVagasStrings = {
    common: {
      loading: "Carregando...",
      notAvailable: "Não disponível",
      saveSuccess: "Salvo com sucesso.",
      saveError: "Não foi possível salvar.",
      ok: "Ok",
      cancel: "Cancelar",
      remove: "Remover",
      clear: "Limpar",
      confirm: "Confirmar",
      save: "Salvar",
      removeConfirmTitle: "Tem certeza?",
      removeConfirmText: "Esta ação não pode ser desfeita.",
      removeConfirmYes: "Sim, remover",
      removeConfirmNo: "Cancelar",
      unauthorized: "Acesso não autorizado."
    },
    apply: {
      send: "Enviar candidatura",
      sending: "Enviando...",
      loadUf: "Carregando UFs...",
      loadCity: "Carregando municípios...",
      selectUfFirst: "Selecione a UF primeiro",
      selectOption: "Selecione",
      ufLoadFail: "Não foi possível carregar UFs",
      cityLoadFail: "Não foi possível carregar cidades",
      attachmentTooLarge: "O arquivo excede 5MB. Selecione um arquivo menor.",
      attachmentInvalid: "Formato não aceito. Use PDF, DOC ou DOCX.",
      reviewFields: "Revise os campos destacados antes de enviar.",
      tenantMissing: "Tenant não informado. Recarregue a página e tente novamente.",
      submitError: "Ocorreu um erro ao enviar sua candidatura. Tente novamente.",
      submitSuccessTitle: "Candidatura enviada",
      submitSuccessText: "Em breve você receberá um e-mail com uma chave única para acessar o portal futuramente.",
      submitSuccessFallback: "Candidatura enviada com sucesso. Você receberá um e-mail com uma chave única para acessar o portal futuramente.",
      validateFileError: "Não foi possível validar o arquivo selecionado.",
      invalidFile: "Arquivo inválido."
    },
    newJob: {
      saving: "Salvando...",
      save: "Salvar",
      createSuccess: "Vaga criada com sucesso.",
      createError: "Não foi possível salvar a vaga.",
      missingRequired: "Preencha os campos obrigatórios.",
      loadUfFail: "Não foi possível carregar UFs.",
      loadCityFail: "Não foi possível carregar cidades.",
      loadJobFail: "Não foi possível carregar os dados da vaga.",
      loadJobFailShort: "Não foi possível carregar dados da vaga.",
      selectOption: "Selecione",
      selectArea: "Selecione a área",
      selectDepartment: "Selecione o departamento",
      selectStatus: "Selecione o status",
      loadUf: "Carregando UFs...",
      loadCity: "Carregando municípios...",
      selectUfFirst: "Selecione a UF primeiro",
      unexpectedErrorTitle: "Erro inesperado",
      createFail: "Não foi possível criar a vaga.",
      createFailAlert: "Falha ao criar a vaga.",
      saveFailTitle: "Falha ao salvar",
      saveSuccessTitle: "Vaga salva",
      saveSuccessText: "A vaga foi criada com sucesso.",
      unauthorized: "Acesso não autorizado.",
      selectModalidade: "Modalidade",
      selectSenioridade: "Senioridade",
      selectTipo: "Tipo",
      selectVisibilidade: "Visibilidade"
    },
    jobs: {
      loadFail: "Não foi possível carregar as vagas. URL da API não configurada.",
      loadFailGeneric: "Não foi possível carregar as vagas.",
      notInformed: "Não informado",
      sectionFallbackTitle: "Outras oportunidades",
      companyFallback: "Portal RH",
      titleFallback: "Vaga",
      areaFallback: "Geral",
      tagFallback: "Geral",
      salaryLabel: "Faixa",
      salaryToBeArranged: "a combinar",
      vacanciesLabel: "vagas",
      noResults: "0 vagas encontradas",
      countSingular: "vaga encontrada",
      countPlural: "vagas encontradas"
    },
    index: {
      applyInitFail: "Não foi possível iniciar a candidatura. Abra os detalhes de uma vaga e tente novamente."
    },
    filters: {
      clear: "Limpar",
      searchPlaceholder: "Buscar por cargo, empresa, tecnologia..."
    },
    jobModal: {
      apply: "Candidatar-se",
      notAvailable: "Não disponível"
    },
    profile: {
      alertLoadFail: "Não foi possível carregar os dados."
    },
    experience: {
      saveErrorTitle: "Erro ao salvar",
      saveErrorText: "Não foi possível salvar a experiência.",
      removeTitle: "Remover experiência?",
      removeErrorTitle: "Erro ao remover",
      removeErrorText: "Não foi possível remover a experiência.",
      projectSaveErrorText: "Não foi possível salvar o projeto.",
      projectRemoveTitle: "Remover projeto?",
      projectRemoveErrorText: "Não foi possível remover o projeto.",
      tagRemoveTitle: "Remover tag?",
      tagRemoveLabel: "Remover tag"
    },
    education: {
      saveErrorTitle: "Erro ao salvar",
      saveErrorText: "Não foi possível salvar a formação.",
      removeTitle: "Remover formação?",
      removeErrorTitle: "Erro ao remover",
      removeErrorText: "Não foi possível remover a formação.",
      clearTitle: "Limpar Formação & Educação?"
    },
    skills: {
      saveErrorTitle: "Erro ao salvar",
      saveErrorText: "Não foi possível salvar a competência.",
      removeTitle: "Remover competência?",
      removeErrorTitle: "Erro ao remover",
      removeErrorText: "Não foi possível remover a competência.",
      removeLegacyTitle: "Remover esta competência?",
      certSaveErrorText: "Não foi possível salvar o curso/certificação.",
      certRemoveTitle: "Remover item?",
      certRemoveErrorText: "Não foi possível remover o curso/certificação.",
      clearTitle: "Limpar Competências & Portfólio?"
    },
    documents: {
      saveFail: "Falha ao salvar documento.",
      saveFailTitle: "Falha ao salvar",
      removeTitle: "Remover documento?",
      removeFail: "Falha ao remover documento.",
      removeFailTitle: "Falha ao remover",
      insertExamplesFailTitle: "Falha ao inserir exemplos",
      clearTitle: "Limpar Documentos & Anexos?",
      unexpectedError: "Erro inesperado"
    },
    references: {
      confirmContactTitle: "Confirmar contato imediato?",
      saveFail: "Falha ao salvar referência.",
      saveFailTitle: "Falha ao salvar",
      removeTitle: "Remover referência?",
      removeFail: "Falha ao remover referência.",
      removeFailTitle: "Falha ao remover",
      insertExamplesFailTitle: "Falha ao inserir exemplos",
      clearTitle: "Limpar Referências?"
    },
    a11y: {
      saveFail: "Falha ao salvar acessibilidade.",
      saveFailTitle: "Falha ao salvar",
      insertExampleFail: "Falha ao inserir exemplo.",
      insertExamplesFailTitle: "Falha ao inserir exemplo",
      clearTitle: "Limpar Acessibilidade & Inclusão?",
      clearFail: "Falha ao limpar.",
      clearFailTitle: "Falha ao limpar",
      unexpectedError: "Erro inesperado"
    },
    agenda: {
      saveErrorTitle: "Erro ao salvar",
      saveErrorText: "Não foi possível salvar o bloqueio.",
      removeTitle: "Remover bloqueio?",
      removeErrorTitle: "Erro ao remover",
      removeErrorText: "Não foi possível remover o bloqueio.",
      clearTitle: "Limpar Disponibilidade & Agenda?",
      noticeFallback: "Não informado"
    },
    apps: {
      removeTitle: "Remover candidatura?",
      clearTitle: "Limpar histórico?"
    },
    notifications: {
      ok: "Ok",
      clearTitle: "Limpar notificações?",
      typeNewJobs: "Novas vagas",
      typeAppsUpdates: "Atualização de status",
      typeInterviews: "Entrevistas",
      typeMessages: "Mensagens",
      typeDocs: "Documentos",
      typeReminders: "Lembretes",
      allowContactYes: "Sim",
      allowContactNo: "Não",
      quietActiveFallback: "Não"
    },
    preferences: {
      clearTitle: "Limpar Preferências?",
      commuteExample: "Acesso fácil a ônibus/metro."
    },
    lgpd: {
      cancel: "Cancelar"
    }
  };
})();
