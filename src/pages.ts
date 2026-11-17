import { weatherPanels } from "./weather";

const portrait = `<picture class="still">
  <img src="/assets/scrapbook-bench.webp" width="1088" height="612" fetchpriority="high"
    alt="Colored-pencil drawing of a park bench with tulips and a lily on the seat.">
</picture>`;

const notebookPaper = `<source media="(min-width: 740px)" srcset="/assets/notebook-spread.webp">
  <img src="/assets/notebook-page.webp" width="720" height="1080" alt="" fetchpriority="high">`;

const sparklePaths = `<path fill="#ebe0ef" d="M20 6 C22 14 26 17 34 18 C27 20 24 25 23 33 C20 26 15 23 8 23 C15 20 19 15 20 6Z" />
  <path d="M43 30 Q44 36 49 38 Q44 39 43 45 Q42 40 37 38 Q42 36 43 30Z" />`;

const gateLettering = `<svg class="gate-signature" viewBox="0 0 312 170" width="312" height="170"
  fill="none" stroke="currentColor" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"
  aria-hidden="true" focusable="false">
  <path pathLength="1" d="M65 12 C52 5 31 13 17 29 C4 44 4 62 13 68 C24 77 43 66 56 51 C70 36 79 19 65 12 Z" />
  <path pathLength="1" d="M71 60 C80 54 85 47 91 42 C87 56 80 74 78 83 C83 68 91 45 102 42 C113 39 116 47 109 55 C101 63 92 63 87 58 C99 65 111 59 120 51 C128 43 139 42 136 49 C133 55 121 58 117 55 C114 61 121 66 129 62 C139 58 148 49 153 43 C151 51 148 57 147 62 C154 54 162 43 169 44 C178 45 166 57 173 61 C179 63 186 56 190 52" />
  <path pathLength="1" d="M209 55 C224 44 231 30 233 20 C230 36 217 54 222 62 C228 70 244 57 250 49 C258 37 272 18 265 17 C257 15 241 41 239 63 C246 54 257 42 264 44 C272 47 260 59 267 61 C273 64 280 54 286 49 C295 41 303 44 299 50 C295 55 285 58 281 55 C278 62 285 67 294 62 C300 60 304 56 306 54" />
  <path pathLength="1" stroke-width="4.5" d="M212 40 Q224 35 242 37" />
  <g transform="translate(1 10)">
    <path pathLength="1" d="M12 124 C23 115 27 102 34 103 C41 104 28 112 33 118 C43 128 32 140 22 137 C15 135 18 129 24 130 C36 134 48 123 55 111 C65 95 73 79 81 83 C89 91 65 110 52 118 C49 125 48 131 47 135 C56 124 68 110 76 114 C84 117 71 128 79 132 C87 135 94 124 100 118 C109 110 118 111 114 117 C110 123 98 126 94 123 C91 133 100 137 109 131 C124 122 137 98 140 86 C142 77 151 76 151 86 C151 97 135 113 122 123 C118 132 123 138 132 132 C143 127 153 111 158 101 C168 82 180 81 177 92 C173 103 163 111 151 119 C148 131 140 149 147 153 C154 158 164 138 163 126" />
    <path pathLength="1" stroke-width="4.5" d="M142 123 C154 122 166 116 186 115 C192 115 196 116 200 117" />
  </g>
</svg>`;

const gateDoodles = `<div class="gate-doodles" aria-hidden="true">
  <svg class="gate-doodle-arrow" viewBox="0 0 88 76" focusable="false">
    <path pathLength="1" d="M5 8 C29 9 51 22 49 38 C47 51 25 50 20 38 C16 24 38 23 55 35 C70 45 79 57 82 70 M69 63 Q76 65 82 70 Q85 63 86 55" />
  </svg>
  <svg class="gate-doodle-hearts" viewBox="0 0 62 56" focusable="false">
    <path fill="#edc1c6" d="M21 32 C13 26 3 13 8 7 C13 1 20 6 23 14 C28 7 35 5 38 10 C43 18 31 28 21 32Z" />
    <path fill="#f4dce6" d="M48 49 C41 45 37 38 42 35 C45 33 50 36 51 39 C54 33 59 34 60 38 C62 42 54 48 48 49Z" />
  </svg>
  <svg class="gate-doodle-sparkles" viewBox="0 0 54 50" focusable="false">
    ${sparklePaths}
  </svg>
  <svg class="gate-doodle-loop" viewBox="0 0 88 54" focusable="false">
    <path pathLength="1" d="M4 30 C7 48 22 50 39 40 C53 31 56 18 49 12 C42 5 30 15 30 26 C30 37 43 41 53 39 C67 36 80 22 82 5" />
  </svg>
</div>`;

function document(title: string, body: string, page: "gate" | "shelf") {
  const locked = page === "gate";
  return `<!doctype html>
<html lang="en"${locked ? ' class="gate-page"' : ""}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fff">
  <title>${title}</title>
  <link rel="icon" href="/assets/icon.webp" type="image/webp">
  <link rel="stylesheet" href="/assets/site.css">
  ${locked
    ? '<link rel="stylesheet" href="/assets/gate.css"><script type="module" src="/assets/gate.js"></script>'
    : '<script type="module" src="/assets/site.js"></script>'}
</head>
<body>
${body}
</body>
</html>`;
}

export function unlockPage(message?: string, invalid = false) {
  return document("Movie Shelf", `<main class="gate" aria-labelledby="gate-title"${message ? " data-feedback" : ""}>
  <div class="gate-journal">
    ${gateDoodles}
    <picture class="gate-notebook">${notebookPaper}</picture>
    <div class="gate-content">
      <h1 id="gate-title" aria-label="Open the shelf">${gateLettering}</h1>
      <span class="gate-pencil-stroke" aria-hidden="true"></span>
      <form action="/unlock" method="post" class="gate-form">
        <div class="gate-entry">
          <div class="gate-field">
            <input id="passphrase" type="password" name="passphrase" autocomplete="current-password" required
              placeholder="Passphrase" aria-label="Passphrase"
              ${message ? 'aria-describedby="unlock-feedback"' : ""}
              ${invalid ? 'aria-invalid="true" autofocus' : ""}>
            <svg class="gate-field-rule" viewBox="0 0 240 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M2 4.8 C38 3.2 77 4.7 120 4.3 C162 3.9 209 2.7 238 3.9" />
            </svg>
            <svg class="gate-field-arrow" viewBox="0 0 50 25" aria-hidden="true" focusable="false">
              <path d="M3 19 C16 24 32 20 43 5 M33 8 Q38 6 43 5 Q42 10 43 15" />
            </svg>
          </div>
          <button class="gate-submit" type="submit">
            <span>Unlock</span>
            <svg viewBox="0 0 24 12" aria-hidden="true" focusable="false">
              <path d="M2 6.8 Q10 5.6 21 6 M16 2 L21 6 Q18 7.8 16 10" />
            </svg>
          </button>
        </div>
        ${message ? `<p id="unlock-feedback" role="alert">${message}</p>` : ""}
      </form>
    </div>
    <div class="gate-illustration">
      <img src="/assets/journal-sketch.webp" width="840" height="840" alt="" fetchpriority="low">
    </div>
  </div>
</main>`, "gate");
}

export function shelfPage() {
  const deleteNoteButton = `<button class="note-action note-delete" type="button" aria-label="Delete note" title="Delete note" hidden>
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5" />
    </svg>
  </button>`;

  return document("Sandy’s Scrapbook", `<header class="masthead wrap">
  <div class="wordmark">Sandy’s <em>Scrapbook</em></div>
  <form action="/lock" method="post">
    <button class="lock-button" type="submit">Lock shelf</button>
  </form>
</header>
<main class="scrapbook">
  <section class="weather-board" id="weather" aria-labelledby="weather-title">
    <div class="weather-deck">
      <div class="weather-note">
        <div class="weather-note-copy">
          <h2 id="weather-title">Weather</h2>
          <p class="weather-status" id="weather-status" role="status">Forecast unavailable</p>
        </div>
        <ul class="weather-pack" id="weather-pack" role="list" aria-label="Pack for rain" hidden>
          <li>Umbrella</li>
          <li>Charged power bank</li>
        </ul>
        <img class="weather-note-art" id="weather-note-art" src="/assets/weather-clouds.webp" width="360" height="360" alt="" decoding="async">
      </div>
      <div class="weather-periods" id="weather-forecast">${weatherPanels()}</div>
    </div>
    <p class="weather-source">Manila time · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> summary
      (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>)</p>
  </section>

  <section class="feature" aria-labelledby="film-title">
    <picture class="feature-paper">${notebookPaper}</picture>
    <div class="feature-info">
      <h1 id="film-title">Forrest <br class="desktop-break">Gump</h1>
      <span class="film-pencil-stroke" aria-hidden="true"></span>
      <p class="film-details">1994 <span aria-hidden="true">·</span> 2h 22m</p>
      <button class="play-button" id="play-movie" type="button" aria-controls="movie-screen" hidden>
        <span class="play-icon" aria-hidden="true"></span>
        <span id="play-label">Play movie</span>
      </button>
      <p class="player-feedback" id="movie-status" role="status"></p>
    </div>
    <div class="movie-mat">
      <div id="movie-screen" class="movie-screen">
        ${portrait}
        <video id="movie" aria-label="Forrest Gump" preload="none" controls playsinline hidden></video>
        <noscript><video aria-label="Forrest Gump" src="/movie.mp4" poster="/assets/scrapbook-bench.webp" preload="none" controls playsinline></video></noscript>
      </div>
    </div>
  </section>

  <section class="notes-shelf" aria-label="Birthday card and notes">
    <div class="notes-spread">
      <div class="notes-viewport">
        <div class="notes-rail" id="notes-rail" role="group" aria-label="Cards">
          <section class="birthday-note note-paper" aria-labelledby="birthday-title" tabindex="-1">
            <svg class="note-sparkles" width="54" height="50" viewBox="0 0 54 50" aria-hidden="true" focusable="false">
              ${sparklePaths}
            </svg>
            <h2 class="note-title" id="birthday-title">Happy birthday, Sandy.</h2>
            <p class="note-paragraph" lang="fil">May <cite>Forrest Gump</cite> dito if you feel like watching. Walang matcha, promise.</p>
            ${deleteNoteButton}
          </section>
          <div class="note-editor-slot" hidden>
            <form class="note-editor note-paper" id="note-editor">
              <input class="note-title note-title-input" id="notes-title" type="text" placeholder="Title"
                aria-label="Title (optional)" maxlength="120" autocomplete="off">
              <button class="note-action note-close" id="close-note" type="button" aria-label="Close note"></button>
              <textarea class="note-writing" id="notes-text" rows="3" placeholder="Write here…" autocomplete="off"
                spellcheck="false" aria-label="Note text" required></textarea>
              <div class="note-actions">
                <button class="note-action note-save" type="submit" disabled>Save note</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="note-controls" id="note-controls" hidden>
        <button class="note-action note-new" id="new-note" type="button" aria-controls="note-editor" aria-expanded="false">
          <span aria-hidden="true">+</span> New note
        </button>
        <div class="note-navigation" id="note-navigation" hidden>
          <button type="button" aria-label="Previous card" aria-controls="notes-rail" disabled></button>
          <button type="button" aria-label="Next card" aria-controls="notes-rail" disabled></button>
        </div>
      </div>
    </div>
    <div class="notes-toast" id="notes-toast">
      <p id="notes-status" role="status" aria-atomic="true"></p>
    </div>
    <template id="saved-note-template">
      <article class="saved-note note-paper" aria-label="Saved note" tabindex="-1">
        <h2 class="note-title"></h2>
        <p class="note-paragraph saved-note-text" tabindex="0"></p>
        ${deleteNoteButton}
      </article>
    </template>
    <dialog class="note-delete-dialog" id="note-delete-dialog" role="alertdialog"
      aria-labelledby="note-delete-title" aria-describedby="note-delete-preview">
      <h2 class="note-title" id="note-delete-title">Delete this note?</h2>
      <p id="note-delete-preview" class="note-delete-preview"></p>
      <p id="note-delete-error" class="note-delete-error" role="status"></p>
      <div class="note-actions">
        <button class="note-action" id="cancel-note-delete" type="button" autofocus>Cancel</button>
        <button class="note-action note-delete-confirm" id="confirm-note-delete" type="button">Delete</button>
      </div>
    </dialog>
  </section>

  <section class="favorites" aria-labelledby="favorites-title">
    <h2 id="favorites-title">A few things from our chats</h2>
    <div class="shelf">
      <section class="scrap snack-scrap">
        <img src="/assets/scrapbook-ice-cream.webp" width="315" height="352" alt="" loading="lazy" decoding="async">
        <h3>Strawberry ice cream</h3>
      </section>
      <section class="scrap music-scrap">
        <div class="music-title">
          <img src="/assets/scrapbook-record.webp" width="315" height="352" alt="" loading="lazy" decoding="async">
          <h3>Songs</h3>
        </div>
        <ul class="tracks">
          <li><a href="https://www.youtube.com/watch?v=vabnZ9-ex7o" target="_blank" rel="noopener noreferrer">
            <span>Come As You Are <small>Nirvana</small></span><span aria-hidden="true" class="track-arrow">↗</span>
          </a></li>
          <li><a href="https://www.youtube.com/watch?v=pKFd12id5oQ" target="_blank" rel="noopener noreferrer">
            <span>Always <small>Daniel Caesar</small></span><span aria-hidden="true" class="track-arrow">↗</span>
          </a></li>
        </ul>
      </section>
      <section class="scrap flowers-scrap">
        <img src="/assets/scrapbook-flowers.webp" width="325" height="352" alt="" loading="lazy" decoding="async">
        <h3>Tulips &amp; lilies</h3>
      </section>
    </div>
  </section>

</main>`, "shelf");
}
