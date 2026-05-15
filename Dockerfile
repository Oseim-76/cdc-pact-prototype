FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/producer/ ./src/producer/
COPY src/shared/ ./src/shared/
RUN npm install -g typescript
RUN npx tsc --outDir dist

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/producer/server.js"]
