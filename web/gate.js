import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

const gate = document.querySelector(".gate:not([data-feedback])");

if (gate) {
  gsap.registerPlugin(CustomEase);
  const ease = CustomEase.create("gateEntrance", ".23, 1, .32, 1");
  const form = gate.querySelector(".gate-form");
  const signature = gate.querySelector(".gate-signature");
  const canAnimate = getComputedStyle(signature).opacity === "0";
  gate.setAttribute("data-ready", "");
  let played = false;

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    if (!canAnimate || played || form.contains(document.activeElement)) return;
    played = true;

    const entry = form.querySelector(".gate-entry");
    const underline = gate.querySelector(".gate-pencil-stroke");
    const doodleLines = gate.querySelectorAll(".gate-doodle-arrow path, .gate-doodle-loop path");
    const doodleAccents = gate.querySelectorAll(".gate-doodle-hearts, .gate-doodle-sparkles");
    const illustration = gate.querySelector(".gate-illustration");
    const strokes = [...signature.querySelectorAll("path")];
    const lengths = strokes.map((stroke) => stroke.getTotalLength());
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);

    gsap.set([...strokes, ...doodleLines], { attr: { "stroke-dashoffset": 1.04 } });
    gsap.set(underline, { scaleX: 0 });
    gsap.set(entry, { opacity: 0, y: 6, pointerEvents: "none" });
    gsap.set(illustration, { opacity: 0 });
    gsap.set(doodleAccents, { opacity: 0, scale: 0.86, y: 5, transformOrigin: "50% 50%" });

    const entrance = gsap.timeline({ defaults: { ease } });
    strokes.forEach((stroke, index) => {
      entrance.to(stroke, {
        attr: { "stroke-dashoffset": 0 },
        duration: 1.55 * lengths[index] / totalLength,
        ease: "none",
      });
    });
    entrance.to(underline, {
      scaleX: 1,
      duration: 0.28,
      clearProps: "transform",
    });
    entrance.addLabel("formReveal");
    entrance.set(entry, { pointerEvents: "auto" }, "formReveal");
    entrance.to(entry, {
      opacity: 1,
      y: 0,
      duration: 0.32,
      clearProps: "opacity,transform,pointerEvents",
    }, "formReveal");

    entrance.to(illustration, {
      opacity: 1,
      duration: 0.28,
      clearProps: "opacity",
    }, 0.04);
    // The curl follows the hearts and sparkles.
    entrance.to(doodleLines, {
      attr: { "stroke-dashoffset": 0 },
      ease: "none",
      duration: 0.38,
      stagger: 0.98,
    }, 0.36);
    entrance.to(doodleAccents, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.25,
      stagger: 0.28,
      clearProps: "opacity,transform,transformOrigin",
    }, 0.77);

    const finishOnFocus = () => entrance.progress(1);
    form.addEventListener("focusin", finishOnFocus, { once: true });
    return () => form.removeEventListener("focusin", finishOnFocus);
  }, gate);
}
