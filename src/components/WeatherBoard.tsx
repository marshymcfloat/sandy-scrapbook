"use client";

import { useEffect, useRef } from "react";
import { initializeWeather } from "../client/weather";

export function WeatherBoard({ initialPanels }: { initialPanels: string }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => initializeWeather(root.current), []);
  return (
    <section
      ref={root}
      className="weather-board"
      id="weather"
      aria-labelledby="weather-title"
      tabIndex={-1}
    >
      <div className="weather-deck">
        <div className="weather-note">
          <div className="weather-note-copy">
            <div className="weather-note-heading">
              <h2 id="weather-title">Weather</h2>
              <details className="weather-about">
                <summary aria-label="About the forecast">
                  <svg
                    viewBox="0 0 24 24"
                    width="19"
                    height="19"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 3.2C6.8 2.8 3 6.8 3.2 12c-.3 5 3.7 9 8.8 8.8 5.1.3 9-3.9 8.8-8.8.3-5.1-3.9-9.2-8.8-8.8Z" />
                    <path d="m11.4 10 1.1-.1-.3 7m-.3-10.3h.1" />
                  </svg>
                </summary>
                <p className="weather-source" id="weather-attribution">
                  Forecast data by{" "}
                  <a
                    href="https://open-meteo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open-Meteo
                  </a>
                  , summarized under{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    CC BY 4.0
                  </a>
                  . Times shown in Manila.
                </p>
              </details>
            </div>
            <p className="weather-status" id="weather-status" role="status">
              Forecast unavailable
            </p>
          </div>
          <ul
            className="weather-pack"
            id="weather-pack"
            role="list"
            aria-label="Pack for rain"
            hidden
          >
            <li>Umbrella</li>
            <li>Charged power bank</li>
          </ul>
          <img
            className="weather-note-art"
            id="weather-note-art"
            src="/assets/weather-clouds.webp"
            width="360"
            height="360"
            alt=""
            decoding="async"
          />
        </div>
        <div
          className="weather-periods"
          id="weather-forecast"
          dangerouslySetInnerHTML={{ __html: initialPanels }}
        />
      </div>
    </section>
  );
}
