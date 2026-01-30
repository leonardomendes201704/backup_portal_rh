namespace RhPortal.Api.Application.Portal;

public sealed class PortalJobMatchOptions
{
    public bool Enabled { get; set; } = true;
    public int MaxVagas { get; set; } = 50;
    public bool IncludeReasons { get; set; } = true;
    public bool CacheEnabled { get; set; } = true;
    public int CacheMinutes { get; set; } = 10;
    public int TimeoutSeconds { get; set; } = 60;
}
