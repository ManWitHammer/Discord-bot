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
    process.stdout.clearLine();  // Clear the preloader line
    process.stdout.cursorTo(0);  // Move cursor to the beginning of the line
  }

  function updateConsoleLog(progress, message) {
    process.stdout.write(`\r${progress}% ${message}\n`);  // Write the new log message
  }
  
  module.exports = { startPreloader, stopPreloader, updateConsoleLog };