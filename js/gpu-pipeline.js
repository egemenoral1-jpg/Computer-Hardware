/* Grafik hattı: köşe → üçgen → rasterization → shading → kare (GSAP, SVG) */
(function () {
  "use strict";
  const svg = document.getElementById("rp-svg");
  if (!svg || !window.gsap) return;

  const $ = function (id) { return document.getElementById(id); };
  const W = 24, H = 16, C = 20;
  const V = [
    { x: 100, y: 60, c: [251, 113, 133], n: "V1" },
    { x: 390, y: 110, c: [52, 211, 153], n: "V2" },
    { x: 210, y: 270, c: [56, 189, 248], n: "V3" }
  ];
  const den = (V[1].y - V[2].y) * (V[0].x - V[2].x) + (V[2].x - V[1].x) * (V[0].y - V[2].y);

  const all = [], inside = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x * C + C / 2, py = y * C + C / 2;
      const w1 = ((V[1].y - V[2].y) * (px - V[2].x) + (V[2].x - V[1].x) * (py - V[2].y)) / den;
      const w2 = ((V[2].y - V[0].y) * (px - V[2].x) + (V[0].x - V[2].x) * (py - V[2].y)) / den;
      const w3 = 1 - w1 - w2;
      const cell = { x: x * C, y: y * C };
      all.push(cell);
      if (w1 >= 0 && w2 >= 0 && w3 >= 0) {
        const r = Math.round(w1 * V[0].c[0] + w2 * V[1].c[0] + w3 * V[2].c[0]);
        const g = Math.round(w1 * V[0].c[1] + w2 * V[1].c[1] + w3 * V[2].c[1]);
        const b = Math.round(w1 * V[0].c[2] + w2 * V[1].c[2] + w3 * V[2].c[2]);
        cell.fill = "rgb(" + r + "," + g + "," + b + ")";
        inside.push(cell);
      }
    }
  }

  const rect = function (c, extra) { return '<rect x="' + c.x + '" y="' + c.y + '" width="' + C + '" height="' + C + '" ' + extra + "/>"; };
  const edges = [[0, 1], [1, 2], [2, 0]];
  svg.innerHTML =
    '<g id="lg-grid">' + all.map(function (c) { return rect(c, 'class="gc" fill="none" stroke="rgba(255,255,255,.09)"'); }).join("") + "</g>" +
    '<g id="lg-frag">' + inside.map(function (c) { return rect(c, 'class="fc" fill="rgba(167,139,250,.22)" stroke="#a78bfa" stroke-width="1"'); }).join("") + "</g>" +
    '<g id="lg-color">' + inside.map(function (c) { return rect(c, 'class="cc" fill="' + c.fill + '"'); }).join("") + "</g>" +
    '<g id="lg-edges"><polygon fill="rgba(255,255,255,.05)" points="' + V.map(function (v) { return v.x + "," + v.y; }).join(" ") + '"/>' +
    edges.map(function (e) {
      const a = V[e[0]], b = V[e[1]], len = Math.hypot(b.x - a.x, b.y - a.y);
      return '<line class="ed" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="' + len + '" stroke-dashoffset="0"/>';
    }).join("") + "</g>" +
    '<g id="lg-verts">' + V.map(function (v) {
      return '<circle class="vt" cx="' + v.x + '" cy="' + v.y + '" r="9" fill="rgb(' + v.c.join(",") + ')" stroke="#fff" stroke-width="2"/>' +
        '<text class="vl" x="' + (v.x + (v.x > 300 ? -32 : 14)) + '" y="' + (v.y + (v.y > 200 ? 26 : -12)) + '" fill="#fff" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600">' + v.n + "</text>";
    }).join("") + "</g>" +
    '<g id="lg-out"><rect class="fr" x="2" y="2" width="476" height="316" rx="6" fill="none" stroke="#34d399" stroke-width="4"/>' +
    '<rect class="fl" x="0" y="0" width="480" height="320" fill="#fff"/>' +
    '<text x="240" y="306" text-anchor="middle" fill="#34d399" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700">KARE HAZIR → EKRANA GİDİYOR</text></g>';

  const G = { grid: $("lg-grid"), frag: $("lg-frag"), color: $("lg-color"), edges: $("lg-edges"), verts: $("lg-verts"), out: $("lg-out") };
  Object.keys(G).forEach(function (k) { gsap.set(G[k], { opacity: 0 }); });

  const TEXT = [
    "<b>Başlangıç.</b> Boş bir ekran. \"İleri\" ile tek bir üçgenin ekrana nasıl çizildiğini adım adım izle.",
    "<b>1. Köşe noktaları (vertex).</b> 3D modeller üçgenlerden oluşur ve her üçgenin 3 köşesi var. Her köşenin bir konumu ve rengi var. <em>Vertex shader</em> her köşeyi 3D dünyadan ekrandaki 2D konuma çevirir. Milyonlarca köşe = milyonlarca bağımsız iş.",
    "<b>2. Şekil kurma (primitive assembly).</b> Üç köşe birleştirilip üçgen oluşturulur.",
    "<b>3. Rasterization.</b> Üçgenin ekranda hangi piksellere denk geldiği bulunur. Bu üçgen <b>" + inside.length + " piksele</b> dönüştü; her biri bir \"fragment\" (piksel adayı).",
    "<b>4. Piksel shader (fragment shader).</b> Her fragment için renk hesaplanır. Burada köşe renkleri konuma göre karıştırılıyor (interpolasyon). Gerçek oyunlarda doku, ışık ve gölge burada hesaplanır. Her piksel için ayrı bir program çalışır, tam GPU'luk iş.",
    "<b>5. Çıktı birleştirme (ROP).</b> Derinlik testi (önde mi, arkada mı?), şeffaflık karışımı ve kenar yumuşatma yapılır, sonuç kare tamponuna yazılır. Kare hazır! Bu döngü saniyede 60, 144, hatta 240 kez tekrarlanır."
  ];
  const NAMES = ["Köşeler", "Üçgen", "Raster", "Piksel shader", "Kare"];

  let step = 0, autoCall = null;
  const shown = [true, false, false, false, false, false];

  function fx(i) {
    if (i === 1) {
      gsap.set(G.verts, { opacity: 1 });
      gsap.fromTo(G.verts.querySelectorAll(".vt"), { attr: { r: 0 } }, { attr: { r: 9 }, duration: 0.5, stagger: 0.2, ease: "back.out(3)" });
      gsap.fromTo(G.verts.querySelectorAll(".vl"), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.2, delay: 0.2 });
    } else if (i === 2) {
      gsap.set(G.edges, { opacity: 1 });
      gsap.fromTo(G.edges.querySelectorAll(".ed"), { strokeDashoffset: function (k, el) { return parseFloat(el.getAttribute("stroke-dasharray")); } }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.35, ease: "power2.inOut" });
      gsap.fromTo(G.edges.querySelector("polygon"), { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1 });
    } else if (i === 3) {
      gsap.set(G.grid, { opacity: 1 });
      gsap.set(G.frag, { opacity: 1 });
      gsap.from(G.grid.querySelectorAll(".gc"), { opacity: 0, duration: 0.3, stagger: { each: 0.002 } });
      gsap.from(G.frag.querySelectorAll(".fc"), { opacity: 0, duration: 0.25, stagger: { each: 0.008 }, delay: 0.5 });
    } else if (i === 4) {
      gsap.set(G.color, { opacity: 1 });
      gsap.from(G.color.querySelectorAll(".cc"), { opacity: 0, duration: 0.3, stagger: { each: 0.006 } });
    } else if (i === 5) {
      gsap.set(G.out, { opacity: 1 });
      gsap.to(G.grid, { opacity: 0.2, duration: 0.5 });
      gsap.fromTo(G.out.querySelector(".fr"), { strokeWidth: 0 }, { strokeWidth: 4, duration: 0.6, ease: "power2.out" });
      gsap.fromTo(G.out.querySelector(".fl"), { opacity: 0.6 }, { opacity: 0, duration: 0.7 });
    }
  }
  function unfx(i) {
    const map = { 1: G.verts, 2: G.edges, 3: [G.grid, G.frag], 4: G.color, 5: G.out };
    [].concat(map[i]).forEach(function (g) {
      gsap.killTweensOf(g);
      gsap.killTweensOf(g.children);
      gsap.set(g, { opacity: 0 });
      gsap.set(g.children, { clearProps: "opacity" });
    });
    if (i === 5 && shown[3]) gsap.set(G.grid, { opacity: 1 });
  }

  const stepsEl = $("rp-steps");
  stepsEl.innerHTML = NAMES.map(function (n, i) { return '<button class="rp-pill" data-s="' + (i + 1) + '"><b>' + (i + 1) + "</b> " + n + "</button>"; }).join("");

  function goto(s) {
    s = Math.max(0, Math.min(5, s));
    for (let i = 1; i <= 5; i++) {
      if (i <= s && !shown[i]) { shown[i] = true; fx(i); }
      else if (i > s && shown[i]) { shown[i] = false; unfx(i); }
    }
    step = s;
    stepsEl.querySelectorAll(".rp-pill").forEach(function (p) {
      const n = +p.dataset.s;
      p.classList.toggle("on", n === s);
      p.classList.toggle("done", n < s);
    });
    const t = $("rp-text");
    t.innerHTML = TEXT[s];
    gsap.fromTo(t, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 });
    $("rp-prev").disabled = s === 0;
    $("rp-next").disabled = s === 5;
  }

  function stopAuto() {
    if (autoCall) { autoCall.kill(); autoCall = null; }
    $("rp-auto").textContent = "Otomatik oynat";
  }
  function auto() {
    if (autoCall) { stopAuto(); return; }
    if (step === 5) goto(0);
    $("rp-auto").textContent = "Durdur";
    (function tick() {
      goto(step + 1);
      if (step < 5) autoCall = gsap.delayedCall(2.6, tick);
      else stopAuto();
    })();
  }

  $("rp-next").addEventListener("click", function () { stopAuto(); goto(step + 1); });
  $("rp-prev").addEventListener("click", function () { stopAuto(); goto(step - 1); });
  $("rp-auto").addEventListener("click", auto);
  stepsEl.addEventListener("click", function (e) {
    const p = e.target.closest(".rp-pill");
    if (p) { stopAuto(); goto(+p.dataset.s); }
  });
  goto(0);
})();
