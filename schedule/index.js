// ==================
// Editable Constants
// ==================

// Whether or not the app should be disabled and show a message
// Either true or false
const emergencyMaintenence = false
// If emergency maintenence is on, the header of the message
const maintenenceHeader = "Temporarily Disabled!"
// If emergency maintenence is on, the body of the message
const maintenenceMessage = "I'm working on changing the schedule for today."

// Whether or not the app should show the following toast message when it starts
// Should be either true or false
const showToastMessage = false
// The toast message to show
const toastMessage = "This schedule may not be accurate on days the schedule is different than normal."

// Overrides for particular dates. The date is in the format "YEAR-MONTH-DAY"
// Choose a schedule from one of the following:
// - "regular" or "normal" - this is just the regular schedule
// - "thursday" or "advisory" - this is the advisory schedule
// - "no-school" - this just shows a message saying no school
const scheduleOverrides = {
  "2021-03-16": "thursday",
  "2021-04-28": "regular",
  "2021-04-29": "regular",
  "2021-05-05": "regular",
  "2021-06-17": "regular",
  "2021-09-27": "regular",
  "2021-09-28": "wednesday-demo",
  "2023-09-14": "thursday",
  "2024-01-17": "oneHourDelay",

}

// The default schedule for a given day
const scheduleDefaults = {
  "Monday": "regular",
  "Tuesday": "regular",
  "Wednesday": "regular",
  "Thursday": "thursday",
  "Friday": "regular",
  "Saturday": "no-school",
  "Sunday": "no-school",
}

const usingBLunch = true

// ==================
// End Editable Constants
// ==================

var devOffsetHours = 0
var devOffsetMinutes = 0
var devDay = false
initDevTools()

const customSchedules = {
  "sat-demo-day": [
    {"name":"Advisory", "time":["7:40", "8:30"]},
    {"name":"English SAT", "time":["8:40", "10:30"]},
    {"name":"Break", "time":["10:30", "10:40"]},
    {"name":"Math SAT", "time":["10:40", "12:00"]},
    {"name":"Lunch", "time":["12:00", "13:00"]},
  ],
  "wednesday-demo": [
    {"name":"Advisory", "time":["7:40","7:56"]},
    {"name":"Period 1", "time":["8:00","8:41"]},
    {"name":"Period 2", "time":["8:45","9:26"]},
    {"name":"Period 3", "time":["9:30","10:11"]},
    {"name":"Period 4", "time":["10:15","10:56"]},
    {"name":"Period 5", "time":["11:00","12:29"], "subPeriod": [
      {"name": "A Lunch", "time":["11:00","11:27"]},
      {"name": "B Lunch", "time":["11:31","11:58"]},
      {"name": "C Lunch", "time":["12:02","12:29"]}
    ]},
    {"name":"Period 6", "time":["12:33","13:14"]},
    {"name":"Advisory", "time":["13:19","14:11"]}
  ],
}

const demo = `[{"name":"Whole Day", "time":["7:40", "14:11"]}]`
const regular = `[
  {"name":"Advisory", "time":["7:40", "7:53"]},
  {"name":"Period 1", "time":["7:57", "8:56"]},
  {"name":"Period 2", "time":["9:00", "9:59"]},
  {"name":"Period 3", "time":["10:03", "11:02"]},
  {"name":"Period 4", "time":["11:06", "12:35"], "subPeriod": [
    {"name": "A Lunch", "time":["11:06","11:33"]},
    {"name": "B Lunch", "time":["11:37","12:04"]},
    {"name": "C Lunch", "time":["12:08","12:35"]}
  ]},
  {"name":"Period 5", "time":["12:39", "13:38"]},
  {"name":"Period 6", "time":["13:42", "14:41"]}
]`


const thursday = `[
	{"name":"Advisory", "time":["7:40", "8:28"]},
	{"name":"Period 1", "time":["8:32", "9:24"]},
	{"name":"Period 2", "time":["9:28", "10:20"]},
	{"name":"Period 3", "time":["10:24", "11:16"]},
	{"name":"Period 4", "time":["11:20", "12:49"], "subPeriod": [
		{"name": "A Lunch", "time":["11:20","11:47"]},
		{"name": "B Lunch", "time":["11:51","12:18"]},
		{"name": "C Lunch", "time":["12:22","12:49"]}
	]},
	{"name":"Period 5", "time":["12:53", "13:45"]},
	{"name":"Period 6", "time":["13:49", "14:41"]}
]`


const oneHourDelay = `[
  {"name":"Advisory", "time":["8:40", "8:53"]},
  {"name":"Period 1", "time":["8:57", "9:44"]},
  {"name":"Period 2", "time":["9:48", "10:35"]},
  {"name":"Period 3", "time":["10:39", "11:26"]},
  {"name":"Period 4", "time":["11:30", "12:59"], "subPeriod": [
    {"name": "A Lunch", "time":["11:30","11:57"]},
    {"name": "B Lunch", "time":["12:01","12:28"]},
    {"name": "C Lunch", "time":["12:32","12:59"]}
  ]},
  {"name":"Period 5", "time":["13:03", "13:50"]},
  {"name":"Period 6", "time":["13:54", "14:41"]}
]`

const dotw = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

var dailySchedule = null
var activePeriods = {
  day: null,
  current: null,
  next: null
}
var options = {}

function getTimeArr() {
  const now = new Date()
  return [now.getHours()+devOffsetHours, now.getMinutes()+devOffsetMinutes]
}

function tick() {
  let timeArr = getTimeArr()

  document.getElementById("simTime").textContent = getFormattedTime(timeArr, true)

  if (new Date().getDay() !== activePeriods.day) {
    startNewDay(new Date())
    return
  }
  else if (activePeriods.noSchool) {
    return
  }

  let currentPeriod = activePeriods.current
  // Should it be next period?
  if (currentPeriod.id === "period" || currentPeriod.id === "transition" || currentPeriod.id === "day-start") {
    if (compareTimeArrs(timeArr, currentPeriod.end) !== -1) {
      refreshPeriod(timeArr, currentPeriod.id === "day-start", currentPeriod.id === "period")
      return
    }
  }

  // currentPeriod
  if (currentPeriod.id === "period" || currentPeriod.id === "transition") {
    document.getElementById("currentPeriodLeft").textContent = timeLeftFormatted(timeArr, currentPeriod.end) + " left"
    setProgress(timeArr, currentPeriod.start, currentPeriod.end)
  }
  else if (currentPeriod.id === "day-start") {
    document.getElementById("salutationTime").textContent = timeLeftFormatted(timeArr, currentPeriod.end)
  }

  let nextPeriod = activePeriods.next
  // nextPeriod
  if (nextPeriod.id !== "no-period") document.getElementById("nextPeriodIn").textContent = "In " + timeLeftFormatted(timeArr, nextPeriod.start)
}

// Tick Accompanying Functions
function dayStart() {
  document.getElementById("currentPeriodSection").classList.add("hidden")
  document.getElementById("salutationSection").classList.remove("hidden")
  document.getElementById("nextPeriodSection").classList.remove("hidden")
  document.getElementById("salutationHeader").textContent = "Good Morning!"
  document.getElementById("salutationSubtext").textContent = "Advisory starts in"
}
function dayOver() {
  document.getElementById("currentPeriodSection").classList.add("hidden")
  document.getElementById("salutationSection").classList.remove("hidden")
  document.getElementById("nextPeriodSection").classList.add("hidden")
  document.getElementById("salutationHeader").textContent = "Day's Over!"
  document.getElementById("salutationSubtext").textContent = ""
  document.getElementById("salutationTime").textContent = "See you tomorrow!"
}
function weekend() {
  document.getElementById("currentPeriodSection").classList.add("hidden")
  document.getElementById("salutationSection").classList.remove("hidden")
  document.getElementById("nextPeriodSection").classList.add("hidden")
  document.getElementById("salutationHeader").textContent = "Weekend!"
  document.getElementById("salutationSubtext").textContent = ""
  document.getElementById("salutationTime").textContent = "See you next week!"
}
function maintenence() {
  document.getElementById("currentPeriodSection").classList.add("hidden")
  document.getElementById("salutationSection").classList.remove("hidden")
  document.getElementById("nextPeriodSection").classList.add("hidden")
  document.getElementById("salutationHeader").textContent = maintenenceHeader
  document.getElementById("salutationSubtext").textContent = ""
  document.getElementById("salutationTime").textContent = maintenenceMessage
}

// Period Shift Function

function switchPeriod(timeArr) {
  if (activePeriods.noSchool) {
    weekend()
    tick()
    return
  }

  let currentPeriod = getCurrentPeriod(dailySchedule, timeArr)
  let nextPeriod = getNextPeriod(dailySchedule, timeArr)

  activePeriods.current = currentPeriod
  activePeriods.next = nextPeriod

  document.getElementById("currentPeriod").classList.remove("transition")

  // Current Period
  if (currentPeriod.id === 'day-end') dayOver()
  else if (currentPeriod.id === 'day-start') dayStart()
  else if (currentPeriod.id === 'transition') {
    document.getElementById("salutationSection").classList.add("hidden")
    document.getElementById("currentPeriodSection").classList.remove("hidden")
    document.getElementById("nextPeriodSection").classList.remove("hidden")
    document.getElementById("currentPeriod").textContent = "Transition"
    document.getElementById("currentPeriod").classList.add("transition")
    document.getElementById("currentPeriodSchedule").textContent = getTimeRangeText(currentPeriod, options.timeFormat === "12")
    document.getElementById("currentPeriodSubtext").textContent = "➔ " + currentPeriod.before
  }
  else { // Normal Period
    document.getElementById("salutationSection").classList.add("hidden")
    document.getElementById("currentPeriodSection").classList.remove("hidden")
    document.getElementById("nextPeriodSection").classList.remove("hidden")
    document.getElementById("currentPeriod").textContent = currentPeriod.name
    document.getElementById("currentPeriodSchedule").textContent = getTimeRangeText(currentPeriod, options.timeFormat === "12")
    if (currentPeriod.sourcePeriod && currentPeriod.name === "Class") {
      // Maybe show what's happening elsewhere during class (a lunch, transition ➔ a lunch)
      document.getElementById("currentPeriodSubtext").textContent = currentPeriod.sourcePeriod
    }
    else if (currentPeriod.sourcePeriod && currentPeriod.name === "Lunch") {
      document.getElementById("currentPeriodSubtext").textContent = currentPeriod.lunchName
      // Subtitle for non-class periods (LUNCH)
    }
    else if (currentPeriod.sourcePeriod) {
      document.getElementById("currentPeriodSubtext").textContent = currentPeriod.sourcePeriod
    }
    else {
      document.getElementById("currentPeriodSubtext").textContent = ""
    }
  }

  // Next Period
  if (nextPeriod.id !== 'no-period') {
    document.getElementById("nextPeriod").textContent = nextPeriod.name
  }
  tick()
}


// Display Update Functions

function refreshPeriod(timeArr, dayStart, skipNext) {
  if (dayStart) {
    document.getElementById("currentPeriodSection").classList.add("in")
    document.getElementById("salutationSection").classList.add("out")
  }
  else {
    document.getElementById("currentPeriodSection").classList.add("swap")
  }
  if (!skipNext) {
    document.getElementById("nextPeriodSection").classList.add("swap")
  }
  setTimeout(()=>{
    switchPeriod(timeArr)
    if (dayStart) {
      document.getElementById("salutationTime").classList.add("hidden")
    }
    setTimeout(()=>{
      if (dayStart) {
        document.getElementById("salutationSection").classList.remove("out")
        document.getElementById("currentPeriodSection").classList.remove("in")
      }
      else {
        document.getElementById("currentPeriodSection").classList.remove("swap")
      }
      if (!skipNext) {
        document.getElementById("nextPeriodSection").classList.remove("swap")
      }
    }, 1000)
  }, 1000)
}
function setProgress(timeArr, start, end) {
  let now = new Date()
  let minutePercent = now.getSeconds()/60
  let timeTotal = timeLeft(start, end)
  let timePassed = timeTotal - timeLeft(timeArr, end) + minutePercent
  let percent = (timePassed/timeTotal)*100
  document.getElementById("periodProgress").setAttribute("value", percent)
}
function getTimeRangeText(period) {
  return getFormattedTime(period.start) + "-" + getFormattedTime(period.end)
}
function getFormattedTime(timeArr, shouldUseAMPM) {
	let hour = timeArr[0]
  let ampm = " am"
  if (options.timeFormat === "12") {
    if (hour >= 12) ampm = " pm"
    if (hour == 0) hour = 12
    if (hour > 12) hour -= 12
  }

	return hour + ":" + String(timeArr[1]).padStart(2, "0") + (options.timeFormat === "12" && shouldUseAMPM ? ampm : "")
}
function timeLeftFormatted(timeNow, targetTime) {
	let mins = timeLeft(timeNow, targetTime)
	let hours = Math.floor(mins/60)
	mins %= 60
	if (hours >= 1) {
		return `${hours} ${hours>1 ? "hours" : "hour"} ${mins} ${mins!==1 ? "mins" : "min"}`
	}
	else {
		return `${mins} ${mins>1 ? "mins" : "min"}`
	}
}

// Time Comparison Utilities
function timeLeft(timeNow, targetTime) {
  return 60*(targetTime[0] - timeNow[0]) + targetTime[1] - timeNow[1]
}
function compareTimeArrs(arr1, arr2) {
  if (arr1[0] < arr2[0]) return -1
  else if (arr1[0] > arr2[0]) return 1
  else if (arr1[1] < arr2[1]) return -1
  else if (arr1[1] > arr2[1]) return 1
  else return 0
}
function withinTimeRange(timeArr, start, end) {
  if (compareTimeArrs(timeArr, start) !== -1 &&
        compareTimeArrs(timeArr, end) === -1) {
      return true
  }
}

// Get Active Periods

function getSubPeriod(schedule, period, timeArr) {
  let obj = {}
  let subPeriod = getCurrentPeriod(period.subPeriod, timeArr)
  let lunchChosen = !!options.lunches[period.name]
  if (lunchChosen) {
    obj.lunchChosen = true
    // subPeriod is the chosen lunch
    if (options.lunches[period.name] === subPeriod.name) {
      obj.name = "Lunch"
      obj.lunchName = subPeriod.name
      obj.start = subPeriod.start
      obj.end = subPeriod.end
      obj.sourcePeriod = period.name
      obj.id = subPeriod.id
    }
    // subPeriod is not the chosen lunch
    else {
      let targetLunchIndex = period.subPeriod.findIndex(sub=>sub.name === options.lunches[period.name])
      let targetLunch = period.subPeriod[targetLunchIndex]

      if (subPeriod.id === "transition" && (subPeriod.before === targetLunch.name || subPeriod.after === targetLunch.name)) {
        obj = {...subPeriod}
        obj.sourcePeriod = period.name
      }
      else {
        obj.name = "Class"
        obj.sourcePeriod = period.name
        obj.id = "period"
        if (compareTimeArrs(timeArr, targetLunch.start) === -1) {
          obj.start = period.start
          obj.end = period.subPeriod[targetLunchIndex-1].end
        }
        if (compareTimeArrs(timeArr, targetLunch.end) === 1) {
          obj.start = period.subPeriod[targetLunchIndex+1].start
          obj.end = period.end
        }
      }
    }

  }
  // Lunch isn't chosen
  else {
    if (subPeriod.id === "transition") obj.before = subPeriod.before
    obj.name = subPeriod.name
    obj.start = subPeriod.start
    obj.end = subPeriod.end
    obj.sourcePeriod = period.name
    obj.id = subPeriod.id
    obj.lunchChosen = false
  }
  return obj
}

function getCurrentPeriod(schedule, timeArr, includeIndex) {
  var obj = {}
  var index = 0
  let found = schedule.some((period) => {
    if (index === 0 && compareTimeArrs(timeArr, period.start) === -1) {
      obj.id = "day-start"
      obj.end = period.start
      return true
    }
    else if (withinTimeRange(timeArr, period.start, period.end)) {
      if (period.subPeriod) {
        obj = getSubPeriod(schedule, period, timeArr)
      }
      else {
        obj.name = period.name
        obj.start = period.start
        obj.end = period.end
        obj.id = "period"
      }
      return true
    }
    else if (compareTimeArrs(timeArr, period.start) === -1) {
      obj.id  = "transition"
      obj.after = schedule[index-1].name
      obj.before = schedule[index].name
      obj.start = schedule[index-1].end
      obj.end = schedule[index].start
      return true
    }
    index++
  })
  if (!found) {
    obj.id = "day-end"
    obj.name = "Day End"
  }
  if (includeIndex) obj.index = index
  if (includeIndex && obj.id === "day-start") obj.index = -1
  return obj
}

function getNextPeriod(schedule, timeArr) {
  let currentPeriod = getCurrentPeriod(schedule, timeArr, true)
  let obj = {}
  let index = currentPeriod.index + 1
  if (currentPeriod.id === "transition" && !currentPeriod.sourcePeriod) index--
  if (index === schedule.length) {
    obj.start = schedule[index-1].end
    obj.name = "Day End"
    obj.id = "day-end"
  }
  else if (index > schedule.length) {
    obj.id = "no-period"
  }
  else {
    let period = schedule[index]
    if (period.name === "Lunch") {
      if (period.lunchChosen) obj.name = period.lunchName
      else obj.name = period.sourcePeriod
    }
    else obj.name = period.name
    obj.start = period.start
    obj.end = period.end
    obj.id = "period"
  }
  return obj
}

// Schedule Generation

function buildSchedule(schedule) {
  return schedule.map((entry)=>{
     entry.start = entry.time[0].split(":").map(val=>Number(val))
     entry.end = entry.time[1].split(":").map(val=>Number(val))
     delete entry.time
     if (entry.subPeriod) entry.subPeriod = buildSchedule(entry.subPeriod)
    return entry
  })
}

function getFormattedDate() {
  return `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`
}

function nameToSchedule(name) {
  if (name == "regular" || name == "normal") return JSON.parse(regular)
  else if (name == "thursday" || name == "advisory") return JSON.parse(thursday)
  else if (name == "no-school") return "no-school"
  else if (customSchedules[name]) {
    return [... customSchedules[name]]
  }
}

function getDailySchedule() {
  let day = dotw[new Date().getDay()]
  const formattedDate = getFormattedDate()
  if (scheduleOverrides[formattedDate]) { 
    console.log(`Using date override schedule! ${formattedDate}: ${scheduleOverrides[formattedDate]}`)
    return nameToSchedule(scheduleOverrides[formattedDate])
  }
  else {
    console.log(`Using default ${devDay || day} schedule: ${scheduleDefaults[devDay || day]}`)
    return nameToSchedule(scheduleDefaults[devDay || day])
  }
}

// Settings

function createSVG(viewBox, paths) {
  let ns = "http://www.w3.org/2000/svg"
  let svg = document.createElementNS(ns, "svg")
  svg.setAttributeNS(null, "viewBox", viewBox)
  paths.forEach((path)=>{
    let pathElem = document.createElementNS(ns, "path")
    pathElem.setAttributeNS(null, "d", path)
    svg.appendChild(pathElem)
  })
  return svg
}

function createCheckbox(label, callback, selected) {
	let container = document.createElement("div")
	container.classList.add("checkbox")
  let checkbox = document.createElement("div")
  checkbox.appendChild(createSVG("0 0 24 24",["M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"]))
  if (selected) checkbox.classList.add("selected")
  container.addEventListener("click", ()=>{
    callback(!checkbox.classList.contains("selected"))
    checkbox.classList.toggle("selected")
  })

	let title = document.createElement("p")
	title.textContent = label
	container.appendChild(checkbox)
  container.appendChild(title)
	return container
}

function createOption(label, options, callback, selected) {
	let container = document.createElement("div")
	container.classList.add("lunch-period")
	let title = document.createElement("p")
	title.textContent = label
	let select = document.createElement("div")
	select.classList.add("select")
	options.forEach((option)=>{
		let p = document.createElement("p")
		p.textContent = option
		p.addEventListener("click", ()=>{
			if (p.classList.contains("selected")) {
				p.classList.remove("selected")
				callback(option, true)
			}
			else {
				Array.from(p.parentElement.children).forEach((child)=>{child.classList.remove("selected")})
				p.classList.add("selected")
				callback(option)
			}
		})
		if (option === selected) p.classList.add("selected")
		select.appendChild(p)
	})
	container.appendChild(title)
	container.appendChild(select)
	return container
}

// var options = {
//   "timeFormat": "12", // "12" or "24"
//   "lunches": {
//     // "Period 4": "C Lunch",
//     // "Period 5": "A Lunch"
//   }
// }

function settingsSave() {
  localStorage.options = JSON.stringify(options)
}

function settingsInit() {
  if (localStorage.options) {
    let temp = JSON.parse(localStorage.options)
    if (temp.bLunch !== usingBLunch && Object.keys(temp.lunches).length !== 0) {
      temp.lunches = {}
      temp.bLunch = usingBLunch
      showToast("Due to schedule changes, your lunches have been reset.")
    }
    options = temp
    settingsSave()

  }
  else {
    options = {
      "timeFormat": "12",
      "lunches": {},
      "version": 1,
      "bLunch": usingBLunch
    }
    settingsSave()
  }
  const lunches = usingBLunch ? ["A", "B", "C"] : ["A", "C"]
  let p4 = createOption("Period 4", lunches, (option, disable)=>{
    if (disable) delete options.lunches["Period 4"]
    else {
      options.lunches["Period 4"] = option + " Lunch"
    }

    settingsSave()
    switchPeriod(getTimeArr())
  }, (options.lunches["Period 4"]||"").slice(0,1))
  let p5 = createOption("Period 5", lunches, (option, disable)=>{
    if (disable) delete options.lunches["Period 5"]
    else {
      options.lunches["Period 5"] = option + " Lunch"
    }
    settingsSave()
    switchPeriod(getTimeArr())
  }, (options.lunches["Period 5"]||"").slice(0,1))
  let timeStyle = createCheckbox("24-Hour Time", (is24Hour)=>{
    options.timeFormat = is24Hour ? "24" : "12"
    tick()
    let currentPeriod = activePeriods.current || {}
    if (currentPeriod.id === "period" || currentPeriod.id === "transition") document.getElementById("currentPeriodSchedule").textContent = getTimeRangeText(activePeriods.current, options.timeFormat === "12")
    settingsSave()
  }, options.timeFormat === "24")
  let menu = document.getElementById("lunchSelect")
  menu.appendChild(p4)
  menu.appendChild(p5)
  let generalSettings = document.getElementById("generalSettings")
  generalSettings.appendChild(timeStyle)
}

// Toast Notification

document.getElementById("toastAccept").addEventListener("click", hideToast)

function showToast(message) {
  document.getElementById("toastMessage").textContent = message
  document.getElementById("toast").classList.add("show")
}

function hideToast() {
  document.getElementById("toast").classList.remove("show")
}

function initDevTools(consoleRun, targetTime) {
  const devMode = consoleRun || false
  const devTargetTime = targetTime || [7,30]
  const targetDay = "Monday"
  const devBLunch = null
  if (!devMode) return
  if (devMode) {
    document.getElementById("simTime").classList.add("devMode")
    devDay = targetDay
    if (devBLunch===true) usingBLunch = true
    else if (devBLunch === false) usingBLunch = false
    const now = new Date()
    devOffsetHours = devTargetTime[0] - now.getHours()
    devOffsetMinutes = devTargetTime[1] - now.getMinutes()
    console.log("Offset:", devOffsetHours, "hours", devOffsetMinutes, "mins" )
  }
}

// Startup and Reset

function startNewDay(now) {
  dailySchedule = null
  let schedule = getDailySchedule(now)
  if (!(typeof schedule == "string")) {
    dailySchedule = buildSchedule(schedule)
    activePeriods.noSchool = false
  } else {
    activePeriods.noSchool = true
  }
  activePeriods.day = now.getDay()
  switchPeriod(getTimeArr())
}

function init() {
  if (emergencyMaintenence) {
    maintenence()
    return
  }
  const now = new Date()
  settingsInit()
  startNewDay(now)
  setInterval(tick, 1000)
  if (showToastMessage) showToast(toastMessage)
}

init()

fetch("/analytics/increment_user", {
  "method": "POST",
  "body": window.location.pathname
})
