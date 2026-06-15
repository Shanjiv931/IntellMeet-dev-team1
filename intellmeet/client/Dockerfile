# ==========================================
# Stage 1: Build static assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package descriptors first to cache dependencies layers
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application source files
COPY . .

# Build Vite client production bundle
RUN npm run build

# ==========================================
# Stage 2: Serve compiled assets using Nginx
# ==========================================
FROM nginx:1.25-alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from build stage to Nginx public root
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration file for SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
