/* Upscaling hesaplayıcı: hedef çözünürlük + mod → GPU'nun çizdiği piksel sayısı */
(function () {
  "use strict";
  const out = document.getElementById("up-out");
  if (!out) return;
  const tgt = document.getElementById("up-target"), mode = document.getElementById("up-mode"), fill = document.getElementById("up-fill");
  const hasG = !!window.gsap;
  const tr = function (n, d) { return n.toLocaleString("tr-TR", { maximumFractionDigits: d === undefined ? 1 : d }); };
  let prev = 100;

  function update() {
    const p = tgt.value.split("x").map(Number), s = +mode.value;
    const rw = Math.round(p[0] * s), rh = Math.round(p[1] * s);
    const full = p[0] * p[1], part = rw * rh;
    const pct = part / full * 100;
    out.innerHTML =
      '<div class="ps"><small>Hedef</small><b>' + p[0] + "×" + p[1] + "</b></div>" +
      '<div class="ps"><small>GPU&#39;nun çizdiği</small><b>' + rw + "×" + rh + "</b></div>" +
      '<div class="ps"><small>Çizilen piksel</small><b>' + tr(part / 1e6, 2) + " M</b></div>" +
      '<div class="ps"><small>Tam çözünürlüğe göre</small><b>%' + tr(pct, 0) + "</b></div>";
    if (hasG) {
      gsap.to(fill, { width: pct + "%", duration: 0.6, ease: "power3.out", overwrite: true });
      gsap.fromTo(out.children, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.04 });
    } else {
      fill.style.width = pct + "%";
    }
    prev = pct;
  }
  tgt.addEventListener("change", update);
  mode.addEventListener("change", update);
  update();
})();
