global.globalThis = global;

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { CosmosClient } = require("@azure/cosmos");

// Azure Cosmos DB Configuration
const cosmosClient = new CosmosClient({
  endpoint: "https://test1db123.documents.azure.com:443/",
  key: "rR6mn5E0sju9G9QpkJm2gUa6Lqf4AhqbotxaR00MPDJWBnx8JW33Vtqlg9s1KMZs0U15RxwYltugACDbb0dlpw==",
});

const databaseId = "test";
const containerId = "testcontainer";
const database = cosmosClient.database(databaseId);
const container = database.container(containerId);

// Load Initial Data from Cosmos DB
let imageData = null;

async function loadInitialData() {
  try {
    const querySpec = {
      query: "SELECT * FROM c",
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    if (resources.length > 0) {
      // Load the latest whiteboard data from Cosmos DB
      imageData = resources[0].data;
    }
  } catch (error) {
    console.error("Error loading initial data from Cosmos DB: " + error.message);
  }
}

loadInitialData();


// Color palette
const colors = [ "#CFF09E", "#A8DBA8", "#79BD9A", "#3B8686", "#0B486B" ];
let colorIndex = 0;
// Express Setup
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/canvas.html');
});

// Socket.io Setup
io.sockets.on('connection', function (socket) {
  // Assign a color to the user
  socket.emit('setup', colors[colorIndex], imageData);
  
  // Rotate to the next color for the next user
  colorIndex = (colorIndex + 1) % colors.length;

  socket.on('do-the-draw', function (data) {
    socket.broadcast.emit('draw', data);
    imageData = data;
  });

  socket.on('clear', function () {
    socket.broadcast.emit('clear');
    imageData = null;
  });

  socket.on('save-data', async function (data) {
    imageData = data;
    try {
      await container.items.create({ data: imageData });
    } catch (error) {
      console.error("Error saving data to Cosmos DB: " + error.message);
    }
  });
});

// Start the server
const port = process.env.PORT || 3000; // You can use any available port
server.listen(port, function () {
  console.log(`Server is running on port ${port}`);
});
