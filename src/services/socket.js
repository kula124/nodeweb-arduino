const Server = require('socket.io');
const io = new Server();
const { spawn } = require('child_process')
const kill  = require('tree-kill');

const messageTypes = require('../constants/message')
const controller = require('../controller')
const MotorActions = require('../constants/motor')
const ServoActions = require('../constants/servo');
const { Servo }=require('johnny-five');

let runner = null

let gyroState = {}
const MOTOR_DELTA = 1
const SERVO_DELTA = 0.5
const IN_MAX = 9.8
const IN_MIN = 0
const BALANCE = IN_MAX / 2

const mapper = (value, inMin, inMax, outMin, outMax) => parseInt(
    (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);

const Run = () => {
    runner = spawn('termux-sensor', ['-s', 'K6DS3TR Accelerometer', '-d', 100])
    let firstRun = true
    let prevValue = {alpha: 0, beta: 0}
    runner.stdout.on('data', data => {
        console.log(JSON.parse(data.toString()))
        const [alpha, beta, gamma] = JSON.parse(data.toString())['K6DS3TR Accelerometer'].values
        if (firstRun) {
            gyroState = {
                alpha: Math.abs(alpha),
                beta: Math.abs(beta),
                gamma: Math.abs(gamma)
            }
            firstRun = false;
            return
        }
        // determine mode:
        const modeOne = alpha > 0
        prevValue.alpha = alpha;
        prevValue.beta = beta;
        console.log('Run -> modeOne', modeOne)
        console.log('Run -> reference', gyroState.alpha)

        const motorValue = mapper(alpha, IN_MIN + (- BALANCE + gyroState.alpha), IN_MAX + (-BALANCE + gyroState.alpha), -255, 255)
        console.log('Run -> IN_MIN', IN_MIN - (BALANCE - gyroState.alpha))
        console.log('Run -> IN_MAX',  IN_MAX - (BALANCE - gyroState.alpha))
        console.log('Run -> motorValue', motorValue)


        const servoValue = mapper(beta, -3.5, 3.5, -40, 40)
        if (Math.abs(prevValue.alpha - alpha) > MOTOR_DELTA)
            controller.act(motorValue < 0 ? MotorActions.FORWARD : MotorActions.REVERSE, Math.abs(motorValue) > 255 ? 255 : Math.abs(motorValue))
        if (Math.abs(prevValue.beta - beta) > SERVO_DELTA)
            controller.act(servoValue ? ServoActions.RIGHT : ServoActions.LEFT, Math.abs(servoValue))
        prevValue.alpha = alpha
        prevValue.beta = beta
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
                if (runner) {
                    kill(runner.pid)
                    firstRun = true
                    gyroState = {}
                }
                break;
        }
    })
})

io.attach(3000, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})