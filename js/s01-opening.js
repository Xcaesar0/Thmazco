/* ==========================================================================
   SCENE 01 — Opening: builds the technical gauge (flange / dial) drawing.
   ========================================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  // Shared gauge drawing — used by the opening and echoed in the closing.
  document.querySelectorAll("[data-dial]").forEach(build);

  function build(svg) {
    const C = 300;
    const add = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      svg.appendChild(el);
      return el;
    };
    const polar = (r, deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return [C + r * Math.cos(a), C + r * Math.sin(a)];
    };

    // Concentric rings
    add("circle", { class: "ring", cx: C, cy: C, r: 296 });
    add("circle", { class: "ring ring--dash", cx: C, cy: C, r: 262 });
    add("circle", { class: "ring", cx: C, cy: C, r: 178 });
    add("circle", { class: "ring ring--dash", cx: C, cy: C, r: 96 });

    // Graduations: 120 ticks, every 10th long, a short orange "hot" sector
    for (let i = 0; i < 120; i++) {
      const deg = i * 3;
      const major = i % 10 === 0;
      const hot = i >= 96 && i <= 104;
      const [x1, y1] = polar(296, deg);
      const [x2, y2] = polar(major ? 272 : 286, deg);
      add("line", {
        class: "t" + (major ? " t--lg" : "") + (hot ? " t--hot" : ""),
        x1, y1, x2, y2,
      });
    }

    // Orange arc on the inner ring — the single warm accent in the drawing
    const [ax, ay] = polar(178, 288);
    const [bx, by] = polar(178, 318);
    add("path", { class: "arc", d: `M ${ax} ${ay} A 178 178 0 0 1 ${bx} ${by}` });

    // Crosshair through the centre
  add("line", { class: "t", x1: C - 120, y1: C, x2: C + 120, y2: C });
  add("line", { class: "t", x1: C, y1: C - 120, x2: C, y2: C + 120 });
  }
})();
