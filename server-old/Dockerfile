FROM node:20-alpine

WORKDIR /app

# Copy descriptors and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend code
COPY . .

# Expose API port
EXPOSE 8080

CMD ["node", "server.js"]
