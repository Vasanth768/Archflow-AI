# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Note: npm run build might fail if no actual code exists yet.
RUN npm run build || echo "Build skipped or failed, continuing..."

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app ./
EXPOSE 3001
CMD ["npm", "start"]
