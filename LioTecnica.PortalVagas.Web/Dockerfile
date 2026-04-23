# ====== build ======
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY LioTecnica.PortalVagas.Web/LioTecnica.PortalVagas.Web.csproj LioTecnica.PortalVagas.Web/
RUN dotnet restore ./LioTecnica.PortalVagas.Web/LioTecnica.PortalVagas.Web.csproj

COPY . .
RUN dotnet publish LioTecnica.PortalVagas.Web/LioTecnica.PortalVagas.Web.csproj -c Release -o /out /p:UseAppHost=false

# ====== runtime ======
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out .

ENV ASPNETCORE_ENVIRONMENT=Production

CMD ["dotnet","LioTecnica.PortalVagas.Web.dll"]
