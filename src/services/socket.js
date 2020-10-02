const Server = require('socket.io');
const io = new Server();

io.on('connect', socket => {
    socket.on('message', data => console.log(data))
})

io.attach(3000, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})