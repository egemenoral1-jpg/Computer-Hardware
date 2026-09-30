/* Işın izleme demosu: fareyi takip eden ışık kaynağından ışınlar (canvas + GSAP ticker) */
(function () {
  "use strict";
  const cv = document.getElementById("ray-canvas");
  if (!cv || !window.gsap) return;
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;

  const segs = [];
  function addRect(x, y, w, h) {
    const p = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    for (let i = 0; i < 4; i++) segs.push({ a: { x: p[i][0], y: p[i][1] }, b: { x: p[(i + 1) % 4][0], y: p[(i + 1) % 4][1] } });
  }
  function addCircle(cx, cy, r, n) {
    for (let i = 0; i < n; i++) {
      const a1 = i / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2;
      segs.push({ a: { x: cx + Math.cos(a1) * r, y: cy + Math.sin(a1) * r }, b: { x: cx + Math.cos(a2) * r, y: cy + Math.sin(a2) * r } });
    }
  }
  addRect(0, 0, W, H);
  const shapes = [];
  function obstacle(kind, a, b, c, d) {
    if (kind === "rect") { addRect(a, b, c, d); shapes.push({ kind: kind, a: a, b: b, c: c, d: d }); }
    else { addCircle(a, b, c, 24); shapes.push({ kind: kind, a: a, b: b, c: c }); }
  }
  obstacle("rect", 130, 70, 90, 70);
  obstacle("circle", 330, 110, 46);
  obstacle("rect", 470, 190, 60, 110);
  obstacle("circle", 210, 280, 38);
  obstacle("rect", 590, 60, 80, 50);

  const light = { x: 360, y: 200 };
  let N = 72, manual = false;
  const nEl = document.getElementById("ray-n"), nVal = document.getElementById("ray-n-val"), stats = document.getElementById("ray-stats");

  function hit(ox, oy, dx, dy, s) {
    const sx = s.b.x - s.a.x, sy = s.b.y - s.a.y;
    const den = dx * sy - dy * sx;
    if (Math.abs(den) < 1e-9) return -1;
    const t = ((s.a.x - ox) * sy - (s.a.y - oy) * sx) / den;
    const u = ((s.a.x - ox) * dy - (s.a.y - oy) * dx) / den;
    return (t >= 0 && u >= 0 && u <= 1) ? t : -1;
  }

  function frame() {
    if (!manual) {
      const t = performance.now() / 1000;
      light.x = W / 2 + Math.cos(t * 0.6) * 250;
      light.y = H / 2 + Math.sin(t * 0.9) * 120;
    }
    // ışınları at
    const pts = [];
    for (let i = 0; i < N; i++) {
      const ang = i / N * Math.PI * 2 + 0.0001;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      let best = Infinity;
      for (let k = 0; k < segs.length; k++) {
        const t = hit(light.x, light.y, dx, dy, segs[k]);
        if (t >= 0 && t < best) best = t;
      }
      pts.push({ x: light.x + dx * best, y: light.y + dy * best });
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#070c18";
    ctx.fillRect(0, 0, W, H);

    // aydınlanan alan
    const g = ctx.createRadialGradient(light.x, light.y, 4, light.x, light.y, 340);
    g.addColorStop(0, "rgba(255,240,180,.55)");
    g.addColorStop(1, "rgba(167,139,250,.05)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();

    // ışınlar
    if (N <= 180) {
      ctx.strokeStyle = "rgba(255,230,150,.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) { ctx.moveTo(light.x, light.y); ctx.lineTo(pts[i].x, pts[i].y); }
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      for (let i = 0; i < pts.length; i++) ctx.fillRect(pts[i].x - 1.5, pts[i].y - 1.5, 3, 3);
    }

    // engeller
    ctx.fillStyle = "#1a2444";
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    shapes.forEach(function (s) {
      ctx.beginPath();
      if (s.kind === "rect") ctx.rect(s.a, s.b, s.c, s.d); else ctx.arc(s.a, s.b, s.c, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // ışık
    ctx.fillStyle = "#fff8d0";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(light.x, light.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function stats_() {
    const tests = N * (segs.length);
    stats.innerHTML =
      '<div class="ps"><small>Işın sayısı</small><b>' + N + "</b></div>" +
      '<div class="ps"><small>Kesişim testi / kare</small><b>' + tests.toLocaleString("tr-TR") + "</b></div>" +
      '<div class="ps"><small>Saniyede (60 FPS)</small><b>' + (tests * 60 / 1e6).toFixed(1).replace(".", ",") + " milyon</b></div>";
  }

  nEl.addEventListener("input", function () {
    N = +nEl.value;
    nVal.textContent = N;
    stats_();
  });
  cv.addEventListener("pointermove", function (e) {
    const r = cv.getBoundingClientRect();
    manual = true;
    gsap.to(light, { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H, duration: 0.25, ease: "power2.out", overwrite: true });
  });
  cv.addEventListener("pointerleave", function () { manual = false; });
  stats_();

  // sadece ekranda görünürken çiz
  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: cv, start: "top bottom", end: "bottom top",
      onToggle: function (self) { if (self.isActive) gsap.ticker.add(frame); else gsap.ticker.remove(frame); }
    });
  } else {
    gsap.ticker.add(frame);
  }
  frame();
})();
