const { Server } = require('socket.io')

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', socket => {
    console.log('A user connected:', socket.id)

    socket.on('rider-location', data => {
      console.log('Location update:', data)
      io.emit('location-update', data)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })
}

module.exports = setupSocket
