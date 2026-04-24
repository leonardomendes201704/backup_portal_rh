# Setup local

Este projeto possui 4 aplicações principais:

- `RHPortal.Api`: API ASP.NET Core + Entity Framework Core + PostgreSQL
- `LioTecnica.Web`: portal administrativo
- `LioTecnica.PortalVagas.Web`: portal de vagas/candidato
- `LioTecnica.PortalVagas.React`: portal de vagas em React + TypeScript + Vite

O banco é usado apenas pela API. Os dois fronts consomem a API por HTTP/HTTPS.

## Arquitetura local

### 1. API

Responsabilidade:

- autenticação
- regras de negócio
- acesso ao PostgreSQL
- migrations
- seed inicial
- health checks
- endpoints públicos e administrativos

Projeto:

- `RHPortal.Api/RHPortal.Api`

URL padrão local:

- `https://localhost:7073/swagger`

### 2. Portal Admin

Responsabilidade:

- operação administrativa do RH
- cadastros, gestão e acompanhamento interno
- login administrativo
- navegação para o portal público

Projeto:

- `LioTecnica.Web`

URL padrão local:

- `https://localhost:7091`

### 3. Portal de Vagas

Responsabilidade:

- experiência pública/candidato
- login e registro do candidato
- listagem de vagas
- candidatura
- perfil do candidato, documentos, agenda, preferências e afins

Projeto:

- `LioTecnica.PortalVagas.Web`

URL padrão local:

- `https://localhost:7092/acesso?tenantId=liotecnica`

### 4. Portal de Vagas React

Responsabilidade:

- SPA do candidato consumindo a API pública diretamente
- autenticação por token (`login`, `register`, `refresh`, `me`, `logout`)
- home pública de vagas + workspace autenticado do candidato

Projeto:

- `LioTecnica.PortalVagas.React`

URL padrão local:

- `http://localhost:7093/acesso?tenantId=liotecnica`

## Pré-requisitos

- .NET SDK 9 com runtime ASP.NET Core 9
- PostgreSQL local ativo
- porta PostgreSQL normalmente em `5432`

## Banco local

A API aplica migrations automaticamente ao subir.

Connection string usada no ambiente local atual:

```text
Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=SuaSenhaForte123!
```

Se você quiser usar outro usuário, senha, host ou nome de banco, ajuste:

- `RHPortal.Api/RHPortal.Api/appsettings.Development.json`
- ou a variável de ambiente `ConnectionStrings__Default`

Exemplo via PowerShell:

```powershell
$env:ConnectionStrings__Default="Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=NovaSenhaAqui"
```

Observações importantes:

- `LioTecnica.Web` não acessa PostgreSQL diretamente
- `LioTecnica.PortalVagas.Web` não acessa PostgreSQL diretamente
- apenas a API precisa da connection string do banco

## Primeira execução em máquina nova

Fluxo recomendado:

1. Instalar PostgreSQL.
2. Criar o banco que será usado pela API.
3. Configurar `ConnectionStrings:Default`.
4. Subir a API uma vez para aplicar migrations.
5. Se precisar de usuário admin inicial, ligar temporariamente o seed.
6. Subir a API novamente para criar os usuários seeded.
7. Voltar o seed para `false`.

Exemplo de seed temporário:

```json
"Seed": {
  "Enabled": true
}
```

## Credenciais do seed inicial

Quando o seed completo está habilitado, os admins padrão são:

- `admin@liotecnica.com.br`
- `admin@dev.local`

Senha padrão:

```text
ChangeThisPassword123!
```

Depois da primeira criação, o recomendado é manter:

```json
"Seed": {
  "Enabled": false
}
```

## Como subir cada projeto

### API

```powershell
cd RHPortal.Api\RHPortal.Api
dotnet restore
dotnet run
```

Resultado esperado:

- migrations aplicadas automaticamente
- Swagger disponível em `https://localhost:7073/swagger`

### Portal Admin

```powershell
cd LioTecnica.Web
dotnet restore
dotnet run
```

Resultado esperado:

- front administrativo em `https://localhost:7091`
- consumindo a API local

### Portal de Vagas

```powershell
cd LioTecnica.PortalVagas.Web
dotnet restore
dotnet run
```

Resultado esperado:

- portal público em `https://localhost:7092/acesso?tenantId=liotecnica`
- consumindo a API local

### Portal de Vagas React

```powershell
cd LioTecnica.PortalVagas.React
npm install
npm run dev
```

Resultado esperado:

- SPA pública em `http://localhost:7093/acesso?tenantId=liotecnica`
- consumindo a API local diretamente via bearer token

## Multiple startup no Visual Studio

O setup foi preparado para subir os 3 projetos juntos.

Profile da solution:

- `API + ADMIN + PORTAL HTTPS`

Perfis esperados:

- API: `https`
- Admin: `https`
- Portal: `https`

Arquivos relacionados:

- `LioTecnica.slnLaunch.user`
- `RHPortal.Api/RHPortal.Api/RHPortal.Api.csproj.user`
- `LioTecnica.Web/LioTecnica.Web.csproj.user`
- `LioTecnica.PortalVagas.Web/LioTecnica.PortalVagas.Web.csproj.user`

## Comportamento de health check

Os dois fronts consultam `/health` na API.

### Portal Admin

- não deve quebrar se a API ainda estiver subindo
- menu e autenticação degradam de forma controlada

### Portal de Vagas

- tenta carregar as vagas novamente quando a API está indisponível
- faz novas tentativas automáticas
- só mostra indisponibilidade amigável depois das tentativas falharem

## OpenAI

Recursos que dependem de OpenAI exigem:

```powershell
$env:OPENAI_API_KEY="sua-chave"
```

Sem isso:

- a aplicação geral continua funcionando
- recursos dependentes de parsing/IA não funcionarão

## Inbox local

A inbox local foi configurada para dentro do repositório:

```text
RHPortal.Api/RHPortal.Api/App_Data/Inbox
```

Isso evita dependência de caminhos absolutos externos.

## Resumo rápido

Em uma máquina nova, normalmente você só precisa:

1. configurar PostgreSQL
2. ajustar `ConnectionStrings:Default`
3. subir `RHPortal.Api`
4. subir `LioTecnica.Web`
5. subir `LioTecnica.PortalVagas.Web`

O banco é responsabilidade da API; os 2 fronts dependem da API, não do PostgreSQL diretamente.
