const { SingleBar, Presets } = require('cli-progress');

// Создайте прогресс-бар
const progressBar = new SingleBar({
  format: '{bar} | {percentage}%, {value}/{total} | {message}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
}, Presets.shades_classic);

// Запустите прогресс-бар
progressBar.start(4, 0);
  
module.exports = { progressBar };