FROM node:22-bookworm-slim
WORKDIR /app/services/dealers
COPY services/dealers/package*.json ./
RUN npm ci --omit=dev
COPY services/dealers/index.js ./
COPY server/seed/ /app/server/seed/
USER node
EXPOSE 3030
CMD ["node", "index.js"]
