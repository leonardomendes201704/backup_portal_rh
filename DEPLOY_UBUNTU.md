# Deploy Ubuntu com Docker Compose

Este guia publica a stack completa em Ubuntu com 3 aplicações:

- `RHPortal.Api`
- `LioTecnica.Web` (portal admin)
- `LioTecnica.PortalVagas.Web` (portal de vagas)

Mais:

- PostgreSQL

## Arquitetura de deploy

### API

Serviço:

- `api`

Responsabilidade:

- regras de negócio
- acesso ao PostgreSQL
- migrations
- seed
- health checks

### Portal Admin

Serviço:

- `web`

Responsabilidade:

- operação administrativa
- login administrativo
- consumo da API
- links públicos para o portal de vagas

### Portal de Vagas

Serviço:

- `portal`

Responsabilidade:

- experiência pública/candidato
- acesso do candidato
- listagem e candidatura em vagas
- consumo da API

### Banco

Serviço:

- `db`

Responsabilidade:

- persistência PostgreSQL

## Arquivos usados

- `docker-compose.server.yml`
- `.env.server`
- `.env.server.example`

## 1. Preparar o servidor

Validar Docker:

```bash
docker --version
docker compose version
```

Preparar diretório:

```bash
sudo mkdir -p /opt/portal_rh
sudo chown -R $USER:$USER /opt/portal_rh
```

## 2. Copiar os arquivos

Copie o repositório ou os arquivos publicados para:

```text
/opt/portal_rh
```

Depois crie:

```bash
cp .env.server.example .env.server
```

## 3. Ajustar variáveis do servidor

Preencha pelo menos:

- `POSTGRES_PASSWORD`
- `JWT_SIGNING_KEY`
- `OPS_RESET_KEY`
- `EMAIL_ENCRYPTION_KEY`
- `WEB_PUBLIC_ORIGIN`
- `WEB_PUBLIC_PORT`
- `PORTAL_PUBLIC_ORIGIN`
- `PORTAL_PUBLIC_PORT`
- `PORTAL_PUBLIC_URL`
- `API_PUBLIC_URL`
- `API_PUBLIC_PORT`
- `SEED_ADMIN_PASSWORD`

Se não for usar OpenAI agora:

- deixe `OPENAI_API_KEY` vazio

## 4. Publicar a stack

Dentro de `/opt/portal_rh`:

```bash
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

## 5. Verificar saúde

```bash
docker compose --env-file .env.server -f docker-compose.server.yml ps
docker compose --env-file .env.server -f docker-compose.server.yml logs -f api
docker compose --env-file .env.server -f docker-compose.server.yml logs -f web
docker compose --env-file .env.server -f docker-compose.server.yml logs -f portal
```

## 6. Seed inicial

Controle principal:

- `SEED_ENABLED=true` na primeira subida
- `SEED_ENABLED=false` depois da carga inicial

Fluxo recomendado:

1. subir com `SEED_ENABLED=true`
2. validar criação dos usuários iniciais
3. alterar para `SEED_ENABLED=false`
4. aplicar novamente:

```bash
docker compose --env-file .env.server -f docker-compose.server.yml up -d
```

## 7. URLs públicas

Exemplo de mapeamento:

- Admin: `http://SEU_HOST:8081`
- Portal de vagas: `http://SEU_HOST:8082/acesso?tenantId=liotecnica`
- API/Swagger: `http://SEU_HOST:7073/swagger`

Observação:

- as portas reais dependem do seu `.env.server`
- em alguns servidores a `8080` pode já estar ocupada
- por isso os valores de `WEB_PUBLIC_PORT` e `PORTAL_PUBLIC_PORT` devem ser tratados como configuráveis

## 8. Atualizar depois de novas mudanças

Se o projeto estiver como clone git no servidor:

```bash
cd /opt/portal_rh
git pull
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

Se você publicar por pacote/artefato:

1. copiar os arquivos novos para `/opt/portal_rh`
2. preservar o `.env.server`
3. rodar:

```bash
cd /opt/portal_rh
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

## 9. Logs úteis

```bash
docker compose --env-file .env.server -f docker-compose.server.yml logs -f api
docker compose --env-file .env.server -f docker-compose.server.yml logs -f web
docker compose --env-file .env.server -f docker-compose.server.yml logs -f portal
docker compose --env-file .env.server -f docker-compose.server.yml logs -f db
```

## 10. Observações importantes

- o modo atual foi preparado para HTTP interno, facilitando bootstrap em rede privada
- `UseHttpsRedirection`, `HSTS` e cookies seguros ficam desligados por padrão no compose de servidor
- quando houver reverse proxy com HTTPS, vale reativar:
  - `WEB_USE_HTTPS_REDIRECTION=true`
  - `WEB_USE_HSTS=true`
  - `WEB_SECURE_COOKIES=true`
  - `PORTAL_USE_HTTPS_REDIRECTION=true`
  - `PORTAL_USE_HSTS=true`
  - `PORTAL_SECURE_COOKIES=true`
  - `API_USE_HTTPS_REDIRECTION=true`

## 11. Resumo operacional

Em produção/servidor, pense sempre assim:

1. `db` guarda os dados
2. `api` concentra banco, regras, migration e seed
3. `web` é o portal administrativo
4. `portal` é o portal público do candidato

Os dois fronts dependem da API; a API depende do PostgreSQL.
