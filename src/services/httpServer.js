const http = require('http')
const fs = require('fs')
const path = require('path')

require('../services/socket')

http.createServer((req, res) => {
  req.url = (req.url === '/' || !req.url) ? 'index.html' : req.url
  req.url = req.url === '/joystick' ? 'joy.html' : req.url 
  fs.readFile(path.join(__dirname, '../public', req.url), function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    data = data.toString().replace(/<HOST_NAME>/g, 'localhost:3000')
    res.end(data);
  });
}).listen(8080)