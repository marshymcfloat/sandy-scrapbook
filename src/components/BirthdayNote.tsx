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
        <p className="note-paragraph" lang="fil">
          I’m glad I’ve gotten to know you, pati ’yung little things you enjoy.
          I put a few of them here.
        </p>
        <p className="note-paragraph" lang="fil">
          Sana maging masaya ang araw mo, with good music, something sweet,
          and time for whatever makes you happy.
        </p>
        <p className="note-paragraph" lang="fil">
          May <cite>Forrest Gump</cite> din dito kung feel mong manood.
          Walang matcha, promise.
        </p>
      </div>
    </section>
  );
}
