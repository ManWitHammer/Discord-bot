const express = require('express');
const server = express();
const { updateConsoleLog } = require("./modules/preloader.js")

server.all('/', (req, res) => {
  res.send('Бот запускается');
});

function keepAlive() {
    server.listen(3000, () => {
      updateConsoleLog(33, "Пытаюсь подключиться к базе данных...")
    });
}

module.exports = keepAlive;