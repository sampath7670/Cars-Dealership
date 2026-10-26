FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY server/frontend/package*.json ./
RUN npm ci
COPY server/frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim AS api-deps
WORKDIR /app/services/dealers
COPY services/dealers/package*.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=api-deps /app/services/dealers/node_modules ./services/dealers/node_modules
COPY services/dealers/ ./services/dealers/
COPY server/seed/ ./server/seed/
COPY --from=frontend /build/dist ./server/frontend/dist
USER node
EXPOSE 3000
CMD ["node", "services/dealers/index.js"]
