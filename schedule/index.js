const regular = `[
  {"name":"Advisory", "time":["7:40", "7:56"]},
  {"name":"Period 1", "time":["8:00", "8:52"]},
  {"name":"Period 2", "time":["8:56", "9:48"]},
  {"name":"Period 3", "time":["9:52", "10:44"]},
  {"name":"Period 4", "time":["10:48", "12:17"], "subPeriod": [
    {"name": "A Lunch", "time":["10:48","11:15"]},
    {"name": "Cleaning", "time":["11:19","11:46"]},
    {"name": "C Lunch", "time":["11:50","12:17"]}
  ]},
  {"name":"Period 5", "time":["12:21", "13:13"]},
  {"name":"Period 6", "time":["13:17", "14:11"]}
]`

const dotw = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

var dailySchedule = null;
var activePeriods = {
  day: null,
  current: null,
  next: null
}
var options = {
  "timeFormat": "24hour" // "12hour" or "24hour"
}

function getTimeArr() {
  const now = new Date();
  return [now.getHours(), now.getMinutes()];
}

function tick() {
  if (new Date().getDay() !== activePeriods.day) {
    startNewDay(new Date())
    return;
  }
  let timeArr = getTimeArr();

  document.getElementById("simTime").textContent = getFormattedTime(timeArr)

  let currentPeriod = activePeriods.current;
  // Should it be next period?
  if (currentPeriod.id === "period" || currentPeriod.id === "transition" || currentPeriod.id === "day-start") {
    if (compareTimeArrs(timeArr, currentPeriod.end) !== -1) {
      refreshPeriod(timeArr, currentPeriod.id === "day-start", currentPeriod.id === "period")
      return;
    }
  }

  // currentPeriod
  if (currentPeriod.id === "period" || currentPeriod.id === "transition") {
    document.getElementById("currentPeriodLeft").textContent = timeLeftFormatted(timeArr, currentPeriod.end) + " left";
    setProgress(timeArr, currentPeriod.start, currentPeriod.end);
  }
  else if (currentPeriod.id === "day-start") {
    document.getElementById("salutationTime").textContent = timeLeftFormatted(timeArr, currentPeriod.end) + " left";
  }

  let nextPeriod = activePeriods.next;
  // nextPeriod
  if (nextPeriod.id !== "no-period") document.getElementById("nextPeriodIn").textContent = "In " + timeLeftFormatted(timeArr, nextPeriod.start);
}

// Tick Accompanying Functions
function dayStart() {
  document.getElementById("currentPeriodSection").classList.add("hidden");
  document.getElementById("salutationSection").classList.remove("hidden");
  document.getElementById("nextPeriodSectionWrapper").classList.remove("hidden");
  document.getElementById("salutationHeader").textContent = "Good Morning!";
  document.getElementById("salutationSubtext").textContent = "Advisory starts in";
}
function dayOver() {
  document.getElementById("currentPeriodSection").classList.add("hidden");
  document.getElementById("salutationSection").classList.remove("hidden");
  document.getElementById("nextPeriodSectionWrapper").classList.add("hidden");
  document.getElementById("salutationHeader").textContent = "Day's Over!";
  document.getElementById("salutationSubtext").textContent = "";
  document.getElementById("salutationTime").textContent = "See you tomorrow!";
}

// Period Shift Function

function switchPeriod(timeArr) {
  let currentPeriod = getCurrentPeriod(dailySchedule, timeArr);
  let nextPeriod = getNextPeriod(dailySchedule, timeArr);

  activePeriods.current = currentPeriod;
  activePeriods.next = nextPeriod;

  document.getElementById("currentPeriod").classList.remove("transition");

  // Current Period
  if (currentPeriod.id === 'day-end') dayOver();
  else if (currentPeriod.id === 'day-start') dayStart();
  else if (currentPeriod.id === 'transition') {
    document.getElementById("salutationSection").classList.add("hidden");
    document.getElementById("currentPeriodSection").classList.remove("hidden");
    document.getElementById("nextPeriodSectionWrapper").classList.remove("hidden");
    document.getElementById("currentPeriod").textContent = "Transition";
    document.getElementById("currentPeriod").classList.add("transition");
    document.getElementById("currentPeriodSchedule").textContent = getTimeRangeText(currentPeriod, options.timeFormat === "12hour");
  }
  else { // Normal Period
    document.getElementById("salutationSection").classList.add("hidden");
    document.getElementById("currentPeriodSection").classList.remove("hidden");
    document.getElementById("nextPeriodSectionWrapper").classList.remove("hidden");
    document.getElementById("currentPeriod").textContent = currentPeriod.name;
    document.getElementById("currentPeriodSchedule").textContent = getTimeRangeText(currentPeriod, options.timeFormat === "12hour");
  }

  // Next Period
  if (nextPeriod.id !== 'no-period') {
    document.getElementById("nextPeriod").textContent = nextPeriod.name;
  }
  tick();
}

// Display Update Functions

function refreshPeriod(timeArr, dayStart, skipNext) {
  if (dayStart) {
    document.getElementById("currentPeriodSection").classList.add("in");
    document.getElementById("salutationSection").classList.add("out");
  }
  else {
    document.getElementById("currentPeriodSection").classList.add("swap");
  }
  if (!skipNext) {
    document.getElementById("nextPeriodSection").classList.add("swap");
  }
  setTimeout(()=>{
    switchPeriod(timeArr);
    if (dayStart) {
      document.getElementById("salutationTime").classList.add("hidden")
    }
    setTimeout(()=>{
      if (dayStart) {
        document.getElementById("salutationSection").classList.remove("out")
        document.getElementById("currentPeriodSection").classList.remove("in");
      }
      else {
        document.getElementById("currentPeriodSection").classList.remove("swap");
      }
      if (!skipNext) {
        document.getElementById("nextPeriodSection").classList.remove("swap");
      }
    }, 1000)
  }, 1000)
}
function setProgress(timeArr, start, end) {
  let now = new Date();
  let minutePercent = now.getSeconds()/60;
  let timeTotal = timeLeft(start, end);
  let timePassed = timeTotal - timeLeft(timeArr, end) + minutePercent;
  let percent = (timePassed/timeTotal)*100;
  document.getElementById("periodProgress").setAttribute("value", percent);
}
function getTimeRangeText(period) {
  return getFormattedTime(period.start) + "-" + getFormattedTime(period.end)
}
function getFormattedTime(timeArr) {
	let hour = timeArr[0];
	if (options.timeFormat === "12hour" && hour > 12) hour -= 12;
	return hour + ":" + String(timeArr[1]).padStart(2, "0");
}
function timeLeftFormatted(timeNow, targetTime) {
	let mins = timeLeft(timeNow, targetTime);
	let hours = Math.floor(mins/60);
	mins %= 60;
	if (hours >= 1) {
		return `${hours} ${hours>1 ? "hours" : "hour"} ${mins} ${mins!==1 ? "mins" : "min"}`
	}
	else {
		return `${mins} ${mins>1 ? "mins" : "min"}`
	}
}

// Time Comparison Utilities
function timeLeft(timeNow, targetTime) {
  return 60*(targetTime[0] - timeNow[0]) + targetTime[1] - timeNow[1];
}
function compareTimeArrs(arr1, arr2) {
  if (arr1[0] < arr2[0]) return -1;
  else if (arr1[0] > arr2[0]) return 1;
  else if (arr1[1] < arr2[1]) return -1;
  else if (arr1[1] > arr2[1]) return 1;
  else return 0;
}
function withinTimeRange(timeArr, start, end) {
  if (compareTimeArrs(timeArr, start) !== -1 &&
        compareTimeArrs(timeArr, end) === -1) {
      return true;
  }
}

// Get Active Periods

function getCurrentPeriod(schedule, timeArr, includeIndex) {
  var obj = {};
  var index = 0;
  let found = dailySchedule.some((period) => {
    if (index === 0 && compareTimeArrs(timeArr, period.start) === -1) {
      obj.id = "day-start";
      obj.end = period.start;
      return true;
    }
    else if (withinTimeRange(timeArr, period.start, period.end)) {
      obj.name = period.name;
      obj.start = period.start;
      obj.end = period.end;
      obj.id = "period";
      return true;
    }
    else if (compareTimeArrs(timeArr, period.start) === -1) {
      obj.id  = "transition";
      obj.after = schedule[index-1].name;
      obj.before = schedule[index].name;
      obj.start = schedule[index-1].end;
      obj.end = schedule[index].start;
      return true;
    }
    index++;
  })
  if (!found) {
    obj.id = "day-end"
    obj.name = "Day End"
  };
  if (includeIndex) obj.index = index;
  if (includeIndex && obj.id === "day-start") obj.index = -1;
  return obj;
}

function getNextPeriod(schedule, timeArr) {
  let currentPeriod = getCurrentPeriod(schedule, timeArr, true);
  let obj = {};
  let index = currentPeriod.index + 1;
  if (currentPeriod.id === "transition") index--;
  if (index === schedule.length) {
    obj.start = schedule[index-1].end;
    obj.name = "Day End";
    obj.id = "day-end";
  }
  else if (index > schedule.length) {
    obj.id = "no-period";
  }
  else {
    let period = schedule[index];
    obj.name = period.name;
    obj.start = period.start;
    obj.end = period.end;
    obj.id = "period";
  }
  return obj;
}

// Schedule Generation

function buildSchedule(schedule) {
  return schedule.map((entry)=>{
     entry.start = entry.time[0].split(":").map(val=>Number(val));
     entry.end = entry.time[1].split(":").map(val=>Number(val));
     delete entry.time;
     if (entry.subPeriod) entry.subPeriod = buildSchedule(entry.subPeriod);
    return entry;
  });
}

function getDailySchedule() {
  let day = dotw[new Date().getDay()];
  // console.log(day);
  switch (day) {
    case "Wednesday":
      return "Not yet implemented";
      break;
    case "Thursday":
      return "Not yet implemented";
      break;
    default:
      return JSON.parse(regular);
  }
}

// Startup and Reset

function startNewDay(now) {
  dailySchedule = null;
  dailySchedule = buildSchedule(getDailySchedule(now));
  activePeriods.day = now.getDay();
  switchPeriod(getTimeArr());
}

function init() {
  const now = new Date();
  startNewDay(now);
  setInterval(tick, 1000)
}

init();
