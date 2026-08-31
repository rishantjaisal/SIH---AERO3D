# Multi-stage Dockerfile for Aero3D Intelligence Application
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Server Environment with Node.js & FFmpeg
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install --only=production

COPY --from=frontend-builder /app/dist ./dist
COPY server ./server
COPY public ./public
COPY scripts ./scripts

EXPOSE 3000 5000

ENV NODE_ENV=production
ENV PORT=5000
ENV PHOTOGRAMMETRY_ENGINE=demo

CMD ["node", "server/index.js"]
