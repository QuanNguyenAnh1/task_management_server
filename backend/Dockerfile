FROM node:18

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY backend/ .

# Build application
RUN npm run build

# Start the application
CMD ["npm", "run", "start:prod"] 