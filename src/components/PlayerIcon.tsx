import type { ReactNode } from "react";

const drawings = {
  play: (
    <path d="M8 4.5 Q7 4 7 6 L7.3 19 Q7.5 20 8.5 19.5 L20 12.5 Q21 12 19.8 11.3Z" />
  ),
  pause: (
    <>
      <path d="M7 5 7.3 19 M10 5.3 9.8 19.2" />
      <path d="M15 5.2 15.3 19 M18 5 17.8 19.2" />
    </>
  ),
  volume: (
    <>
      <path d="M4 9 8 9 13.7 4.5 Q14.5 4 14.4 5.2 L14 19 Q14 20 13 19.2 L8 15 4 15Z" />
      <path d="M17 8 Q21 12 17 16 M19.5 4.5 Q26 12 19.5 19.5" />
    </>
  ),
  muted: (
    <>
      <path d="M3 9 7 9 12.5 4.5 12.2 19.5 7 15 3 15Z" />
      <path d="M17 9 23 15 M22.7 9 17.2 15" />
    </>
  ),
  fullscreen: (
    <path d="M4 9 4.3 4 9 4.2 M15 4 20 4.3 19.8 9 M20 15 19.8 20 15 19.8 M9 20 4 19.7 4.2 15" />
  ),
  minimize: (
    <path d="M3 8 8 8.2 7.8 3 M16 3 15.8 8 21 7.8 M21 16 16 15.8 16.2 21 M8 21 8.2 16 3 16.2" />
  ),
  settings: (
    <>
      <path d="M3 7.5 8 7.3 M13 7.5 21 7.7 M3 16.5 13 16.2 M18 16.5 21 16.7" />
      <path d="M8 4.5 8.2 10.5 13 10.3 12.8 4.3Z M13 13.4 13.2 19.5 18 19.3 17.8 13.2Z" />
    </>
  ),
  close: <path d="M6 5.5 Q12 12 18 18.5 M18.3 5.7 Q12 12 5.8 18" />,
  replay: <path d="M5.5 8.5 A8 8 0 1 1 4.4 15 M5.5 3.5 5.3 9 10.7 8.7" />,
  pip: (
    <>
      <path d="M3 4.5 21 4.8 20.8 19.5 3.2 19.2Z" />
      <path d="M12 12 18.5 12.2 18.3 17 12.2 16.8Z" />
    </>
  ),
  loading: <path d="M19.4 7.5 A8.5 8.5 0 1 0 20.4 15" />,
} satisfies Record<string, ReactNode>;

export function PlayerIcon({ name }: { name: keyof typeof drawings }) {
  return (
    <svg
      className="player-icon"
      viewBox="0 0 26 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[name]}
    </svg>
  );
}
