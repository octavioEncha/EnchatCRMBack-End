FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (production only)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and app files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Expose the port the app listens on
EXPOSE 4000

# Start the server
CMD ["node", "src/server.js"]
