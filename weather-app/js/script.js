// My Weather App - script.js
// Uses two free weather APIs that don't need an API key:
// 1) Open-Meteo (main data source, has hourly + 7 day forecast)
// 2) MET Norway / Yr.no (just used to compare temperature with Open-Meteo)

let currentUnit = "C"; // C, F or K
let currentData = null; // keeps the last weather result so we can switch units without re-fetching
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

window.onload = function () {
  showFavorites();
  getWeather(60.17, 24.94, "Helsinki"); // load a default city so the page isn't empty
};

function searchCity() {
  let city = document.getElementById("city-input").value.trim();
  if (city === "") {
    alert("Please type a city name first.");
    return;
  }

  document.getElementById("status").innerText = "Searching...";

  fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + city)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data.results || data.results.length === 0) {
        document.getElementById("status").innerText = "City not found, try another name.";
        return;
      }
      let place = data.results[0];
      getWeather(place.latitude, place.longitude, place.name);
    })
    .catch(function (err) {
      console.log(err);
      document.getElementById("status").innerText = "Something went wrong with the search.";
    });
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Your browser does not support location.");
    return;
  }
  document.getElementById("status").innerText = "Getting your location...";
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      getWeather(pos.coords.latitude, pos.coords.longitude, "My Location");
    },
    function () {
      document.getElementById("status").innerText = "Could not get your location.";
    }
  );
}

function getWeather(lat, lon, name) {
  document.getElementById("status").innerText = "Loading weather...";

  let openMeteoUrl =
    "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
    "&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code" +
    "&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto";

  let metNoUrl = "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=" + lat + "&lon=" + lon;

  fetch(openMeteoUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (omData) {
      // get the second source too, but don't let it break the app if it fails
      fetch(metNoUrl)
        .then(function (res) {
          return res.json();
        })
        .then(function (metData) {
          currentData = { name: name, om: omData, metno: metData };
          showWeather();
        })
        .catch(function () {
          currentData = { name: name, om: omData, metno: null };
          showWeather();
        });
    })
    .catch(function (err) {
      console.log(err);
      document.getElementById("status").innerText = "Could not load weather data.";
    });
}

function showWeather() {
  document.getElementById("status").innerText = "";
  document.getElementById("city-name").innerText = currentData.name;

  let temp = currentData.om.current.temperature_2m;
  let code = currentData.om.current.weather_code;

  document.getElementById("current-icon").innerText = getIcon(code);
  document.getElementById("current-temp").innerText = convertTemp(temp);
  document.getElementById("current-desc").innerText = getDescription(code);

  if (currentData.metno) {
    let metTemp = currentData.metno.properties.timeseries[0].data.instant.details.air_temperature;
    document.getElementById("compare-text").innerText =
      "MET Norway (Yr.no) says: " + convertTemp(metTemp);
  } else {
    document.getElementById("compare-text").innerText = "(couldn't load the second data source)";
  }

  showHourly();
  showDaily();
  drawChart();
  setBackground(code, temp);
}

// simple conversion, rounds to whole numbers
function convertTemp(c) {
  if (currentUnit === "F") {
    return Math.round((c * 9) / 5 + 32) + "°F";
  }
  if (currentUnit === "K") {
    return Math.round(c + 273.15) + "K";
  }
  return Math.round(c) + "°C";
}

function setUnit(unit) {
  currentUnit = unit;

  let buttons = document.querySelectorAll(".unit-btn");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }
  document.getElementById("btn-" + unit.toLowerCase()).classList.add("active");

  if (currentData) {
    showWeather(); // redraw everything with the new unit, no need to fetch again
  }
}

// Open-Meteo uses "weather codes" (numbers) to describe the weather.
// This is not every single code, just the common ones.
function getIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2 || code === 3) return "⛅";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

function getDescription(code) {
  if (code === 0) return "Clear sky";
  if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Rainy";
  if (code >= 71 && code <= 77) return "Snowy";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown weather";
}

function showHourly() {
  let container = document.getElementById("hourly-forecast");
  container.innerHTML = "";

  let times = currentData.om.hourly.time;
  let temps = currentData.om.hourly.temperature_2m;
  let codes = currentData.om.hourly.weather_code;

  // the API gives us the whole day starting from midnight, so we need to
  // find where "now" is and start the list from there
  let startIndex = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] >= currentData.om.current.time) {
      startIndex = i;
      break;
    }
  }

  for (let i = startIndex; i < startIndex + 24 && i < times.length; i++) {
    let hourText = times[i].substring(11, 16); // just grab the "HH:MM" part

    let box = document.createElement("div");
    box.className = "hour-box";
    box.innerHTML =
      "<p>" + hourText + "</p>" +
      "<p>" + getIcon(codes[i]) + "</p>" +
      "<p>" + convertTemp(temps[i]) + "</p>";
    container.appendChild(box);
  }
}

function showDaily() {
  let container = document.getElementById("daily-forecast");
  container.innerHTML = "";

  let dates = currentData.om.daily.time;
  let maxTemps = currentData.om.daily.temperature_2m_max;
  let minTemps = currentData.om.daily.temperature_2m_min;
  let codes = currentData.om.daily.weather_code;

  for (let i = 0; i < dates.length; i++) {
    let dayName = new Date(dates[i]).toDateString().substring(0, 3); // e.g. "Mon"

    let box = document.createElement("div");
    box.className = "day-box";
    box.innerHTML =
      "<p>" + dayName + "</p>" +
      "<p>" + getIcon(codes[i]) + "</p>" +
      "<p>" + convertTemp(maxTemps[i]) + " / " + convertTemp(minTemps[i]) + "</p>";
    container.appendChild(box);
  }
}

// draws a simple line chart comparing the two weather sources for the next 24 hours
function drawChart() {
  let canvas = document.getElementById("chart");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let omTemps = currentData.om.hourly.temperature_2m.slice(0, 24);

  // need min/max to scale the line so it fits inside the canvas
  let allTemps = omTemps.slice();
  let metTemps = [];
  if (currentData.metno) {
    let series = currentData.metno.properties.timeseries;
    for (let i = 0; i < 24 && i < series.length; i++) {
      metTemps.push(series[i].data.instant.details.air_temperature);
    }
    allTemps = allTemps.concat(metTemps);
  }

  let maxTemp = Math.max.apply(null, allTemps);
  let minTemp = Math.min.apply(null, allTemps);
  if (maxTemp === minTemp) {
    maxTemp = maxTemp + 1; // avoid dividing by zero below
  }

  drawLine(ctx, canvas, omTemps, minTemp, maxTemp, "orange");
  let legend = "Orange line = Open-Meteo";

  if (metTemps.length > 1) {
    drawLine(ctx, canvas, metTemps, minTemp, maxTemp, "blue");
    legend += " | Blue line = MET Norway";
  }

  document.getElementById("chart-legend").innerText = legend;
}

function drawLine(ctx, canvas, temps, minTemp, maxTemp, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < temps.length; i++) {
    let x = (i / (temps.length - 1)) * canvas.width;
    let y = canvas.height - ((temps[i] - minTemp) / (maxTemp - minTemp)) * canvas.height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

// changes the page background color a bit depending on the weather - my own extra feature
function setBackground(code, temp) {
  let body = document.body;
  body.classList.remove("bg-cold", "bg-mild", "bg-hot", "bg-rain");

  if (code >= 51 && code <= 82) {
    body.classList.add("bg-rain");
  } else if (temp < 5) {
    body.classList.add("bg-cold");
  } else if (temp > 25) {
    body.classList.add("bg-hot");
  } else {
    body.classList.add("bg-mild");
  }
}

function addFavorite() {
  if (!currentData) return;

  if (favorites.indexOf(currentData.name) !== -1) {
    alert(currentData.name + " is already in your favorites.");
    return;
  }

  favorites.push(currentData.name);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  showFavorites();
}

function showFavorites() {
  let list = document.getElementById("favorites-list");
  list.innerHTML = "";

  for (let i = 0; i < favorites.length; i++) {
    let li = document.createElement("li");
    li.innerText = favorites[i];
    li.onclick = function () {
      document.getElementById("city-input").value = favorites[i];
      searchCity();
    };
    list.appendChild(li);
  }
}
