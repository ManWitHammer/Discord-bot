const express = require('express');
const server = express();

server.all('/', (req, res) => {
  res.send('Бот запускается');
});

function keepAlive() {
    server.listen(3000, () => {
        console.log("Сервер запущен на порту 3000");
    });
}

module.exports = keepAlive;