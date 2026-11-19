import { weatherPanels } from "../weather";
import { MoviePlayer } from "./MoviePlayer";
import { Notes } from "./Notes";
import { WeatherBoard } from "./WeatherBoard";

export function Scrapbook() {
  return (
    <>
      <header className="masthead wrap">
        <div className="wordmark">
          Sandy’s <em>Scrapbook</em>
        </div>
        <form action="/lock" method="post">
          <button className="lock-button" type="submit">
            Lock shelf
          </button>
        </form>
      </header>
      <main className="scrapbook">
        <WeatherBoard initialPanels={weatherPanels()} />
        <MoviePlayer />
        <Notes />
        <section className="favorites" aria-labelledby="favorites-title">
          <h2 id="favorites-title">A few things from our chats</h2>
          <div className="shelf">
            <section className="scrap snack-scrap">
              <img
                src="/assets/scrapbook-ice-cream.webp"
                width="315"
                height="352"
                alt=""
                loading="lazy"
                decoding="async"
              />
              <h3>Strawberry ice cream</h3>
            </section>
            <section className="scrap music-scrap">
              <div className="music-title">
                <img
                  src="/assets/scrapbook-record.webp"
                  width="315"
                  height="352"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <h3>Songs</h3>
              </div>
              <ul className="tracks">
                <li>
                  <a
                    href="https://www.youtube.com/watch?v=vabnZ9-ex7o"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      Come As You Are <small>Nirvana</small>
                    </span>
                    <span aria-hidden="true" className="track-arrow">
                      ↗
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/watch?v=pKFd12id5oQ"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      Always <small>Daniel Caesar</small>
                    </span>
                    <span aria-hidden="true" className="track-arrow">
                      ↗
                    </span>
                  </a>
                </li>
              </ul>
            </section>
            <section className="scrap flowers-scrap">
              <img
                src="/assets/scrapbook-flowers.webp"
                width="325"
                height="352"
                alt=""
                loading="lazy"
                decoding="async"
              />
              <h3>Tulips &amp; lilies</h3>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
