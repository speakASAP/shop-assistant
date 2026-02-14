FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl1.1-compat || apk add --no-cache openssl
ENV npm_config_update_notifier=false
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

FROM base AS build
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl1.1-compat wget || apk add --no-cache openssl wget
ENV NODE_ENV=production
ENV npm_config_update_notifier=false
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
COPY prisma ./prisma
COPY scripts/docker-entrypoint.sh /app/scripts/docker-entrypoint.sh
RUN chmod +x /app/scripts/docker-entrypoint.sh
EXPOSE 4500
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
