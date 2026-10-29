# Multi-stage Dockerfile for Aero3D Intelligence Application
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
# postinstall runs scripts/generate-demo-glb.js, so scripts/ must exist before npm install
COPY scripts ./scripts
COPY public ./public
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server Environment with Node.js & FFmpeg
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg

COPY package*.json ./
COPY scripts ./scripts
COPY public ./public
RUN npm ci --omit=dev

COPY --from=frontend-builder /app/dist ./dist
COPY server ./server

RUN mkdir -p storage server/uploads && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=5000
ENV PHOTOGRAMMETRY_ENGINE=demo

EXPOSE 5000
USER node

CMD ["node", "server/index.js"]
