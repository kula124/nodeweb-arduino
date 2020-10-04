const Server = require('socket.io');
const io = new Server();
const { spawn } = require('child_process')

const messageTypes = require('../constants/message')
//const controller = require('../controller')
const MotorActions = require('../constants/motor')
const ServoActions = require('../constants/servo')

let runner = null

const gyroState = {
    alpha: 0,
    beta: 0,
    gamma: 0
}

const Run = () => {
    runner = spawn('termux-sensor', ['-s', 'K6DS3TR Accelerometer', '-d', 100])
    let firstRun = true
    runner.stdout.on('data', data => {
        console.log(JSON.parse(data.toString()))
        if (firstRun) {
            firstRun = false;
        }
    })
}

io.on('connect', socket => {
    socket.on('message', data => {
        data = JSON.parse(data)
        const {type, ...deltas} = data
        switch (type) {
            case messageTypes.GYRO_START:
                console.log('START:')
                Run()
                break;
            case messageTypes.GYRO_END:
                console.log('END:')
                runner ? runner.kill() : (() => console.log('ayy lmaoo'))()
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