module.exports = function(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const formattedSeconds = seconds % 60;
    const formattedMinutes = minutes % 60;
    const formattedHours = hours;

    let timeString = '';

    if (formattedHours > 0) {
        timeString += `${formattedHours} Hour${formattedHours > 1 ? "s" : ""} `;
    }

    if (formattedMinutes > 0) {
        timeString += `${formattedMinutes} Minute${formattedMinutes > 1 ? "s" : ""} `;
    }

    timeString += `${formattedSeconds} Second${formattedSeconds > 1 ? "s" : ""}`;

    return timeString.trim();
 }