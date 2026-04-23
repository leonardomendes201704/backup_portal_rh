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
