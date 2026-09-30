/* Amdahl yasası demosu: çekirdek sayısı ↔ hızlanma (GSAP) */
(function () {
  "use strict";
  const host = document.getElementById("am-bars");
  const slider = document.getElementById("am-p");
  if (!host || !slider || !window.gsap) return;

  const NS = [1, 2, 4, 8, 16, 32, 64];
  host.innerHTML = NS.map(function (n) {
    return '<div class="amrow"><span class="an">' + n + ' çekirdek</span>' +
      '<div class="atrack"><div class="aideal"></div><div class="afill"></div></div>' +
      '<span class="av">×1,0</span></div>';
  }).join("");
  const fills = host.querySelectorAll(".afill");
  const ideals = host.querySelectorAll(".aideal");
  const vals = host.querySelectorAll(".av");
  const vs = NS.map(function () { return { v: 1 }; });

  const speedup = function (p, n) { return 1 / ((1 - p) + p / n); };

  function update(animate) {
    const pct = +slider.value;
    const p = pct / 100;
    document.getElementById("am-p-val").textContent = pct + "%";
    NS.forEach(function (n, i) {
      const sp = speedup(p, n);
      const w = sp / 64 * 100;
      const iw = n / 64 * 100;
      if (animate) {
        gsap.to(fills[i], { width: w + "%", duration: 0.5, ease: "power2.out", overwrite: true });
        gsap.to(ideals[i], { width: iw + "%", duration: 0.5, ease: "power2.out", overwrite: true });
        gsap.to(vs[i], {
          v: sp, duration: 0.5, ease: "power2.out", overwrite: true,
          onUpdate: function () { vals[i].textContent = "×" + vs[i].v.toFixed(1).replace(".", ","); }
        });
      } else {
        fills[i].style.width = w + "%";
        ideals[i].style.width = iw + "%";
        vs[i].v = sp;
        vals[i].textContent = "×" + sp.toFixed(1).replace(".", ",");
      }
    });
    const limit = p >= 1 ? null : 1 / (1 - p);
    document.getElementById("am-note").innerHTML = limit
      ? "Sarı çizgi \"ideal\" (çekirdek sayısı kadar hızlanma), dolu çubuk gerçek. Bu programda sonsuz çekirdek bile olsa hız en fazla <b>×" + limit.toFixed(0) + "</b> olur, çünkü %" + (100 - pct) + "'lik kısım sırayla çalışmak zorunda."
      : "Program tamamen paralel: çekirdek sayısı kadar hızlanır. Gerçek hayatta bu neredeyse hiç olmaz.";
  }

  slider.addEventListener("input", function () { update(true); });
  update(false);

  if (window.ScrollTrigger) {
    gsap.from(fills, {
      width: 0, duration: 0.9, stagger: 0.08, ease: "power3.out",
      scrollTrigger: { trigger: host, start: "top 85%", once: true }
    });
  }
})();
