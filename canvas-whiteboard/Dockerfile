# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Bundle app source code inside the container
COPY . .

# Expose the port that the application will run on

# Define the command to run your application
CMD ["npm", "start"]
