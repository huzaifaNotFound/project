const wallpaper = document.getElementById("wallpaper");
const dock = document.getElementById("dock");
const weather = document.getElementById("weather");

/* Time + Date */
function updateTime() {
  const now = new Date();

  document.getElementById("time").textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  document.getElementById("date").textContent =
    now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
setInterval(updateTime, 1000);
updateTime();

/* Background sampling */
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

wallpaper.onload = () => {
  canvas.width = wallpaper.naturalWidth;
  canvas.height = wallpaper.naturalHeight;
  ctx.drawImage(wallpaper, 0, 0);
  updateTheme();
};

function updateTheme() {
  const x = canvas.width / 2;
  const y = canvas.height * 0.85;

  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness > 140) {
    dock.style.background = "rgba(0,0,0,0.3)";
    dock.style.color = "white";

    weather.style.background = "rgba(0,0,0,0.35)";
    weather.style.color = "white";
  } else {
    dock.style.background = "rgba(255,255,255,0.2)";
    dock.style.color = "black";

    weather.style.background = "rgba(255,255,255,0.15)";
    weather.style.color = "black";
  }
}

/* WEATHER */
const API_KEY = "8c613d9a099482bf87481c0354e07439";

const iconMap = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Mist: "🌫️"
};

function getWeather(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("temp").textContent = Math.round(data.main.temp) + "°C";
      document.getElementById("condition").textContent = data.weather[0].main;
      document.getElementById("location").textContent = data.name;
      document.getElementById("details").textContent = "Humidity: " + data.main.humidity + "%";

      document.getElementById("icon").textContent =
        iconMap[data.weather[0].main] || "🌍";
    })
    .catch(() => {
      document.getElementById("condition").textContent = "Weather failed";
    });
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => getWeather(pos.coords.latitude, pos.coords.longitude),
    () => {
      document.getElementById("condition").textContent = "Location blocked";
    }
  );
}

/* ELEMENTS */
const settingsWindow = document.getElementById("settingsWindow");
const closeWindow = document.getElementById("closeWindow");
const header = document.getElementById("windowHeader");
const bgOptions = document.querySelectorAll(".bg-grid img");

/* OPEN SETTINGS (2nd icon = settings) */
document.querySelectorAll(".dock-item")[1].addEventListener("click", () => {
  settingsWindow.classList.remove("hidden");
});

/* CLOSE */
closeWindow.addEventListener("click", () => {
  settingsWindow.classList.add("hidden");
});

/* DRAGGING */
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

header.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;

  e.preventDefault(); // prevents blue selection

  isDragging = true;
  offsetX = e.clientX - settingsWindow.offsetLeft;
  offsetY = e.clientY - settingsWindow.offsetTop;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  settingsWindow.style.left = (e.clientX - offsetX) + "px";
  settingsWindow.style.top = (e.clientY - offsetY) + "px";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

/* CHANGE BACKGROUND */
bgOptions.forEach(img => {
  img.addEventListener("click", () => {
    const src = img.getAttribute("data-bg");
    wallpaper.src = src;
  });
});

