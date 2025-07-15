# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy the entire monorepo source code
COPY . .

# Install dependencies for the user-service and its workspace dependencies
RUN pnpm install --filter=user-service...

# Build the user-service
RUN pnpm run build --filter=user-service

# Stage 2: Production image
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Create a non-root user for better security
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

# Copy the built application from the builder stage
COPY --from=builder /app/apps/user-service/dist ./dist

# Copy the Prisma schema
COPY --from=builder /app/apps/user-service/prisma ./prisma

# Copy the production node_modules
COPY --from=builder /app/apps/user-service/node_modules ./node_modules

# Change ownership to the non-root user
RUN chown -R nonroot:nonroot /app

# Switch to the non-root user
USER nonroot

# Expose the port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]