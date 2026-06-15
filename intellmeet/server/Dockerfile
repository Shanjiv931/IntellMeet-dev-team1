# ==========================================
# Stage 1: Build Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies if any native modules need compilation
RUN apk add --no-cache python3 make g++

# Copy package descriptors first to cache layer dependencies
COPY package*.json ./

# Install all dependencies (including devDependencies for testing/building if needed)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Prune development dependencies to keep production image light
RUN npm prune --production

# ==========================================
# Stage 2: Minimal Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose standard cloud port
EXPOSE 8080

# Create application directory and configure ownership for standard node non-root user
RUN chown -R node:node /usr/src/app

# Copy production dependencies and files from build stage
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/package.json ./package.json
COPY --from=builder --chown=node:node /usr/src/app/src ./src

# Set non-root execution permissions for container security hardening
USER node

# Start the Express server
CMD ["npm", "start"]
