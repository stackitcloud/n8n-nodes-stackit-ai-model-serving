# Use Node.js 22 LTS as the base image
FROM node:22-alpine

# Bypass TLS issues by switching Alpine repositories to HTTP
RUN sed -i 's/https/http/g' /etc/apk/repositories

# Install build essentials for native npm modules
RUN apk add --no-cache python3 make g++

# Install n8n globally
RUN npm install n8n -g

# Create the custom nodes directory
WORKDIR /home/node/.n8n/custom
RUN npm init -y

# Set the working directory for your custom node code
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your node source code
COPY . .

# Build your custom node
RUN npm run build

# Link the node globally so it can be linked elsewhere
RUN npm link

# Move back to the custom directory and link the package
WORKDIR /home/node/.n8n/custom
RUN npm link @stackitcloud/n8n-nodes-stackit-ai-model-serving

# Set n8n to use the custom extensions directory
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom/

EXPOSE 5678

CMD ["n8n", "start"]