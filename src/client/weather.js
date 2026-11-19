import { createLifecycle } from "./lifecycle";

export function initializeWeather(root) {
  if (!root) return;
  const { listen, schedule, dispose } = createLifecycle();
  const requests = new AbortController();
  let stopped = false;
  const forecast = root.querySelector("#weather-forecast");
  const status = root.querySelector("#weather-status");
  const packReminder = root.querySelector("#weather-pack");
  const noteArt = root.querySelector("#weather-note-art");
  const emptyForecast = forecast.innerHTML;
  const shortcut = document.querySelector("#weather-shortcut");
  const shortcutReadings = shortcut?.querySelector("#weather-shortcut-readings");
  const masthead = shortcut?.closest(".masthead");
  const refreshInterval = 15 * 60_000;
  let nextRefresh = 0;
  let showingUpcoming = false;
  let boardObserver;
  let headerObserver;
  let headerHeight = -1;

  // Both views use the same response, so the navbar never starts a second request.
  function updateShortcut(state) {
    if (!shortcut || !shortcutReadings) return;
    const rows = [...forecast.querySelectorAll("#weather-now-readings .weather-reading")];
    const hasCurrentWeather = state === "ready" && rows.some((row) =>
      row.querySelector(".weather-value").textContent !== "—" ||
      row.querySelector(".weather-condition-art"),
    );
    shortcut.dataset.state = hasCurrentWeather ? "ready" :
      state === "loading" ? "loading" : "unavailable";
    shortcut.querySelector(".weather-shortcut-label").textContent = hasCurrentWeather ? "Now" : "Weather";

    if (!hasCurrentWeather) {
      const message = state === "loading" ? "Checking the forecast…" :
        state === "ready" ? "Current weather unavailable" : "Forecast unavailable";
      const text = document.createElement("span");
      text.className = "weather-shortcut-status";
      text.textContent = message;
      shortcutReadings.replaceChildren(text);
      shortcut.setAttribute("aria-label", `${message}. View the full forecast.`);
      return;
    }

    const labels = [];
    const readings = rows.map((row) => {
      const place = row.querySelector(".weather-place").textContent;
      const temperature = row.querySelector(".weather-value").textContent;
      const conditionArt = row.querySelector(".weather-condition-art");
      const condition = conditionArt?.title ?? "";
      labels.push(`${place}: ${condition ? `${condition}, ` : ""}${temperature === "—" ? "temperature unavailable" : temperature}`);

      const reading = document.createElement("span");
      reading.className = "weather-shortcut-area";
      const name = document.createElement("span");
      name.className = "weather-shortcut-place";
      name.textContent = place;
      const value = document.createElement("strong");
      value.className = "weather-shortcut-temperature";
      value.textContent = temperature;
      const icon = conditionArt ? conditionArt.cloneNode() : document.createElement("span");
      icon.className = "weather-shortcut-icon";
      icon.setAttribute("aria-hidden", "true");
      if (conditionArt) icon.alt = "";
      else icon.textContent = "?";
      reading.append(name, icon, value);
      return reading;
    });
    shortcutReadings.replaceChildren(...readings);
    shortcut.setAttribute("aria-label", `Current weather. ${labels.join(". ")}. View the full forecast.`);
  }

  if (shortcut && masthead) {
    listen(shortcut, "click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      root.focus({ preventScroll: true });
      root.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    });
    if ("IntersectionObserver" in window) {
      const observeBoard = () => {
        const height = Math.ceil(masthead.getBoundingClientRect().height);
        if (height === headerHeight) return;
        headerHeight = height;
        root.style.setProperty("--weather-scroll-offset", `${height + 20}px`);
        boardObserver?.disconnect();
        boardObserver = new IntersectionObserver(([entry]) => {
          shortcut.toggleAttribute("data-full-visible", entry.isIntersecting);
          shortcut.inert = entry.isIntersecting;
          shortcut.setAttribute("aria-hidden", String(entry.isIntersecting));
        }, { rootMargin: `-${height}px 0px 0px 0px` });
        boardObserver.observe(root);
      };
      observeBoard();
      headerObserver = new ResizeObserver(observeBoard);
      headerObserver.observe(masthead);
    }
  }

  function updateWeatherView() {
    const switchButton = forecast.querySelector(".weather-period-switch");
    if (!switchButton) return;

    const available = !!forecast.querySelector("#weather-upcoming-readings");
    const upcoming = available && showingUpcoming;
    const activeView = upcoming ? "upcoming" : "now";
    for (const view of forecast.querySelectorAll("[data-weather-view]")) {
      view.hidden = view.dataset.weatherView !== activeView;
    }

    forecast.querySelector("#weather-now-title").textContent = upcoming
      ? "In 4h"
      : "Now";
    switchButton.disabled = !available;
    const switchLabel =
      switchButton.querySelector(".weather-period-label") ?? switchButton;
    switchLabel.textContent = upcoming ? "Now" : "+4h";
    switchButton.toggleAttribute("data-return", upcoming);
    const label = upcoming
      ? "Show current weather"
      : "Show weather in about four hours";
    switchButton.setAttribute(
      "aria-label",
      available ? label : "Four-hour forecast unavailable",
    );
  }

  listen(forecast, "click", (event) => {
    const switchButton = event.target.closest?.(".weather-period-switch");
    if (!switchButton || switchButton.disabled) return;
    showingUpcoming = !showingUpcoming;
    updateWeatherView();
  });

  async function refreshWeather() {
    if (stopped || document.hidden || Date.now() < nextRefresh) return;
    nextRefresh = Date.now() + refreshInterval;
    if (!forecast.hasAttribute("data-loaded"))
      status.textContent = "Checking the forecast…";
    if (!forecast.hasAttribute("data-loaded")) updateShortcut("loading");

    try {
      let response = await fetch("/weather?view=panels", {
        signal: requests.signal,
      });
      if (response.status === 503) {
        await new Promise((resolve) => schedule(resolve, 1500));
        if (!document.hidden)
          response = await fetch("/weather?view=panels", {
            signal: requests.signal,
          });
      }
      if (stopped) return;
      if (!response.ok) throw new Error("Forecast unavailable");
      const template = document.createElement("template");
      template.innerHTML = await response.text();
      const panels = template.content.querySelector("[data-weather-panels]");
      if (!panels) throw new Error("Forecast unavailable");

      const hadSwitchFocus = !!forecast.querySelector(
        ".weather-period-switch:focus",
      );
      forecast.replaceChildren(...panels.children);
      updateWeatherView();
      if (hadSwitchFocus)
        forecast
          .querySelector(".weather-period-switch")
          ?.focus({ preventScroll: true });
      forecast.setAttribute("data-loaded", "");
      updateShortcut("ready");
      status.textContent = panels.dataset.outlook ?? "Forecast ready";
      const packForRain = panels.hasAttribute("data-rain");
      packReminder.hidden = !packForRain;
      noteArt.src = packForRain
        ? "/assets/weather-umbrella.webp"
        : "/assets/weather-clouds.webp";
    } catch {
      if (stopped) return;
      forecast.innerHTML = emptyForecast;
      updateWeatherView();
      forecast.removeAttribute("data-loaded");
      updateShortcut("unavailable");
      status.textContent = "Forecast unavailable";
      packReminder.hidden = true;
      noteArt.src = "/assets/weather-clouds.webp";
      nextRefresh = Date.now() + 60_000;
    }
  }

  void refreshWeather();
  const interval = setInterval(refreshWeather, 60_000);
  listen(document, "visibilitychange", refreshWeather);
  return () => {
    stopped = true;
    requests.abort();
    clearInterval(interval);
    boardObserver?.disconnect();
    headerObserver?.disconnect();
    if (shortcut) {
      shortcut.removeAttribute("data-full-visible");
      shortcut.removeAttribute("aria-hidden");
      shortcut.inert = false;
    }
    dispose();
  };
}
