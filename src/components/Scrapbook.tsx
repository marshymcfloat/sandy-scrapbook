import { weatherPanels } from "../weather";
import { BirthdayNote } from "./BirthdayNote";
import { MoviePlayer } from "./MoviePlayer";
import { Notes } from "./Notes";
import { WeatherBoard } from "./WeatherBoard";
import { WeatherShortcut } from "./WeatherShortcut";

export function Scrapbook() {
  return (
    <>
      <div className="masthead-shell">
        <header className="masthead wrap">
          <div className="wordmark">
            Sandy’s <em>Scrapbook</em>
          </div>
          <WeatherShortcut />
          <form action="/lock" method="post">
            <button className="lock-button" type="submit">
              Close scrapbook
            </button>
          </form>
        </header>
      </div>
      <main className="scrapbook">
        <BirthdayNote />
        <MoviePlayer />
        <WeatherBoard initialPanels={weatherPanels()} />
        <Notes />
      </main>
    </>
  );
}
