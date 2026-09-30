/* Güç kaynağı sayfası: hero, AC→DC dalga aşamaları, watt hesaplayıcı, verimlilik eğrisi, konnektörler */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const tr = function (n, d) { return n.toLocaleString("tr-TR", { maximumFractionDigits: d === undefined ? 1 : d }); };

  /* =========================================================
     Hero
     ========================================================= */
  const hero = $("psu-hero");
  if (hero) {
    let blades = "";
    for (let i = 0; i < 7; i++) blades += '<path d="M0 -8 C 16 -24, 32 -42, 7 -60 C -10 -46, -13 -24, 0 -8 Z" transform="rotate(' + (i * 360 / 7) + ')"/>';
    hero.innerHTML =
      '<svg viewBox="0 0 400 400" role="img">' +
      '<rect class="body" x="36" y="110" width="250" height="180" rx="16"/>' +
      '<circle class="ring" cx="140" cy="200" r="70"/>' +
      '<g transform="translate(140 200)"><g class="fan">' + blades + '<circle r="10" class="hub"/></g></g>' +
      '<path class="bolt" d="M232 150 L206 208 H228 L214 250 L250 190 H228 Z"/>' +
      '<text class="tag" x="205" y="132">PSU</text>' +
      '<path class="cable c12" d="M286 152 H380"/><path class="cable c5" d="M286 200 H380"/><path class="cable c33" d="M286 248 H380"/>' +
      '<text class="tag" x="342" y="144">+12V</text><text class="tag" x="342" y="192">+5V</text><text class="tag" x="342" y="240">+3.3V</text>' +
      '<text class="ac" x="16" y="70">230V AC</text><path class="cable ac-in" d="M16 82 C 16 110, 30 130, 36 150"/>' +
      "</svg>";
  }

  /* =========================================================
     AC → DC aşamaları
     ========================================================= */
  const stepsEl = $("conv-steps");
  if (stepsEl) {
    const P = 100;
    const STAGES = [
      { n: "Prizden AC", v: "230 V AC",
        d: "Prizden gelen elektrik saniyede 50 kez yön değiştirir: sinüs dalgası. Tepe voltajı yaklaşık 325 V. Girişteki EMI filtresi şebekedeki gürültüyü ayıklar.",
        f: function (x) { return 55 - 42 * Math.sin(x / P * 2 * Math.PI); } },
      { n: "Doğrultma", v: "~325 V, dalgalı DC",
        d: "Köprü doğrultucu negatif yarım dalgaları ters çevirir. Artık akım hep aynı yönde ama hâlâ inip çıkıyor: sürekli \"tümsekler\".",
        f: function (x) { return 98 - 76 * Math.abs(Math.sin(x / P * 2 * Math.PI)); } },
      { n: "PFC + ana kondansatör", v: "~400 V DC",
        d: "PFC devresi güç faktörünü düzeltir (şebekeden verimli çeker) ve voltajı yükseltir. Büyük ana kondansatör dalgaları düzleştirir: neredeyse düz, yüksek voltajlı DC.",
        f: function (x) { return 22 + 4 * Math.abs(Math.sin(x / P * 2 * Math.PI)); } },
      { n: "Yüksek frekanslı anahtarlama", v: "~100 kHz kare dalga",
        d: "Transistörler bu DC'yi saniyede on binlerce kez açıp kapatarak kare dalgaya çevirir. Böylece küçük bir trafo, büyük güç aktarabilir. Bu yüzden güç kaynakları eski, ağır demir trafolardan çok daha küçük.",
        f: null },
      { n: "Trafo, doğrultma, filtre", v: "12 V DC",
        d: "Trafo voltajı düşürür, ikinci bir doğrultucu ve filtre kondansatörleri onu yeniden düzeltir. Çıkış: düz, temiz +12 V. 5 V ve 3,3 V bu hattan ayrıca türetilir. (Şekil ölçekli değil.)",
        f: function (x) { return 62 + 1.4 * Math.sin(x * 1.3); } }
    ];
    let cur = 0;
    stepsEl.innerHTML = STAGES.map(function (s, i) { return '<button class="tab' + (i === 0 ? " active" : "") + '" data-i="' + i + '"><b>' + (i + 1) + "</b> " + s.n + "</button>"; }).join("");
    const wave = $("conv-wave");

    function path(i) {
      const s = STAGES[i];
      let pts = [];
      if (s.f) { for (let x = 0; x <= 300; x += 2) pts.push(x + "," + s.f(x).toFixed(1)); }
      else { for (let k = 0; k < 75; k++) { const y = k % 2 ? 26 : 84; pts.push((k * 4) + "," + y, ((k + 1) * 4) + "," + y); } }
      return "M" + pts.join(" L");
    }
    function draw() {
      const s = STAGES[cur];
      wave.innerHTML = '<line x1="0" y1="98" x2="300" y2="98" stroke="rgba(255,255,255,.14)" stroke-dasharray="3 4"/>' +
        '<path id="wv" d="' + path(cur) + '" fill="none" stroke="#fb923c" stroke-width="2.6" stroke-linejoin="round"/>';
      const wv = $("wv"), len = wv.getTotalLength();
      wv.style.strokeDasharray = len; wv.style.strokeDashoffset = len;
      void wv.getBoundingClientRect();
      wv.style.transition = "stroke-dashoffset 1.1s ease";
      wv.style.strokeDashoffset = 0;
      wv.addEventListener("transitionend", function () { wv.style.strokeDasharray = "none"; }, { once: true });
      $("conv-text").innerHTML = '<div class="cv-v">' + s.v + "</div><h3>" + (cur + 1) + ". " + s.n + "</h3><p>" + s.d + "</p>";
      stepsEl.querySelectorAll(".tab").forEach(function (t, i) { t.classList.toggle("active", i === cur); });
    }
    stepsEl.addEventListener("click", function (e) {
      const b = e.target.closest(".tab");
      if (b) { cur = +b.dataset.i; draw(); }
    });
    draw();
  }

  /* =========================================================
     Watt hesaplayıcı
     ========================================================= */
  const wcRes = $("wc-result");
  if (wcRes) {
    const STD = [450, 500, 550, 650, 750, 850, 1000, 1200, 1300, 1600];
    const ids = ["wc-cpu", "wc-gpu", "wc-ram", "wc-ssd", "wc-hdd", "wc-fan"];
    function calc() {
      const v = {}; ids.forEach(function (id) { v[id] = +$(id).value; });
      const other = 45 + v["wc-ram"] * 4 + v["wc-ssd"] * 5 + v["wc-hdd"] * 9 + v["wc-fan"] * 3;
      let peak = v["wc-cpu"] + v["wc-gpu"] + other;
      if ($("wc-oc").checked) peak *= 1.2;
      const need = peak / 0.7;
      let rec = STD.find(function (s) { return s >= need; }) || 1600;
      const load = peak / rec * 100;
      const wall = peak / 0.9;
      const seg = function (w) { return Math.max(0, w / rec * 100); };
      wcRes.innerHTML =
        '<div class="wc-cards">' +
        '<div class="ps"><small>Tahmini tepe tüketim</small><b>' + tr(peak, 0) + " W</b></div>" +
        '<div class="ps hl"><small>Önerilen güç kaynağı</small><b>' + rec + " W</b></div>" +
        '<div class="ps"><small>Yük yüzdesi</small><b>%' + tr(load, 0) + "</b></div>" +
        '<div class="ps"><small>Duvardan çekilen (Gold varsayımı)</small><b>~' + tr(wall, 0) + " W</b></div></div>" +
        '<div class="wc-bar"><i class="b-cpu" style="width:' + seg(v["wc-cpu"] * ($("wc-oc").checked ? 1.2 : 1)) + '%"></i><i class="b-gpu" style="width:' + seg(v["wc-gpu"] * ($("wc-oc").checked ? 1.2 : 1)) + '%"></i><i class="b-oth" style="width:' + seg(other * ($("wc-oc").checked ? 1.2 : 1)) + '%"></i></div>' +
        '<div class="wc-legend"><span><i class="b-cpu"></i>İşlemci</span><span><i class="b-gpu"></i>Ekran kartı</span><span><i class="b-oth"></i>Diğer (anakart, RAM, disk, fan)</span><span><i class="b-free"></i>Boş pay</span></div>';
    }
    ids.forEach(function (id) { $(id).addEventListener("change", calc); });
    $("wc-oc").addEventListener("change", calc);
    calc();
  }

  /* =========================================================
     Verimlilik eğrisi
     ========================================================= */
  const chart = $("eff-chart");
  if (chart) {
    // [yük %, verimlilik %]
    const EFF = {
      std: [[20, 80], [50, 80], [100, 80]],
      bronze: [[20, 82], [50, 85], [100, 82]],
      silver: [[20, 85], [50, 88], [100, 85]],
      gold: [[20, 87], [50, 90], [100, 87]],
      plat: [[20, 90], [50, 92], [100, 89]],
      titan: [[10, 90], [20, 92], [50, 94], [100, 90]]
    };
    const X0 = 34, X1 = 310, Y0 = 158, Y1 = 18, EMIN = 70, EMAX = 96;
    const xp = function (p) { return X0 + p / 100 * (X1 - X0); };
    const yp = function (e) { return Y0 - (e - EMIN) / (EMAX - EMIN) * (Y0 - Y1); };
    function eff(level, p) {
      const pts = EFF[level];
      if (p <= pts[0][0]) return Math.max(55, pts[0][1] - (pts[0][0] - p) * 0.6);
      for (let i = 1; i < pts.length; i++) {
        if (p <= pts[i][0]) {
          const a = pts[i - 1], b = pts[i];
          return a[1] + (b[1] - a[1]) * (p - a[0]) / (b[0] - a[0]);
        }
      }
      return pts[pts.length - 1][1];
    }
    const lvl = $("ef-lvl"), cap = $("ef-cap"), load = $("ef-load");
    function update() {
      const c = +cap.value;
      load.max = c;
      if (+load.value > c) load.value = c;
      const l = +load.value, p = l / c * 100;
      $("ef-cap-v").textContent = c; $("ef-load-v").textContent = l;
      const e = eff(lvl.value, p);
      const wall = l / (e / 100), heat = wall - l;
      const stdHeat = l / (eff("std", p) / 100) - l;
      let grid = "";
      [75, 80, 85, 90, 95].forEach(function (g) {
        grid += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + yp(g) + '" y2="' + yp(g) + '" stroke="rgba(255,255,255,.08)"/><text x="' + (X0 - 5) + '" y="' + (yp(g) + 3) + '" text-anchor="end" fill="#7d89ab" font-size="8" font-family="JetBrains Mono, monospace">%' + g + "</text>";
      });
      [0, 20, 50, 100].forEach(function (g) {
        grid += '<text x="' + xp(g) + '" y="172" text-anchor="middle" fill="#7d89ab" font-size="8" font-family="JetBrains Mono, monospace">%' + g + "</text>";
      });
      const line = [];
      for (let q = 5; q <= 100; q += 5) line.push(xp(q).toFixed(1) + "," + yp(eff(lvl.value, q)).toFixed(1));
      const ptx = xp(Math.min(100, p)), pty = yp(e);
      chart.innerHTML =
        '<rect x="' + X0 + '" y="' + Y1 + '" width="' + (xp(20) - X0) + '" height="' + (Y0 - Y1) + '" fill="rgba(251,191,36,.07)"/>' + grid +
        '<polyline fill="none" stroke="#fb923c" stroke-width="2.4" stroke-linejoin="round" points="' + line.join(" ") + '"/>' +
        '<line x1="' + ptx + '" x2="' + ptx + '" y1="' + Y1 + '" y2="' + Y0 + '" stroke="rgba(255,255,255,.4)" stroke-dasharray="3 3"/>' +
        '<circle cx="' + ptx + '" cy="' + pty + '" r="5" fill="#fff" stroke="#fb923c" stroke-width="2.5"/>' +
        '<text x="' + (X0 + 3) + '" y="' + (Y1 + 9) + '" fill="#a98b3a" font-size="7.5" font-family="Inter, sans-serif">garanti yok</text>';
      $("eff-out").innerHTML =
        '<div class="ps"><small>Yük</small><b>%' + tr(p, 0) + "</b></div>" +
        '<div class="ps"><small>Verimlilik</small><b>%' + tr(e, 1) + "</b></div>" +
        '<div class="ps"><small>Duvardan çekilen</small><b>' + tr(wall, 0) + " W</b></div>" +
        '<div class="ps"><small>Isıya giden</small><b>' + tr(heat, 0) + " W</b></div>" +
        '<div class="eff-note">Standard (%80) bir güç kaynağı aynı işte <b>' + tr(stdHeat, 0) + " W</b> ısı üretirdi. " +
        (lvl.value === "std" ? "" : "Aradaki fark: <b>" + tr(Math.max(0, stdHeat - heat), 0) + " W</b>.") + "</div>";
    }
    [lvl, cap, load].forEach(function (el) { el.addEventListener("input", update); });
    update();
  }

  /* =========================================================
     Konnektörler
     ========================================================= */
  const grid = $("conn-grid");
  if (grid) {
    const C = [
      { n: "24 pin ATX", to: "Anakart (ana güç)", cols: 12, rows: 2, w: "Ana güç + kontrol sinyalleri", note: "Bazen 20+4 pin olarak ayrılabilir." },
      { n: "4+4 pin EPS", to: "Anakart (işlemci gücü)", cols: 4, rows: 2, w: "Kabaca 150-300 W", note: "Güçlü işlemcilerde 8+4 ya da çift 8 pin gerekir." },
      { n: "6+2 pin PCIe", to: "Ekran kartı", cols: 4, rows: 2, w: "6 pin: 75 W · 8 pin: 150 W", note: "Kart birkaç tane isteyebilir. PCIe yuvası da 75 W verir." },
      { n: "12V-2x6 / 12VHPWR", to: "Yeni nesil ekran kartları", cols: 6, rows: 2, extra: 4, w: "Azami 600 W", note: "Fişi sonuna kadar itmek çok önemli; yarım takılı olursa ısınabilir." },
      { n: "SATA güç", to: "SATA SSD / HDD", cols: 15, rows: 1, w: "3,3 / 5 / 12 V", note: "Yassı, L şeklinde çentikli." },
      { n: "Molex (4 pin)", to: "Eski cihazlar, bazı fan/RGB kontrolcüleri", cols: 4, rows: 1, w: "5 V / 12 V", note: "Eski ama hâlâ bulunuyor." }
    ];
    grid.innerHTML = C.map(function (c, i) {
      let pins = "";
      for (let r = 0; r < c.rows; r++) {
        pins += '<div class="prow2">';
        for (let k = 0; k < c.cols; k++) pins += "<i></i>";
        pins += "</div>";
      }
      if (c.extra) { pins += '<div class="prow2 small">'; for (let k = 0; k < c.extra; k++) pins += "<i></i>"; pins += "</div>"; }
      return '<div class="card reveal d' + (i % 3) + '"><div class="pins">' + pins + "</div><h3>" + c.n + '</h3><p class="to">' + c.to + '</p><p class="w">' + c.w + "</p><p>" + c.note + "</p></div>";
    }).join("");
    if (window.PP && PP.reveal) PP.reveal(grid);
  }
})();
