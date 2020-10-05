const mapper = (value, inMin, inMax, outMin, outMax) => parseInt(
  (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);

  let alpha = 6.134546
setInterval(() => {
  const IN_MAX = 9.5
  const IN_MIN = 0
  const BALANCE = 9.5 / 2
  const reference = 6.134546

  const motorValue = mapper(alpha, IN_MIN + (- BALANCE + reference), IN_MAX + (-BALANCE + reference), -255, 255)
  alpha += 0.56
  console.log('alpha', alpha)
  console.log('RANGE: ',IN_MIN + (- BALANCE + reference), IN_MAX + (-BALANCE + reference))
  console.log(motorValue)
}, 1000)