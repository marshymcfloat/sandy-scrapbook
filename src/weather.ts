import { htmlResponse, textResponse } from "./responses";

const places = [
  { name: "Makati", latitude: 14.5547, longitude: 121.0244 },
  { name: "Mandaluyong", latitude: 14.5794, longitude: 121.0359 },
  { name: "BGC", latitude: 14.5507, longitude: 121.0502 },
];

const timeZone = "Asia/Manila";
const localDate = new Intl.DateTimeFormat("en-CA", {
  timeZone, year: "numeric", month: "2-digit", day: "2-digit",
});
const localTime = new Intl.DateTimeFormat("en-GB", {
  timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const dateLabel = new Intl.DateTimeFormat("en-PH", {
  timeZone, month: "short", day: "numeric",
});
const timeLabel = new Intl.DateTimeFormat("en-PH", {
  timeZone, hour: "numeric", minute: "2-digit",
});

const conditionLabels: Record<number, string> = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Fog",
  51: "Drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  56: "Freezing drizzle", 57: "Freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Freezing rain",
  71: "Snow", 73: "Snow", 75: "Snow", 77: "Snow",
  80: "Showers", 81: "Showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Snow showers",
  95: "Thunderstorms", 96: "Thunderstorms", 97: "Thunderstorms", 99: "Thunderstorms",
};
const rainyCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 97, 99]);
const rainThreshold = 40;

type Reading = number | null;

interface OpenMeteoForecast {
  current?: {
    time?: string;
    temperature_2m?: Reading;
    precipitation?: Reading;
    weather_code?: Reading;
    is_day?: Reading;
  };
  daily?: {
    time: string[];
    temperature_2m_max: Reading[];
    precipitation_probability_max: Reading[];
  };
  hourly?: {
    time: string[];
    precipitation_probability: Reading[];
    temperature_2m?: Reading[];
    weather_code?: Reading[];
    is_day?: Reading[];
  };
}

type SkyArt = "clouds" | "rain" | "sun" | "moon";

interface SkyReading {
  name: string;
  temperature: Reading;
  condition?: string;
  art?: SkyArt;
  hourlyRain?: Reading;
}

interface AreaReadings extends SkyReading {
  high: Reading;
  rain: Reading;
}

interface UpcomingForecast {
  at: Date;
  crossesMidnight: boolean;
  areas: SkyReading[];
}

function weatherArt(code: number, isDay: Reading | undefined): SkyArt {
  if (rainyCodes.has(code)) return "rain";
  if (code === 0 || code === 1) {
    if (isDay === 1) return "sun";
    if (isDay === 0) return "moon";
  }
  return "clouds";
}

function readingRow(name: string, value: string, detail: string) {
  return `<li class="weather-reading">
    <span class="weather-place">${name}</span>
    <span class="weather-reading-detail">${detail}</span>
    <strong class="weather-value">${value}</strong>
  </li>`;
}

function temperatureReadings(areas: SkyReading[], view: "now" | "upcoming") {
  const rows = areas.map(({ name, temperature, condition, art, hourlyRain }) => {
    const showCondition = condition && /Fog|Thunderstorms|Snow|Freezing|Heavy/.test(condition);
    const icon = condition && art
      ? `<img class="weather-condition-art" src="/assets/weather-${art}.webp" width="27" height="27" alt="${showCondition ? "" : condition}" title="${condition}" decoding="async">`
      : "";
    const label = showCondition ? `<small class="weather-condition-label">${condition}</small>` : "";
    const rain = hourlyRain == null ? "" : `<span class="weather-hourly-rain" title="${hourlyRain}% chance of rain">
      <span aria-hidden="true">${hourlyRain}%</span><span class="weather-screen-reader">${hourlyRain}% chance of rain</span>
    </span>`;
    return readingRow(name, temperature === null ? "—" : `${temperature}°C`, icon + label + rain);
  }).join("");
  return `<ul id="weather-${view}-readings" class="weather-readings" data-weather-view="${view}"${view === "upcoming" ? " hidden" : ""}>${rows}</ul>`;
}

export function weatherPanels({
  areas = places.map(({ name }) => ({ name, temperature: null, high: null, rain: null })),
  tomorrowArt = "clouds",
  observedAt,
  tomorrow,
  upcoming,
}: {
  areas?: AreaReadings[];
  tomorrowArt?: SkyArt;
  observedAt?: Date;
  tomorrow?: Date;
  upcoming?: UpcomingForecast;
} = {}) {
  const currentTime = observedAt
    ? `<time datetime="${observedAt.toISOString()}">${timeLabel.format(observedAt)}</time>`
    : "";
  const upcomingTime = upcoming
    ? `<time datetime="${upcoming.at.toISOString()}">${upcoming.crossesMidnight ? `${dateLabel.format(upcoming.at)} · ` : ""}${timeLabel.format(upcoming.at)}</time>`
    : "";
  const upcomingRainLabel = upcoming?.areas.some(({ hourlyRain }) => hourlyRain != null) ? " · Rain chance" : "";
  const tomorrowDate = tomorrow
    ? `<time datetime="${localDate.format(tomorrow)}">${dateLabel.format(tomorrow)}</time> · `
    : "";
  const tomorrowRows = areas.map(({ name, high, rain }) => {
    const highReading = high === null ? "" : `<span class="weather-high" title="High ${high}°C">
      <span aria-hidden="true">↑</span><span class="weather-screen-reader">High </span>${high}°C
    </span>`;
    const meter = rain === null ? "" : `<meter class="weather-rain-meter" min="0" max="100" value="${rain}" aria-hidden="true"></meter>`;
    return readingRow(name, rain === null ? "—" : `${rain}%`, meter + highReading);
  }).join("");

  return `<section class="weather-panel weather-now" aria-labelledby="weather-now-title">
    <header class="weather-period-header">
      <h3 id="weather-now-title">Now</h3>
      <button class="weather-period-switch" type="button" aria-label="Show weather in about four hours" disabled>
        <span class="weather-period-label">+4h</span><span class="weather-period-arrow" aria-hidden="true"></span>
      </button>
      <p class="weather-period-caption" data-weather-view="now">${currentTime}</p>
      ${upcoming ? `<p class="weather-period-caption" data-weather-view="upcoming" hidden>${upcomingTime}${upcomingRainLabel}</p>` : ""}
    </header>
    ${temperatureReadings(areas, "now")}
    ${upcoming ? temperatureReadings(upcoming.areas, "upcoming") : ""}
  </section>
  <section class="weather-panel weather-tomorrow" aria-labelledby="weather-tomorrow-title">
    <header class="weather-period-header">
      <h3 id="weather-tomorrow-title">Tomorrow</h3>
      <img class="weather-sky" src="/assets/weather-${tomorrowArt}.webp" width="184" height="184" alt="" decoding="async">
      <p class="weather-period-caption">${tomorrowDate}Peak rain chance</p>
    </header>
    <ul class="weather-readings">${tomorrowRows}</ul>
  </section>`;
}

function wholeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

function rainChance(value: unknown) {
  return typeof value === "number" && value >= 0 && value <= 100 ? Math.round(value) : null;
}

export async function weatherResponse(showPanels = false) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const todayDate = localDate.format(now);
  const tomorrowDate = localDate.format(tomorrow);
  const nowInManila = `${todayDate}T${localTime.format(now)}`;
  const hour = 3_600_000;
  const upcomingAt = new Date(Math.round((now.getTime() + 4 * hour) / hour) * hour);
  const upcomingDate = localDate.format(upcomingAt);
  const upcomingSlot = `${upcomingDate}T${localTime.format(upcomingAt)}`;
  const parameters = new URLSearchParams({
    latitude: places.map(({ latitude }) => latitude).join(","),
    longitude: places.map(({ longitude }) => longitude).join(","),
    current: "temperature_2m,precipitation,weather_code,is_day",
    hourly: "precipitation_probability,temperature_2m,weather_code,is_day",
    daily: "temperature_2m_max,precipitation_probability_max",
    timezone: timeZone,
    start_date: todayDate,
    end_date: tomorrowDate,
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`, {
      cf: { cacheEverything: true, cacheTtlByStatus: { "200": 300 } },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);

    const forecasts = await response.json<OpenMeteoForecast[]>();
    if (!Array.isArray(forecasts) || forecasts.length !== places.length) {
      throw new Error("Unexpected forecast response");
    }

    const weather = places.map(({ name }, index) => {
      const { current, daily, hourly } = forecasts[index] ?? {};
      const code = wholeNumber(current?.weather_code) ?? -1;
      const temperature = wholeNumber(current?.temperature_2m);
      const condition = conditionLabels[code];
      const tomorrowIndex = daily?.time?.indexOf(tomorrowDate) ?? -1;
      const high = wholeNumber(daily?.temperature_2m_max?.[tomorrowIndex]);
      const rain = rainChance(daily?.precipitation_probability_max?.[tomorrowIndex]);
      const rainNow = rainyCodes.has(code) || (current?.precipitation ?? 0) > 0;
      // Hourly probabilities describe the hour ending at each timestamp.
      const chancesLater = hourly?.time?.flatMap((end, hour) =>
        end > nowInManila && end <= `${tomorrowDate}T00:00`
          ? [rainChance(hourly.precipitation_probability?.[hour])]
          : []) ?? [];
      const rainLater = chancesLater.some((chance) => (chance ?? 0) >= rainThreshold);
      const hasRainForecast = rain !== null && chancesLater.length > 0
        && chancesLater.every((chance) => chance !== null);

      const upcomingIndex = hourly?.time?.indexOf(upcomingSlot) ?? -1;
      const upcomingCode = wholeNumber(hourly?.weather_code?.[upcomingIndex]) ?? -1;
      const upcoming: SkyReading = {
        name,
        temperature: wholeNumber(hourly?.temperature_2m?.[upcomingIndex]),
        condition: conditionLabels[upcomingCode],
        art: weatherArt(upcomingCode, hourly?.is_day?.[upcomingIndex]),
        hourlyRain: rainChance(hourly?.precipitation_probability?.[upcomingIndex]),
      };
      return { name, temperature, condition, art: weatherArt(code, current?.is_day), high, rain, rainNow, rainLater, hasRainForecast, upcoming };
    });
    const upcomingAreas = weather.map((area) => area.upcoming);
    const hasUpcoming = upcomingAreas.some(({ temperature, condition, hourlyRain }) =>
      temperature !== null || !!condition || hourlyRain != null);
    if (!(showPanels && hasUpcoming) && weather.every(({ temperature, condition, high, rain }) =>
      temperature === null && !condition && high === null && rain === null)) {
      throw new Error("Forecast has no readings");
    }

    const raining = weather.some(({ rainNow }) => rainNow);
    const rainToday = raining || weather.some(({ rainLater }) => rainLater);
    const rainTomorrow = weather.some(({ rain }) => (rain ?? 0) >= rainThreshold);
    const rainyDays = [rainToday && "today", rainTomorrow && "tomorrow"].filter(Boolean).join(" and ");
    const hasRainForecast = weather.every((area) => area.hasRainForecast);
    let outlook = hasRainForecast ? "Low rain chance" : "Forecast incomplete";
    if (rainyDays) outlook = `Rain possible ${rainyDays}`;
    if (raining) outlook = rainTomorrow ? "Rain now, possible tomorrow" : "Rain now";

    if (showPanels) {
      const observedAt = new Date(`${forecasts[0]?.current?.time}+08:00`);
      const panels = weatherPanels({
        areas: weather,
        tomorrowArt: rainTomorrow ? "rain" : "clouds",
        observedAt: Number.isFinite(observedAt.getTime()) ? observedAt : undefined,
        tomorrow,
        upcoming: hasUpcoming ? { at: upcomingAt, crossesMidnight: upcomingDate !== todayDate, areas: upcomingAreas } : undefined,
      });
      return htmlResponse(`<div data-weather-panels data-outlook="${outlook}"${rainyDays ? " data-rain" : ""}>${panels}</div>`);
    }

    const reminder = rainyDays
      ? `<p class="weather-reminder"><strong>Rain possible ${rainyDays}.</strong>
        Umbrella and a charged power bank if you’re heading out.</p>`
      : "";
    const rows = weather.map(({ name, temperature, condition, high, rain }) => `<tr>
      <th scope="row">${name}</th>
      <td>
        ${temperature === null ? "" : `<strong>${temperature}°C</strong>`}
        <small>${condition ?? "Condition unavailable"}</small>
      </td>
      <td>
        ${rain === null ? "<small>Rain chance unavailable</small>" : `<strong>Up to ${rain}%</strong> <small>chance of rain</small>`}
        ${high === null ? "" : `<small>High ${high}°C</small>`}
      </td>
    </tr>`).join("");

    return htmlResponse(`${reminder}
      <table class="weather-table" aria-label="Weather by area" data-outlook="${outlook}"${rainyDays ? " data-rain" : ""}>
        <thead><tr>
          <th scope="col">Area</th>
          <th scope="col">Now</th>
          <th scope="col">Tomorrow <small><time datetime="${tomorrowDate}">${dateLabel.format(tomorrow)}</time></small></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  } catch (error) {
    console.warn("Weather update unavailable", error);
    return textResponse("Weather is unavailable right now.", 503);
  }
}
