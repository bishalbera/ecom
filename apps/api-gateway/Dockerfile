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

# Change ownership to non-root user
RUN chown -R nonroot:nonroot /app
USER nonroot

# The NestJS app in this project listens on port 3000 by default.
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
