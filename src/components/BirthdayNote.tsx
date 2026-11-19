import { Sparkles } from "./Artwork";

export function BirthdayNote() {
  return (
    <section className="birthday-greeting" aria-labelledby="birthday-title">
      <div className="birthday-note note-paper">
        <svg
          className="note-sparkles"
          width="54"
          height="50"
          viewBox="0 0 54 50"
          aria-hidden="true"
          focusable="false"
        >
          <Sparkles />
        </svg>
        <h1 className="note-title" id="birthday-title">
          Happy birthday, Sandy.
        </h1>
        <p className="note-paragraph" lang="en">
          wishing u happiness, good health, and success in everything ure working
          on. hope this year brings u closer to everything u want to achieve.
          happy birthday again, sandy!
        </p>
      </div>
    </section>
  );
}
