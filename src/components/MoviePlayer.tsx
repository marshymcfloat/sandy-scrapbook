"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { NotebookPaper } from "./Artwork";
import { PlayerIcon } from "./PlayerIcon";
import "../../web/player.css";

const positionKey = "sandyfave:forrest-gump:position";
const playbackSpeeds = [0.75, 1, 1.25, 1.5, 2];
type SafariVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

function savedPosition() {
  try {
    const value = Number(localStorage.getItem(positionKey));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function timeLabel(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const remainder = String(total % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}`
    : `${minutes}:${remainder}`;
}

export function MoviePlayer() {
  const root = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const movie = useRef<SafariVideo>(null);
  const settings = useRef<HTMLDivElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(0);
  const canRemember = useRef(false);
  const previousVolume = useRef(1);
  const tapRevealsControls = useRef(false);
  const errorRequest = useRef<AbortController | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [draftTime, setDraftTime] = useState<number | null>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [supportsFullscreen, setSupportsFullscreen] = useState(false);
  const [supportsPip, setSupportsPip] = useState(false);
  const [resumePosition, setResumePosition] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [unlockAgain, setUnlockAgain] = useState(false);
  const dragging = draftTime !== null;

  const savePosition = useCallback(() => {
    const video = movie.current;
    if (!video || !canRemember.current || video.ended) return;
    lastSaved.current = Math.floor(video.currentTime);
    try {
      if (lastSaved.current > 0)
        localStorage.setItem(positionKey, String(lastSaved.current));
      else localStorage.removeItem(positionKey);
    } catch {
      /* Playback also works when browser storage is disabled. */
    }
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!movie.current?.paused && !settingsOpen && !dragging) {
      hideTimer.current = setTimeout(() => {
        if (!screen.current?.querySelector(":focus-visible"))
          setControlsVisible(false);
      }, 2600);
    }
  }, [settingsOpen, dragging]);

  useEffect(() => {
    setReady(true);
    setResumePosition(savedPosition());
    const video = movie.current!;
    setSupportsFullscreen(
      !!screen.current?.requestFullscreen || !!video.webkitEnterFullscreen,
    );
    setSupportsPip(
      !!document.pictureInPictureEnabled && !!video.requestPictureInPicture,
    );
    const updateFullscreen = () =>
      setFullscreen(document.fullscreenElement === screen.current);
    const beginNativeFullscreen = () => setFullscreen(true);
    const endNativeFullscreen = () => setFullscreen(false);
    document.addEventListener("fullscreenchange", updateFullscreen);
    video.addEventListener("webkitbeginfullscreen", beginNativeFullscreen);
    video.addEventListener("webkitendfullscreen", endNativeFullscreen);
    window.addEventListener("pagehide", savePosition);

    gsap.registerPlugin(CustomEase);
    const entrance = CustomEase.create("shelfEntrance", ".23, 1, .32, 1");
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        gsap
          .timeline({ defaults: { ease: entrance } })
          .fromTo(
            "#film-title",
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              clearProps: "opacity,transform",
            },
          )
          .fromTo(
            ".film-pencil-stroke",
            { scaleX: 0 },
            { scaleX: 1, duration: 0.5, clearProps: "transform" },
            "-=0.22",
          );
      },
      root,
    );
    return () => {
      savePosition();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      errorRequest.current?.abort();
      document.removeEventListener("fullscreenchange", updateFullscreen);
      video.removeEventListener("webkitbeginfullscreen", beginNativeFullscreen);
      video.removeEventListener("webkitendfullscreen", endNativeFullscreen);
      window.removeEventListener("pagehide", savePosition);
      media.revert();
    };
  }, [savePosition]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [playing, revealControls]);

  useEffect(() => {
    if (!settingsOpen) return;
    settings.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !settings.current?.contains(target) &&
        !settingsButton.current?.contains(target)
      )
        setSettingsOpen(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setSettingsOpen(false);
      settingsButton.current?.focus();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [settingsOpen]);

  function play() {
    const video = movie.current;
    if (!video) return;
    if (unlockAgain) {
      window.location.assign("/");
      return;
    }
    errorRequest.current?.abort();
    setFeedback("");
    setActive(true);
    setEnded(false);
    if (!video.hasAttribute("src")) {
      setLoading(true);
      video.src = "/movie.mp4";
    } else if (video.error) {
      canRemember.current = false;
      setLoading(true);
      video.load();
    } else if (video.ended) video.currentTime = 0;
    video.play().catch((error: Error) => {
      if (error.name === "NotAllowedError") {
        setLoading(false);
        setFeedback("Tap play to start the movie.");
      }
    });
    revealControls();
  }

  function togglePlay() {
    if (!movie.current) return;
    if (movie.current.paused) play();
    else movie.current.pause();
    revealControls();
  }

  function seekTo(value: number) {
    const video = movie.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const target = Math.min(video.duration, Math.max(0, value));
    video.currentTime = target;
    setCurrentTime(target);
    setEnded(false);
    revealControls();
  }

  function changeVolume(value: number) {
    const video = movie.current;
    if (!video) return;
    const next = Math.max(0, Math.min(1, value));
    video.volume = next;
    video.muted = next === 0;
    if (next > 0) previousVolume.current = next;
    if (Math.abs(video.volume - next) > 0.01)
      setFeedback("Use your device’s volume buttons to adjust sound.");
  }

  function toggleMute() {
    const video = movie.current;
    if (!video) return;
    if (!video.volume) changeVolume(previousVolume.current);
    else video.muted = !video.muted;
    revealControls();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (screen.current?.requestFullscreen)
        await screen.current.requestFullscreen();
      else movie.current?.webkitEnterFullscreen?.();
    } catch {
      setFeedback("Fullscreen couldn’t open. Try again.");
    }
    revealControls();
  }

  async function togglePip() {
    setSettingsOpen(false);
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture();
      else await movie.current?.requestPictureInPicture();
    } catch {
      setFeedback("Picture-in-picture couldn’t open. Try again.");
    }
  }

  function keyboardControls(event: KeyboardEvent<HTMLDivElement>) {
    if (!active || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea")) return;
    if (
      target.closest("button") &&
      (event.key === " " || event.key === "Enter")
    )
      return;
    switch (event.key.toLowerCase()) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlay();
        break;
      case "arrowleft":
        event.preventDefault();
        seekTo((movie.current?.currentTime ?? 0) - 10);
        break;
      case "arrowright":
        event.preventDefault();
        seekTo((movie.current?.currentTime ?? 0) + 10);
        break;
      case "arrowup":
        event.preventDefault();
        changeVolume(volume + 0.05);
        break;
      case "arrowdown":
        event.preventDefault();
        changeVolume(volume - 0.05);
        break;
      case "home":
        event.preventDefault();
        seekTo(0);
        break;
      case "end":
        event.preventDefault();
        seekTo(duration);
        break;
      case "m":
        event.preventDefault();
        toggleMute();
        break;
      case "f":
        if (supportsFullscreen) {
          event.preventDefault();
          void toggleFullscreen();
        }
        break;
    }
    revealControls();
  }

  function loadedMetadata() {
    const video = movie.current!;
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    const position = savedPosition();
    if (position > 0 && position < video.duration - 5)
      video.currentTime = position;
    lastSaved.current = Math.floor(video.currentTime);
    canRemember.current = true;
    setCurrentTime(video.currentTime);
  }

  async function playbackError() {
    const video = movie.current!;
    setActive(false);
    setPlaying(false);
    setLoading(false);
    setSettingsOpen(false);
    setFeedback("The movie couldn’t load. Try again.");
    const controller = new AbortController();
    errorRequest.current?.abort();
    errorRequest.current = controller;
    try {
      const response = await fetch("/movie.mp4", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      if (
        response.status === 401 &&
        video.error &&
        !controller.signal.aborted
      ) {
        setUnlockAgain(true);
        setFeedback("Unlock the shelf to keep watching.");
      }
    } catch {
      /* Retry stays available when the connection returns. */
    }
  }

  const shownTime = draftTime ?? currentTime;
  const mutedSound = muted || volume === 0;
  const startLabel = unlockAgain
    ? "Unlock again"
    : feedback
      ? "Retry movie"
      : resumePosition > 0
        ? "Resume movie"
        : "Play movie";
  const timelineStyle = {
    "--played": `${duration ? (shownTime / duration) * 100 : 0}%`,
    "--buffered": `${duration ? (buffered / duration) * 100 : 0}%`,
  } as CSSProperties;

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
          hidden={!ready || active}
          onClick={play}
        >
          <PlayerIcon name="play" />
          <span id="play-label">{startLabel}</span>
        </button>
        <p className="player-feedback" id="movie-status" role="status">
          {feedback}
        </p>
      </div>
      <div className="movie-mat">
        <div
          ref={screen}
          id="movie-screen"
          className="movie-screen"
          role="group"
          aria-label="Forrest Gump movie player"
          aria-describedby="movie-shortcuts"
          tabIndex={active ? 0 : -1}
          data-controls-hidden={
            active && !controlsVisible && !settingsOpen && playing
              ? "true"
              : undefined
          }
          onPointerMove={revealControls}
          onFocusCapture={revealControls}
          onKeyDown={keyboardControls}
        >
          <picture className="still" hidden={active}>
            <img
              src="/assets/scrapbook-bench.webp"
              width="1088"
              height="612"
              fetchPriority="high"
              alt="Colored-pencil drawing of a park bench with tulips and a lily on the seat."
            />
          </picture>
          <video
            ref={movie}
            id="movie"
            aria-label="Forrest Gump"
            preload="none"
            playsInline
            hidden={!active}
            tabIndex={-1}
            disableRemotePlayback
            onPointerDown={(event) => {
              tapRevealsControls.current =
                event.pointerType === "touch" && !controlsVisible;
            }}
            onClick={() => {
              if (settingsOpen) setSettingsOpen(false);
              else if (!tapRevealsControls.current) togglePlay();
              tapRevealsControls.current = false;
              screen.current?.focus({ preventScroll: true });
              revealControls();
            }}
            onDoubleClick={() => {
              if (supportsFullscreen) void toggleFullscreen();
            }}
            onLoadedMetadata={loadedMetadata}
            onDurationChange={(event) =>
              setDuration(
                Number.isFinite(event.currentTarget.duration)
                  ? event.currentTarget.duration
                  : 0,
              )
            }
            onTimeUpdate={(event) => {
              setCurrentTime(event.currentTarget.currentTime);
              if (
                Math.abs(event.currentTarget.currentTime - lastSaved.current) >=
                5
              )
                savePosition();
            }}
            onProgress={(event) => {
              const ranges = event.currentTarget.buffered;
              if (ranges.length) setBuffered(ranges.end(ranges.length - 1));
            }}
            onPlay={() => {
              setPlaying(true);
              setEnded(false);
            }}
            onPlaying={() => {
              setPlaying(true);
              setLoading(false);
              setFeedback("");
            }}
            onPause={() => {
              setPlaying(false);
              savePosition();
            }}
            onWaiting={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onSeeking={() => setLoading(true)}
            onSeeked={(event) => {
              setLoading(event.currentTarget.readyState < 3);
              savePosition();
            }}
            onVolumeChange={(event) => {
              setVolume(event.currentTarget.volume);
              setMuted(event.currentTarget.muted);
            }}
            onRateChange={(event) => setSpeed(event.currentTarget.playbackRate)}
            onError={() => void playbackError()}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
              setLoading(false);
              lastSaved.current = 0;
              try {
                localStorage.removeItem(positionKey);
              } catch {
                /* Browser storage may be disabled. */
              }
            }}
          />
          {active && (
            <>
              {loading && (
                <div className="player-loading" role="status">
                  <PlayerIcon name="loading" />
                  <span>Loading…</span>
                </div>
              )}
              {!playing && !loading && (
                <button
                  type="button"
                  className="player-center-play"
                  aria-label={ended ? "Replay movie" : "Resume playback"}
                  onClick={play}
                >
                  <PlayerIcon name={ended ? "replay" : "play"} />
                </button>
              )}
              <div className="player-controls" aria-label="Movie controls">
                <div className="player-seek" style={timelineStyle}>
                  <div className="player-seek-track" aria-hidden="true">
                    <span className="player-buffered" />
                    <span className="player-progress" />
                  </div>
                  <input
                    className="player-range player-seek-range"
                    type="range"
                    aria-label="Seek movie"
                    min={0}
                    max={duration || 1}
                  step={1}
                    value={shownTime}
                    disabled={!duration}
                    aria-valuetext={`${timeLabel(shownTime)} of ${timeLabel(duration)}`}
                    onPointerDown={(event) => {
                      setDraftTime(Number(event.currentTarget.value));
                      revealControls();
                    }}
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      if (draftTime === null) seekTo(value);
                      else setDraftTime(value);
                    }}
                    onPointerUp={(event) => {
                      seekTo(Number(event.currentTarget.value));
                      setDraftTime(null);
                    }}
                    onPointerCancel={() => setDraftTime(null)}
                    onBlur={(event) => {
                      if (draftTime !== null) {
                        seekTo(Number(event.currentTarget.value));
                        setDraftTime(null);
                      }
                    }}
                  />
                </div>
                <div className="player-control-row">
                  <button
                    type="button"
                    className="player-button"
                    aria-label={playing ? "Pause" : ended ? "Replay" : "Play"}
                    data-tooltip={playing ? "Pause" : ended ? "Replay" : "Play"}
                    onClick={togglePlay}
                  >
                    <PlayerIcon
                      name={playing ? "pause" : ended ? "replay" : "play"}
                    />
                  </button>
                  <span className="player-time">
                    <span>{timeLabel(shownTime)}</span>
                    <span className="player-time-divider"> / </span>
                    <span>{timeLabel(duration)}</span>
                  </span>
                  <div className="player-volume">
                    <button
                      type="button"
                      className="player-button"
                      aria-label={mutedSound ? "Unmute" : "Mute"}
                      data-tooltip={mutedSound ? "Unmute" : "Mute"}
                      onClick={toggleMute}
                    >
                      <PlayerIcon name={mutedSound ? "muted" : "volume"} />
                    </button>
                    <input
                      className="player-range player-volume-range"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      aria-label="Volume"
                      aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)} percent`}
                      style={
                        {
                          "--volume": `${(muted ? 0 : volume) * 100}%`,
                        } as CSSProperties
                      }
                      onChange={(event) =>
                        changeVolume(Number(event.currentTarget.value))
                      }
                    />
                  </div>
                  <button
                    ref={settingsButton}
                    type="button"
                    className="player-button"
                    aria-label="Playback settings"
                    data-tooltip="Settings"
                    aria-expanded={settingsOpen}
                    aria-controls="movie-settings"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    <PlayerIcon name="settings" />
                  </button>
                  {supportsFullscreen && (
                    <button
                      type="button"
                      className="player-button"
                      aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                      data-tooltip={
                        fullscreen ? "Exit fullscreen" : "Fullscreen"
                      }
                      onClick={() => void toggleFullscreen()}
                    >
                      <PlayerIcon
                        name={fullscreen ? "minimize" : "fullscreen"}
                      />
                    </button>
                  )}
                </div>
              </div>
              {settingsOpen && (
                <div
                  ref={settings}
                  className="player-settings-panel"
                  id="movie-settings"
                  role="dialog"
                  aria-label="Playback settings"
                >
                  <div className="player-settings-header">
                    <span>Playback speed</span>
                    <button
                      type="button"
                      className="player-button"
                      aria-label="Close playback settings"
                      onClick={() => {
                        setSettingsOpen(false);
                        settingsButton.current?.focus();
                      }}
                    >
                      <PlayerIcon name="close" />
                    </button>
                  </div>
                  <div
                    className="player-speed-options"
                    role="radiogroup"
                    aria-label="Playback speed"
                  >
                    {playbackSpeeds.map((value) => (
                      <label className="player-speed-option" key={value}>
                        <input
                          className="player-sr-only"
                          type="radio"
                          name="movie-speed"
                          value={value}
                          checked={speed === value}
                          onChange={() => {
                            if (movie.current)
                              movie.current.playbackRate = value;
                          }}
                        />
                        <span>{value}×</span>
                      </label>
                    ))}
                  </div>
                  {supportsPip && (
                    <button
                      type="button"
                      className="player-pip"
                      onClick={() => void togglePip()}
                    >
                      <PlayerIcon name="pip" />
                      Picture-in-picture
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <p className="player-sr-only" id="movie-shortcuts">
            Space or K plays and pauses. Left and right arrows seek ten seconds.
            Up and down arrows adjust volume. M mutes. F toggles fullscreen.
            Escape closes settings.
          </p>
          <noscript>
            <video
              aria-label="Forrest Gump"
              src="/movie.mp4"
              poster="/assets/scrapbook-bench.webp"
              preload="none"
              controls
              playsInline
            />
          </noscript>
        </div>
      </div>
    </section>
  );
}
