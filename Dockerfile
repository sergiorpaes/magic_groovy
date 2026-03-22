FROM node:20-slim

# 1. Install Java (OpenJDK 17), wget, and unzip
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless wget unzip && \
    rm -rf /var/lib/apt/lists/*

# 2. Download and install Groovy 4.0.15
RUN wget https://archive.apache.org/dist/groovy/4.0.15/distribution/apache-groovy-binary-4.0.15.zip && \
    unzip apache-groovy-binary-4.0.15.zip && \
    mv groovy-* /opt/groovy && \
    rm apache-groovy-binary-4.0.15.zip

# 3. Set working directory
WORKDIR /app

# 4. Copy only the backend folder contents to /app
COPY execution-engine/ ./

# 5. Install backend dependencies
RUN npm install --production

# 6. Create temp directory
RUN mkdir -p temp && chmod 777 temp

# 7. Expose Koyeb port
EXPOSE 8000

# 8. Start the server
CMD ["node", "index.js"]
