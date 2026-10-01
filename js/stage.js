/* ==========================================================================
   Stage — scene-by-scene presentation controller.

   Scenes are <section class="scene"> children of .stage. One is active at a
   time; wheel, keys, swipe and the scroll cue move between them. Each scene
   reveals its own content when it receives .is-in.

   Scene modules can register enter/leave hooks:
     Stage.register("opening", { enter(el) {}, leave(el) {} });
   ========================================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  const stageEl = document.querySelector(".stage");
  const scenes = Array.from(stageEl.querySelectorAll(".scene"));
  const huds = Array.from(document.querySelectorAll(".hud"));
  const total = Math.max(Number(stageEl.dataset.total) || 0, scenes.length);
  const hooks = {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const TRANSITION_MS = 1100;
  const WHEEL_THRESHOLD = 40;
  const SWIPE_THRESHOLD = 50;

  let current = -1;
  let locked = false;
  let wheelAccum = 0;
  let wheelTimer = 0;

  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- Rail ---------- */
  const railIndex = document.querySelector("[data-rail-index]");
  const railTotal = document.querySelector("[data-rail-total]");
  const railTicks = document.querySelector("[data-rail-ticks]");
  if (railTotal) railTotal.textContent = pad(total);
  if (railTicks) {
    for (let i = 0; i < total; i++) railTicks.appendChild(document.createElement("span")).className = "rail__tick";
  }

  function updateRail(i) {
    if (railIndex) railIndex.textContent = pad(i + 1);
    if (!railTicks) return;
    Array.from(railTicks.children).forEach((t, k) => {
      t.classList.toggle("is-current", k === i);
      t.classList.toggle("is-future", k >= scenes.length);
    });
  }

  /* ---------- Scene switching ---------- */
  function go(next, { instant = false } = {}) {
    if (next === current || next < 0) return;
    if (next >= scenes.length) return bump();

    const prev = scenes[current];
    const el = scenes[next];
    locked = true;

    if (prev) {
      prev.classList.remove("is-active", "is-in");
      prev.classList.add("is-leaving");
      hooks[prev.dataset.scene]?.leave?.(prev);
      setTimeout(() => prev.classList.remove("is-leaving"), TRANSITION_MS);
    }

    el.classList.add("is-active");
    // Two frames so the "before" state is painted, then resolve the reveal.
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-in")));
    hooks[el.dataset.scene]?.enter?.(el);

    current = next;
    root.dataset.tone = el.dataset.tone || "dark";
    updateRail(next);
    history.replaceState(null, "", "#" + pad(next + 1));
    setTimeout(() => (locked = false), instant ? 0 : TRANSITION_MS);
  }

  const next = () => !locked && go(current + 1);
  const prev = () => !locked && go(current - 1);

  // No scene beyond this one yet — acknowledge the input with a small nudge.
  function bump() {
    stageEl.classList.remove("is-bumped");
    void stageEl.offsetWidth;
    stageEl.classList.add("is-bumped");
    locked = true;
    setTimeout(() => {
      stageEl.classList.remove("is-bumped");
      locked = false;
    }, 800);
  }

  /* ---------- Input ---------- */
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (locked) return;
    wheelAccum += e.deltaY;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => (wheelAccum = 0), 160);
    if (wheelAccum > WHEEL_THRESHOLD) { wheelAccum = 0; next(); }
    else if (wheelAccum < -WHEEL_THRESHOLD) { wheelAccum = 0; prev(); }
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    const k = e.key;
    if (k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey)) { e.preventDefault(); prev(); }
    else if (k === "Home") { e.preventDefault(); !locked && go(0); }
    else if (k === "End") { e.preventDefault(); !locked && go(scenes.length - 1); }
  });

  let touchY = null;
  window.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("touchend", (e) => {
    if (touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (dy > SWIPE_THRESHOLD) next();
    else if (dy < -SWIPE_THRESHOLD) prev();
  });

  document.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", next));

  // Touch devices advance with a swipe, not a wheel — say so.
  if (!finePointer) {
    document.querySelectorAll(".cue__label").forEach((l) => (l.textContent = "اسحب للمتابعة"));
  }

  /* ---------- Pointer parallax (fine pointers only) ---------- */
  scenes.forEach((s) => s.querySelectorAll("[data-depth]").forEach((l) => l.style.setProperty("--depth", l.dataset.depth)));

  if (finePointer && !reduceMotion) {
    let tx = 0, ty = 0, x = 0, y = 0;
    window.addEventListener("pointermove", (e) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    });
    (function tick() {
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      const el = scenes[current];
      if (el) {
        el.style.setProperty("--px", x.toFixed(4));
        el.style.setProperty("--py", y.toFixed(4));
      }
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- Boot: wait for display type, lift the curtain, open ---------- */
  root.classList.add("is-loading");
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, 1800));

  Promise.race([fontsReady, timeout]).then(() => {
    setTimeout(() => {
      root.classList.remove("is-loading");
      root.classList.add("is-ready");
      huds.forEach((h) => h.classList.add("is-in"));
      const fromHash = parseInt(location.hash.slice(1), 10) - 1;
      go(Number.isInteger(fromHash) && fromHash >= 0 && fromHash < scenes.length ? fromHash : 0, { instant: true });
    }, reduceMotion ? 0 : 450);
  });

  window.Stage = {
    register(name, h) { hooks[name] = h; },
    go: (i) => go(i),
    next,
    prev,
    get index() { return current; },
  };
})();
