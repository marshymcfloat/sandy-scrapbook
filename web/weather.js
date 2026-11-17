const forecast = document.querySelector("#weather-forecast");
const status = document.querySelector("#weather-status");
const packReminder = document.querySelector("#weather-pack");
const noteArt = document.querySelector("#weather-note-art");
const emptyForecast = forecast.innerHTML;
const refreshInterval = 15 * 60_000;
let nextRefresh = 0;
let showingUpcoming = false;

function updateWeatherView() {
  const switchButton = forecast.querySelector(".weather-period-switch");
  if (!switchButton) return;

  const available = !!forecast.querySelector("#weather-upcoming-readings");
  const upcoming = available && showingUpcoming;
  const activeView = upcoming ? "upcoming" : "now";
  for (const view of forecast.querySelectorAll("[data-weather-view]")) {
    view.hidden = view.dataset.weatherView !== activeView;
  }

  forecast.querySelector("#weather-now-title").textContent = upcoming ? "In 4h" : "Now";
  switchButton.disabled = !available;
  const switchLabel = switchButton.querySelector(".weather-period-label") ?? switchButton;
  switchLabel.textContent = upcoming ? "Now" : "+4h";
  switchButton.toggleAttribute("data-return", upcoming);
  const label = upcoming ? "Show current weather" : "Show weather in about four hours";
  switchButton.setAttribute("aria-label", available ? label : "Four-hour forecast unavailable");
}

forecast.addEventListener("click", (event) => {
  const switchButton = event.target.closest?.(".weather-period-switch");
  if (!switchButton || switchButton.disabled) return;
  showingUpcoming = !showingUpcoming;
  updateWeatherView();
});

async function refreshWeather() {
  if (document.hidden || Date.now() < nextRefresh) return;
  nextRefresh = Date.now() + refreshInterval;
  if (!forecast.hasAttribute("data-loaded")) status.textContent = "Checking the forecast…";

  try {
    let response = await fetch("/weather?view=panels");
    if (response.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!document.hidden) response = await fetch("/weather?view=panels");
    }
    if (!response.ok) throw new Error("Forecast unavailable");
    const template = document.createElement("template");
    template.innerHTML = await response.text();
    const panels = template.content.querySelector("[data-weather-panels]");
    if (!panels) throw new Error("Forecast unavailable");

    const hadSwitchFocus = !!forecast.querySelector(".weather-period-switch:focus");
    forecast.replaceChildren(...panels.children);
    updateWeatherView();
    if (hadSwitchFocus) forecast.querySelector(".weather-period-switch")?.focus({ preventScroll: true });
    forecast.setAttribute("data-loaded", "");
    status.textContent = panels.dataset.outlook ?? "Forecast ready";
    const packForRain = panels.hasAttribute("data-rain");
    packReminder.hidden = !packForRain;
    noteArt.src = packForRain ? "/assets/weather-umbrella.webp" : "/assets/weather-clouds.webp";
  } catch {
    forecast.innerHTML = emptyForecast;
    updateWeatherView();
    forecast.removeAttribute("data-loaded");
    status.textContent = "Forecast unavailable";
    packReminder.hidden = true;
    noteArt.src = "/assets/weather-clouds.webp";
    nextRefresh = Date.now() + 60_000;
  }
}

void refreshWeather();
setInterval(refreshWeather, 60_000);
document.addEventListener("visibilitychange", refreshWeather);
