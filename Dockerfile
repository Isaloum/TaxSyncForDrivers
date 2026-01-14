# Multi-stage build for production deployment
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 taxsync

# Copy dependencies from deps stage
COPY --from=deps --chown=taxsync:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=taxsync:nodejs . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Use non-root user
USER taxsync

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "email-server.js"]
