/* VRAM bant genişliği hesaplayıcı + kare tamponu boyutu (GSAP ile animasyonlu çubuklar) */
(function () {
  "use strict";
  const bars = document.getElementById("bw-bars");
  if (!bars) return;
  const hasG = !!window.gsap;
  const tr = function (n, d) { return n.toLocaleString("tr-TR", { maximumFractionDigits: d === undefined ? 1 : d }); };

  /* ---------- bant genişliği ---------- */
  const MAXBW = 1100;
  const SYS = 96;   // DDR5-6000 dual channel: 6000 MT/s × 8 bayt × 2
  const PCIE = 32;  // PCIe 4.0 x16, tek yön (yaklaşık)
  const ROWS = [
    { id: "sys", label: "Sistem RAM (DDR5-6000, dual channel)", val: SYS, cls: "sys" },
    { id: "pcie", label: "PCIe 4.0 x16 (kartla anakart arası)", val: PCIE, cls: "pcie" },
    { id: "gpu", label: "Bu ekran kartının VRAM'i", val: 0, cls: "gpu" }
  ];
  bars.innerHTML = ROWS.map(function (r) {
    return '<div class="bwrow ' + r.cls + '"><div class="bwl">' + r.label + '</div><div class="bwt"><div class="bwf" id="bwf-' + r.id + '"></div></div><div class="bwv" id="bwv-' + r.id + '">0</div></div>';
  }).join("");

  const busEl = document.getElementById("bw-bus"), spdEl = document.getElementById("bw-speed");
  const shown = { gpu: 0 };

  function setBar(id, val, animate) {
    const f = document.getElementById("bwf-" + id), v = document.getElementById("bwv-" + id);
    const w = Math.min(100, val / MAXBW * 100);
    if (hasG && animate) {
      gsap.to(f, { width: w + "%", duration: 0.6, ease: "power3.out", overwrite: true });
      const o = { n: shown[id] || 0 };
      gsap.to(o, { n: val, duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: function () { v.textContent = tr(o.n, 0) + " GB/s"; } });
    } else {
      f.style.width = w + "%";
      v.textContent = tr(val, 0) + " GB/s";
    }
    shown[id] = val;
  }

  function update(animate) {
    const bus = +busEl.value, spd = +spdEl.value;
    const bw = bus * spd / 8;
    setBar("sys", SYS, animate);
    setBar("pcie", PCIE, animate);
    setBar("gpu", bw, animate);
    document.getElementById("bw-note").innerHTML =
      "<b>" + bus + " bit × " + spd + " Gbps ÷ 8 = " + tr(bw, 1) + " GB/s.</b> Bu, sistem RAM'inin yaklaşık <b>" + tr(bw / SYS, 1) + " katı</b>, PCIe hattının ise <b>" + tr(bw / PCIE, 0) + " katı</b>. Bu yüzden veriyi VRAM'de tutmak, her seferinde işlemciden çekmekten çok daha hızlı.";
  }

  const PRESETS = [
    { t: "Giriş seviyesi (128 bit, 18 Gbps)", bus: 128, spd: 18 },
    { t: "Orta seviye (192 bit, 21 Gbps)", bus: 192, spd: 21 },
    { t: "Üst seviye (384 bit, 21 Gbps)", bus: 384, spd: 21 }
  ];
  const presets = document.getElementById("bw-presets");
  presets.innerHTML = PRESETS.map(function (p, i) { return '<button class="btn sm ghost" data-i="' + i + '">' + p.t + "</button>"; }).join("");
  presets.addEventListener("click", function (e) {
    const b = e.target.closest("button");
    if (!b) return;
    const p = PRESETS[+b.dataset.i];
    busEl.value = p.bus; spdEl.value = p.spd;
    update(true);
  });
  busEl.addEventListener("change", function () { update(true); });
  spdEl.addEventListener("change", function () { update(true); });
  update(false);

  if (hasG && window.ScrollTrigger) {
    ScrollTrigger.create({ trigger: bars, start: "top 85%", once: true, onEnter: function () {
      gsap.from(bars.querySelectorAll(".bwf"), { width: 0, duration: 1, stagger: 0.15, ease: "power3.out" });
    } });
  }

  /* ---------- kare tamponu ---------- */
  const resEl = document.getElementById("fb-res"), out = document.getElementById("fb-out");
  function fb() {
    const p = resEl.value.split("x").map(Number);
    const px = p[0] * p[1], mb = px * 4 / 1e6;
    out.innerHTML =
      '<div class="ps"><small>Piksel sayısı</small><b>' + tr(px / 1e6, 2) + ' milyon</b></div>' +
      '<div class="ps"><small>Tek kare (4 bayt/piksel)</small><b>' + tr(mb, 1) + " MB</b></div>" +
      '<div class="ps"><small>Üçlü tamponlama</small><b>' + tr(mb * 3, 1) + " MB</b></div>" +
      '<div class="ps"><small>Tek bir 4096×4096 doku</small><b>' + tr(4096 * 4096 * 4 / 1e6, 1) + " MB</b></div>";
    if (hasG) gsap.fromTo(out.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.05 });
  }
  resEl.addEventListener("change", fb);
  fb();
})();
