/* Warp sapması (divergence) demosu: 32 thread, GSAP timeline */
(function () {
  "use strict";
  const host = document.getElementById("warp-threads");
  if (!host || !window.gsap) return;

  const COLORS = ["#a78bfa", "#f472b6", "#fbbf24", "#34d399"];
  const MODES = [
    { tab: "Sapma yok", paths: 1, path: function () { return 0; },
      code: [["y = x * 2;", 0]],
      note: "Bütün thread'ler aynı yolda: 32 thread tek adımda biter. Verim %100." },
    { tab: "if / else (2 yol)", paths: 2, path: function (i) { return i < 16 ? 0 : 1; },
      code: [["if (id < 16) {", -1], ["    y = A(x);", 0], ["} else {", -1], ["    y = B(x);", 1], ["}", -1]],
      note: "Önce ilk 16 thread A'yı çalıştırır, diğer 16 maskelenip bekler. Sonra roller değişir. İş 2 adıma çıktı, verim %50." },
    { tab: "switch (4 yol)", paths: 4, path: function (i) { return i % 4; },
      code: [["switch (id % 4) {", -1], ["  case 0: y = A(x); break;", 0], ["  case 1: y = B(x); break;", 1], ["  case 2: y = C(x); break;", 2], ["  case 3: y = D(x); break;", 3], ["}", -1]],
      note: "4 farklı yol var, hepsi sırayla çalışıyor: 4 adım, verim %25. Aynı 32 thread, dört kat daha yavaş." }
  ];

  let h = "";
  for (let i = 0; i < 32; i++) h += '<div class="th"><span>' + i + "</span></div>";
  host.innerHTML = h;
  const ths = host.querySelectorAll(".th");

  const tabs = document.getElementById("warp-tabs");
  const codeEl = document.getElementById("warp-code");
  const stats = document.getElementById("warp-stats");
  let cur = 1, tl = null;

  tabs.innerHTML = MODES.map(function (m, i) {
    return '<button class="tab' + (i === cur ? " active" : "") + '" data-i="' + i + '">' + m.tab + "</button>";
  }).join("");

  function play() {
    if (tl) tl.kill();
    const m = MODES[cur];
    codeEl.innerHTML = m.code.map(function (l, i) {
      return '<span class="cl" data-p="' + l[1] + '">' + l[0].replace(/</g, "&lt;") + "</span>";
    }).join("");
    const lines = codeEl.querySelectorAll(".cl");
    document.getElementById("warp-note").textContent = m.note;
    gsap.set(ths, { opacity: 0.22, scale: 0.85, backgroundColor: "#334166" });
    lines.forEach(function (l) { l.classList.remove("on"); });
    stats.innerHTML =
      '<div class="ps"><small>Adım</small><b id="wp-step">0 / ' + m.paths + "</b></div>" +
      '<div class="ps"><small>Bu adımda çalışan</small><b id="wp-run">—</b></div>' +
      '<div class="ps"><small>Verimlilik</small><b id="wp-eff">—</b></div>';

    tl = gsap.timeline();
    for (let s = 0; s < m.paths; s++) {
      const mine = [];
      ths.forEach(function (t, i) { if (m.path(i) === s) mine.push(t); });
      tl.call(function () {
        lines.forEach(function (l) { l.classList.toggle("on", +l.dataset.p === s); });
        document.getElementById("wp-step").textContent = (s + 1) + " / " + m.paths;
        document.getElementById("wp-run").textContent = mine.length + " / 32 thread";
        gsap.to(mine, { opacity: 1, scale: 1.18, backgroundColor: COLORS[s], duration: 0.3, ease: "back.out(2)" });
      }, null, s * 1.1);
      tl.to(mine, { scale: 1, duration: 0.25 }, s * 1.1 + 0.8);
    }
    tl.call(function () {
      lines.forEach(function (l) { l.classList.remove("on"); });
      const eff = 100 / m.paths;
      const e = document.getElementById("wp-eff");
      e.textContent = "%" + eff.toFixed(0);
      e.style.color = eff === 100 ? "#34d399" : eff >= 50 ? "#fbbf24" : "#fb7185";
      gsap.fromTo(e, { scale: 1.4 }, { scale: 1, duration: 0.7, ease: "elastic.out(1,.4)" });
    }, null, m.paths * 1.1);
  }

  tabs.addEventListener("click", function (e) {
    const b = e.target.closest(".tab");
    if (!b) return;
    cur = +b.dataset.i;
    tabs.querySelectorAll(".tab").forEach(function (t, i) { t.classList.toggle("active", i === cur); });
    play();
  });
  document.getElementById("warp-replay").addEventListener("click", play);

  if (window.ScrollTrigger) {
    ScrollTrigger.create({ trigger: host, start: "top 80%", once: true, onEnter: play });
  } else {
    play();
  }
})();
