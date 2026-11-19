// Controllers attach to a component's ref and release every listener and timer on unmount.
export function createLifecycle() {
  const events = new AbortController();
  const timers = new Set();
  return {
    listen(target, type, handler, options = {}) {
      target.addEventListener(type, handler, {
        ...options,
        signal: events.signal,
      });
    },
    schedule(callback, delay) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    },
    dispose() {
      events.abort();
      for (const timer of timers) clearTimeout(timer);
    },
  };
}
