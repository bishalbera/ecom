# Multi-stage build for self-contained microservice
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml ./ 2>/dev/null || true
COPY pnpm-workspace.yaml ./ 2>/dev/null || true

# Copy workspace packages if they exist
COPY packages/ ./packages/ 2>/dev/null || true

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (use direct nest build instead of turbo)
RUN pnpm run build

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

# Change ownership to non-root user
RUN chown -R nonroot:nonroot /app
USER nonroot

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
