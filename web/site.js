import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import "./notes";
import "./weather";

const movie = document.querySelector("#movie");
const poster = document.querySelector("#movie-screen .still");
const playButton = document.querySelector("#play-movie");
const playLabel = document.querySelector("#play-label");
const status = document.querySelector("#movie-status");
const positionKey = "sandyfave:forrest-gump:position";
const movieUrl = "/movie.mp4";

let unlockAgain = false;
let canRemember = false;
let lastSaved = 0;

function savedPosition() {
  try {
    const value = Number(localStorage.getItem(positionKey));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function savePosition() {
  if (!canRemember || movie.ended) return;
  lastSaved = Math.floor(movie.currentTime);
  try {
    if (lastSaved > 0) localStorage.setItem(positionKey, String(lastSaved));
    else localStorage.removeItem(positionKey);
  } catch {
    // Playback works with browser storage disabled.
  }
}

function playMovie() {
  if (unlockAgain) {
    window.location.assign("/");
    return;
  }

  canRemember = false;
  status.textContent = "";
  poster.hidden = true;
  movie.hidden = false;
  movie.focus({ preventScroll: true });
  playButton.hidden = true;

  if (movie.hasAttribute("src")) movie.load();
  else movie.src = movieUrl;

  movie.play().catch((error) => {
    if (error.name === "NotAllowedError") status.textContent = "Use Play in the video controls.";
  });
}

async function showPlaybackError() {
  const currentError = movie.error;
  status.textContent = "The movie couldn’t load. Try again.";
  playLabel.textContent = "Retry movie";
  playButton.hidden = false;
  poster.hidden = false;
  movie.hidden = true;

  try {
    const response = await fetch(movieUrl, { method: "HEAD", cache: "no-store" });
    if (response.status === 401 && movie.error === currentError) {
      unlockAgain = true;
      status.textContent = "Unlock the shelf to keep watching.";
      playLabel.textContent = "Unlock again";
    }
  } catch {
    // The button remains available when the connection returns.
  }
}

movie.addEventListener("loadedmetadata", () => {
  const position = savedPosition();
  if (position > 0 && position < movie.duration - 5) movie.currentTime = position;
  lastSaved = Math.floor(movie.currentTime);
  canRemember = true;
});
movie.addEventListener("timeupdate", () => {
  if (Math.abs(movie.currentTime - lastSaved) >= 5) savePosition();
});
movie.addEventListener("pause", savePosition);
movie.addEventListener("seeked", savePosition);
movie.addEventListener("ended", () => {
  lastSaved = 0;
  try {
    localStorage.removeItem(positionKey);
  } catch {
    // Playback works with browser storage disabled.
  }
});
movie.addEventListener("playing", () => { status.textContent = ""; });
movie.addEventListener("error", showPlaybackError);
window.addEventListener("pagehide", savePosition);
playButton.addEventListener("click", playMovie);

if (savedPosition() >= 1) playLabel.textContent = "Resume movie";
playButton.hidden = false;

gsap.registerPlugin(CustomEase);
const entrance = CustomEase.create("shelfEntrance", ".23, 1, .32, 1");
let revealed = false;
gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
  if (revealed) return;
  revealed = true;
  gsap.timeline({ defaults: { ease: entrance } })
    .fromTo("#film-title", { opacity: 0, y: 8 }, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      clearProps: "opacity,transform",
    })
    .fromTo(".film-pencil-stroke", { scaleX: 0 }, {
      scaleX: 1,
      duration: 0.5,
      clearProps: "transform",
    }, "-=0.22");
});
