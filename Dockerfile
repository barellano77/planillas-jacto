# Imagen única que compila el frontend y sirve todo (frontend + API) con un
# solo proceso Node (server.ts). Pensada para Render, Railway, Fly.io, etc.

FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- imagen final, más liviana (sin devDependencies de build) ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server.ts ./
COPY src ./src

EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
