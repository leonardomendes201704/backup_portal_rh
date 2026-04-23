# ====== build ======
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restaura apenas o projeto da API (evita depender do Web)
COPY RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj RHPortal.Api/RHPortal.Api/
RUN dotnet restore RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj

# Copia tudo e publica
COPY . .
RUN dotnet publish RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj -c Release -o /out /p:UseAppHost=false

# ====== runtime ======
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

CMD ["dotnet","RHPortal.Api.dll"]
