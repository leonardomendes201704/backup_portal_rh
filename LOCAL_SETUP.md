# Setup local

Este repositório não tinha um guia de ambiente local. O fluxo abaixo reflete a configuração encontrada na API, no `docker-compose.yml` e nos `launchSettings.json`.

## 1. Pré-requisitos

- .NET SDK com runtime ASP.NET Core 9
- PostgreSQL local ativo na porta `5432`

## 2. Banco local esperado pela API

A API está configurada para usar PostgreSQL e aplicar migrations automaticamente na inicialização.

Connection string local usada no projeto:

```text
Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=SuaSenhaForte123!
```

Se seu PostgreSQL estiver vazio, crie o usuário e o banco com algo equivalente a:

```sql
CREATE DATABASE bddev;
```

Se preferir usar outro usuário ou senha, ajuste a chave `ConnectionStrings:Default` em:

- `RHPortal.Api/RHPortal.Api/appsettings.Development.json`
- ou a variável de ambiente `ConnectionStrings__Default`

Exemplo de override por variável de ambiente no PowerShell:

```powershell
$env:ConnectionStrings__Default="Host=localhost;Port=5432;Database=bddev;Username=postgres;Password=NovaSenhaAqui"
```

Observação importante:

- o front `LioTecnica.Web` não usa credenciais de banco
- somente a API `RHPortal.Api` precisa da connection string do PostgreSQL
- em outra máquina, o ajuste principal quase sempre é só `ConnectionStrings:Default`

## 2.1 Primeira execução em outra máquina

Se outro agente ou desenvolvedor precisar configurar o projeto pela primeira vez em uma máquina nova, o fluxo recomendado é:

1. Instalar PostgreSQL localmente.
2. Criar o banco que a API vai usar.
3. Definir a connection string da API no `appsettings.Development.json` ou via variável de ambiente `ConnectionStrings__Default`.
4. Rodar a API uma vez para aplicar migrations.
5. Se precisar de usuário administrativo inicial, ligar temporariamente:

```json
"Seed": {
  "Enabled": true
}
```

6. Subir a API uma vez para criar os usuários seeded.
7. Voltar `Seed:Enabled` para `false` para evitar startup mais lento nas próximas execuções.

Credenciais padrão do admin seeded:

- `admin@liotecnica.com.br`
- `admin@dev.local`

Senha padrão:

```text
ChangeThisPassword123!
```

No ambiente configurado nesta máquina, os admins já foram criados uma vez e depois o seed voltou para `false`.

## 3. Rodar a API

Na pasta `RHPortal.Api/RHPortal.Api`:

```powershell
dotnet restore
dotnet run
```

Ao subir, a aplicação executa `Database.MigrateAsync()` e aplica todas as migrations automaticamente.

Swagger da API:

```text
https://localhost:7073/swagger
```

## 4. Seeds

Por padrão:

- as migrations sobem sempre
- os seeds completos estão desligados (`Seed:Enabled = false`)
- os menus e roles básicos continuam sendo garantidos

Se quiser popular dados de exemplo, altere na API:

```json
"Seed": {
  "Enabled": true
}
```

Senha padrão do admin seeded:

```text
ChangeThisPassword123!
```

## 5. Rodar o front web local

Na pasta `LioTecnica.Web`:

```powershell
dotnet restore
dotnet run
```

URL local do front:

```text
https://localhost:7091
```

O front já está apontando para a API local em `https://localhost:7073/`.

## 6. OpenAI

O recurso de parsing com OpenAI só funciona se você definir:

```powershell
$env:OPENAI_API_KEY="sua-chave"
```

Sem isso, o restante da aplicação pode subir, mas funcionalidades que dependem da OpenAI não vão funcionar.

## 7. Inbox local

A pasta monitorada da inbox foi configurada para:

```text
RHPortal.Api/RHPortal.Api/App_Data/Inbox
```

Isso evita dependência de um caminho absoluto fora do repositório.
