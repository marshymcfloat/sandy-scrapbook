"use client";

import { useCallback, useEffect, useRef } from "react";
import { initializeNotes } from "../client/notes";

const savedNoteTemplate = `
  <article class="saved-note note-paper" aria-label="Saved note" tabindex="-1">
    <h3 class="note-title"></h3>
    <p class="note-paragraph saved-note-text" tabindex="0"></p>
    <button class="note-action note-delete" type="button" aria-label="Delete note" title="Delete note" hidden>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5" />
      </svg>
    </button>
  </article>`;

export function Notes({ initialOpen = false }: { initialOpen?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const controller = useRef<ReturnType<typeof initializeNotes>>(undefined);
  const ensureNotes = useCallback(() => {
    controller.current ??= initializeNotes(root.current);
    return controller.current;
  }, []);
  useEffect(() => {
    ensureNotes();
    return () => {
      controller.current?.dispose();
      controller.current = undefined;
    };
  }, [ensureNotes]);
  return (
    <section
      ref={root}
      className="notes-shelf"
      aria-labelledby="notes-title-heading"
    >
      <div className="notes-heading wrap">
        <h2 id="notes-title-heading">Notes to self</h2>
        <p id="notes-storage-hint">Saved only in this browser.</p>
      </div>
      <div className="notes-spread">
        <div className="notes-viewport" hidden={!initialOpen}>
          <div
            className="notes-rail"
            id="notes-rail"
            role="group"
            aria-label="Notes to self"
          >
            <div className="note-editor-slot" hidden={!initialOpen}>
              <form
                className="note-editor note-paper"
                id="note-editor"
                aria-describedby="notes-storage-hint"
              >
                <input
                  className="note-title note-title-input"
                  id="notes-title"
                  type="text"
                  placeholder="Title"
                  aria-label="Title (optional)"
                  maxLength={120}
                  autoComplete="off"
                  autoFocus={initialOpen}
                />
                <button
                  className="note-action note-close"
                  id="close-note"
                  type="button"
                  aria-label="Close note"
                ></button>
                <textarea
                  className="note-writing"
                  id="notes-text"
                  rows={3}
                  placeholder="Write here…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Note text"
                  required
                ></textarea>
                <div className="note-actions">
                  <button
                    className="note-action note-save"
                    type="submit"
                    disabled
                  >
                    Save note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <form
          className="note-controls"
          id="note-controls"
          action="/#notes-title-heading"
          method="get"
          onSubmit={(event) => {
            event.preventDefault();
            ensureNotes()?.toggleEditor();
          }}
        >
          <input type="hidden" name="note" value="new" />
          <button
            className="note-action note-new"
            id="new-note"
            type="submit"
            aria-controls="note-editor"
            aria-expanded={initialOpen}
          >
            <span aria-hidden="true">+</span> Notes to self
          </button>
          <div className="note-navigation" id="note-navigation" hidden>
            <button
              type="button"
              aria-label="Previous card"
              aria-controls="notes-rail"
              disabled
            ></button>
            <button
              type="button"
              aria-label="Next card"
              aria-controls="notes-rail"
              disabled
            ></button>
          </div>
        </form>
      </div>
      <div className="notes-toast" id="notes-toast">
        <p id="notes-status" role="status" aria-atomic="true"></p>
      </div>
      <template
        id="saved-note-template"
        dangerouslySetInnerHTML={{ __html: savedNoteTemplate }}
      />
      <dialog
        className="note-delete-dialog"
        id="note-delete-dialog"
        role="alertdialog"
        aria-labelledby="note-delete-title"
        aria-describedby="note-delete-preview"
      >
        <h2 className="note-title" id="note-delete-title">
          Delete this note?
        </h2>
        <p id="note-delete-preview" className="note-delete-preview"></p>
        <p
          id="note-delete-error"
          className="note-delete-error"
          role="status"
        ></p>
        <div className="note-actions">
          <button
            className="note-action"
            id="cancel-note-delete"
            type="button"
            autoFocus
          >
            Cancel
          </button>
          <button
            className="note-action note-delete-confirm"
            id="confirm-note-delete"
            type="button"
          >
            Delete
          </button>
        </div>
      </dialog>
    </section>
  );
}
