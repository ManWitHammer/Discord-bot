function startPreloader() {
    const frames = ['-', '\\', '|', '/'];
    let i = 0;
    return setInterval(() => {
      process.stdout.write(`\r${frames[i]} Загрузка...`);
      i = (i + 1) % frames.length;
    }, 100);
  }
  
  function stopPreloader(preloader) {
    clearInterval(preloader);
  
    if (process.stdout.clearLine) {
      process.stdout.clearLine();  // Очистка строки, если метод доступен
      process.stdout.cursorTo(0);  // Перемещение курсора в начало строки
    } else {
      process.stdout.write('\r');  // Альтернативное решение для очистки строки
    }
    console.log(''); // Добавляем новую строку, чтобы не мешать выводу следующей информации
  }

  function updateConsoleLog(progress, message) {
    process.stdout.write(`\r${progress}% ${message}\n`);  // Write the new log message
  }
  
  module.exports = { startPreloader, stopPreloader, updateConsoleLog };