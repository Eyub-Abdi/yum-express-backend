// server.js
const http = require('http')
const debug = require('debug')('app')
const app = require('./src/app') // or './app' depending on structure
const setupSocket = require('./src/socket') // path to your socket.js

const port = process.env.PORT || 5000
const server = http.createServer(app)

// Attach socket to server
setupSocket(server)

// Start the server
server.listen(port, () => {
  debug(`Server running on port ${port}`)
})
