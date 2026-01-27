using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RhPortal.Api.Domain.Entities;

namespace RhPortal.Api.Infrastructure.Pdf;

public sealed class CandidateResumePdfBuilder
{
    public byte[] Build(CandidateResumeData data)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(10).FontColor("#111827"));

                page.Content().Column(col =>
                {
                    RenderHeader(col, data);
                    RenderSection(col, "Resumo profissional", !string.IsNullOrWhiteSpace(data.Candidato.ResumoProfissional)
                        ? data.Candidato.ResumoProfissional!
                        : "Nao informado");

                    RenderSkills(col, data);
                    RenderEducation(col, data);
                    RenderExperience(col, data);
                    RenderProjects(col, data);
                    RenderPortfolio(col, data);
                    RenderPreferences(col, data);
                    RenderDocuments(col, data);
                    RenderReferences(col, data);
                    RenderAccessibility(col, data);
                    RenderAgenda(col, data);
                    RenderNotifications(col, data);
                    RenderLgpd(col, data);
                });
            });
        });

        return doc.GeneratePdf();
    }

    private static void RenderHeader(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().Row(row =>
        {
            row.RelativeColumn().Column(inner =>
            {
                inner.Item().Text(data.Candidato.Nome).FontSize(18).Bold().FontColor("#0C3A64");
                var lines = new List<string>
                {
                    $"Email: {Safe(data.Candidato.Email)}"
                };

                if (!string.IsNullOrWhiteSpace(data.Candidato.Fone))
                    lines.Add($"Telefone: {data.Candidato.Fone}");
                if (!string.IsNullOrWhiteSpace(data.Candidato.Cidade) || !string.IsNullOrWhiteSpace(data.Candidato.Uf))
                    lines.Add($"Local: {Safe(data.Candidato.Cidade)} {Safe(data.Candidato.Uf)}".Trim());
                if (!string.IsNullOrWhiteSpace(data.Candidato.LinkedinUrl))
                    lines.Add($"LinkedIn: {data.Candidato.LinkedinUrl}");

                lines.Add($"Atualizado: {FormatDate(data.Candidato.UpdatedAtUtc)}");
                inner.Item().Text(string.Join(" | ", lines)).FontSize(9).FontColor("#374151");
            });
        });
    }

    private static void RenderSection(ColumnDescriptor col, string title, string? body)
    {
        col.Item().PaddingTop(10).Text(title).FontSize(12).Bold().FontColor("#0C3A64");
        col.Item().Text(string.IsNullOrWhiteSpace(body) ? "Nao informado" : body).FontSize(10);
    }

    private static void RenderSkills(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Competencias & Certificacoes").FontSize(12).Bold().FontColor("#0C3A64");

        var skillsText = data.Skills.Count > 0
            ? string.Join(" | ", data.Skills.Select(s => $"{s.Tipo}: {s.Nome} ({s.Nivel}){OptionalSuffix(s.Evidencia)}"))
            : "Nao informado";
        col.Item().Text($"Competencias: {skillsText}");

        var certText = data.Certifications.Count > 0
            ? string.Join(" | ", data.Certifications.Select(c => $"{c.Nome}{OptionalSuffix(c.Instituicao)}{OptionalSuffix(c.Ano)}"))
            : "Nao informado";
        col.Item().Text($"Certificacoes: {certText}");
    }

    private static void RenderEducation(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Formacao & Educacao").FontSize(12).Bold().FontColor("#0C3A64");

        if (data.EducationSummary is not null)
        {
            RenderFieldLine(col, "Nivel", data.EducationSummary.Nivel);
            RenderFieldLine(col, "Area principal", data.EducationSummary.AreaPrincipal);
            RenderFieldLine(col, "Situacao", data.EducationSummary.Situacao);
            RenderFieldLine(col, "Destaques", data.EducationSummary.Destaques);
        }
        else
        {
            RenderFieldLine(col, "Nivel", null);
            RenderFieldLine(col, "Area principal", null);
            RenderFieldLine(col, "Situacao", null);
            RenderFieldLine(col, "Destaques", null);
        }

        if (data.EducationItems.Count > 0)
        {
            foreach (var item in data.EducationItems)
            {
                var period = BuildPeriod(item.Inicio, item.Fim);
                col.Item().Text($"{item.Curso} - {Safe(item.Instituicao)} {period}".Trim());
                if (!string.IsNullOrWhiteSpace(item.Observacoes))
                    col.Item().Text(item.Observacoes).FontSize(9).FontColor("#4B5563");
            }
        }
        else
        {
            RenderFieldLine(col, "Cursos", null);
        }
    }

    private static void RenderExperience(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Experiencia Profissional").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.Experiences.Count == 0)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }
        foreach (var exp in data.Experiences)
        {
            var period = BuildPeriod(exp.Inicio, exp.Fim);
            col.Item().Text($"{exp.Cargo} - {exp.Empresa} {period}".Trim());
            var meta = string.Join(" | ", new[] { exp.Local }.Where(x => !string.IsNullOrWhiteSpace(x)));
            if (!string.IsNullOrWhiteSpace(meta))
                col.Item().Text(meta).FontSize(9).FontColor("#6B7280");
            if (!string.IsNullOrWhiteSpace(exp.Atividades))
                col.Item().Text(exp.Atividades).FontSize(9).FontColor("#4B5563");
        }
    }

    private static void RenderProjects(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Projetos").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.Projects.Count == 0)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }
        foreach (var proj in data.Projects)
        {
            var period = OptionalSuffix(proj.Periodo);
            col.Item().Text($"{proj.Nome}{period}");
            if (!string.IsNullOrWhiteSpace(proj.Stack))
                col.Item().Text($"Stack: {proj.Stack}").FontSize(9).FontColor("#6B7280");
            if (!string.IsNullOrWhiteSpace(proj.Descricao))
                col.Item().Text(proj.Descricao).FontSize(9).FontColor("#4B5563");
            if (!string.IsNullOrWhiteSpace(proj.Link))
                col.Item().Text($"Link: {proj.Link}").FontSize(9).FontColor("#4B5563");
        }
    }

    private static void RenderPortfolio(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Portfolios & Links").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.Portfolio is null)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }
        RenderFieldLine(col, "LinkedIn", data.Portfolio.Linkedin);
        RenderFieldLine(col, "GitHub", data.Portfolio.Github);
        RenderFieldLine(col, "Portfolio", data.Portfolio.Portfolio);
        RenderFieldLine(col, "Drive", data.Portfolio.Drive);
        RenderFieldLine(col, "Tags", data.Portfolio.Tags);
        RenderFieldLine(col, "Observacoes", data.Portfolio.Note);
        RenderFieldLine(col, "Modelo", data.Portfolio.WorkModel);
        RenderFieldLine(col, "Disponibilidade", data.Portfolio.Availability);
        RenderFieldLine(col, "Pretensao", data.Portfolio.Salary);
        RenderFieldLine(col, "Jornada", data.Portfolio.Shift);
    }

    private static void RenderPreferences(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Preferencias de Vaga").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.Preferences is null)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }

        RenderFieldLine(col, "Cargo alvo", data.Preferences.CargoAlvo);
        RenderFieldLine(col, "Senioridade", data.Preferences.Senioridade);
        RenderFieldLine(col, "Inicio disponivel", data.Preferences.InicioDisponivel);
        RenderFieldLine(col, "Modelo", data.Preferences.ModeloTrabalho);
        RenderFieldLine(col, "Jornada", data.Preferences.Jornada);
        RenderFieldLine(col, "Contrato", data.Preferences.TipoContrato);
        RenderFieldLine(col, "Viagens", data.Preferences.Viagens);
        RenderFieldLine(col, "Mudanca", data.Preferences.Mudanca);
        RenderFieldLine(col, "Cidade preferida", data.Preferences.CidadePreferida);
        RenderFieldLine(col, "Distancia maxima (km)", data.Preferences.DistanciaMaxKm?.ToString());
        RenderFieldLine(col, "Pretensao salarial", data.Preferences.PretensaoSalarial);
        RenderFieldLine(col, "Pretensao negociavel", data.Preferences.PretensaoNegociavel);
        RenderFieldLine(col, "Beneficios", data.Preferences.BeneficiosDesejados);
        RenderFieldLine(col, "Nao abre mao de", data.Preferences.NaoAbreMaoDe);
        RenderFieldLine(col, "Areas de interesse", data.Preferences.AreasInteresse);
        RenderFieldLine(col, "Resumo", data.Preferences.Resumo);
        RenderFieldLine(col, "Obs deslocamento", data.Preferences.ObsDeslocamento);
    }

    private static void RenderDocuments(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Documentos & Anexos").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.Documents.Count == 0)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }
        foreach (var doc in data.Documents)
        {
            var line = $"{doc.Tipo}: {doc.NomeArquivo}";
            if (!string.IsNullOrWhiteSpace(doc.DataReferencia))
                line += $" ({doc.DataReferencia})";
            col.Item().Text(line);
        }
    }

    private static void RenderReferences(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Referencias").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.References.Count == 0)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }
        foreach (var reference in data.References)
        {
            col.Item().Text($"{reference.Nome} - {reference.Relacao}").SemiBold();
            var meta = new List<string>();
            AddIf(meta, "Empresa", reference.Empresa);
            AddIf(meta, "Cargo", reference.Cargo);
            AddIf(meta, "Contato", reference.Contato);
            AddIf(meta, "Periodo", reference.Periodo);
            AddIf(meta, "LinkedIn", reference.Linkedin);
            if (meta.Count > 0)
                col.Item().Text(string.Join(" | ", meta)).FontSize(9).FontColor("#4B5563");
            if (!string.IsNullOrWhiteSpace(reference.Observacoes))
                col.Item().Text(reference.Observacoes).FontSize(9).FontColor("#4B5563");
            col.Item().Text($"Pode contatar: {(reference.PodeContatar ? "Sim" : "Nao")}").FontSize(9).FontColor("#6B7280");
        }
    }

    private static void RenderAccessibility(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Acessibilidade & Inclusao").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.Accessibility is null)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }

        var needs = new List<string>();
        if (data.Accessibility.PrecisaLegendas) needs.Add("Legendas");
        if (data.Accessibility.PrecisaInterprete) needs.Add("Interprete");
        if (data.Accessibility.PrecisaLeitorTela) needs.Add("Leitor de tela");
        if (data.Accessibility.PrecisaBaixaEstimulo) needs.Add("Baixa estimulacao");
        if (data.Accessibility.PrecisaMobilidade) needs.Add("Mobilidade");
        if (data.Accessibility.PrecisaTempoExtra) needs.Add("Tempo extra");
        RenderFieldLine(col, "Idioma", data.Accessibility.Idioma);
        RenderFieldLine(col, "Canal", data.Accessibility.Canal);
        RenderFieldLine(col, "Melhor horario", data.Accessibility.MelhorHorario);
        RenderFieldLine(col, "Observacoes", data.Accessibility.ObservacoesComunicacao);
        RenderFieldLine(col, "Necessidades", needs.Count == 0 ? null : string.Join(", ", needs));
        RenderFieldLine(col, "Detalhes necessidades", data.Accessibility.DetalhesNecessidades);
        RenderFieldLine(col, "PCD", data.Accessibility.ConsentimentoPcd ? "Sim" : "Nao");
        RenderFieldLine(col, "Identificacao", data.Accessibility.PcdIdentificacao);
        RenderFieldLine(col, "Tipo", data.Accessibility.PcdTipo);
        RenderFieldLine(col, "Comprovacao", data.Accessibility.PcdComprovacao);
        RenderFieldLine(col, "Observacoes PCD", data.Accessibility.PcdObservacoes);
    }

    private static void RenderAgenda(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Disponibilidade & Agenda").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.AgendaPreferences is null && data.AgendaBlocks.Count == 0)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }

        if (data.AgendaPreferences is not null)
        {
            var prefs = new List<string>();
            AddIf(prefs, "Formato", data.AgendaPreferences.FormatoEntrevista);
            AddIf(prefs, "Inicio disponivel", data.AgendaPreferences.InicioDisponivel);
            AddIf(prefs, "Aviso previo", data.AgendaPreferences.AvisoPrevio);
            AddIf(prefs, "Horario preferido", data.AgendaPreferences.HorarioPreferido);
            AddIf(prefs, "Fuso", data.AgendaPreferences.FusoHorario);
            var dias = new List<string>();
            if (data.AgendaPreferences.DiaSeg) dias.Add("Seg");
            if (data.AgendaPreferences.DiaTer) dias.Add("Ter");
            if (data.AgendaPreferences.DiaQua) dias.Add("Qua");
            if (data.AgendaPreferences.DiaQui) dias.Add("Qui");
            if (data.AgendaPreferences.DiaSex) dias.Add("Sex");
            if (data.AgendaPreferences.DiaSab) dias.Add("Sab");
            if (data.AgendaPreferences.DiaDom) dias.Add("Dom");
            if (dias.Count > 0)
                prefs.Add($"Dias: {string.Join(", ", dias)}");
            var periodos = new List<string>();
            if (data.AgendaPreferences.PeriodoManha) periodos.Add("Manha");
            if (data.AgendaPreferences.PeriodoTarde) periodos.Add("Tarde");
            if (data.AgendaPreferences.PeriodoNoite) periodos.Add("Noite");
            if (periodos.Count > 0)
                prefs.Add($"Periodos: {string.Join(", ", periodos)}");

            col.Item().Text(string.Join(" | ", prefs));
            if (!string.IsNullOrWhiteSpace(data.AgendaPreferences.Observacoes))
                col.Item().Text(data.AgendaPreferences.Observacoes).FontSize(9).FontColor("#4B5563");
        }

        if (data.AgendaBlocks.Count > 0)
        {
            foreach (var block in data.AgendaBlocks)
            {
                var line = $"{block.Tipo}: {block.Titulo}";
                if (!string.IsNullOrWhiteSpace(block.Data))
                    line += $" ({block.Data})";
                if (!string.IsNullOrWhiteSpace(block.Horario))
                    line += $" {block.Horario}";
                col.Item().Text(line);
                if (!string.IsNullOrWhiteSpace(block.Observacoes))
                    col.Item().Text(block.Observacoes).FontSize(9).FontColor("#4B5563");
            }
        }
    }

    private static void RenderNotifications(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("Notificacoes & Comunicacao").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.NotificationPreferences is null)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }
        var channels = new List<string>();
        if (data.NotificationPreferences.CanalEmail) channels.Add("Email");
        if (data.NotificationPreferences.CanalWhatsapp) channels.Add("WhatsApp");
        if (data.NotificationPreferences.CanalSms) channels.Add("SMS");
        if (data.NotificationPreferences.CanalPush) channels.Add("Push");
        var alerts = new List<string>();
        if (data.NotificationPreferences.AlertaNovasVagas) alerts.Add("Novas vagas");
        if (data.NotificationPreferences.AlertaAtualizacoes) alerts.Add("Atualizacoes");
        if (data.NotificationPreferences.AlertaEntrevistas) alerts.Add("Entrevistas");
        if (data.NotificationPreferences.AlertaMensagens) alerts.Add("Mensagens");
        if (data.NotificationPreferences.AlertaDocumentos) alerts.Add("Documentos");
        if (data.NotificationPreferences.AlertaLembretes) alerts.Add("Lembretes");
        RenderFieldLine(col, "Canais", channels.Count == 0 ? null : string.Join(", ", channels));
        RenderFieldLine(col, "Alertas", alerts.Count == 0 ? null : string.Join(", ", alerts));
        RenderFieldLine(col, "Frequencia", data.NotificationPreferences.Frequencia);
        var silence = string.IsNullOrWhiteSpace(data.NotificationPreferences.SilencioAtivo)
            ? null
            : $"{data.NotificationPreferences.SilencioAtivo} {OptionalSuffix(data.NotificationPreferences.SilencioInicio)}{OptionalSuffix(data.NotificationPreferences.SilencioFim)}".Trim();
        RenderFieldLine(col, "Silencio", silence);
    }

    private static void RenderLgpd(ColumnDescriptor col, CandidateResumeData data)
    {
        col.Item().PaddingTop(10).Text("LGPD").FontSize(12).Bold().FontColor("#0C3A64");
        if (data.LgpdConsent is null)
        {
            col.Item().Text("Nao informado").FontSize(9).FontColor("#6B7280");
            return;
        }
        RenderFieldLine(col, "Processar candidatura", BoolLabel(data.LgpdConsent.ProcessarCandidatura));
        RenderFieldLine(col, "Permitir contato", BoolLabel(data.LgpdConsent.PermitirContato));
        RenderFieldLine(col, "Banco de talentos", BoolLabel(data.LgpdConsent.BancoTalentos));
        RenderFieldLine(col, "Dados sensiveis", BoolLabel(data.LgpdConsent.DadosSensiveis));
        RenderFieldLine(col, "Comunicacoes", BoolLabel(data.LgpdConsent.Comunicacoes));
        RenderFieldLine(col, "Compartilhamento", data.LgpdConsent.Compartilhamento?.ToString());
        RenderFieldLine(col, "Retencao (meses)", data.LgpdConsent.RetencaoMeses?.ToString());
        RenderFieldLine(col, "Consentido em", FormatDate(data.LgpdConsent.ConsentidoEmUtc));
        RenderFieldLine(col, "Revogado em", FormatDate(data.LgpdConsent.RevogadoEmUtc));
    }

    private static string Safe(string? value)
        => string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    private static string OptionalSuffix(string? value)
        => string.IsNullOrWhiteSpace(value) ? string.Empty : $" - {value}";

    private static string BuildPeriod(string? start, string? end)
    {
        if (string.IsNullOrWhiteSpace(start) && string.IsNullOrWhiteSpace(end))
            return string.Empty;
        if (string.IsNullOrWhiteSpace(end))
            return $"({start})";
        if (string.IsNullOrWhiteSpace(start))
            return $"({end})";
        return $"({start} - {end})";
    }

    private static string BoolLabel(bool value) => value ? "Sim" : "Nao";

    private static string FormatDate(DateTimeOffset? date)
    {
        if (date is null) return string.Empty;
        return date.Value.ToLocalTime().ToString("dd/MM/yyyy HH:mm", CultureInfo.GetCultureInfo("pt-BR"));
    }

    private static void RenderFieldLine(ColumnDescriptor col, string label, string? value)
    {
        var text = string.IsNullOrWhiteSpace(value) ? "Nao informado" : value;
        col.Item().Text($"{label}: {text}");
    }

    private static void AddIf(List<string> target, string label, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;
        target.Add($"{label}: {value}");
    }
}

public sealed record CandidateResumeData(
    Candidato Candidato,
    IReadOnlyList<CandidatoCompetencia> Skills,
    IReadOnlyList<CandidatoCertificacao> Certifications,
    CandidatoPortfolio? Portfolio,
    CandidatoEducacaoResumo? EducationSummary,
    IReadOnlyList<CandidatoEducacaoItem> EducationItems,
    IReadOnlyList<CandidatoExperiencia> Experiences,
    IReadOnlyList<CandidatoProjeto> Projects,
    CandidatoPreferenciasVaga? Preferences,
    IReadOnlyList<CandidatoDocumento> Documents,
    IReadOnlyList<CandidatoReferencia> References,
    CandidatoAcessibilidade? Accessibility,
    CandidatoAgendaPreferencia? AgendaPreferences,
    IReadOnlyList<CandidatoAgendaBloqueio> AgendaBlocks,
    CandidatoNotificacaoPreferencia? NotificationPreferences,
    CandidatoLgpdConsent? LgpdConsent
);

