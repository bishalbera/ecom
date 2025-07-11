# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all monorepo dependencies.
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

WORKDIR /app/apps/user-service

# Generate Prisma client
RUN npx prisma generate

# Build the specific 'user-service' application using Turborepo
RUN pnpm turbo run build --filter=user-service

# Prune and install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Stage 2: Create the final, production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy the built application and dependencies
COPY --from=builder /app/apps/user-service/package.json .
COPY --from=builder /app/apps/user-service/dist ./dist
COPY --from=builder /app/apps/user-service/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Expose the port the app runs on
# EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]