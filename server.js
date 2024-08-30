const express = require('express');
const server = express();

function updateConsoleLog(progress, message) {
  process.stdout.write(`\r${progress}% ${message}\n`);  // Write the new log message
}

server.all('/', (req, res) => {
  res.send('Бот запускается');
});

function keepAlive() {
    server.listen(3000, () => {
      updateConsoleLog(33, "Пытаюсь подключиться к базе данных...")
    });
}

module.exports = keepAlive;