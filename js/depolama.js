/* Depolama sayfası: HDD kafa simülasyonu, NAND hücre seviyeleri, kopyalama yarışı */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const tr = function (n, d) { return n.toLocaleString("tr-TR", { maximumFractionDigits: d === undefined ? 1 : d }); };

  /* =========================================================
     1) HDD: kol bir izden diğerine gidiyor
     ========================================================= */
  const svg = $("hdd-svg");
  if (svg) {
    const C = { x: 190, y: 190 }, P = { x: 370, y: 370 }, L = 250;
    const RINGS = [55, 78, 101, 124, 147, 170];
    const D = Math.hypot(P.x - C.x, P.y - C.y);
    const th0 = Math.atan2(C.y - P.y, C.x - P.x) * 180 / Math.PI;
    const ANG = RINGS.map(function (r) {
      return th0 + Math.acos((D * D + L * L - r * r) / (2 * D * L)) * 180 / Math.PI;
    });

    svg.innerHTML =
      '<defs><radialGradient id="pg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3a456c"/><stop offset="1" stop-color="#1c2543"/></radialGradient></defs>' +
      '<rect width="420" height="420" rx="26" fill="#0b1122" stroke="rgba(255,255,255,.1)"/>' +
      '<g class="spin"><circle cx="190" cy="190" r="175" fill="url(#pg)" stroke="rgba(251,113,133,.6)" stroke-width="2"/>' +
      RINGS.map(function (r) { return '<circle class="ringline" cx="190" cy="190" r="' + r + '"/>'; }).join("") +
      '<path d="M190 190 L190 15 A175 175 0 0 1 250 25 Z" fill="rgba(251,113,133,.16)"/></g>' +
      '<circle cx="190" cy="190" r="26" fill="#6b7aa3" stroke="#1b2340" stroke-width="4"/>' +
      RINGS.map(function (r, i) { return '<circle class="trk" data-i="' + i + '" cx="190" cy="190" r="' + r + '"/>'; }).join("") +
      '<g id="hdd-arm"><path d="M370 366 L620 368.5 L620 371.5 L370 374 Z" fill="#8f9bc0"/><circle cx="370" cy="370" r="16" fill="#3a4568" stroke="#8f9bc0" stroke-width="3"/>' +
      '<circle cx="620" cy="370" r="7" fill="#fb7185"/></g>';

    const arm = $("hdd-arm");
    let cur = 0;
    function place(i, instant) {
      if (instant) arm.style.transition = "none";
      arm.style.transform = "rotate(" + ANG[i] + "deg)";
      if (instant) { void arm.getBoundingClientRect(); arm.style.transition = ""; }
      svg.querySelectorAll(".trk").forEach(function (t, k) { t.classList.toggle("sel", k === i); });
    }
    place(0, true);
    $("hdd-out").innerHTML = '<div class="hdd-total">— <small>henüz okuma yapmadık</small></div>';
    $("hdd-note").innerHTML = "Toplam süre üç parçadan oluşur: <b>seek</b> (kolun gitmesi), <b>dönme gecikmesi</b> (plakanın sektörü getirmesi) ve <b>aktarım</b> (asıl okuma).";

    svg.addEventListener("click", function (e) {
      const t = e.target.closest(".trk");
      if (!t) return;
      const i = +t.dataset.i, d = Math.abs(i - cur);
      const seek = d === 0 ? 0 : 2 + 2.2 * d;            // ms (örnek değerler)
      const rot = Math.random() * 8.33;                   // 7200 RPM'de bir tur 8,33 ms
      const xfer = 0.1;
      const total = seek + rot + xfer;
      cur = i;
      place(i, false);
      const w = function (v) { return Math.min(100, v / 25 * 100); };
      $("hdd-out").innerHTML =
        '<div class="hdd-total">' + tr(total, 1) + ' ms <small>toplam</small></div>' +
        '<div class="hdd-stack"><i class="s1" style="width:' + w(seek) + '%"></i><i class="s2" style="width:' + w(rot) + '%"></i><i class="s3" style="width:' + w(xfer) + '%"></i></div>' +
        '<div class="hdd-legend"><span><span class="k" style="background:#fb7185"></span>seek <b>' + tr(seek, 1) + ' ms</b></span>' +
        '<span><span class="k" style="background:#fbbf24"></span>dönme <b>' + tr(rot, 1) + ' ms</b></span>' +
        '<span><span class="k" style="background:#34d399"></span>aktarım <b>' + tr(xfer, 1) + ' ms</b></span></div>';
      $("hdd-note").innerHTML = "Aynı veriye bir NVMe SSD yaklaşık <b>0,08 ms</b>'de ulaşır. Yani bu okuma SSD'ye göre yaklaşık <b>" + tr(total / 0.08, 0) + " kat</b> yavaştı." +
        (d === 0 ? " Kol zaten orada olduğu için seek yok, sadece dönmeyi bekledik." : "");
    });
  }

  /* =========================================================
     2) NAND hücresi
     ========================================================= */
  const cellEl = $("nand-cell");
  if (cellEl) {
    const TYPES = [
      { n: "SLC", b: 1, pe: "~50.000 – 100.000", spd: "en hızlı", cost: "en pahalı", use: "kurumsal diskler, SSD'lerin SLC önbelleği" },
      { n: "MLC", b: 2, pe: "~3.000 – 10.000", spd: "hızlı", cost: "pahalı", use: "eski üst seviye SSD'ler" },
      { n: "TLC", b: 3, pe: "~1.000 – 3.000", spd: "iyi", cost: "makul", use: "bugünkü SSD'lerin çoğu" },
      { n: "QLC", b: 4, pe: "~100 – 1.000", spd: "daha yavaş", cost: "ucuz", use: "büyük kapasiteli ekonomik SSD'ler" }
    ];
    let ti = 2, sel = -1;
    const tabs = $("nand-tabs");
    tabs.innerHTML = TYPES.map(function (t, i) { return '<button class="tab' + (i === ti ? " active" : "") + '" data-i="' + i + '">' + t.n + " · " + t.b + " bit</button>"; }).join("");
    const bin = function (n, b) { return n.toString(2).padStart(b, "0"); };

    function render() {
      const t = TYPES[ti], levels = Math.pow(2, t.b);
      let h = "";
      for (let l = levels - 1; l >= 0; l--) {
        h += '<div class="lv' + (l === sel ? " sel" : "") + '" style="--h:' + (210 + l / levels * 140).toFixed(0) + '" data-l="' + l + '"><span>' + bin(l, t.b) + "</span><em>seviye " + l + "</em></div>";
      }
      cellEl.innerHTML = h;
      const cellsPerGB = 8.59e9 / t.b / 1e9;
      const msg = sel >= 0
        ? '<div class="nand-msg">Yük <b>' + (sel + 1) + " / " + levels + ". seviyeye</b> ayarlandı → okununca bitler <b>" + bin(sel, t.b) + "</b>. Aralarında sadece <b>%" + tr(100 / levels, 1) + "</b>'lik yük farkı var; bu yüzden QLC'de okumak zor, yavaş.</div>"
        : '<div class="nand-msg">Bir değer yaz ve hücredeki yükün hangi seviyeye çıkacağını gör.</div>';
      $("nand-out").innerHTML = msg +
        '<div class="ps"><small>Seviye sayısı</small><b>' + levels + "</b></div>" +
        '<div class="ps"><small>1 GB için hücre</small><b>' + tr(cellsPerGB, 1) + " milyar</b></div>" +
        '<div class="ps"><small>Dayanıklılık (kabaca)</small><b style="font-size:1rem">' + t.pe + " yazma</b></div>" +
        '<div class="ps"><small>Hız / maliyet</small><b style="font-size:1rem">' + t.spd + " · " + t.cost + "</b></div>" +
        '<div class="ps" style="grid-column:1/-1"><small>Nerede kullanılır</small><b style="font-size:.95rem;font-family:var(--font);font-weight:600">' + t.use + "</b></div>";
    }
    tabs.addEventListener("click", function (e) {
      const b = e.target.closest(".tab");
      if (!b) return;
      ti = +b.dataset.i; sel = -1;
      tabs.querySelectorAll(".tab").forEach(function (x, i) { x.classList.toggle("active", i === ti); });
      render();
    });
    $("nand-write").addEventListener("click", function () {
      sel = Math.floor(Math.random() * Math.pow(2, TYPES[ti].b));
      render();
    });
    render();
  }

  /* =========================================================
     3) Kopyalama yarışı
     ========================================================= */
  const rowsEl = $("cp-rows");
  if (rowsEl) {
    const DEV = [
      { id: "hdd", n: "HDD (SATA)", big: 150, small: 15 },
      { id: "sata", n: "SATA SSD", big: 520, small: 250 },
      { id: "nvme", n: "NVMe SSD (Gen4)", big: 5000, small: 600 }
    ];
    let mode = "big", raf = 0;
    const sizeEl = $("cp-size");
    const fmtT = function (s) {
      if (s < 60) return tr(s, 1) + " sn";
      if (s < 3600) return Math.floor(s / 60) + " dk " + Math.round(s % 60) + " sn";
      return Math.floor(s / 3600) + " sa " + Math.round((s % 3600) / 60) + " dk";
    };
    const speed = function (d) { return mode === "big" ? d.big : d.small; };
    const total = function (d) { return sizeEl.value * 1000 / speed(d); };   // saniye

    function draw() {
      $("cp-size-v").textContent = sizeEl.value + " GB";
      rowsEl.innerHTML = DEV.map(function (d) {
        return '<div class="cp-row ' + d.id + '" id="cp-' + d.id + '"><div class="cp-name">' + d.n + "<small>~" + tr(speed(d), 0) + " MB/s</small></div>" +
          '<div class="cp-track"><div class="cp-fill"></div></div><div class="cp-time">' + fmtT(total(d)) + "</div></div>";
      }).join("");
      $("cp-note").textContent = mode === "big"
        ? "Tek büyük dosyada NVMe'nin sıralı hız avantajı çok net: SATA SSD'nin bile ~10 katı."
        : "Küçük dosyalarda her dosya için ayrı işlem gerekir. HDD kafası sürekli gezinir ve hız 10 kat düşer. SSD'ler de yavaşlar ama fark hâlâ devasa.";
    }

    function go() {
      cancelAnimationFrame(raf);
      draw();
      const tmax = Math.max.apply(null, DEV.map(total));
      const REAL = 9;                                  // en yavaş cihaz için gerçek saniye
      const scale = tmax / REAL;
      const t0 = performance.now();
      $("cp-go").disabled = true;
      (function tick(now) {
        const sim = (now - t0) / 1000 * scale;
        let alive = false;
        DEV.forEach(function (d) {
          const t = total(d), row = $("cp-" + d.id);
          const p = Math.min(1, sim / t);
          row.querySelector(".cp-fill").style.width = (p * 100) + "%";
          row.querySelector(".cp-time").textContent = p >= 1 ? "✓ " + fmtT(t) : fmtT(Math.min(sim, t));
          row.classList.toggle("done", p >= 1);
          if (p < 1) alive = true;
        });
        if (alive) raf = requestAnimationFrame(tick); else $("cp-go").disabled = false;
      })(t0);
    }

    $("cp-mode").addEventListener("click", function (e) {
      const b = e.target.closest(".tab");
      if (!b) return;
      cancelAnimationFrame(raf);
      $("cp-go").disabled = false;
      mode = b.dataset.m;
      $("cp-mode").querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t === b); });
      draw();
    });
    sizeEl.addEventListener("input", function () { cancelAnimationFrame(raf); $("cp-go").disabled = false; draw(); });
    $("cp-go").addEventListener("click", go);
    draw();
  }
})();
