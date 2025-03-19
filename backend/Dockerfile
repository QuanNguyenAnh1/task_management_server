FROM node:lts

WORKDIR /app

COPY . ./

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "run", "start:prod"] 