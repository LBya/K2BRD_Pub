# Stage 1: Build the frontend assets
FROM node:22-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the project for production. This command will need a corresponding script in package.json.
# We will add "build": "vite build" to package.json later.
RUN npm run build

# Stage 2: Serve the built assets with Nginx
FROM nginx:1.25-alpine

# Copy the built assets from the 'builder' stage
# Vite's default build output directory is 'dist'
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom nginx config if needed to handle SPA routing, etc.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"] 