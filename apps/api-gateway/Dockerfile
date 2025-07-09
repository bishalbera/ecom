
# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all monorepo dependencies. This leverages the Docker cache.
RUN pnpm install --frozen-lockfile

# Copy the rest of the monorepo source code
COPY . .

# Build the specific 'api-gateway' application using Turborepo
# This leverages Turborepo's caching and dependency graph analysis.
RUN pnpm turbo run build --filter=api-gateway

# After the build, prune the monorepo to only include the files
# and dependencies required for the 'api-gateway' service.
RUN pnpm deploy --filter=api-gateway ./deploy


# Stage 2: Create the final, lean production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for better security
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot

# Copy the pruned application files from the builder stage
COPY --from=builder /app/deploy .

# The NestJS app in this project listens on port 3000 by default.
EXPOSE 3000

# Start the application
CMD ["node", "apps/api-gateway/dist/main.js"]
