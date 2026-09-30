/* CPU hero: GSAP ile animasyonlu çip çizimi (yazı ve sayaç animasyonları gsap-common.js'te) */
(function () {
  "use strict";
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- çip çizimi ---------- */
  const host = document.getElementById("cpu-hero");
  if (host) {
    let cores = "";
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 104 + c * 50, y = r ? 206 : 122;
        cores += '<g transform="translate(' + x + "," + y + ')"><g class="core">' +
          '<rect class="cbody" width="42" height="48" rx="6"/>' +
          '<rect class="alu" x="8" y="8" width="26" height="12" rx="2"/>' +
          '<rect class="reg" x="8" y="26" width="26" height="6" rx="1.5"/>' +
          '<rect class="reg" x="8" y="35" width="26" height="6" rx="1.5"/></g></g>';
      }
    }

    // pinler + izler
    let pins = "", traces = "";
    const dotDefs = [];
    for (let i = 0; i < 14; i++) {
      const p = 64 + i * 20;
      const cl = Math.min(300, Math.max(100, p));
      pins += '<line class="pin" x1="' + p + '" y1="24" x2="' + p + '" y2="40"/>' +
              '<line class="pin" x1="' + p + '" y1="360" x2="' + p + '" y2="376"/>' +
              '<line class="pin" x1="24" y1="' + p + '" x2="40" y2="' + p + '"/>' +
              '<line class="pin" x1="360" y1="' + p + '" x2="376" y2="' + p + '"/>';
      traces += '<path class="trace" d="M' + p + " 40 L" + cl + ' 102"/>' +
                '<path class="trace" d="M' + p + " 360 L" + cl + ' 298"/>' +
                '<path class="trace" d="M40 ' + p + " L92 " + Math.min(280, Math.max(120, p)) + '"/>' +
                '<path class="trace" d="M360 ' + p + " L308 " + Math.min(280, Math.max(120, p)) + '"/>';
      if (i % 2 === 0) {
        dotDefs.push([p, 24, cl, 102], [p, 376, cl, 298], [24, p, 92, Math.min(280, Math.max(120, p))], [376, p, 308, Math.min(280, Math.max(120, p))]);
      }
    }
    let dots = "";
    dotDefs.forEach(function () { dots += '<circle class="dot" r="2.6" cx="-10" cy="-10"/>'; });

    host.innerHTML =
      '<svg viewBox="0 0 400 400" role="img">' +
      '<g class="traces">' + traces + "</g>" +
      '<g class="pins">' + pins + "</g>" +
      '<rect class="pkg" x="40" y="40" width="320" height="320" rx="26"/>' +
      '<g class="dg">' +
      '<rect class="die" x="92" y="102" width="216" height="196" rx="12"/>' +
      cores +
      '<rect class="l3" x="104" y="178" width="192" height="20" rx="5"/>' +
      '<text x="200" y="192">L3 CACHE</text>' +
      '<rect class="strip" x="104" y="262" width="92" height="26" rx="5"/><text x="150" y="279">iGPU</text>' +
      '<rect class="strip" x="204" y="262" width="92" height="26" rx="5"/><text x="250" y="279">BELLEK DEN.</text>' +
      "</g>" +
      '<g class="dots">' + dots + "</g></svg>";

    const q = function (s) { return host.querySelectorAll(s); };

    // giriş animasyonu
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(q(".pkg"), { scale: 0.6, opacity: 0, transformOrigin: "50% 50%", duration: 0.8 })
      .from(q(".die"), { scale: 0.8, opacity: 0, transformOrigin: "50% 50%", duration: 0.6 }, "-=0.4")
      .from(q(".core"), { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.06, ease: "back.out(2)" }, "-=0.2")
      .from(q(".l3"), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5 }, "<0.2")
      .from(q(".strip"), { opacity: 0, y: 8, duration: 0.4, stagger: 0.1 })
      .from(q(".pin"), { opacity: 0, duration: 0.3, stagger: { each: 0.015, from: "random" } }, "-=0.7")
      .from(q(".trace"), { opacity: 0, duration: 0.4, stagger: { each: 0.01, from: "random" } }, "<");

    // sürekli hareketler
    tl.add(function () {
      gsap.to(q(".cbody"), { fill: "rgba(56,189,248,.5)", duration: 0.7, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: { each: 0.35, from: "random" } });
      gsap.to(q(".alu"), { opacity: 0.25, duration: 0.25, yoyo: true, repeat: -1, repeatDelay: 0.5, stagger: { each: 0.13, from: "random" } });
      q(".dot").forEach(function (d, i) {
        const a = dotDefs[i];
        gsap.fromTo(d, { attr: { cx: a[0], cy: a[1] } }, {
          attr: { cx: a[2], cy: a[3] }, duration: 1 + (i % 5) * 0.22, repeat: -1, ease: "none", delay: i * 0.11
        });
      });
    });

    // fareyle hafif paralaks
    const dg = q(".dg")[0];
    const mx = gsap.quickTo(dg, "x", { duration: 0.7, ease: "power3" });
    const my = gsap.quickTo(dg, "y", { duration: 0.7, ease: "power3" });
    host.addEventListener("pointermove", function (e) {
      const r = host.getBoundingClientRect();
      mx(((e.clientX - r.left) / r.width - 0.5) * 16);
      my(((e.clientY - r.top) / r.height - 0.5) * 16);
    });
    host.addEventListener("pointerleave", function () { mx(0); my(0); });
  }
})();
