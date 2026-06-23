# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 8080
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy SQLite database and configurations
COPY --from=builder /app/db ./db

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
