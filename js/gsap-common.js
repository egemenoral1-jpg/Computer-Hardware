/* GSAP sayfaları için ortak yardımcılar: hero giriş animasyonu + sayaçlar */
(function () {
  "use strict";
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".part-hero .eyebrow, .part-hero h1, .part-hero .lead, .part-hero .chip", {
    y: 26, opacity: 0, duration: 0.7, stagger: 0.09, ease: "power3.out"
  });

  document.querySelectorAll(".stat b[data-count]").forEach(function (el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || "0", 10);
    const suf = el.dataset.suffix || "";
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: function () {
        gsap.to(o, {
          v: end, duration: 1.6, ease: "power2.out",
          onUpdate: function () {
            el.textContent = (dec ? o.v.toFixed(dec).replace(".", ",") : Math.round(o.v).toLocaleString("tr-TR")) + suf;
          }
        });
      }
    });
  });
})();
