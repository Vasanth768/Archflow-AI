# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build || echo "Build skipped or failed, continuing..."

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app ./
EXPOSE 5001
CMD ["npm", "run", "start:prod"]
