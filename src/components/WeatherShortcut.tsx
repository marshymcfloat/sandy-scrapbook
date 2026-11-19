export function WeatherShortcut() {
  return (
    <a
      className="weather-shortcut"
      id="weather-shortcut"
      href="#weather"
      aria-label="Weather. View the full forecast."
      data-state="loading"
    >
      <span className="weather-shortcut-label">Weather</span>
      <span className="weather-shortcut-readings" id="weather-shortcut-readings">
        <span className="weather-shortcut-status">Checking the forecast…</span>
      </span>
      <span className="weather-shortcut-arrow" aria-hidden="true">↓</span>
    </a>
  );
}
