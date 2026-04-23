# Deploy Ubuntu com Docker Compose

Este guia sobe a stack completa em um servidor Linux Ubuntu usando:

- PostgreSQL
- `RHPortal.Api`
- `LioTecnica.Web` (portal admin)
- `LioTecnica.PortalVagas.Web` (portal do candidato)

Com seed inicial habilitado na primeira subida.

## Arquivos usados

- `docker-compose.server.yml`
- `.env.server`

## 1. Preparar o servidor

No Ubuntu, confirme que Docker e Docker Compose estao disponiveis:

```bash
docker --version
docker compose version
```

Crie a pasta de deploy:

```bash
sudo mkdir -p /opt/portal_rh
sudo chown -R $USER:$USER /opt/portal_rh
```

## 2. Copiar os arquivos

Copie o repositorio para o servidor e, em seguida, crie o arquivo `.env.server` baseado em `.env.server.example`.

```bash
cp .env.server.example .env.server
```

## 3. Ajustar variaveis do servidor

Preencha pelo menos:

- `POSTGRES_PASSWORD`
- `JWT_SIGNING_KEY`
- `OPS_RESET_KEY`
- `EMAIL_ENCRYPTION_KEY`
- `WEB_PUBLIC_ORIGIN`
- `PORTAL_PUBLIC_ORIGIN`
- `API_PUBLIC_URL`
- `SEED_ADMIN_PASSWORD`

Se nao quiser OpenAI no servidor neste momento, pode deixar `OPENAI_API_KEY` vazio.

## 4. Subir a stack

Dentro da pasta do projeto:

```bash
docker compose --env-file .env.server -f docker-compose.server.yml up -d --build
```

## 5. Verificar status

```bash
docker compose --env-file .env.server -f docker-compose.server.yml ps
docker compose --env-file .env.server -f docker-compose.server.yml logs -f api
docker compose --env-file .env.server -f docker-compose.server.yml logs -f web
docker compose --env-file .env.server -f docker-compose.server.yml logs -f portal
```

## 6. Seed inicial

O compose de servidor sobe com:

- `Seed__Enabled=true`

Isso cria os dados iniciais e os usuarios administrativos conforme a configuracao do projeto.

Depois da primeira subida, o recomendado e:

1. editar `.env.server`
2. mudar `SEED_ENABLED=true` para `SEED_ENABLED=false`
3. recriar os containers:

```bash
docker compose --env-file .env.server -f docker-compose.server.yml up -d
```

## 7. Portas padrao

- Web admin: `8080`
- Portal vagas: `8081`
- API: `7073`

Exemplo:

- `http://10.0.0.80:8080`
- `http://10.0.0.80:8081/acesso?tenantId=liotecnica`
- `http://10.0.0.80:7073/swagger`

## 8. Observacoes importantes

- Neste modo, a stack sobe em HTTP para simplificar o bootstrap em servidor interno.
- Os cookies seguros e o redirecionamento HTTPS ficam desligados por padrao no compose de servidor.
- Se depois voce colocar Nginx, Caddy ou Traefik com HTTPS na frente, vale a pena religar:
  - `WEB_USE_HTTPS_REDIRECTION=true`
  - `WEB_USE_HSTS=true`
  - `WEB_SECURE_COOKIES=true`
  - `PORTAL_USE_HTTPS_REDIRECTION=true`
  - `PORTAL_USE_HSTS=true`
  - `PORTAL_SECURE_COOKIES=true`
  - `API_USE_HTTPS_REDIRECTION=true`
