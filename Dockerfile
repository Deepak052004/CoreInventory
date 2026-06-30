# ─── Stage 1: Build Frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source code and build it
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production Server ─────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy backend package files and install production dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

# Copy the backend source code
COPY backend/ ./

# Copy the built frontend from Stage 1 into the location the backend expects
# The backend/server.js expects the frontend build at '../frontend/dist'
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose the port the app runs on
EXPOSE 5001

# Start the Node.js backend
CMD ["npm", "start"]
