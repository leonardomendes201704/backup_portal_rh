# Portal RH

Portal RH is a recruiting and hiring platform composed of 3 main applications plus PostgreSQL:

- `RHPortal.Api`: ASP.NET Core API responsible for authentication, business rules, database access, migrations, seed, health checks, auditing, and integrations.
- `LioTecnica.Web`: ASP.NET Core MVC admin portal used by internal/admin users.
- `LioTecnica.PortalVagas.Web`: ASP.NET Core MVC candidate portal used by applicants and public job flows.

## Architecture

### 1. `RHPortal.Api`

Responsibilities:

- PostgreSQL access
- Entity Framework Core migrations
- initial seed
- JWT authentication
- multi-tenancy
- health endpoints
- public and admin endpoints
- SignalR and operational logging

Path:

- `RHPortal.Api/RHPortal.Api`

### 2. `LioTecnica.Web`

Responsibilities:

- admin login
- internal RH workflows
- management screens
- links into the candidate portal
- API consumption for admin use cases

Path:

- `LioTecnica.Web`

### 3. `LioTecnica.PortalVagas.Web`

Responsibilities:

- candidate login/register
- public jobs listing
- application flow
- candidate profile, documents, preferences, agenda, LGPD, notifications
- API consumption for candidate/public flows

Path:

- `LioTecnica.PortalVagas.Web`

## Tech stack

- .NET 9
- ASP.NET Core MVC
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL / Npgsql
- SignalR
- Bootstrap 5
- Docker / Docker Compose
- OpenAI API for resume parsing features

## Repository structure

```text
.
|-- RHPortal.Api/                # API solution and project
|-- LioTecnica.Web/              # admin portal
|-- LioTecnica.PortalVagas.Web/  # candidate portal
|-- docker-compose.yml           # local full stack
|-- docker-compose.server.yml    # Ubuntu/server full stack
|-- LOCAL_SETUP.md               # detailed local setup
|-- DEPLOY_UBUNTU.md             # detailed Ubuntu deploy
`-- LioTecnica.sln               # main solution
```

## How the 3 projects relate

- only `RHPortal.Api` talks directly to PostgreSQL
- `LioTecnica.Web` depends on the API
- `LioTecnica.PortalVagas.Web` depends on the API
- the 2 front-ends do not use database credentials directly

## Local setup

Detailed instructions:

- [LOCAL_SETUP.md](./LOCAL_SETUP.md)

Short version:

### Database

Configure the API connection string in:

- `RHPortal.Api/RHPortal.Api/appsettings.Development.json`
- or `ConnectionStrings__Default`

Example:

```text
Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=SuaSenhaForte123!
```

### Run the API

```powershell
cd RHPortal.Api\RHPortal.Api
dotnet restore
dotnet run
```

Expected URL:

- `https://localhost:7073/swagger`

### Run the admin portal

```powershell
cd LioTecnica.Web
dotnet restore
dotnet run
```

Expected URL:

- `https://localhost:7091`

### Run the candidate portal

```powershell
cd LioTecnica.PortalVagas.Web
dotnet restore
dotnet run
```

Expected URL:

- `https://localhost:7092/acesso?tenantId=liotecnica`

## First run on a new machine

Recommended flow:

1. Install PostgreSQL.
2. Create the database.
3. Configure `ConnectionStrings:Default`.
4. Run the API to apply migrations automatically.
5. Temporarily enable the full seed if you need the initial admin user.
6. Run the API once to create the seeded users.
7. Turn seed back off.

Seed example:

```json
"Seed": {
  "Enabled": true
}
```

## Seeded admin credentials

Default users:

- `admin@liotecnica.com.br`
- `admin@dev.local`

Default password:

```text
ChangeThisPassword123!
```

## Visual Studio multiple startup

The solution is configured to start the 3 apps together.

Recommended profile:

- `API + ADMIN + PORTAL HTTPS`

Expected profiles:

- API: `https`
- Admin: `https`
- Portal: `https`

Relevant files:

- `LioTecnica.slnLaunch.user`
- `RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj.user`
- `LioTecnica.Web/LioTecnica.Web.csproj.user`
- `LioTecnica.PortalVagas.Web/LioTecnica.PortalVagas.Web.csproj.user`

## Health and startup behavior

Both front-ends depend on the API health.

### Admin portal

- should not crash if the API is still starting
- menu/auth requests degrade gracefully while the API is unavailable

### Candidate portal

- retries job loading automatically when the API is unavailable
- waits a few seconds between retries
- only shows a friendly unavailable state after retries fail

## Docker

The repository includes:

- `docker-compose.yml` for local/full stack
- `docker-compose.server.yml` for Ubuntu/server deployment

Local stack includes:

- PostgreSQL
- API
- admin portal
- candidate portal
- Dozzle

Start locally:

```powershell
docker compose up --build
```

Default local ports:

- admin: `http://localhost:8080`
- candidate portal: `http://localhost:8081/acesso?tenantId=liotecnica`
- api: `http://localhost:7073`
- dozzle: `http://localhost:9999`

## Ubuntu / server deployment

Detailed instructions:

- [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md)

Core files:

- `docker-compose.server.yml`
- `.env.server`
- `.env.server.example`

Main command:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

Typical public mapping:

- admin: `http://HOST:8081`
- portal: `http://HOST:8082/acesso?tenantId=liotecnica`
- api: `http://HOST:7073/swagger`

Note:

- actual ports are configurable in `.env.server`
- this matters because some servers already use `8080`

## Important configuration by project

### API

- `ConnectionStrings:Default`
- `Seed:*`
- `Jwt:*`
- `Cors:*`
- `InboxFolder:*`
- `OpenAI:*`
- `EmailConfig:*`

### Admin portal

- `Endpoints:RhApi`
- `Endpoints:PortalVagasWeb`
- `EntraId:*`
- `Ops:ResetKey`

### Candidate portal

- `Endpoints:RhApi`
- `Endpoints:RhApiPublic`
- `TransportSecurity:*`

## OpenAI

Features that depend on OpenAI require:

```powershell
$env:OPENAI_API_KEY="your-key"
```

Without it:

- the platform still runs
- only OpenAI-dependent features stay unavailable

## Operational notes

- the API applies migrations automatically on startup
- full seed should normally stay disabled after first bootstrap
- the 2 front-ends depend on the API, not on PostgreSQL directly
- build warnings may still exist in the API dependencies, but the solution builds and runs

## Internal references

- [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md)
- [docker-compose.yml](./docker-compose.yml)
- [docker-compose.server.yml](./docker-compose.server.yml)

---

# Portal RH - PT-BR

Portal RH é uma plataforma de recrutamento e seleção composta por 3 aplicações principais mais PostgreSQL:

- `RHPortal.Api`: API ASP.NET Core responsável por autenticação, regras de negócio, acesso ao banco, migrations, seed, health checks, auditoria e integrações.
- `LioTecnica.Web`: portal administrativo ASP.NET Core MVC usado pelos usuários internos/admin.
- `LioTecnica.PortalVagas.Web`: portal de vagas/candidato ASP.NET Core MVC usado pelos candidatos e fluxos públicos.

## Arquitetura

### 1. `RHPortal.Api`

Responsabilidades:

- acesso ao PostgreSQL
- migrations do Entity Framework Core
- seed inicial
- autenticação JWT
- multi-tenancy
- endpoints de health
- endpoints públicos e administrativos
- SignalR e logging operacional

Caminho:

- `RHPortal.Api/RHPortal.Api`

### 2. `LioTecnica.Web`

Responsabilidades:

- login administrativo
- fluxos internos de RH
- telas de gestão
- links para o portal de vagas
- consumo da API para casos administrativos

Caminho:

- `LioTecnica.Web`

### 3. `LioTecnica.PortalVagas.Web`

Responsabilidades:

- login e registro do candidato
- listagem pública de vagas
- candidatura
- perfil, documentos, preferências, agenda, LGPD e notificações do candidato
- consumo da API para fluxos públicos/candidato

Caminho:

- `LioTecnica.PortalVagas.Web`

## Stack

- .NET 9
- ASP.NET Core MVC
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL / Npgsql
- SignalR
- Bootstrap 5
- Docker / Docker Compose
- OpenAI API para recursos de parsing de currículo

## Estrutura do repositório

```text
.
|-- RHPortal.Api/                # solução e projeto da API
|-- LioTecnica.Web/              # portal admin
|-- LioTecnica.PortalVagas.Web/  # portal de vagas/candidato
|-- docker-compose.yml           # stack local completa
|-- docker-compose.server.yml    # stack Ubuntu/servidor
|-- LOCAL_SETUP.md               # setup local detalhado
|-- DEPLOY_UBUNTU.md             # deploy Ubuntu detalhado
`-- LioTecnica.sln               # solution principal
```

## Como os 3 projetos se relacionam

- apenas `RHPortal.Api` acessa PostgreSQL diretamente
- `LioTecnica.Web` depende da API
- `LioTecnica.PortalVagas.Web` depende da API
- os 2 fronts não usam credenciais de banco diretamente

## Setup local

Instruções detalhadas:

- [LOCAL_SETUP.md](./LOCAL_SETUP.md)

Resumo:

### Banco

Configure a connection string da API em:

- `RHPortal.Api/RHPortal.Api/appsettings.Development.json`
- ou `ConnectionStrings__Default`

Exemplo:

```text
Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=SuaSenhaForte123!
```

### Subir a API

```powershell
cd RHPortal.Api\RHPortal.Api
dotnet restore
dotnet run
```

URL esperada:

- `https://localhost:7073/swagger`

### Subir o portal admin

```powershell
cd LioTecnica.Web
dotnet restore
dotnet run
```

URL esperada:

- `https://localhost:7091`

### Subir o portal de vagas

```powershell
cd LioTecnica.PortalVagas.Web
dotnet restore
dotnet run
```

URL esperada:

- `https://localhost:7092/acesso?tenantId=liotecnica`

## Primeira execução em máquina nova

Fluxo recomendado:

1. Instalar PostgreSQL.
2. Criar o banco.
3. Configurar `ConnectionStrings:Default`.
4. Subir a API para aplicar migrations automaticamente.
5. Ligar temporariamente o seed completo se precisar do admin inicial.
6. Subir a API uma vez para criar os usuários seeded.
7. Desligar o seed novamente.

Exemplo:

```json
"Seed": {
  "Enabled": true
}
```

## Credenciais do admin seeded

Usuários padrão:

- `admin@liotecnica.com.br`
- `admin@dev.local`

Senha padrão:

```text
ChangeThisPassword123!
```

## Multiple startup no Visual Studio

A solution foi preparada para subir os 3 projetos juntos.

Profile recomendado:

- `API + ADMIN + PORTAL HTTPS`

Perfis esperados:

- API: `https`
- Admin: `https`
- Portal: `https`

Arquivos relevantes:

- `LioTecnica.slnLaunch.user`
- `RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj.user`
- `LioTecnica.Web/LioTecnica.Web.csproj.user`
- `LioTecnica.PortalVagas.Web/LioTecnica.PortalVagas.Web.csproj.user`

## Health e comportamento de startup

Os dois fronts dependem da saúde da API.

### Portal Admin

- não deve quebrar se a API ainda estiver subindo
- menu/autenticação degradam de forma controlada enquanto a API está indisponível

### Portal de Vagas

- tenta carregar as vagas novamente quando a API está indisponível
- espera alguns segundos entre tentativas
- só mostra uma indisponibilidade amigável depois das tentativas falharem

## Docker

O repositório inclui:

- `docker-compose.yml` para stack local/completa
- `docker-compose.server.yml` para Ubuntu/servidor

A stack local inclui:

- PostgreSQL
- API
- portal admin
- portal de vagas
- Dozzle

Subida local:

```powershell
docker compose up --build
```

Portas padrão locais:

- admin: `http://localhost:8080`
- portal de vagas: `http://localhost:8081/acesso?tenantId=liotecnica`
- api: `http://localhost:7073`
- dozzle: `http://localhost:9999`

## Deploy Ubuntu / servidor

Instruções detalhadas:

- [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md)

Arquivos principais:

- `docker-compose.server.yml`
- `.env.server`
- `.env.server.example`

Comando principal:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

Mapeamento público típico:

- admin: `http://HOST:8081`
- portal: `http://HOST:8082/acesso?tenantId=liotecnica`
- api: `http://HOST:7073/swagger`

Observação:

- as portas reais são configuráveis via `.env.server`
- isso é importante porque alguns servidores já usam a `8080`

## Configuração importante por projeto

### API

- `ConnectionStrings:Default`
- `Seed:*`
- `Jwt:*`
- `Cors:*`
- `InboxFolder:*`
- `OpenAI:*`
- `EmailConfig:*`

### Portal Admin

- `Endpoints:RhApi`
- `Endpoints:PortalVagasWeb`
- `EntraId:*`
- `Ops:ResetKey`

### Portal de Vagas

- `Endpoints:RhApi`
- `Endpoints:RhApiPublic`
- `TransportSecurity:*`

## OpenAI

Recursos que dependem de OpenAI exigem:

```powershell
$env:OPENAI_API_KEY="sua-chave"
```

Sem isso:

- a plataforma continua subindo
- apenas os recursos dependentes de OpenAI ficam indisponíveis

## Observações operacionais

- a API aplica migrations automaticamente no startup
- o seed completo normalmente deve ficar desligado após o bootstrap inicial
- os 2 fronts dependem da API, não do PostgreSQL diretamente
- ainda podem existir warnings de dependência na API, mas a solution compila e roda

## Referências internas

- [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md)
- [docker-compose.yml](./docker-compose.yml)
- [docker-compose.server.yml](./docker-compose.server.yml)
