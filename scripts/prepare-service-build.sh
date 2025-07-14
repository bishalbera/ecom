#!/bin/bash

# Script to prepare a service directory for Docker build
# This copies all necessary files from the monorepo to the service directory
# Usage: ./prepare-service-build.sh <service-name>

SERVICE_NAME=$1
if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: $0 <service-name>"
    exit 1
fi

SERVICE_DIR="apps/$SERVICE_NAME"
if [ ! -d "$SERVICE_DIR" ]; then
    echo "Error: Service directory $SERVICE_DIR does not exist"
    exit 1
fi

echo "Preparing $SERVICE_NAME for Docker build..."

# Create a temporary build directory
BUILD_DIR="$SERVICE_DIR/.docker-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy service files
echo "Copying service files..."
cp -r "$SERVICE_DIR"/* "$BUILD_DIR"/ 2>/dev/null || true
cp -r "$SERVICE_DIR"/.[!.]* "$BUILD_DIR"/ 2>/dev/null || true

# For Node.js services, copy workspace dependencies
if [ -f "$SERVICE_DIR/package.json" ]; then
    echo "Copying workspace dependencies for Node.js service..."
    
    # Copy root package files
    cp package.json pnpm-lock.yaml "$BUILD_DIR/"
    
    # Copy workspace packages that this service depends on
    if [ -d "packages" ]; then
        mkdir -p "$BUILD_DIR/packages"
        cp -r packages/* "$BUILD_DIR/packages/"
    fi
    
    # Create a simplified pnpm-workspace.yaml for this service
    cat > "$BUILD_DIR/pnpm-workspace.yaml" << EOF
packages:
  - '.'
  - 'packages/*'
EOF

    # Update package.json to use local packages instead of workspace:*
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$BUILD_DIR/package.json', 'utf8'));
        
        // Replace workspace:* dependencies with file paths
        const replaceDeps = (deps) => {
            if (!deps) return;
            Object.keys(deps).forEach(key => {
                if (deps[key] === 'workspace:*') {
                    deps[key] = 'file:packages/' + key.replace('@repo/', '');
                }
            });
        };
        
        replaceDeps(pkg.dependencies);
        replaceDeps(pkg.devDependencies);
        
        fs.writeFileSync('$BUILD_DIR/package.json', JSON.stringify(pkg, null, 2));
    "
fi

echo "Build preparation complete for $SERVICE_NAME"
echo "Build context ready in: $BUILD_DIR"
