const express = require('express');
const server = express();
const { progressBar } = require("./modules/preloader.js")

server.all('/', (req, res) => {
  res.send('Бот запускается');
});

function keepAlive() {
    server.listen(3000, () => {
      progressBar.update(2, { message: "Пытаюсь подключиться к базе данных..." });
    });
}

module.exports = keepAlive;