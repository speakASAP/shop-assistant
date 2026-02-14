# Shop Assistant Deployment

1. Clone repo (or ensure folder name is `shop-assistant` on server).
2. Copy `.env.example` to `.env` and set all values (database, LOGGING_SERVICE_URL, AUTH_SERVICE_URL, AI_SERVICE_URL, DOMAIN, PORT, PORT_GREEN). Search uses ai-microservice; no SEARCH_API_* in shop-assistant.
3. Create database: `CREATE DATABASE shop_assistant;` on shared PostgreSQL (database-server).
4. From project root: `./scripts/deploy.sh`.
5. Deploy script validates `docker-compose.blue.yml` and `docker-compose.green.yml`, then runs `nginx-microservice/scripts/blue-green/deploy-smart.sh shop-assistant`.
6. Nginx config and service registry are generated under nginx-microservice. Access via `https://<DOMAIN>` (e.g. `https://shop-assistant.statex.cz`).

## Dependencies

Shop-assistant depends on **ai-microservice**, **auth-microservice**, **database-server** (PostgreSQL), and **logging-microservice**. Ensure they are available at the URLs configured in `.env`. See README “Required integrations” and [INTEGRATION.md](INTEGRATION.md).

## Production rules

- Do not modify database-server, auth-microservice, nginx-microservice, logging-microservice.
- All settings in shop-assistant codebase; production nginx is regenerated on deploy.
