"use client";

import { useEffect, useRef } from "react";
import { initializeGate } from "../client/gate";
import { GateDoodles, GateLettering, NotebookPaper } from "./Artwork";

export function Gate({
  message,
  invalid = false,
}: {
  message?: string;
  invalid?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => initializeGate(root.current), [message]);
  return (
    <main
      ref={root}
      className="gate gate-page"
      aria-labelledby="gate-title"
      data-feedback={message ? "" : undefined}
    >
      <div className="gate-journal">
        <GateDoodles />
        <picture className="gate-notebook">
          <NotebookPaper />
        </picture>
        <div className="gate-content">
          <h1 id="gate-title" aria-label="Sandy&rsquo;s Scrapbook">
            <GateLettering />
          </h1>
          <span className="gate-pencil-stroke" aria-hidden="true"></span>
          <form action="/unlock" method="post" className="gate-form">
            <div className="gate-entry">
              <div className="gate-field">
                <input
                  id="passphrase"
                  type="password"
                  name="passphrase"
                  autoComplete="current-password"
                  required
                  placeholder="Passphrase"
                  aria-label="Passphrase"
                  aria-describedby={message ? "unlock-feedback" : undefined}
                  aria-invalid={invalid || undefined}
                  autoFocus={invalid}
                />
                <svg
                  className="gate-field-rule"
                  viewBox="0 0 240 8"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M2 4.8 C38 3.2 77 4.7 120 4.3 C162 3.9 209 2.7 238 3.9" />
                </svg>
                <svg
                  className="gate-field-arrow"
                  viewBox="0 0 50 25"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M3 19 C16 24 32 20 43 5 M33 8 Q38 6 43 5 Q42 10 43 15" />
                </svg>
              </div>
              <button className="gate-submit" type="submit">
                <span>Unlock</span>
                <svg viewBox="0 0 24 12" aria-hidden="true" focusable="false">
                  <path d="M2 6.8 Q10 5.6 21 6 M16 2 L21 6 Q18 7.8 16 10" />
                </svg>
              </button>
            </div>
            {message && (
              <p id="unlock-feedback" role="alert">
                {message}
              </p>
            )}
          </form>
        </div>
        <div className="gate-illustration">
          <img
            src="/assets/journal-sketch.webp"
            width="840"
            height="840"
            alt=""
            fetchPriority="low"
          />
        </div>
      </div>
    </main>
  );
}
