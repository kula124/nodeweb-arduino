const Server = require('socket.io');
const io = new Server();
const { spawn } = require('child_process')
const kill = require('tree-kill');

const messageTypes = require('../constants/message')
const controller = require('../controller')
const MotorActions = require('../constants/motor')
const ServoActions = require('../constants/servo');

let runner = null

let gyroState = {}
const MOTOR_DELTA = 5
const SERVO_DELTA = 2
const IN_MAX = 9.8
const IN_MIN = 0
const BALANCE = IN_MAX / 2
let firstRun = true

const mapper = (value, inMin, inMax, outMin, outMax) => parseInt(
    (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);

const Run = () => {
    if (runner) {
        return
    }
    runner = spawn('termux-sensor', ['-s', 'K6DS3TR Accelerometer', '-d', 100])
    let prevValue = { motor: 0, servo: 0 }
    runner.stderr.on('data', error => console.log("Error detected!", error.toString()))
    runner.on('close', () => console.log('Termux-sensor terminated!'))
    runner.on('error', () => console.log('Main call error'))
    runner.stdout.on('data', data => {
        if (!shouldRun)
            return
        let parsedData
        try {
            parsedData = JSON.parse(data.toString())['K6DS3TR Accelerometer'].values
        } catch (error) {
            runner.kill()
            return
        }
        const [alpha, beta, gamma] = parsedData
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

        const motorValue = mapper(alpha, IN_MIN + (- BALANCE + gyroState.alpha), IN_MAX + (-BALANCE + gyroState.alpha), -100, 100)
        const servoValue = mapper(beta, -2, 2, -40, 40)
        console.log('Run -> IN_MIN', IN_MIN - (BALANCE - gyroState.alpha))
        console.log('Run -> IN_MAX', IN_MAX - (BALANCE - gyroState.alpha))
        console.log('Run -> motorValue', motorValue)
        console.log('Run -> servoValue', servoValue)


        if (motorValue > -10 && motorValue < 10)
    //        return controller.act(MotorActions.STOP)
        if (Math.abs(prevValue.motor - motorValue) > MOTOR_DELTA) {
   //         controller.act(motorValue < 0 ? MotorActions.FORWARD : MotorActions.REVERSE, Math.abs(motorValue) > 255 ? 255 : Math.abs(motorValue))
            prevValue.motor = motorValue
        }
        if (Math.abs(prevValue.servo - servoValue) > SERVO_DELTA) {
     //       controller.act(servoValue > 0 ? ServoActions.RIGHT : ServoActions.LEFT, Math.abs(servoValue))
            prevValue.servo = servoValue
        }
    })
}

const isInInterval = (value, start, end) => {
    return Math.abs(value) > start && Math.abs(value) < end
}

const mapJoystickData = (() => {
    let debounced = false
    let useIntervals = false
    return payload => {
        if (debounced)
            return
        
        let motorValue;
        let servoValue;
        
        if (!useIntervals) {
            motorValue = mapper(payload.y, -50, 50, -255, 255)
            servoValue = mapper(payload.x, -50, 50, -40, 40)
        } else {
            if (isInInterval(payload.y, 10, 25)) {
                motorValue = mapper(Math.abs(payload.y), 10, 25, 50, 80)
            }
            else if (isInInterval(payload.y, 25, 35)) {
                motorValue = mapper(Math.abs(payload.y), 25, 35, 80, 120)
            }
            else if (isInInterval(payload.y, 25, 35)) {
                motorValue = mapper(Math.abs(payload.y), 25, 35, 80, 120)
            }
            else if (isInInterval(payload.y, 35, 50)) {
                motorValue = mapper(Math.abs(payload.y), 35, 50, 120, 200)
            }
            //
            if (isInInterval(payload.x, 10, 30)) {
                motorValue = mapper(Math.abs(payload.x), 10, 30, 0, 20)
            }
            else if (isInInterval(payload.x, 30, 50)) {
                motorValue = mapper(Math.abs(payload.x), 30, 50, 20, 40)
            }
        }
        if (isInInterval(payload.x, -10, 10)){
            servoValue = 0;
            controller.act(ServoActions.STOP)
        }
        if (isInInterval(payload.y, -10, 10)){
            motorValue = 0;
            controller.act(MotorActions.STOP)
        }
        console.log(`Running motor ${payload.y > 0 ? 'FORWARD' : 'REVERSE'} by ${motorValue} speed of value ${payload.y}`)
        console.log(`Turning ${payload.x > 0 ? 'LEFT': 'RIGHT'} by angle of ${servoValue} of value ${payload.x}`)
        controller.act(payload.y > 0 ? MotorActions.FORWARD : MotorActions.REVERSE ,motorValue)

        debounced = true
        setTimeout(() => debounced = false, 150)
    }
})()

io.on('connect', socket => {
    socket.on('message', data => {
        data = JSON.parse(data)
        // console.log(data)
        const { type, payload } = data
        switch (type) {
            case messageTypes.GYRO_START:
                console.log('START:')
                shouldRun = true;
                firstRun = true;
                Run()
                break;
            case messageTypes.GYRO_END:
                console.log('END:')
                shouldRun = false;
                controller.act(MotorActions.STOP)
                controller.act(ServoActions.STOP)
                break;
            case  messageTypes.JOYSTICK:
                // console.log('JOYSTICK DATA:', payload)
                mapJoystickData(payload)
        }
    })
})

io.attach(3000, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
})