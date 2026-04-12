# Use official Node image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose port (match your app)
EXPOSE 6060

# Start app
CMD ["npm", "start"]