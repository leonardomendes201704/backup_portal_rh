using System.Globalization;
using System.Linq;
using System.Net;
using System.Text;
using RhPortal.Api.Domain.Entities;
using RhPortal.Api.Infrastructure.Pdf;

namespace RhPortal.Api.Infrastructure.Html;

public sealed class CandidateResumeHtmlBuilder
{
    public string Build(CandidateResumeData data)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!doctype html>");
        sb.AppendLine("<html lang=\"pt-BR\">");
        sb.AppendLine("<head>");
        sb.AppendLine("  <meta charset=\"utf-8\" />");
        sb.AppendLine("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />");
        sb.AppendLine($"  <title>Curriculo - {Enc(data.Candidato.Nome)}</title>");
        sb.AppendLine("  <style>");
        sb.AppendLine("    :root {");
        sb.AppendLine("      --bg: #f3f5f9;");
        sb.AppendLine("      --card: #ffffff;");
        sb.AppendLine("      --ink: #0f172a;");
        sb.AppendLine("      --muted: #64748b;");
        sb.AppendLine("      --primary: #0c3a64;");
        sb.AppendLine("      --border: #e2e8f0;");
        sb.AppendLine("      --accent: #e8f1fb;");
        sb.AppendLine("    }");
        sb.AppendLine("    * { box-sizing: border-box; }");
        sb.AppendLine("    body { margin: 0; font-family: \"Segoe UI\", Arial, sans-serif; background: var(--bg); color: var(--ink); }");
        sb.AppendLine("    .page { max-width: 980px; margin: 32px auto; padding: 0 16px 48px; }");
        sb.AppendLine("    .hero { background: linear-gradient(135deg, #e6f0fb, #f7fbff); border: 2px solid #cbd5e1; border-radius: 18px; padding: 24px; }");
        sb.AppendLine("    .hero-content { display: flex; gap: 16px; align-items: center; }");
        sb.AppendLine("    .hero h1 { margin: 0 0 8px; font-size: 28px; color: var(--primary); }");
        sb.AppendLine("    .hero .meta { color: var(--muted); font-size: 14px; line-height: 1.5; }");
        sb.AppendLine("    .avatar { width: 64px; height: 64px; border-radius: 50%; background: #0c3a64; display: grid; place-items: center; color: #fff; }");
        sb.AppendLine("    .avatar svg { width: 34px; height: 34px; fill: #fff; }");
        sb.AppendLine("    .grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 20px; }");
        sb.AppendLine("    .card { background: var(--card); border: 2px solid #cbd5e1; border-radius: 16px; padding: 18px; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06); }");
        sb.AppendLine("    .card h2 { margin: 0 0 12px; font-size: 16px; color: var(--primary); }");
        sb.AppendLine("    .field { display: grid; grid-template-columns: 160px 1fr; gap: 8px; padding: 6px 0; border-bottom: 1px dashed #e5e7eb; }");
        sb.AppendLine("    .field:last-child { border-bottom: none; }");
        sb.AppendLine("    .label { font-weight: 600; color: #1f2a44; }");
        sb.AppendLine("    .value { color: #111827; }");
        sb.AppendLine("    .muted { color: var(--muted); }");
        sb.AppendLine("    .entry { padding: 10px 0; border-bottom: 1px solid var(--border); }");
        sb.AppendLine("    .entry:last-child { border-bottom: none; }");
        sb.AppendLine("    .entry-title { font-weight: 600; color: #0f172a; }");
        sb.AppendLine("    .entry-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }");
        sb.AppendLine("    .badge { display: inline-block; background: var(--accent); color: var(--primary); border-radius: 999px; padding: 2px 10px; font-size: 12px; margin-right: 6px; margin-bottom: 4px; }");
        sb.AppendLine("    @media print { body { background: #fff; } .page { margin: 0; } .card { box-shadow: none; } }");
        sb.AppendLine("  </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("  <div class=\"page\">");

        sb.AppendLine("    <section class=\"hero\">");
        sb.AppendLine("      <div class=\"hero-content\">");
        sb.AppendLine("        <div class=\"avatar\" aria-hidden=\"true\">");
        sb.AppendLine("          <svg viewBox=\"0 0 24 24\" role=\"img\" aria-label=\"Usuario\">");
        sb.AppendLine("            <path d=\"M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2-8 4v2h16v-2c0-2-3.58-4-8-4z\"/>");
        sb.AppendLine("          </svg>");
        sb.AppendLine("        </div>");
        sb.AppendLine("        <div>");
        sb.AppendLine($"          <h1>{Enc(data.Candidato.Nome)}</h1>");
        sb.AppendLine("          <div class=\"meta\">");
        sb.AppendLine($"            Email: {Display(data.Candidato.Email)} | Telefone: {Display(data.Candidato.Fone)} | Local: {Display($"{data.Candidato.Cidade} {data.Candidato.Uf}".Trim())}");
        if (!string.IsNullOrWhiteSpace(data.Candidato.LinkedinUrl))
            sb.AppendLine($"            | LinkedIn: {Enc(data.Candidato.LinkedinUrl)}");
        sb.AppendLine($"            <br/>Atualizado: {Display(FormatDate(data.Candidato.UpdatedAtUtc))}");
        sb.AppendLine("          </div>");
        sb.AppendLine("        </div>");
        sb.AppendLine("      </div>");
        sb.AppendLine("    </section>");

        sb.AppendLine("    <section class=\"grid\">");
        AppendCard(sb, "Resumo profissional", builder =>
        {
            AppendField(builder, "Resumo", data.Candidato.ResumoProfissional);
        });

        AppendCard(sb, "Competencias & Certificacoes", builder =>
        {
            AppendField(builder, "Competencias", data.Skills.Count == 0
                ? null
                : string.Join(" | ", data.Skills.Select(s => $"{s.Tipo}: {s.Nome} ({s.Nivel}){OptionalSuffix(s.Evidencia)}")));
            AppendField(builder, "Certificacoes", data.Certifications.Count == 0
                ? null
                : string.Join(" | ", data.Certifications.Select(c => $"{c.Nome}{OptionalSuffix(c.Instituicao)}{OptionalSuffix(c.Ano)}")));
        });

        AppendCard(sb, "Formacao & Educacao", builder =>
        {
            if (data.EducationSummary is null)
            {
                AppendField(builder, "Nivel", null);
                AppendField(builder, "Area principal", null);
                AppendField(builder, "Situacao", null);
                AppendField(builder, "Destaques", null);
            }
            else
            {
                AppendField(builder, "Nivel", data.EducationSummary.Nivel);
                AppendField(builder, "Area principal", data.EducationSummary.AreaPrincipal);
                AppendField(builder, "Situacao", data.EducationSummary.Situacao);
                AppendField(builder, "Destaques", data.EducationSummary.Destaques);
            }

            if (data.EducationItems.Count == 0)
            {
                AppendField(builder, "Cursos", null);
                return;
            }

            foreach (var item in data.EducationItems)
            {
                var period = BuildPeriod(item.Inicio, item.Fim);
                builder.AppendLine("<div class=\"entry\">");
                builder.AppendLine($"  <div class=\"entry-title\">{Enc(item.Curso)} - {Enc(item.Instituicao)} {Enc(period)}</div>");
                if (!string.IsNullOrWhiteSpace(item.Observacoes))
                    builder.AppendLine($"  <div class=\"entry-sub\">{Enc(item.Observacoes)}</div>");
                builder.AppendLine("</div>");
            }
        });

        AppendCard(sb, "Experiencia Profissional", builder =>
        {
            if (data.Experiences.Count == 0)
            {
                AppendField(builder, "Historico", null);
                return;
            }
            foreach (var exp in data.Experiences)
            {
                var period = BuildPeriod(exp.Inicio, exp.Fim);
                builder.AppendLine("<div class=\"entry\">");
                builder.AppendLine($"  <div class=\"entry-title\">{Enc(exp.Cargo)} - {Enc(exp.Empresa)} {Enc(period)}</div>");
                if (!string.IsNullOrWhiteSpace(exp.Local))
                    builder.AppendLine($"  <div class=\"entry-sub\">{Enc(exp.Local)}</div>");
                if (!string.IsNullOrWhiteSpace(exp.Atividades))
                    builder.AppendLine($"  <div class=\"entry-sub\">{Enc(exp.Atividades)}</div>");
                builder.AppendLine("</div>");
            }
        });

        AppendCard(sb, "Projetos", builder =>
        {
            if (data.Projects.Count == 0)
            {
                AppendField(builder, "Projetos", null);
                return;
            }
            foreach (var proj in data.Projects)
            {
                builder.AppendLine("<div class=\"entry\">");
                builder.AppendLine($"  <div class=\"entry-title\">{Enc(proj.Nome)} {Enc(OptionalSuffix(proj.Periodo))}</div>");
                if (!string.IsNullOrWhiteSpace(proj.Stack))
                    builder.AppendLine($"  <div class=\"entry-sub\">Stack: {Enc(proj.Stack)}</div>");
                if (!string.IsNullOrWhiteSpace(proj.Descricao))
                    builder.AppendLine($"  <div class=\"entry-sub\">{Enc(proj.Descricao)}</div>");
                if (!string.IsNullOrWhiteSpace(proj.Link))
                    builder.AppendLine($"  <div class=\"entry-sub\">Link: {Enc(proj.Link)}</div>");
                builder.AppendLine("</div>");
            }
        });

        AppendCard(sb, "Portfolios & Links", builder =>
        {
            if (data.Portfolio is null)
            {
                AppendField(builder, "Portfolio", null);
                return;
            }
            AppendField(builder, "LinkedIn", data.Portfolio.Linkedin);
            AppendField(builder, "GitHub", data.Portfolio.Github);
            AppendField(builder, "Portfolio", data.Portfolio.Portfolio);
            AppendField(builder, "Drive", data.Portfolio.Drive);
            AppendField(builder, "Tags", data.Portfolio.Tags);
            AppendField(builder, "Observacoes", data.Portfolio.Note);
            AppendField(builder, "Modelo", data.Portfolio.WorkModel);
            AppendField(builder, "Disponibilidade", data.Portfolio.Availability);
            AppendField(builder, "Pretensao", data.Portfolio.Salary);
            AppendField(builder, "Jornada", data.Portfolio.Shift);
        });

        AppendCard(sb, "Preferencias de Vaga", builder =>
        {
            if (data.Preferences is null)
            {
                AppendField(builder, "Preferencias", null);
                return;
            }
            AppendField(builder, "Cargo alvo", data.Preferences.CargoAlvo);
            AppendField(builder, "Senioridade", data.Preferences.Senioridade);
            AppendField(builder, "Inicio disponivel", data.Preferences.InicioDisponivel);
            AppendField(builder, "Modelo", data.Preferences.ModeloTrabalho);
            AppendField(builder, "Jornada", data.Preferences.Jornada);
            AppendField(builder, "Contrato", data.Preferences.TipoContrato);
            AppendField(builder, "Viagens", data.Preferences.Viagens);
            AppendField(builder, "Mudanca", data.Preferences.Mudanca);
            AppendField(builder, "Cidade preferida", data.Preferences.CidadePreferida);
            AppendField(builder, "Distancia maxima (km)", data.Preferences.DistanciaMaxKm?.ToString());
            AppendField(builder, "Pretensao salarial", data.Preferences.PretensaoSalarial);
            AppendField(builder, "Pretensao negociavel", data.Preferences.PretensaoNegociavel);
            AppendField(builder, "Beneficios", data.Preferences.BeneficiosDesejados);
            AppendField(builder, "Nao abre mao de", data.Preferences.NaoAbreMaoDe);
            AppendField(builder, "Areas de interesse", data.Preferences.AreasInteresse);
            AppendField(builder, "Resumo", data.Preferences.Resumo);
            AppendField(builder, "Obs deslocamento", data.Preferences.ObsDeslocamento);
        });

        AppendCard(sb, "Documentos & Anexos", builder =>
        {
            if (data.Documents.Count == 0)
            {
                AppendField(builder, "Documentos", null);
                return;
            }
            foreach (var doc in data.Documents)
            {
                var line = $"{doc.Tipo}: {doc.NomeArquivo}";
                if (!string.IsNullOrWhiteSpace(doc.DataReferencia))
                    line += $" ({doc.DataReferencia})";
                builder.AppendLine($"<div class=\"entry\"><div class=\"entry-title\">{Enc(line)}</div></div>");
            }
        });

        AppendCard(sb, "Referencias", builder =>
        {
            if (data.References.Count == 0)
            {
                AppendField(builder, "Referencias", null);
                return;
            }
            foreach (var reference in data.References)
            {
                builder.AppendLine("<div class=\"entry\">");
                builder.AppendLine($"  <div class=\"entry-title\">{Enc(reference.Nome)} - {Enc(reference.Relacao)}</div>");
                if (!string.IsNullOrWhiteSpace(reference.Empresa))
                    builder.AppendLine($"  <div class=\"entry-sub\">Empresa: {Enc(reference.Empresa)}</div>");
                if (!string.IsNullOrWhiteSpace(reference.Cargo))
                    builder.AppendLine($"  <div class=\"entry-sub\">Cargo: {Enc(reference.Cargo)}</div>");
                if (!string.IsNullOrWhiteSpace(reference.Contato))
                    builder.AppendLine($"  <div class=\"entry-sub\">Contato: {Enc(reference.Contato)}</div>");
                if (!string.IsNullOrWhiteSpace(reference.Periodo))
                    builder.AppendLine($"  <div class=\"entry-sub\">Periodo: {Enc(reference.Periodo)}</div>");
                if (!string.IsNullOrWhiteSpace(reference.Linkedin))
                    builder.AppendLine($"  <div class=\"entry-sub\">LinkedIn: {Enc(reference.Linkedin)}</div>");
                if (!string.IsNullOrWhiteSpace(reference.Observacoes))
                    builder.AppendLine($"  <div class=\"entry-sub\">{Enc(reference.Observacoes)}</div>");
                builder.AppendLine($"  <div class=\"entry-sub\">Pode contatar: {(reference.PodeContatar ? "Sim" : "Nao")}</div>");
                builder.AppendLine("</div>");
            }
        });

        AppendCard(sb, "Acessibilidade & Inclusao", builder =>
        {
            if (data.Accessibility is null)
            {
                AppendField(builder, "Acessibilidade", null);
                return;
            }
            AppendField(builder, "Idioma", data.Accessibility.Idioma);
            AppendField(builder, "Canal", data.Accessibility.Canal);
            AppendField(builder, "Melhor horario", data.Accessibility.MelhorHorario);
            AppendField(builder, "Observacoes", data.Accessibility.ObservacoesComunicacao);
            var needs = new List<string>();
            if (data.Accessibility.PrecisaLegendas) needs.Add("Legendas");
            if (data.Accessibility.PrecisaInterprete) needs.Add("Interprete");
            if (data.Accessibility.PrecisaLeitorTela) needs.Add("Leitor de tela");
            if (data.Accessibility.PrecisaBaixaEstimulo) needs.Add("Baixa estimulacao");
            if (data.Accessibility.PrecisaMobilidade) needs.Add("Mobilidade");
            if (data.Accessibility.PrecisaTempoExtra) needs.Add("Tempo extra");
            AppendField(builder, "Necessidades", needs.Count == 0 ? null : string.Join(", ", needs));
            AppendField(builder, "Detalhes necessidades", data.Accessibility.DetalhesNecessidades);
            AppendField(builder, "PCD", data.Accessibility.ConsentimentoPcd ? "Sim" : "Nao");
            AppendField(builder, "Identificacao", data.Accessibility.PcdIdentificacao);
            AppendField(builder, "Tipo", data.Accessibility.PcdTipo);
            AppendField(builder, "Comprovacao", data.Accessibility.PcdComprovacao);
            AppendField(builder, "Observacoes PCD", data.Accessibility.PcdObservacoes);
        });

        AppendCard(sb, "Disponibilidade & Agenda", builder =>
        {
            if (data.AgendaPreferences is null && data.AgendaBlocks.Count == 0)
            {
                AppendField(builder, "Agenda", null);
                return;
            }
            if (data.AgendaPreferences is not null)
            {
                AppendField(builder, "Formato", data.AgendaPreferences.FormatoEntrevista);
                AppendField(builder, "Inicio disponivel", data.AgendaPreferences.InicioDisponivel);
                AppendField(builder, "Aviso previo", data.AgendaPreferences.AvisoPrevio);
                AppendField(builder, "Horario preferido", data.AgendaPreferences.HorarioPreferido);
                AppendField(builder, "Fuso", data.AgendaPreferences.FusoHorario);
                var dias = new List<string>();
                if (data.AgendaPreferences.DiaSeg) dias.Add("Seg");
                if (data.AgendaPreferences.DiaTer) dias.Add("Ter");
                if (data.AgendaPreferences.DiaQua) dias.Add("Qua");
                if (data.AgendaPreferences.DiaQui) dias.Add("Qui");
                if (data.AgendaPreferences.DiaSex) dias.Add("Sex");
                if (data.AgendaPreferences.DiaSab) dias.Add("Sab");
                if (data.AgendaPreferences.DiaDom) dias.Add("Dom");
                AppendField(builder, "Dias", dias.Count == 0 ? null : string.Join(", ", dias));
                var periodos = new List<string>();
                if (data.AgendaPreferences.PeriodoManha) periodos.Add("Manha");
                if (data.AgendaPreferences.PeriodoTarde) periodos.Add("Tarde");
                if (data.AgendaPreferences.PeriodoNoite) periodos.Add("Noite");
                AppendField(builder, "Periodos", periodos.Count == 0 ? null : string.Join(", ", periodos));
                AppendField(builder, "Observacoes", data.AgendaPreferences.Observacoes);
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
                    builder.AppendLine($"<div class=\"entry\"><div class=\"entry-title\">{Enc(line)}</div></div>");
                }
            }
        });

        AppendCard(sb, "Notificacoes & Comunicacao", builder =>
        {
            if (data.NotificationPreferences is null)
            {
                AppendField(builder, "Notificacoes", null);
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
            AppendField(builder, "Canais", channels.Count == 0 ? null : string.Join(", ", channels));
            AppendField(builder, "Alertas", alerts.Count == 0 ? null : string.Join(", ", alerts));
            AppendField(builder, "Frequencia", data.NotificationPreferences.Frequencia);
            var silence = string.IsNullOrWhiteSpace(data.NotificationPreferences.SilencioAtivo)
                ? null
                : $"{data.NotificationPreferences.SilencioAtivo} {OptionalSuffix(data.NotificationPreferences.SilencioInicio)}{OptionalSuffix(data.NotificationPreferences.SilencioFim)}".Trim();
            AppendField(builder, "Silencio", silence);
        });

        AppendCard(sb, "LGPD", builder =>
        {
            if (data.LgpdConsent is null)
            {
                AppendField(builder, "LGPD", null);
                return;
            }
            AppendField(builder, "Processar candidatura", BoolLabel(data.LgpdConsent.ProcessarCandidatura));
            AppendField(builder, "Permitir contato", BoolLabel(data.LgpdConsent.PermitirContato));
            AppendField(builder, "Banco de talentos", BoolLabel(data.LgpdConsent.BancoTalentos));
            AppendField(builder, "Dados sensiveis", BoolLabel(data.LgpdConsent.DadosSensiveis));
            AppendField(builder, "Comunicacoes", BoolLabel(data.LgpdConsent.Comunicacoes));
            AppendField(builder, "Compartilhamento", data.LgpdConsent.Compartilhamento?.ToString());
            AppendField(builder, "Retencao (meses)", data.LgpdConsent.RetencaoMeses?.ToString());
            AppendField(builder, "Consentido em", FormatDate(data.LgpdConsent.ConsentidoEmUtc));
            AppendField(builder, "Revogado em", FormatDate(data.LgpdConsent.RevogadoEmUtc));
        });

        sb.AppendLine("    </section>");
        sb.AppendLine("  </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");

        return sb.ToString();
    }

    private static void AppendCard(StringBuilder sb, string title, Action<StringBuilder> content)
    {
        var builder = new StringBuilder();
        content(builder);
        sb.AppendLine("      <div class=\"card\">");
        sb.AppendLine($"        <h2>{Enc(title)}</h2>");
        sb.AppendLine(builder.ToString());
        sb.AppendLine("      </div>");
    }

    private static void AppendField(StringBuilder sb, string label, string? value)
    {
        sb.AppendLine("        <div class=\"field\">");
        sb.AppendLine($"          <div class=\"label\">{Enc(label)}</div>");
        sb.AppendLine($"          <div class=\"value\">{Display(value)}</div>");
        sb.AppendLine("        </div>");
    }

    private static string Display(string? value)
        => string.IsNullOrWhiteSpace(value) ? "<span class=\"muted\">Nao informado</span>" : Enc(value);

    private static string Enc(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

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
}
