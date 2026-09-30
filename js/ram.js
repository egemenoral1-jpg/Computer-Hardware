/* RAM sayfası: hero çizimi, DRAM hücre demosu, hız hesaplayıcı, kanal animasyonu, swap demosu */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const tr = function (n, d) { return n.toLocaleString("tr-TR", { maximumFractionDigits: d === undefined ? 1 : d }); };

  /* =========================================================
     Hero: RAM modülü
     ========================================================= */
  const hero = $("ram-hero");
  if (hero) {
    let chips = "", contacts = "", leds = "";
    for (let i = 0; i < 8; i++) {
      const x = 26 + i * 38;
      chips += '<rect class="rchip" style="--i:' + i + '" x="' + x + '" y="30" width="30" height="50" rx="4"/>' +
        '<text class="rlabel" x="' + (x + 15) + '" y="58">DRAM</text>';
    }
    for (let i = 0; i < 40; i++) {
      if (i >= 19 && i <= 21) continue;
      contacts += '<rect class="contact" x="' + (10 + i * 8) + '" y="104" width="5" height="14"/>';
    }
    for (let i = 0; i < 22; i++) leds += '<rect class="led" style="--i:' + i + '" x="' + (16 + i * 14) + '" y="10" width="10" height="6" rx="2"/>';
    hero.innerHTML =
      '<svg viewBox="0 0 400 400" role="img"><g transform="translate(200 205) rotate(-16) translate(-170 -60)"><g class="float">' +
      '<rect class="pcb" width="340" height="122" rx="8"/>' + leds + chips +
      '<rect class="spd" x="304" y="34" width="24" height="18" rx="3"/><text class="rlabel" x="316" y="46">SPD</text>' +
      contacts + '<rect class="notch" x="170" y="100" width="10" height="24"/>' +
      '<path id="ram-path" d="M14 92 H326" fill="none"/>' +
      [0, 1, 2].map(function (k) { return '<circle class="dot" r="3"><animateMotion dur="2.4s" begin="' + (k * 0.8) + 's" repeatCount="indefinite" path="M14 92 H326"/></circle>'; }).join("") +
      "</g></g></svg>";
  }

  /* =========================================================
     DRAM hücresi
     ========================================================= */
  const grid = $("dram-grid");
  if (grid) {
    const N = 64, THRESH = 50;
    const charge = new Array(N).fill(0), want = new Array(N).fill(0);
    const rate = []; for (let i = 0; i < N; i++) rate.push(6 + Math.random() * 6); // %/sn
    const HEART = [
      0,1,1,0,0,1,1,0,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      1,1,1,1,1,1,1,1,
      0,1,1,1,1,1,1,0,
      0,0,1,1,1,1,0,0,
      0,0,0,1,1,0,0,0,
      0,0,0,0,0,0,0,0
    ];
    let refreshOn = false;

    let h = "";
    for (let i = 0; i < N; i++) h += '<button class="dc" data-i="' + i + '" aria-label="Hücre ' + i + '"><span class="fill"></span><b>0</b></button>';
    grid.innerHTML = h;
    const cells = grid.querySelectorAll(".dc");

    function render() {
      let ones = 0, lost = 0;
      for (let i = 0; i < N; i++) {
        const c = cells[i], bit = charge[i] >= THRESH ? 1 : 0;
        c.querySelector(".fill").style.height = charge[i] + "%";
        c.querySelector("b").textContent = bit;
        c.classList.toggle("one", !!bit);
        ones += bit;
        if (want[i] === 1 && bit === 0) lost++;
      }
      $("dram-read").innerHTML = "Şu an okunan 1'ler: <b>" + ones + "</b> · Kaybolan bit: <b class=\"" + (lost ? "bad" : "") + '">' + lost + "</b>" +
        (lost ? "<br>Yenileme olmadan veri sızıp gitti!" : (refreshOn ? "<br>Yenileme açık: veri korunuyor." : "<br>Yenileme kapalı: yükler yavaş yavaş azalıyor..."));
    }

    setInterval(function () {
      for (let i = 0; i < N; i++) charge[i] = Math.max(0, charge[i] - rate[i] * 0.1);
      render();
    }, 100);
    setInterval(function () {
      if (!refreshOn) return;
      for (let i = 0; i < N; i++) charge[i] = charge[i] >= THRESH ? 100 : 0;
      cells.forEach(function (c) { c.classList.add("flash"); setTimeout(function () { c.classList.remove("flash"); }, 200); });
      render();
    }, 2000);

    grid.addEventListener("click", function (e) {
      const b = e.target.closest(".dc");
      if (!b) return;
      const i = +b.dataset.i, bit = charge[i] >= THRESH ? 0 : 1;
      charge[i] = bit ? 100 : 0; want[i] = bit;
      render();
    });
    $("dram-heart").addEventListener("click", function () {
      for (let i = 0; i < N; i++) { want[i] = HEART[i]; charge[i] = HEART[i] ? 100 : 0; }
      render();
    });
    $("dram-clear").addEventListener("click", function () {
      for (let i = 0; i < N; i++) { want[i] = 0; charge[i] = 0; }
      render();
    });
    $("dram-refresh").addEventListener("click", function () {
      refreshOn = !refreshOn;
      this.setAttribute("aria-pressed", String(refreshOn));
      this.textContent = "Yenileme: " + (refreshOn ? "AÇIK" : "KAPALI");
      render();
    });
    render();
  }

  /* =========================================================
     Hız / gecikme hesaplayıcı
     ========================================================= */
  const rcRes = $("rc-results");
  if (rcRes) {
    const mts = $("rc-mts"), cl = $("rc-cl"), ch = $("rc-ch");
    const PRESETS = [
      { n: "DDR4-3200 CL16", m: 3200, c: 16 }, { n: "DDR4-3600 CL16", m: 3600, c: 16 },
      { n: "DDR5-4800 CL40", m: 4800, c: 40 }, { n: "DDR5-6000 CL30", m: 6000, c: 30 },
      { n: "DDR5-6400 CL32", m: 6400, c: 32 }, { n: "DDR5-7200 CL34", m: 7200, c: 34 }
    ];
    $("rc-presets").innerHTML = PRESETS.map(function (p, i) { return '<button class="btn sm ghost" data-i="' + i + '">' + p.n + "</button>"; }).join("");
    $("rc-presets").addEventListener("click", function (e) {
      const b = e.target.closest("button");
      if (!b) return;
      const p = PRESETS[+b.dataset.i];
      mts.value = p.m; cl.value = p.c;
      calc();
    });
    function calc() {
      const m = +mts.value, c = +cl.value, k = +ch.value;
      $("rc-mts-v").textContent = m; $("rc-cl-v").textContent = c;
      const lat = c * 2000 / m, bw = m * 8 * k / 1000, clock = m / 2;
      rcRes.innerHTML =
        '<div class="rc-card lat"><small>Gerçek gecikme</small><b>' + tr(lat, 1) + ' ns</b><div class="rc-bar"><i style="width:' + Math.min(100, lat / 20 * 100) + '%"></i></div></div>' +
        '<div class="rc-card"><small>Bant genişliği (teorik)</small><b>' + tr(bw, 1) + ' GB/s</b><div class="rc-bar"><i style="width:' + Math.min(100, bw / 140 * 100) + '%"></i></div></div>' +
        '<div class="rc-card"><small>Gerçek saat</small><b>' + tr(clock, 0) + ' MHz</b><div class="rc-bar"><i style="width:' + Math.min(100, clock / 4200 * 100) + '%"></i></div></div>';
      $("rc-note").innerHTML = "<b>" + c + " × 2000 ÷ " + m + " = " + tr(lat, 1) + " ns</b>. Bant genişliği: " + m + " MT/s × 8 bayt × " + k + " kanal = " + tr(bw, 1) + " GB/s. " +
        "Hız arttıkça gecikme (ns) düşer, ama CL de büyüyorsa kazanç azalır.";
    }
    [mts, cl].forEach(function (el) { el.addEventListener("input", calc); });
    ch.addEventListener("change", calc);
    calc();
  }

  /* =========================================================
     Kanallar
     ========================================================= */
  const roads = $("lane-roads");
  if (roads) {
    const BASE = 25.6; // DDR4-3200 tek kanal GB/s
    function lanes(c) {
      roads.innerHTML = '<div class="road"><i></i><i></i><i></i><i></i></div>'.repeat(c);
      $("lane-ram").innerHTML = '<div class="stick">DIMM 1</div>'.repeat(1) + (c === 2 ? '<div class="stick">DIMM 2</div>' : "");
      $("lane-note").innerHTML = c === 1
        ? "<b>Tek kanal:</b> tek 64 bitlik yol. DDR4-3200 ile teorik <b>" + tr(BASE, 1) + " GB/s</b>."
        : "<b>Dual channel:</b> iki 64 bitlik yol yan yana çalışır: <b>" + tr(BASE * 2, 1) + " GB/s</b>. Aynı RAM, iki kat geniş yol. İntegre ekran kartı kullanıyorsan bu fark oyunlarda çok belirgin olur.";
      document.querySelectorAll("#lane-tabs .tab").forEach(function (t) { t.classList.toggle("active", +t.dataset.c === c); });
    }
    $("lane-tabs").addEventListener("click", function (e) {
      const b = e.target.closest(".tab");
      if (b) lanes(+b.dataset.c);
    });
    lanes(2);
  }

  /* =========================================================
     RAM dolunca (swap)
     ========================================================= */
  const appsEl = $("sw-apps");
  if (appsEl) {
    const APPS = [
      { n: "İşletim sistemi + arka plan", gb: 4, fixed: true, on: true },
      { n: "Tarayıcı (20 sekme)", gb: 4, on: true },
      { n: "Oyun", gb: 8, on: false },
      { n: "Video düzenleme", gb: 6, on: false },
      { n: "Sanal makine", gb: 4, on: false },
      { n: "Kod editörü + araçlar", gb: 3, on: false },
      { n: "Sohbet + müzik", gb: 1.5, on: true },
      { n: "Fotoğraf editörü", gb: 3, on: false }
    ];
    const cap = $("sw-cap");
    appsEl.innerHTML = APPS.map(function (a, i) {
      return '<label class="sw-app' + (a.fixed ? " fixed" : "") + (a.on ? " on" : "") + '" data-i="' + i + '"><span><input type="checkbox"' + (a.on ? " checked" : "") + (a.fixed ? " disabled" : "") + '>' + a.n + "</span><b>" + tr(a.gb, 1) + " GB</b></label>";
    }).join("");
    appsEl.addEventListener("change", function (e) {
      const l = e.target.closest(".sw-app");
      if (!l) return;
      APPS[+l.dataset.i].on = e.target.checked;
      l.classList.toggle("on", e.target.checked);
      update();
    });
    cap.addEventListener("change", update);

    function update() {
      const total = +cap.value;
      const used = APPS.reduce(function (s, a) { return s + (a.on ? a.gb : 0); }, 0);
      const over = Math.max(0, used - total);
      const scale = Math.max(used, total);
      $("sw-ram").style.width = (Math.min(used, total) / scale * 100) + "%";
      $("sw-disk").style.width = (over / scale * 100) + "%";
      $("sw-legend").innerHTML = "<span>RAM: <b>" + tr(Math.min(used, total), 1) + " / " + total + " GB</b></span>" +
        "<span>İstenen toplam: <b>" + tr(used, 1) + " GB</b></span>" + (over ? '<span style="color:#fb7185">Diske taşan: <b>' + tr(over, 1) + " GB</b></span>" : "");
      const ratio = used / total;
      const note = $("sw-note");
      if (over > 0) {
        note.className = "callout warn mt1";
        note.innerHTML = "<span class=\"callout-title\">RAM taştı!</span>Yaklaşık <b>" + tr(over, 1) + " GB</b> veri sayfa dosyasına (diske) yazıldı. Disk RAM'den yüzlerce kat yavaş olduğu için program geçişlerinde takılma, donma ve kasma başlar. Çözüm: programları kapat ya da RAM ekle.";
      } else if (ratio > 0.75) {
        note.className = "callout fun mt1";
        note.innerHTML = "<span class=\"callout-title\">Sınıra yaklaşıyorsun</span>Hâlâ diske taşmadın ama işletim sistemi önbelleklerini boşaltıyor. Yeni bir program açarsan taşabilir.";
      } else {
        note.className = "callout mt1";
        note.innerHTML = "<span class=\"callout-title\">Rahat</span>Her şey RAM'de, yani hızlı. Boştaki RAM boşa değil: işletim sistemi onu sık kullanılan dosyaları önbelleğe almak için kullanır.";
      }
    }
    update();
  }
})();
