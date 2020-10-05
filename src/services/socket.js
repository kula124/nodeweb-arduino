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
const MOTOR_DELTA = 30
const SERVO_DELTA = 10
const IN_MAX = 9.8
const IN_MIN = 0
const BALANCE = IN_MAX / 2

const mapper = (value, inMin, inMax, outMin, outMax) => parseInt(
    (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);

const Run = () => {
    runner = spawn('termux-sensor', ['-s', 'K6DS3TR Accelerometer', '-d', 100])
    let firstRun = true
    let prevValue = {motor: 0, servo: 0}
    runner.stdout.on('data', data => {
        let parsedData
        try {
           parsedData = JSON.parse(data.toString())['K6DS3TR Accelerometer'].values
        } catch (error) {
            runner.kill()
            return
        }
        const [alpha, beta, gamma] 
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
        if (Math.abs(prevValue.motor - motorValue) > MOTOR_DELTA){
            controller.act(motorValue < 0 ? MotorActions.FORWARD : MotorActions.REVERSE, Math.abs(motorValue) > 255 ? 255 : Math.abs(motorValue))
            prevValue.motor = motorValue
        }
        if (Math.abs(prevValue.servoValue - servoValue) > SERVO_DELTA) {
            controller.act(servoValue > 0 ? ServoActions.RIGHT : ServoActions.LEFT, Math.abs(servoValue))
            prevValue.servo = servoValue 
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