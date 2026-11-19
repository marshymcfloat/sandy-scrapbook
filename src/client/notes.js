import { gsap } from "gsap";
import { createLifecycle } from "./lifecycle";

export function initializeNotes(root) {
  if (!root) return;
  const { listen, schedule, dispose } = createLifecycle();

  const rail = root.querySelector("#notes-rail");

  if (rail) {
    const viewport = rail.parentElement;
    const spread = viewport.parentElement;
    const controls = root.querySelector("#note-controls");
    const navigation = root.querySelector("#note-navigation");
    const [previous, next] = navigation.querySelectorAll("button");
    const newNote = root.querySelector("#new-note");
    const form = root.querySelector("#note-editor");
    const editorSlot = form.parentElement;
    const titleInput = root.querySelector("#notes-title");
    const editor = root.querySelector("#notes-text");
    const save = form.querySelector('button[type="submit"]');
    const toast = root.querySelector("#notes-toast");
    const status = root.querySelector("#notes-status");
    const cardTemplate = root.querySelector("#saved-note-template");
    const deleteDialog = root.querySelector("#note-delete-dialog");
    const deletePreview = root.querySelector("#note-delete-preview");
    const deleteError = root.querySelector("#note-delete-error");
    const originalKey = "sandyfave:notes-to-self";
    const cardPrefix = `${originalKey}:card:`;
    const entryPrefix = `${originalKey}:entry:`;
    const cards = new Map();
    const scrollThumbTimers = new WeakMap();
    let storage;
    let toastTimer;
    let clearToastTimer;
    let pendingDelete;
    let finishDialogClose;
    let mouseDrag;
    let suppressDragClick = false;
    let railSnap;
    let cardReflow;
    let editorOpen = false;
    let allowNoteMotion = false;
    let finishEditorMotion;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      allowNoteMotion = true;
      return () => {
        allowNoteMotion = false;
        gsap.killTweensOf([editorSlot, form]);
        finishEditorMotion?.();
        railSnap?.progress(1);
        finishCardReflow();
        gsap.killTweensOf(deleteDialog);
        if (finishDialogClose) finishDialogClose();
        else gsap.set(deleteDialog, { clearProps: "opacity,transform" });
      };
    });

    function isNoteKey(key) {
      return (
        key === originalKey ||
        key.startsWith(cardPrefix) ||
        key.startsWith(entryPrefix)
      );
    }

    function readNote(key, value) {
      if (key.startsWith(entryPrefix)) {
        try {
          const note = JSON.parse(value);
          if (typeof note?.title === "string" && typeof note.text === "string")
            return note;
        } catch {
          // Keep any unreadable entry visible as text.
        }
      }
      return { title: "", text: value };
    }

    function announce(message, error = false) {
      clearTimeout(toastTimer);
      clearTimeout(clearToastTimer);
      status.textContent = message;
      toast.toggleAttribute("data-error", error);
      toast.setAttribute("data-visible", "");
      toastTimer = schedule(dismissToast, error ? 6500 : 4000);
    }

    function dismissToast() {
      clearTimeout(toastTimer);
      if (!toast.hasAttribute("data-visible")) return;
      toast.removeAttribute("data-visible");
      clearToastTimer = schedule(
        () => {
          status.textContent = "";
          toast.removeAttribute("data-error");
        },
        allowNoteMotion ? 180 : 0,
      );
    }

    function updateNavigation() {
      viewport.hidden = !cards.size && editorSlot.hidden;
      const end = rail.scrollWidth - rail.clientWidth;
      const scrollable = end > 1;
      const hasPrevious = rail.scrollLeft > 1;
      const hasNext = rail.scrollLeft < end - 1;
      navigation.hidden = !scrollable;
      rail.tabIndex = scrollable ? 0 : -1;
      rail.toggleAttribute("data-scrollable", scrollable);
      viewport.toggleAttribute("data-more-before", hasPrevious);
      viewport.toggleAttribute("data-more-after", hasNext);
      previous.disabled = !hasPrevious;
      next.disabled = !hasNext;
    }

    function scrollToCard(card) {
      stopRailSnap();
      card.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    function showScrollThumb(event) {
      const scroller = event.target;
      if (
        scroller !== rail &&
        !scroller.matches(".note-writing, .saved-note-text")
      )
        return;

      scroller.setAttribute("data-scrolling", "");
      clearTimeout(scrollThumbTimers.get(scroller));
      scrollThumbTimers.set(
        scroller,
        schedule(() => {
          scroller.removeAttribute("data-scrolling");
          scrollThumbTimers.delete(scroller);
        }, 550),
      );
    }

    function startDrag(event) {
      suppressDragClick = false;
      stopRailSnap();
      if (
        mouseDrag ||
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        event.shiftKey ||
        navigation.hidden
      )
        return;
      if (event.target.closest(".note-editor, a")) return;
      const scrollbarTop =
        rail.getBoundingClientRect().top + rail.clientTop + rail.clientHeight;
      if (event.clientY >= scrollbarTop) return;

      if (!event.target.closest("button")) event.preventDefault();
      mouseDrag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: rail.scrollLeft,
      };
    }

    function dragCards(event) {
      if (mouseDrag?.id !== event.pointerId) return;
      const delta = event.clientX - mouseDrag.x;
      if (!rail.hasAttribute("data-dragging")) {
        if (
          Math.abs(delta) < 6 ||
          Math.abs(delta) < Math.abs(event.clientY - mouseDrag.y)
        )
          return;
        finishCardReflow();
        mouseDrag.left = rail.scrollLeft;
        rail.setAttribute("data-dragging", "");
        rail.setPointerCapture(event.pointerId);
        rail.focus({ preventScroll: true });
      }
      event.preventDefault();
      rail.scrollLeft = mouseDrag.left - delta;
    }

    function endDrag(event) {
      if (mouseDrag?.id !== event.pointerId) return;
      const start = mouseDrag.left;
      mouseDrag = undefined;
      if (!rail.hasAttribute("data-dragging")) return;

      suppressDragClick = true;
      const stops = cardStops();
      const left = rail.scrollLeft;
      const nearest = nearestStop(stops, left);
      const distance = left - start;
      let target = nearest;
      if (event.type === "pointerup" && Math.abs(distance) >= 26) {
        const startIndex = stops.indexOf(nearestStop(stops, start));
        const nextStop = stops[startIndex + Math.sign(distance)] ?? nearest;
        target =
          distance > 0
            ? Math.max(nearest, nextStop)
            : Math.min(nearest, nextStop);
      }
      snapToStop(target);
      rail.removeAttribute("data-dragging");
    }

    function cardStops() {
      const end = rail.scrollWidth - rail.clientWidth;
      const inset = Number.parseFloat(getComputedStyle(rail).scrollPaddingLeft);
      const origin =
        rail.getBoundingClientRect().left +
        rail.clientLeft +
        inset -
        rail.scrollLeft;
      const stops = [0];
      for (const card of rail.querySelectorAll(".note-paper")) {
        if (!card.offsetWidth) continue;
        const left = Math.min(end, card.getBoundingClientRect().left - origin);
        if (left > stops.at(-1) + 1) stops.push(left);
      }
      if (end > stops.at(-1) + 1) stops.push(end);
      return stops;
    }

    function nearestStop(stops, left) {
      return stops.reduce((closest, stop) =>
        Math.abs(stop - left) < Math.abs(closest - left) ? stop : closest,
      );
    }

    function stopRailSnap() {
      if (!railSnap) return;
      railSnap.kill();
      railSnap = undefined;
      rail.removeAttribute("data-settling");
    }

    function snapToStop(left) {
      stopRailSnap();
      if (!allowNoteMotion || Math.abs(left - rail.scrollLeft) < 1) {
        rail.scrollTo({ left, behavior: "instant" });
        return;
      }
      rail.setAttribute("data-settling", "");
      railSnap = gsap.to(rail, {
        scrollLeft: left,
        duration: 0.38,
        ease: "shelfEntrance",
        onComplete() {
          railSnap = undefined;
          rail.removeAttribute("data-settling");
        },
      });
    }

    function cardGap() {
      return Number.parseFloat(getComputedStyle(form).marginInlineStart);
    }

    function shiftCards(direction) {
      finishCardReflow();
      const left = railSnap?.vars.scrollLeft ?? rail.scrollLeft;
      const stops = cardStops();
      const target =
        direction > 0
          ? stops.find((stop) => stop > left + 1)
          : stops.findLast((stop) => stop < left - 1);
      if (target !== undefined) snapToStop(target);
    }

    function setEditorOpen(open, { instant = false } = {}) {
      finishCardReflow();
      const wasHidden = editorSlot.hidden;
      gsap.killTweensOf([editorSlot, form]);
      editorOpen = open;
      newNote.setAttribute("aria-expanded", String(open));
      form.inert = !open;
      if (open) {
        viewport.hidden = false;
        editorSlot.hidden = false;
      }

      function finish() {
        const movedLayout = editorSlot.hasAttribute("data-folding");
        finishEditorMotion = undefined;
        editorSlot.hidden = !open;
        editorSlot.removeAttribute("data-folding");
        gsap.set(editorSlot, { clearProps: "width,height" });
        gsap.set(form, { clearProps: "opacity,visibility,transform" });
        updateNavigation();
        if (open && movedLayout && form.contains(document.activeElement))
          scrollToCard(form);
      }

      if (!allowNoteMotion || instant) {
        finish();
        return;
      }

      const timing = {
        duration: open ? 0.32 : 0.2,
        ease: open ? "shelfEntrance" : "power2.inOut",
      };
      // Resize the slot only if all cards fit. A scrollable row needs its full width for native scrolling.
      if (
        editorSlot.hasAttribute("data-folding") ||
        rail.scrollWidth <= rail.clientWidth + 1
      ) {
        const width = form.offsetWidth + cardGap();
        const height = form.offsetHeight;
        editorSlot.setAttribute("data-folding", "");
        if (wasHidden) gsap.set(editorSlot, { width: 0, height: 0 });
        gsap.to(editorSlot, {
          ...timing,
          width: open ? width : 0,
          height: open ? height : 0,
        });
      }

      if (open && wasHidden) gsap.set(form, { autoAlpha: 0.02, y: 7 });
      finishEditorMotion = finish;
      gsap.to(form, {
        ...timing,
        autoAlpha: open ? 1 : 0,
        y: open ? 0 : 7,
        onComplete: finish,
      });
      updateNavigation();
    }

    function closeEditor() {
      newNote.focus({ preventScroll: true });
      setEditorOpen(false);
    }

    function removeCard(key) {
      cards.get(key)?.remove();
      cards.delete(key);
    }

    function finishCardReflow() {
      cardReflow?.progress(1);
    }

    function reflowAfterDeletion(update) {
      stopRailSnap();
      if (!allowNoteMotion || document.hidden) {
        finishCardReflow();
        update();
        return;
      }

      const before = [...rail.children, newNote, navigation]
        .filter((element) => element.offsetWidth)
        .map((element) => ({ element, rect: element.getBoundingClientRect() }));
      const oldWidth = spread.getBoundingClientRect().width;
      finishCardReflow();
      rail.setAttribute("data-reflowing", "");
      update();
      rail.scrollTo({
        left: nearestStop(cardStops(), rail.scrollLeft),
        behavior: "instant",
      });

      const width = spread.getBoundingClientRect().width;
      const resize = Math.abs(width - oldWidth) > 1;
      // Keep the original viewport wide enough to show the cards as they start moving.
      if (resize) gsap.set(spread, { width: oldWidth });
      const moves = [];
      for (const { element, rect } of before) {
        if (!element.isConnected || !element.offsetWidth) continue;
        const next = element.getBoundingClientRect();
        const x = rect.left - next.left;
        const y = rect.top - next.top;
        if (Math.abs(x) > 1 || Math.abs(y) > 1) moves.push({ element, x, y });
      }

      function finish() {
        cardReflow = undefined;
        rail.removeAttribute("data-reflowing");
        updateNavigation();
      }

      if (!resize && !moves.length) {
        finish();
        return;
      }
      cardReflow = gsap.timeline({
        defaults: { duration: 0.38, ease: "shelfEntrance" },
        onComplete: finish,
      });
      if (resize) cardReflow.to(spread, { width, clearProps: "width" }, 0);
      for (const { element, x, y } of moves) {
        cardReflow.fromTo(
          element,
          { x, y },
          { x: 0, y: 0, clearProps: "transform" },
          0,
        );
      }
    }

    function openDeleteDialog() {
      deleteDialog.showModal();
      if (allowNoteMotion) {
        // Resolve the backdrop's initial opacity before triggering the transition.
        getComputedStyle(deleteDialog, "::backdrop").opacity;
        gsap.fromTo(
          deleteDialog,
          { opacity: 0, y: 8, scale: 0.985 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.24,
            ease: "shelfEntrance",
            clearProps: "opacity,transform",
          },
        );
      }
      deleteDialog.setAttribute("data-visible", "");
    }

    function closeDeleteDialog(onClosed) {
      if (!deleteDialog.open || finishDialogClose) return;
      gsap.killTweensOf(deleteDialog);
      deleteDialog.removeAttribute("data-visible");
      finishDialogClose = () => {
        finishDialogClose = undefined;
        deleteDialog.close();
        gsap.set(deleteDialog, { clearProps: "opacity,transform" });
        onClosed?.();
      };
      if (allowNoteMotion && !document.hidden) {
        gsap.to(deleteDialog, {
          opacity: 0,
          y: 6,
          scale: 0.985,
          duration: 0.18,
          ease: "shelfEntrance",
          onComplete: finishDialogClose,
        });
      } else {
        finishDialogClose();
      }
    }

    function enableDelete(key, card) {
      const button = card.querySelector(".note-delete");
      listen(button, "click", () => {
        if (deleteDialog.open) return;
        stopRailSnap();
        pendingDelete = { key, card, button };
        const title = card.querySelector(".note-title").textContent;
        const preview =
          title === "Untitled"
            ? card
                .querySelector(".note-paragraph")
                .textContent.replace(/\s+/g, " ")
                .trim()
            : title;
        deletePreview.textContent =
          preview.length > 100 ? `${preview.slice(0, 100)}…` : preview;
        deleteError.textContent = "";
        openDeleteDialog();
      });
      button.hidden = false;
    }

    function confirmDelete() {
      if (!deleteDialog.open || finishDialogClose || !pendingDelete) return;
      const { key, card } = pendingDelete;

      try {
        localStorage.removeItem(key);
      } catch {
        deleteError.textContent = "Couldn’t delete this note. Try again.";
        return;
      }

      pendingDelete = undefined;
      closeDeleteDialog(() => {
        const visibleCards = [
          ...rail.querySelectorAll(".saved-note"),
        ];
        const index = visibleCards.indexOf(card);
        const neighbor = visibleCards[index + 1] ?? visibleCards[index - 1];
        reflowAfterDeletion(() => {
          removeCard(key);
          updateNavigation();
          if (neighbor) {
            scrollToCard(neighbor);
            neighbor.focus({ preventScroll: true });
          } else {
            newNote.focus({ preventScroll: true });
          }
          announce("Note deleted.");
        });
      });
    }

    function showNote(key, value) {
      const { title, text } = readNote(key, value);
      let card = cards.get(key);
      if (!card) {
        card = cardTemplate.content.firstElementChild.cloneNode(true);
        enableDelete(key, card);
        if (key === originalKey) rail.prepend(card);
        else editorSlot.before(card);
        cards.set(key, card);
      }
      card.querySelector(".note-title").textContent = title || "Untitled";
      card.querySelector(".saved-note-text").textContent = text;
      return card;
    }

    try {
      storage = localStorage;
      for (const key of Object.keys(storage).filter(isNoteKey).sort()) {
        const text = storage.getItem(key);
        if (text) showNote(key, text);
      }
    } catch {
      announce("Saving is unavailable in this browser.", true);
    }

    listen(newNote, "click", () => {
      if (editorOpen) {
        closeEditor();
        return;
      }
      if (!toast.hasAttribute("data-error")) dismissToast();
      setEditorOpen(true);
      if (!editorSlot.hasAttribute("data-folding")) scrollToCard(form);
      titleInput.focus({ preventScroll: true });
    });
    listen(root.querySelector("#close-note"), "click", closeEditor);
    listen(form, "keydown", (event) => {
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        closeEditor();
      }
    });
    listen(editor, "input", () => {
      save.disabled = !editor.value.trim();
    });
    listen(form, "submit", (event) => {
      event.preventDefault();
      const text = editor.value;
      if (!editorOpen || !text.trim()) return;

      const key = `${entryPrefix}${Date.now()}-${crypto.randomUUID()}`;
      const value = JSON.stringify({ title: titleInput.value.trim(), text });
      try {
        localStorage.setItem(key, value);
      } catch {
        announce("Couldn’t save. Copy your note before leaving.", true);
        return;
      }

      const card = showNote(key, value);
      form.reset();
      save.disabled = true;
      setEditorOpen(false, { instant: true });
      scrollToCard(card);
      card.focus({ preventScroll: true });
      if (allowNoteMotion) {
        gsap.fromTo(
          card,
          { opacity: 0.4 },
          {
            opacity: 1,
            duration: 0.24,
            ease: "shelfEntrance",
            clearProps: "opacity",
          },
        );
      }
      announce("Note saved in this browser.");
    });

    listen(window, "storage", ({ storageArea, key, newValue }) => {
      if (storageArea !== storage) return;
      if (key === null) {
        for (const card of cards.values()) card.remove();
        cards.clear();
      } else if (isNoteKey(key)) {
        if (newValue) showNote(key, newValue);
        else removeCard(key);
      } else {
        return;
      }
      if (
        pendingDelete &&
        (pendingDelete.card.hidden || !pendingDelete.card.isConnected)
      )
        closeDeleteDialog();
      updateNavigation();
    });

    listen(root.querySelector("#cancel-note-delete"), "click", () =>
      closeDeleteDialog(),
    );
    listen(root.querySelector("#confirm-note-delete"), "click", confirmDelete);
    listen(deleteDialog, "cancel", (event) => {
      event.preventDefault();
      closeDeleteDialog();
    });
    listen(deleteDialog, "close", () => {
      if (deleteDialog.open || !pendingDelete) return;
      const { card, button } = pendingDelete;
      pendingDelete = undefined;
      const returnFocus = card.isConnected && !card.hidden ? button : newNote;
      returnFocus.focus({ preventScroll: true });
    });

    listen(previous, "click", () => shiftCards(-1));
    listen(next, "click", () => shiftCards(1));
    listen(rail, "scroll", updateNavigation, { passive: true });
    listen(rail, "scroll", showScrollThumb, { capture: true, passive: true });
    listen(
      rail,
      "wheel",
      () => {
        stopRailSnap();
        finishCardReflow();
      },
      { passive: true },
    );
    listen(rail, "pointerdown", startDrag);
    listen(window, "pointermove", dragCards);
    listen(window, "pointerup", endDrag);
    listen(window, "pointercancel", endDrag);
    listen(rail, "lostpointercapture", endDrag);
    listen(
      rail,
      "click",
      (event) => {
        if (!suppressDragClick || !event.detail) return;
        event.preventDefault();
        event.stopPropagation();
      },
      { capture: true },
    );
    const notesResize = new ResizeObserver(updateNavigation);
    notesResize.observe(rail);
    controls.hidden = false;
    updateNavigation();
    return () => {
      dispose();
      notesResize.disconnect();
      media.revert();
      stopRailSnap();
      finishCardReflow();
      gsap.killTweensOf([
        editorSlot,
        form,
        deleteDialog,
        spread,
        ...cards.values(),
      ]);
      for (const card of cards.values()) card.remove();
      controls.hidden = true;
      if (deleteDialog.open) deleteDialog.close();
    };
  }
}
