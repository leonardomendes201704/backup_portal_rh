# Portal RH

Portal RH is a web application for recruiting and hiring workflow management composed of:

- `RHPortal.Api`: ASP.NET Core 9 API with Entity Framework Core, PostgreSQL, JWT authentication, multi-tenancy, SignalR, auditing, and operational logging.
- `LioTecnica.Web`: ASP.NET Core MVC front-end that consumes the API, with cookie authentication and optional Microsoft Entra ID integration.

The project covers jobs, candidates, managers, departments, business units, reports, agenda, inbox, notifications, email templates, and candidate portal flows.

## Stack

- .NET 9
- ASP.NET Core MVC + ASP.NET Core Web API
- Entity Framework Core + Npgsql
- PostgreSQL
- SignalR
- Bootstrap 5
- OpenAI API for resume parsing
- Docker / Docker Compose for containerized execution

## Repository structure

```text
.
|-- LioTecnica.Web/         # MVC web application
|-- RHPortal.Api/           # API solution and project
|-- docker-compose.yml      # full stack environment with db + api + web
|-- LOCAL_SETUP.md          # detailed local setup guide
`-- LioTecnica.sln          # main solution
```

## Main capabilities

- admin user authentication with JWT in the API and cookies in the web app
- optional Microsoft Entra ID authentication
- multi-tenancy through `tenant`
- CRUD for areas, departments, positions, managers, units, and jobs
- candidate portal with profile, documents, agenda, preferences, LGPD consent, and notifications
- PDF generation and resume HTML rendering
- email queue and email configuration
- API and database health checks
- auditing and operational logs stored in the database
- SignalR real-time updates for inbox, operational reset, and notifications

## Local execution

The detailed guide is in [LOCAL_SETUP.md](./LOCAL_SETUP.md). The short version is below.

### Prerequisites

- .NET SDK with ASP.NET Core 9 runtime
- local PostgreSQL

### Database

The API uses `ConnectionStrings:Default`.

Example used in this local environment:

```text
Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=SuaSenhaForte123!
```

You can define it in:

- `RHPortal.Api/RHPortal.Api/appsettings.Development.json`
- or through an environment variable:

```powershell
$env:ConnectionStrings__Default="Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=NovaSenhaAqui"
```

### Start the API

```powershell
cd RHPortal.Api\RHPortal.Api
dotnet restore
dotnet run
```

Expected URL:

- `https://localhost:7073/swagger`

### Start the web app

```powershell
cd LioTecnica.Web
dotnet restore
dotnet run
```

Expected URL:

- `https://localhost:7091`

## First run on a new machine

Recommended flow:

1. Install PostgreSQL.
2. Create the database that will be used by the API.
3. Adjust `ConnectionStrings:Default`.
4. Run the API so it applies migrations automatically.
5. If you need the initial admin user, temporarily enable:

```json
"Seed": {
  "Enabled": true
}
```

6. Run the API once so it creates the seeded users.
7. Set `Seed:Enabled` back to `false` to avoid slower startup.

## Seeded credentials

When full seed is enabled, the default admin users are:

- `admin@liotecnica.com.br`
- `admin@dev.local`

Default password:

```text
ChangeThisPassword123!
```

## Docker

The repository already includes `docker-compose.yml` with:

- PostgreSQL
- API
- web app
- Dozzle for logs

To start the environment:

```powershell
docker compose up --build
```

Default services:

- web: `http://localhost:8080`
- api: `http://localhost:7073`
- dozzle: `http://localhost:9999`

Note:

- `docker-compose.yml` uses its own database credentials for the containerized environment, independent from the local non-Docker setup

## Server deployment

For Ubuntu server deployment, use:

- `docker-compose.server.yml`
- `.env.server`
- [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md)

### First publish

1. Copy the repository to the server, for example to `/opt/portal_rh`.
2. Create `.env.server` from `.env.server.example`.
3. Fill the required secrets and public URLs.
4. Start the stack:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

5. Confirm the containers are healthy:

```bash
docker compose --env-file .env.server -f docker-compose.server.yml ps
```

### Seed control

- First start: set `SEED_ENABLED=true`
- After the initial data is created: change it to `SEED_ENABLED=false`

To apply the change:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d api
```

### Updating the server after new code is pushed

If the repository already exists on the server:

```bash
cd /opt/portal_rh
git pull
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

If you changed only environment variables in `.env.server`:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d
```

### Useful checks

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml ps
docker compose --env-file .env.server -f docker-compose.server.yml logs -f api
docker compose --env-file .env.server -f docker-compose.server.yml logs -f web
```

## Health check and login screen behavior

The web app calls `/api/health` to verify API and database availability.

On the login screen:

- API and DB appear with visual status indicators
- while the API is not ready, the front-end retries in short intervals
- login fields stay disabled until both API and database are healthy

This helps a lot when both projects are started together through Visual Studio.

## Visual Studio configuration

The project was adjusted to work well with multiple startup:

- solution profile: `API + WEB HTTPS`
- API using `https` profile
- Web using `https` profile

Relevant files:

- `LioTecnica.slnLaunch.user`
- `RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj.user`
- `LioTecnica.Web/LioTecnica.Web.csproj.user`

## Important configuration

### API

- `ConnectionStrings:Default`: PostgreSQL connection
- `Seed:*`: initial seed control
- `Jwt:*`: JWT signing configuration
- `Cors:WebOrigin`: allowed front-end origin
- `InboxFolder:*`: monitored inbox folder
- `OpenAI:*`: resume parsing configuration
- `EmailConfig:*`: email encryption and configuration

### Web

- `Endpoints:RhApi`: API base URL
- `EntraId:*`: optional Microsoft login
- `Ops:ResetKey`: key used for operational reset

## OpenAI

OpenAI-based parsing features require an API key:

```powershell
$env:OPENAI_API_KEY="sua-chave"
```

Without it, the rest of the application still works, but OpenAI-dependent features will not.

## Operational notes

- the API applies migrations automatically on startup
- essential menu and role seeds are still ensured even when the full seed is disabled
- the project has background watchers and workers for inbox, email, logging, and notifications
- there are dependency warnings during build, but the project compiles and runs locally

## Internal references

- detailed local guide: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- compose environment: [docker-compose.yml](./docker-compose.yml)
- API startup: [RHPortal.Api/RHPortal.Api/Program.cs](./RHPortal.Api/RHPortal.Api/Program.cs)
- Web startup: [LioTecnica.Web/Program.cs](./LioTecnica.Web/Program.cs)

---

# Portal RH - PT-BR

Portal RH e uma aplicacao web para recrutamento e gestao de processos seletivos composta por:

- `RHPortal.Api`: API ASP.NET Core 9 com Entity Framework Core, PostgreSQL, autenticacao JWT, multi-tenancy, SignalR, auditoria e logging operacional.
- `LioTecnica.Web`: front-end ASP.NET Core MVC que consome a API, com autenticacao por cookie e integracao opcional com Microsoft Entra ID.

O projeto cobre fluxos de vagas, candidatos, gestores, departamentos, unidades, relatorios, agenda, inbox, notificacoes, templates de email e portal do candidato.

## Stack - PT-BR

- .NET 9
- ASP.NET Core MVC + ASP.NET Core Web API
- Entity Framework Core + Npgsql
- PostgreSQL
- SignalR
- Bootstrap 5
- OpenAI API para parsing de curriculos
- Docker / Docker Compose para execucao conteinerizada

## Estrutura do repositorio

```text
.
|-- LioTecnica.Web/         # aplicacao web MVC
|-- RHPortal.Api/           # solucao e projeto da API
|-- docker-compose.yml      # ambiente completo com db + api + web
|-- LOCAL_SETUP.md          # guia detalhado de configuracao local
`-- LioTecnica.sln          # solution principal
```

## Principais capacidades

- autenticacao de usuarios administrativos com JWT na API e cookies no front
- autenticacao opcional via Microsoft Entra ID
- multi-tenancy por `tenant`
- CRUD de areas, departamentos, cargos, gestores, unidades e vagas
- portal do candidato com perfil, documentos, agenda, preferencias, consentimento LGPD e notificacoes
- geracao de PDFs e renderizacao HTML de curriculo
- fila e configuracao de emails
- health check de API e banco
- auditoria e logs operacionais persistidos em banco
- atualizacoes em tempo real com SignalR para inbox, reset operacional e notificacoes

## Execucao local

O guia detalhado esta em [LOCAL_SETUP.md](./LOCAL_SETUP.md). O resumo esta abaixo.

### Pre-requisitos

- .NET SDK com runtime ASP.NET Core 9
- PostgreSQL local

### Banco de dados

A API usa `ConnectionStrings:Default`.

Exemplo usado neste ambiente local:

```text
Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=SuaSenhaForte123!
```

Voce pode definir isso em:

- `RHPortal.Api/RHPortal.Api/appsettings.Development.json`
- ou via variavel de ambiente:

```powershell
$env:ConnectionStrings__Default="Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=NovaSenhaAqui"
```

### Subir a API

```powershell
cd RHPortal.Api\RHPortal.Api
dotnet restore
dotnet run
```

URL esperada:

- `https://localhost:7073/swagger`

### Subir o front-end

```powershell
cd LioTecnica.Web
dotnet restore
dotnet run
```

URL esperada:

- `https://localhost:7091`

## Primeira execucao em uma maquina nova

Fluxo recomendado:

1. Instalar o PostgreSQL.
2. Criar o banco que sera usado pela API.
3. Ajustar `ConnectionStrings:Default`.
4. Rodar a API para aplicar as migrations automaticamente.
5. Se precisar criar o usuario administrativo inicial, habilitar temporariamente:

```json
"Seed": {
  "Enabled": true
}
```

6. Rodar a API uma vez para gerar os usuarios seeded.
7. Voltar `Seed:Enabled` para `false` para evitar startup mais lento.

## Credenciais do seed

Quando o seed completo esta habilitado, os usuarios admin padrao sao:

- `admin@liotecnica.com.br`
- `admin@dev.local`

Senha padrao:

```text
ChangeThisPassword123!
```

## Docker - PT-BR

O repositorio ja inclui `docker-compose.yml` com:

- PostgreSQL
- API
- front-end web
- Dozzle para logs

Para subir o ambiente:

```powershell
docker compose up --build
```

Servicos padrao:

- web: `http://localhost:8080`
- api: `http://localhost:7073`
- dozzle: `http://localhost:9999`

Observacao:

- o `docker-compose.yml` usa credenciais proprias para o banco do ambiente em container, independentes do setup local fora do Docker

## Publicacao no servidor

Para publicacao em servidor Ubuntu, use:

- `docker-compose.server.yml`
- `.env.server`
- [DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md)

### Primeira publicacao

1. Copie o repositorio para o servidor, por exemplo em `/opt/portal_rh`.
2. Crie o `.env.server` a partir de `.env.server.example`.
3. Preencha os segredos obrigatorios e as URLs publicas.
4. Suba a stack:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

5. Confirme que os containers ficaram saudaveis:

```bash
docker compose --env-file .env.server -f docker-compose.server.yml ps
```

### Controle do seed

- Primeira subida: `SEED_ENABLED=true`
- Depois que os dados iniciais forem criados: altere para `SEED_ENABLED=false`

Para aplicar a mudanca:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d api
```

### Como atualizar o servidor depois de subir novas mudancas

Se o repositorio ja estiver no servidor:

```bash
cd /opt/portal_rh
git pull
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

Se voce mudou apenas variaveis no `.env.server`:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d
```

### Comandos uteis

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml ps
docker compose --env-file .env.server -f docker-compose.server.yml logs -f api
docker compose --env-file .env.server -f docker-compose.server.yml logs -f web
```

## Health check e comportamento da tela de login

O front chama `/api/health` para verificar a disponibilidade da API e do banco.

Na tela de login:

- API e DB aparecem com indicadores visuais de status
- enquanto a API ainda nao esta pronta, o front-end tenta novamente em intervalos curtos
- os campos de login permanecem desabilitados ate API e banco ficarem saudaveis

Isso ajuda bastante quando os dois projetos sao iniciados juntos pelo Visual Studio.

## Configuracao do Visual Studio

O projeto foi ajustado para funcionar bem com multiple startup:

- profile da solution: `API + WEB HTTPS`
- API usando o profile `https`
- Web usando o profile `https`

Arquivos relevantes:

- `LioTecnica.slnLaunch.user`
- `RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj.user`
- `LioTecnica.Web/LioTecnica.Web.csproj.user`

## Configuracoes importantes

### API

- `ConnectionStrings:Default`: conexao com PostgreSQL
- `Seed:*`: controle do seed inicial
- `Jwt:*`: configuracao de assinatura JWT
- `Cors:WebOrigin`: origem permitida para o front-end
- `InboxFolder:*`: pasta monitorada da inbox
- `OpenAI:*`: configuracao do parser de curriculos
- `EmailConfig:*`: criptografia e configuracao de email

### Web

- `Endpoints:RhApi`: URL base da API
- `EntraId:*`: login Microsoft opcional
- `Ops:ResetKey`: chave usada no reset operacional

## OpenAI - PT-BR

Os recursos de parsing com OpenAI exigem uma chave de API:

```powershell
$env:OPENAI_API_KEY="sua-chave"
```

Sem isso, o restante da aplicacao continua funcionando, mas as funcionalidades que dependem de OpenAI nao.

## Observacoes operacionais

- a API aplica migrations automaticamente no startup
- seeds essenciais de menu e role continuam garantidos mesmo com o seed completo desligado
- o projeto possui watchers e workers em background para inbox, email, logging e notificacoes
- existem warnings de dependencias durante o build, mas o projeto compila e roda localmente

## Referencias internas

- guia local detalhado: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- ambiente compose: [docker-compose.yml](./docker-compose.yml)
- startup da API: [RHPortal.Api/RHPortal.Api/Program.cs](./RHPortal.Api/RHPortal.Api/Program.cs)
- startup do front-end: [LioTecnica.Web/Program.cs](./LioTecnica.Web/Program.cs)
