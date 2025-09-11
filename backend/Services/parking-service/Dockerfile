FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package và cài dependencies
COPY package*.json ./
RUN npm install --production

# ✅ Cài Nest CLI
RUN npm install -g @nestjs/cli

# Copy source code
COPY . .

# Expose port 3000 trong container
EXPOSE 3000

# Start NestJS
CMD ["nest", "start"]
