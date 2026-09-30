/* GPU hero: 400 küçük "çekirdek" ızgarası. GSAP grid stagger ile dalga + tıklayınca dalgalanma */
(function () {
  "use strict";
  const host = document.getElementById("gpu-hero");
  if (!host || !window.gsap) return;

  const N = 20;
  let html = '<div class="hgrid">';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const hue = (255 + (x + y) * 3.4) % 360;
      html += '<div class="hc" style="background:hsl(' + hue.toFixed(0) + ' 85% 64%)"></div>';
    }
  }
  html += "</div>";
  host.innerHTML = html;
  const cells = host.querySelectorAll(".hc");

  // sürekli dalga: her hücre kendi tween'inde yoyo yapar, gecikmeler dalgayı oluşturur
  function startWave() {
    gsap.to(cells, {
      scale: 0.3, opacity: 0.3, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1,
      stagger: { grid: [N, N], from: "center", amount: 2.6 }
    });
  }

  // giriş: merkezden dışa doğru belirme, bitince dalga başlar
  gsap.timeline({ onComplete: startWave }).from(cells, {
    scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)",
    stagger: { grid: [N, N], from: "center", amount: 1.1 }
  });

  // tıklayınca / üstünde gezince: dönerek yuvarlaklaşma dalgası (scale/opacity ile çakışmasın diye farklı özellikler)
  let last = 0;
  function ripple(idx) {
    const now = performance.now();
    if (now - last < 350) return;
    last = now;
    gsap.fromTo(cells, { rotation: 0, borderRadius: "3px" }, {
      rotation: 180, borderRadius: "50%", duration: 0.35, yoyo: true, repeat: 1, ease: "power2.inOut",
      stagger: { grid: [N, N], from: idx, amount: 0.7 }, overwrite: "auto"
    });
  }
  host.addEventListener("pointerdown", function (e) {
    const t = e.target.closest(".hc");
    if (t) ripple(Array.prototype.indexOf.call(cells, t));
  });
  host.addEventListener("pointerover", function (e) {
    const t = e.target.closest(".hc");
    if (t) ripple(Array.prototype.indexOf.call(cells, t));
  });
})();
