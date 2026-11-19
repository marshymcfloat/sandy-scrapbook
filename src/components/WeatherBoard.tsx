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
            <h2 id="weather-title">Weather</h2>
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
      <p className="weather-source">
        Manila time ·{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open-Meteo
        </a>{" "}
        summary (
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        )
      </p>
    </section>
  );
}
