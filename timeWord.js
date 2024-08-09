function timeWord(time) {
    const hoursMap = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
    const minutesMap = ["oh", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tensMap = ["twenty", "thirty", "forty", "fifty"];

    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (hour === 0 && minute === 0) return "midnight";
    if (hour === 12 && minute === 0) return "noon";

    const period = hour >= 12 ? "pm" : "am";
    const hourWord = hoursMap[hour % 12];

    let minuteWord;
    if (minute === 0) {
        minuteWord = "o’clock";
    } else if (minute < 20) {
        minuteWord = minutesMap[minute];
    } else {
        const tens = Math.floor(minute / 10);
        const ones = minute % 10;
        minuteWord = tensMap[tens - 2];
        if (ones > 0) {
            minuteWord += ` ${minutesMap[ones]}`;
        }
    }

    if (minute > 0 && minute < 10) {
        minuteWord = `oh ${minutesMap[minute]}`;
    }

    return `${hourWord} ${minuteWord} ${period}`.trim();
}

module.exports = timeWord;
