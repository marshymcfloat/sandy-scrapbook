"use client";

import { useEffect, useRef } from "react";
import { initializeMovie } from "../client/movie";
import { NotebookPaper } from "./Artwork";

export function MoviePlayer() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => initializeMovie(root.current), []);
  return (
    <section ref={root} className="feature" aria-labelledby="film-title">
      <picture className="feature-paper">
        <NotebookPaper />
      </picture>
      <div className="feature-info">
        <h1 id="film-title">
          Forrest <br className="desktop-break" />
          Gump
        </h1>
        <span className="film-pencil-stroke" aria-hidden="true"></span>
        <p className="film-details">
          1994 <span aria-hidden="true">·</span> 2h 22m
        </p>
        <button
          className="play-button"
          id="play-movie"
          type="button"
          aria-controls="movie-screen"
          hidden
        >
          <span className="play-icon" aria-hidden="true"></span>
          <span id="play-label">Play movie</span>
        </button>
        <p className="player-feedback" id="movie-status" role="status"></p>
      </div>
      <div className="movie-mat">
        <div id="movie-screen" className="movie-screen">
          <picture className="still">
            <img
              src="/assets/scrapbook-bench.webp"
              width="1088"
              height="612"
              fetchPriority="high"
              alt="Colored-pencil drawing of a park bench with tulips and a lily on the seat."
            />
          </picture>
          <video
            id="movie"
            aria-label="Forrest Gump"
            preload="none"
            controls
            playsInline
            hidden
          ></video>
          <noscript>
            <video
              aria-label="Forrest Gump"
              src="/movie.mp4"
              poster="/assets/scrapbook-bench.webp"
              preload="none"
              controls
              playsInline
            ></video>
          </noscript>
        </div>
      </div>
    </section>
  );
}
