FROM node:20-slim

# 1. Install Java (OpenJDK 17)
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# 2. Set working directory
WORKDIR /app

# 3. Copy only the backend folder contents to /app
COPY execution-engine/ ./

# 4. Install backend dependencies
# (Assumes execution-engine/package.json exists)
RUN npm install --production

# 5. Create temp directory
RUN mkdir -p temp && chmod 777 temp

# 6. Expose Koyeb port
EXPOSE 8000

# 7. Start the server
# Since we copied everything from execution-engine to /app, 
# index.js is now in the root of /app
CMD ["node", "index.js"]
