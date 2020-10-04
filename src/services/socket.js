const Server = require('socket.io');
const io = new Server();

const messageTypes = require('../constants/message')
//const controller = require('../controller')
const MotorActions = require('../constants/motor')
const ServoActions = require('../constants/servo')

const gyroState = {
    alpha: 0,
    beta: 0,
    gamma: 0
}

io.on('connect', socket => {
    socket.on('message', data => {
        console.log(data)
        const {type, ...deltas} = data
        switch (type) {
            case messageTypes.GYRO_DATA:
                console.log('IN DATA: ', deltas)
                break;
            case messageTypes.GYRO_END:
                console.log('END:')
                //controller.act(MotorActions.STOP);
                //controller.act(ServoActions.STOP);
                break;
        }
    })
})

io.attach(3000, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})