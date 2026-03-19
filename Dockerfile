FROM node:20-slim

# Install Java (OpenJDK 17)
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy execution engine files
# We copy the contents of the execution-engine folder to the root of the /app dir
COPY execution-engine/package*.json ./
RUN npm install

COPY execution-engine/ ./

# Create temp directory and set permissions
RUN mkdir -p temp && chmod 777 temp

# The application listens on port 8080 by default
EXPOSE 8080

# Start the server
CMD ["node", "index.js"]
