# Multi-stage build for self-contained microservice
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./

# Copy pnpm-lock.yaml (provided by the build context)
COPY pnpm-lock.yaml ./
# Copy only the specific packages this service needs
COPY packages/proto ./packages/proto
COPY packages/shared-dtos ./packages/shared-dtos
COPY packages/typescript-config ./packages/typescript-config

# Create workspace file
RUN echo 'packages:\n  - "."\n  - "packages/*"' > pnpm-workspace.yaml

# Update package.json to use local packages
RUN node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); const replaceDeps = (deps) => { if (!deps) return; Object.keys(deps).forEach(key => { if (deps[key] === 'workspace:*') { deps[key] = 'file:packages/' + key.replace('@repo/', ''); } }); }; replaceDeps(pkg.dependencies); replaceDeps(pkg.devDependencies); fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Update package dependencies in copied packages
RUN for pkg in packages/*/package.json; do \
  if [ -f "$$pkg" ]; then \
    node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('$$pkg', 'utf8')); const replaceDeps = (deps) => { if (!deps) return; Object.keys(deps).forEach(key => { if (deps[key] === 'workspace:*') { deps[key] = 'file:packages/' + key.replace('@repo/', ''); } }); }; replaceDeps(pkg.dependencies); replaceDeps(pkg.devDependencies); fs.writeFileSync('$$pkg', JSON.stringify(pkg, null, 2));"; \
  fi; \
done

# Install all dependencies
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

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

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Change ownership to non-root user
RUN chown -R nonroot:nonroot /app
USER nonroot

# Expose port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
