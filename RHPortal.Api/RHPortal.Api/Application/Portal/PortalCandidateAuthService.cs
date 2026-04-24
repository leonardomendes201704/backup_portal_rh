using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RhPortal.Api.Contracts.Portal;
using RhPortal.Api.Contracts.Notifications;
using RhPortal.Api.Domain.Entities;
using RhPortal.Api.Domain.Enums;
using RhPortal.Api.Infrastructure.Data;
using RhPortal.Api.Infrastructure.Localization;
using RhPortal.Api.Infrastructure.Notifications;
using RhPortal.Api.Infrastructure.Security;
using RhPortal.Api.Infrastructure.Tenancy;

namespace RhPortal.Api.Application.Portal;

public interface IPortalCandidateAuthService
{
    Task<PortalCandidateSessionResponse?> LoginAsync(PortalCandidateLoginRequest request, string? userAgent, CancellationToken ct);
    Task<PortalCandidateSessionResponse> RegisterAsync(PortalCandidateRegisterRequest request, string? userAgent, CancellationToken ct);
    Task<PortalCandidateSessionResponse?> RefreshAsync(PortalCandidateRefreshRequest request, string? userAgent, CancellationToken ct);
    Task<PortalCandidateIdentityResponse?> GetCurrentAsync(Guid candidateId, CancellationToken ct);
    Task LogoutAsync(Guid candidateId, PortalCandidateLogoutRequest request, CancellationToken ct);
}

public sealed class PortalCandidateAuthService : IPortalCandidateAuthService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<Candidato> _passwordHasher;
    private readonly IStringLocalizer<ServiceMessages> _localizer;
    private readonly NotificationPublisher _notificationPublisher;
    private readonly ITenantContext _tenantContext;
    private readonly JwtOptions _jwtOptions;
    private readonly TimeProvider _timeProvider;
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(14);

    public PortalCandidateAuthService(
        AppDbContext db,
        IPasswordHasher<Candidato> passwordHasher,
        IStringLocalizer<ServiceMessages> localizer,
        NotificationPublisher notificationPublisher,
        ITenantContext tenantContext,
        IOptions<JwtOptions> jwtOptions,
        TimeProvider timeProvider)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _localizer = localizer;
        _notificationPublisher = notificationPublisher;
        _tenantContext = tenantContext;
        _jwtOptions = jwtOptions.Value;
        _timeProvider = timeProvider;
    }

    public async Task<PortalCandidateSessionResponse?> LoginAsync(PortalCandidateLoginRequest request, string? userAgent, CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(email)) return null;

        var candidato = await _db.Candidatos
            .FirstOrDefaultAsync(x => x.Email == email, ct);

        if (candidato is null || string.IsNullOrWhiteSpace(candidato.PortalPasswordHash))
            return null;

        var result = _passwordHasher.VerifyHashedPassword(candidato, candidato.PortalPasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return null;

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            candidato.PortalPasswordHash = _passwordHasher.HashPassword(candidato, request.Password);
            await _db.SaveChangesAsync(ct);
        }

        return await CreateSessionAsync(candidato, userAgent, ct);
    }

    public async Task<PortalCandidateSessionResponse> RegisterAsync(PortalCandidateRegisterRequest request, string? userAgent, CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException(_localizer["ServiceErrors.PortalEmailInvalid"]);

        var candidato = await _db.Candidatos
            .FirstOrDefaultAsync(x => x.Email == email, ct);

        if (candidato is not null)
        {
            if (!string.IsNullOrWhiteSpace(candidato.PortalPasswordHash))
                throw new InvalidOperationException(_localizer["ServiceErrors.PortalAccessExists"]);

            candidato.Nome = (request.Nome ?? string.Empty).Trim();
            candidato.Email = email;
            candidato.Fone = NormalizeRequired(request.Fone);
            candidato.Cidade = NormalizeRequired(request.Cidade);
            candidato.Uf = NormalizeUfRequired(request.Uf);
            candidato.PortalPasswordHash = _passwordHasher.HashPassword(candidato, request.Password);

            await _db.SaveChangesAsync(ct);
            await NotifyPortalRegisterAsync(candidato, ct);
            return await CreateSessionAsync(candidato, userAgent, ct);
        }

        var entity = new Candidato
        {
            Id = Guid.NewGuid(),
            Nome = (request.Nome ?? string.Empty).Trim(),
            Email = email,
            Fone = NormalizeRequired(request.Fone),
            Cidade = NormalizeRequired(request.Cidade),
            Uf = NormalizeUfRequired(request.Uf),
            Fonte = CandidateOrigin.Site,
            Status = CandidateStatus.Novo,
            VagaId = null,
            PortalAccessKey = GeneratePortalAccessKey()
        };

        entity.PortalPasswordHash = _passwordHasher.HashPassword(entity, request.Password);

        _db.Candidatos.Add(entity);
        await _db.SaveChangesAsync(ct);
        await NotifyPortalRegisterAsync(entity, ct);

        return await CreateSessionAsync(entity, userAgent, ct);
    }

    public async Task<PortalCandidateSessionResponse?> RefreshAsync(PortalCandidateRefreshRequest request, string? userAgent, CancellationToken ct)
    {
        var now = _timeProvider.GetUtcNow();
        var tokenHash = HashRefreshToken(request.RefreshToken);

        var session = await _db.Set<PortalCandidateSession>()
            .Include(x => x.Candidato)
            .FirstOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, ct);

        if (session is null || session.Candidato is null || session.RevokedAtUtc.HasValue || session.ExpiresAtUtc <= now)
        {
            return null;
        }

        session.RevokedAtUtc = now;
        session.LastUsedAtUtc = now;

        return await CreateSessionAsync(session.Candidato, userAgent ?? session.UserAgent, ct);
    }

    public async Task<PortalCandidateIdentityResponse?> GetCurrentAsync(Guid candidateId, CancellationToken ct)
    {
        var candidate = await _db.Candidatos
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == candidateId, ct);

        return candidate is null ? null : MapIdentity(candidate);
    }

    public async Task LogoutAsync(Guid candidateId, PortalCandidateLogoutRequest request, CancellationToken ct)
    {
        var sessions = _db.Set<PortalCandidateSession>()
            .Where(x => x.CandidatoId == candidateId && !x.RevokedAtUtc.HasValue);

        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var hash = HashRefreshToken(request.RefreshToken);
            sessions = sessions.Where(x => x.RefreshTokenHash == hash);
        }

        var items = await sessions.ToListAsync(ct);
        if (items.Count == 0)
            return;

        var now = _timeProvider.GetUtcNow();
        foreach (var item in items)
        {
            item.RevokedAtUtc = now;
            item.LastUsedAtUtc = now;
        }

        await _db.SaveChangesAsync(ct);
    }

    private static string NormalizeEmail(string? email)
        => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static string NormalizeUfRequired(string? uf)
        => (uf ?? string.Empty).Trim().ToUpperInvariant();

    private static string NormalizeRequired(string? value)
        => (value ?? string.Empty).Trim();

    private async Task<PortalCandidateSessionResponse> CreateSessionAsync(Candidato candidato, string? userAgent, CancellationToken ct)
    {
        var now = _timeProvider.GetUtcNow();
        var accessTokenExpiresAt = now.AddMinutes(_jwtOptions.AccessTokenExpirationMinutes);
        var refreshToken = GenerateRefreshToken();
        var refreshTokenExpiresAt = now.Add(RefreshTokenLifetime);

        var session = new PortalCandidateSession
        {
            Id = Guid.NewGuid(),
            CandidatoId = candidato.Id,
            RefreshTokenHash = HashRefreshToken(refreshToken),
            ExpiresAtUtc = refreshTokenExpiresAt,
            LastUsedAtUtc = now,
            UserAgent = NormalizeUserAgent(userAgent)
        };

        _db.Set<PortalCandidateSession>().Add(session);
        await _db.SaveChangesAsync(ct);

        return new PortalCandidateSessionResponse(
            AccessToken: CreateJwtToken(candidato, accessTokenExpiresAt),
            AccessTokenExpiresAtUtc: accessTokenExpiresAt,
            AccessTokenExpiresInSeconds: Math.Max(1, (int)(accessTokenExpiresAt - now).TotalSeconds),
            RefreshToken: refreshToken,
            RefreshTokenExpiresAtUtc: refreshTokenExpiresAt,
            Candidate: MapIdentity(candidato));
    }

    private PortalCandidateIdentityResponse MapIdentity(Candidato candidato)
        => new(candidato.Id, candidato.Nome, candidato.Email, candidato.TenantId);

    private string CreateJwtToken(Candidato candidato, DateTimeOffset expiresAt)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, candidato.Id.ToString()),
            new(ClaimTypes.Email, candidato.Email ?? string.Empty),
            new(ClaimTypes.Name, candidato.Nome ?? string.Empty),
            new("tenant", candidato.TenantId),
            new(PortalCandidateClaimConstants.CandidateId, candidato.Id.ToString()),
            new(PortalCandidateClaimConstants.Scope, PortalCandidateClaimConstants.ScopeValue)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(48);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string HashRefreshToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private static string? NormalizeUserAgent(string? userAgent)
    {
        var trimmed = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent.Trim();
        if (trimmed is null)
            return null;

        return trimmed.Length <= 256 ? trimmed : trimmed[..256];
    }

    private static string GeneratePortalAccessKey()
    {
        var raw = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        return raw.TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private async Task NotifyPortalRegisterAsync(Candidato candidato, CancellationToken ct)
    {
        try
        {
            var tenantId = string.IsNullOrWhiteSpace(candidato.TenantId) ? _tenantContext.TenantId : candidato.TenantId;
            var parts = new List<string>
            {
                $"Nome: {candidato.Nome}",
                $"Email: {candidato.Email}"
            };

            if (!string.IsNullOrWhiteSpace(candidato.Fone))
                parts.Add($"Fone: {candidato.Fone}");
            if (!string.IsNullOrWhiteSpace(candidato.Cidade) || !string.IsNullOrWhiteSpace(candidato.Uf))
                parts.Add($"Cidade/UF: {candidato.Cidade} - {candidato.Uf}");

            var message = string.Join(" | ", parts);
            var request = new NotificationSendRequest(
                NotificationScope.Tenant,
                "Novo candidato cadastrado",
                message,
                "info",
                $"/Candidatos?open={candidato.Id}",
                tenantId,
                null);

            await _notificationPublisher.PublishToTenantsAsync(new[] { tenantId }, request, ct);
        }
        catch
        {
            // best-effort
        }
    }
}
