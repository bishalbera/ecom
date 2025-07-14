# Multi-stage build for self-contained microservice
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for better security
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

# Copy package.json for service info
COPY package.json ./

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Change ownership to non-root user
RUN chown -R nonroot:nonroot /app
USER nonroot

# Expose port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
