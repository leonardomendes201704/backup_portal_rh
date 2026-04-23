# ====== build ======
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restaura apenas o projeto web para nao depender de outros csproj da solution
COPY LioTecnica.Web/*.csproj LioTecnica.Web/
RUN dotnet restore ./LioTecnica.Web/LioTecnica.Web.csproj

# Copia tudo e publica
COPY . .
RUN dotnet publish LioTecnica.Web/LioTecnica.Web.csproj -c Release -o /out /p:UseAppHost=false

# ====== runtime ======
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out .

ENV ASPNETCORE_ENVIRONMENT=Production

CMD ["dotnet","LioTecnica.Web.dll"]
