/* ==========================================================================
   Chapters — current-site screenshot slots.
   Any [data-shot] figure shows a schematic until a real screenshot exists at
   its path (e.g. assets/img/current/home.jpg); then the image replaces it.
   ========================================================================== */
(function () {
  "use strict";

  document.querySelectorAll("[data-shot]").forEach((fig) => {
    const img = new Image();
    img.alt = "لقطة من موقع طهماز الحالي";
    img.onload = () => {
      fig.insertBefore(img, fig.firstChild);
      fig.classList.add("has-shot");
    };
    img.src = fig.dataset.shot;
  });
})();
