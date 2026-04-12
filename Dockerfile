# Kok Bo Chang, A0273542E
# Use official Node image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 6060

# Start app
CMD ["npm", "start"]