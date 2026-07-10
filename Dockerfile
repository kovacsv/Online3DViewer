# Stage 1: Clone and Build the application
FROM node:lts-alpine AS builder

# Install git AND python3 explicitly
RUN apk add --no-cache git python3 py3-pip # Add python3 here

# Set the working directory
COPY . /app
WORKDIR /app
RUN echo "Current directory after WORKDIR /app:" && pwd && ls -la

# Install dependencies (including run-python3)
RUN npm install

# --- Run the prerequisite build steps individually for clarity ---
RUN echo "Running: npm run create_dist" && npm run create_dist || echo "create_dist failed"

# Stage 2: Create the final image to serve the built files
FROM node:lts-alpine AS runner

# Set the working directory
WORKDIR /app

# Install http-server globally
RUN npm install -g http-server

# Copy the built website files from the builder stage
# Corrected source path: /app/build/package/website
COPY --from=builder /app/build/ /app

# Expose port 8080
EXPOSE 8080

# Command to start the http-server
CMD ["http-server", "-p", "8080", "-a", "0.0.0.0", "package/website"]
