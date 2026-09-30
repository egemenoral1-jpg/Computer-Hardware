/* Soğutma sayfası: hero, ısı zinciri simülasyonu, termal macun, kasa hava akışı */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const tr = function (n, d) { return n.toLocaleString("tr-TR", { maximumFractionDigits: d === undefined ? 1 : d }); };
  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* =========================================================
     Hero: dönen fan + yayılan ısı halkaları
     ========================================================= */
  const hero = $("cool-hero");
  if (hero) {
    let blades = "";
    for (let i = 0; i < 9; i++) blades += '<path d="M0 -14 C 22 -34, 46 -64, 12 -96 C -14 -74, -20 -40, 0 -14 Z" transform="rotate(' + (i * 40) + ')"/>';
    hero.innerHTML =
      '<svg viewBox="0 0 400 400" role="img">' +
      '<circle class="wave w1" cx="200" cy="200" r="60"/><circle class="wave w2" cx="200" cy="200" r="60"/><circle class="wave w3" cx="200" cy="200" r="60"/>' +
      '<rect class="frame" x="70" y="70" width="260" height="260" rx="34"/>' +
      '<circle class="ring" cx="200" cy="200" r="112"/>' +
      '<g transform="translate(200 200)"><g class="fan">' + blades + '<circle class="hub" r="20"/></g></g>' +
      '<circle class="screw" cx="94" cy="94" r="7"/><circle class="screw" cx="306" cy="94" r="7"/><circle class="screw" cx="94" cy="306" r="7"/><circle class="screw" cx="306" cy="306" r="7"/>' +
      "</svg>";
  }

  /* =========================================================
     Isı zinciri
     ========================================================= */
  const nodesEl = $("ch-nodes");
  if (nodesEl) {
    const CR = { stock: 0.46, tower: 0.28, aio240: 0.23, aio360: 0.19, none: 1.6 };
    const PR = { good: 0.05, old: 0.15, none: 0.6 };
    const FAN = { low: 1.25, mid: 1.0, high: 0.85 };
    const NOISE = { low: 24, mid: 32, high: 42 };
    const RD = 0.05, TMAX = 95;
    const NAMES = ["Silikon (die)", "Metal kapak (IHS)", "Soğutucu tabanı", "Isı borusu / sıvı", "Kanatçık / radyatör", "Oda havası"];
    const hue = function (t) { return clamp(210 - (t - 30) / 70 * 210, 0, 210); };

    nodesEl.innerHTML = NAMES.map(function (n, i) {
      return '<div class="ch-node" id="chn' + i + '"><small>' + n + "</small><b>—</b></div>" + (i < NAMES.length - 1 ? '<span class="ch-arrow">→</span>' : "");
    }).join("");

    function calc() {
      const P = +$("ch-p").value, amb = +$("ch-amb").value;
      $("ch-p-v").textContent = P; $("ch-amb-v").textContent = amb;
      const c = $("ch-c").value, paste = $("ch-paste").value, fan = $("ch-fan").value;
      const Rc = CR[c] * FAN[fan], Rp = PR[paste], Rt = RD + Rp + Rc;
      let Tdie = amb + P * Rt, Puse = P, perf = 100, thr = false;
      if (Tdie > TMAX) { thr = true; Puse = (TMAX - amb) / Rt; perf = Math.max(0, Puse / P * 100); Tdie = TMAX; }
      const T = [Tdie, amb + Puse * (Rp + Rc), amb + Puse * Rc, amb + Puse * Rc * 0.75, amb + Puse * Rc * 0.45, amb];
      T.forEach(function (t, i) {
        const el = $("chn" + i);
        el.style.setProperty("--h", hue(t).toFixed(0));
        el.querySelector("b").textContent = tr(t, 0) + " °C";
      });
      const pct = clamp((Tdie - 30) / 70 * 100, 0, 100);
      const fill = $("ch-fill");
      fill.style.width = pct + "%";
      $("ch-out").innerHTML =
        '<div class="ps"><small>İşlemci sıcaklığı</small><b style="color:hsl(' + hue(Tdie).toFixed(0) + ' 85% 62%)">' + tr(Tdie, 0) + ' °C</b></div>' +
        '<div class="ps"><small>Toplam ısı direnci</small><b>' + tr(Rt, 2) + ' °C/W</b></div>' +
        '<div class="ps"><small>Fan gürültüsü (kabaca)</small><b>~' + NOISE[fan] + ' dBA</b></div>' +
        '<div class="ps"><small>Performans</small><b style="color:' + (thr ? "#fb7185" : "#34d399") + '">%' + tr(perf, 0) + "</b></div>";
      const note = $("ch-note");
      if (thr) {
        note.className = "callout warn mt1";
        note.innerHTML = "<span class=\"callout-title\">Throttling!</span>İşlemci " + TMAX + " °C sınırına dayandı ve kendini korumak için gücünü düşürdü: performans yaklaşık <b>%" + tr(perf, 0) + "</b>'a indi. Daha iyi soğutucu, düzgün macun ya da daha serin bir oda dene.";
      } else if (paste !== "good") {
        note.className = "callout fun mt1";
        note.innerHTML = "<span class=\"callout-title\">Macun halkası zayıf</span>Silikondan çıkan ısı, metal kapak ile soğutucu tabanı arasındaki boşlukta takılıyor. Kapak sıcak, soğutucu taban serin: aradaki fark tam olarak bu halkanın kaybı.";
      } else if (Tdie > 80) {
        note.className = "callout fun mt1";
        note.innerHTML = "<span class=\"callout-title\">Sınıra yaklaşıyor</span>Sıcaklık yüksek ama throttle yok. Daha güçlü soğutucu ya da daha iyi kasa hava akışı sıcaklığı düşürür.";
      } else {
        note.className = "callout mt1";
        note.innerHTML = "<span class=\"callout-title\">Rahat</span>Isı zinciri dengeli. Soğutucu tabanından havaya doğru sıcaklık düzgün biçimde düşüyor.";
      }
    }
    ["ch-p", "ch-amb"].forEach(function (id) { $(id).addEventListener("input", calc); });
    ["ch-c", "ch-paste", "ch-fan"].forEach(function (id) { $(id).addEventListener("change", calc); });
    calc();
  }

  /* =========================================================
     Termal macun
     ========================================================= */
  const pasteSvg = $("paste-svg");
  if (pasteSvg) {
    // sabit tohumlu sözde-rastgele pürüzler
    let seed = 7;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const topPts = [], botPts = [];
    for (let x = 0; x <= 400; x += 10) { topPts.push([x, 58 + rnd() * 20]); botPts.push([x, 84 - rnd() * 22]); }
    const topPath = "M0 0 L" + topPts.map(function (p) { return p[0] + " " + p[1].toFixed(1); }).join(" L") + " L400 0 Z";
    const botPath = "M0 160 L" + botPts.map(function (p) { return p[0] + " " + p[1].toFixed(1); }).join(" L") + " L400 160 Z";
    // yüzeylerin temas ettiği yaklaşık tepe noktaları
    let contacts = [];
    for (let i = 0; i < topPts.length; i++) if (topPts[i][1] + 2 >= botPts[i][1]) contacts.push(topPts[i][0]);

    function draw(mode) {
      const paste = mode === "paste";
      let arrows = "";
      if (paste) {
        for (let x = 20; x < 400; x += 30) arrows += '<line class="ar strong" x1="' + x + '" y1="120" x2="' + x + '" y2="30" />';
      } else {
        (contacts.length ? contacts : [60, 200, 330]).forEach(function (x) { arrows += '<line class="ar weak" x1="' + x + '" y1="120" x2="' + x + '" y2="30" />'; });
      }
      pasteSvg.innerHTML =
        '<defs><pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(180,190,220,.35)"/></pattern></defs>' +
        '<rect x="0" y="40" width="400" height="80" fill="' + (paste ? "#cfd6ea" : "url(#dots)") + '" opacity="' + (paste ? ".85" : "1") + '"/>' +
        '<path d="' + topPath + '" fill="#4a5578"/><path d="' + botPath + '" fill="#5a4a6a"/>' + arrows +
        '<text x="10" y="18" fill="#dbe4ff" font-size="11" font-family="JetBrains Mono, monospace">soğutucu tabanı</text>' +
        '<text x="10" y="152" fill="#e2d5f0" font-size="11" font-family="JetBrains Mono, monospace">işlemci kapağı (sıcak)</text>';
      $("paste-text").innerHTML = paste
        ? "<b>Macun var.</b> Macun (~5–10 W/mK) boşlukları dolduruyor, ısı yüzeyin tamamından geçiyor. Isı direnci ciddi şekilde düşer."
        : "<b>Macun yok.</b> Yüzeyler sadece birkaç tepe noktasından temas ediyor. Boşlukları dolduran hava (0,026 W/mK) ısıyı çok kötü iletir: ısı neredeyse sıkışır kalır.";
      $("paste-tabs").querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t.dataset.m === mode); });
    }
    $("paste-tabs").addEventListener("click", function (e) {
      const b = e.target.closest(".tab");
      if (b) draw(b.dataset.m);
    });
    draw("none");
  }

  /* =========================================================
     Kasa hava akışı
     ========================================================= */
  const afSvg = $("af-svg");
  if (afSvg) {
    const FANS = [
      { id: "f1", n: "Ön fan 1 (giriş)", t: "in", x: 40, y: 96, on: true },
      { id: "f2", n: "Ön fan 2 (giriş)", t: "in", x: 40, y: 178, on: true },
      { id: "r1", n: "Arka fan (çıkış)", t: "out", x: 462, y: 100, on: true },
      { id: "t1", n: "Üst fan 1 (çıkış)", t: "out", x: 200, y: 36, on: false },
      { id: "t2", n: "Üst fan 2 (çıkış)", t: "out", x: 290, y: 36, on: false }
    ];
    $("af-fans").innerHTML = FANS.map(function (f, i) {
      return '<label class="af-fan' + (f.on ? " on" : "") + " " + f.t + '" data-i="' + i + '"><input type="checkbox"' + (f.on ? " checked" : "") + "> " + f.n + "</label>";
    }).join("");

    function blades(cx, cy, r, on) {
      let b = "";
      for (let i = 0; i < 5; i++) b += '<path d="M0 -3 C 6 -8, 12 -14, 3 -' + (r - 3) + ' C -3 -12, -4 -7, 0 -3 Z" transform="rotate(' + (i * 72) + ')"/>';
      return '<g transform="translate(' + cx + " " + cy + ')"><circle class="fring" r="' + r + '"/><g class="fblades' + (on ? " spin" : "") + '">' + b + "</g></g>";
    }

    function render() {
      const I = FANS.filter(function (f) { return f.on && f.t === "in"; }).length;
      const E = FANS.filter(function (f) { return f.on && f.t === "out"; }).length;
      let paths = "", fans = "";
      FANS.forEach(function (f) {
        fans += blades(f.x, f.y, 22, f.on);
        if (!f.on) return;
        if (f.t === "in") paths += '<path class="flow in" d="M' + (f.x + 26) + " " + f.y + " C 150 " + f.y + ", 250 140, 338 132\"/>";
        else if (f.id === "r1") paths += '<path class="flow out" d="M410 132 C 440 132, 440 ' + f.y + ', ' + (f.x - 26) + " " + f.y + '"/>';
        else paths += '<path class="flow out" d="M' + (f.x < 240 ? 350 : 370) + " 100 C " + f.x + " 100, " + f.x + " 100, " + f.x + " " + (f.y + 26) + '"/>';
      });
      const flow = (I === 0 || E === 0) ? 0.35 * (I + E) : (I + E) / 2;
      const idx = clamp(flow / 3, 0, 1);
      const rise = 4 + 22 * (1 - idx);
      afSvg.innerHTML =
        '<rect class="case" x="14" y="14" width="472" height="272" rx="16"/>' +
        '<rect class="mobo" x="110" y="52" width="360" height="176" rx="6"/>' +
        '<ellipse class="glow" cx="360" cy="140" rx="90" ry="60" style="opacity:' + (0.15 + 0.6 * (1 - idx)).toFixed(2) + '"/>' +
        '<rect class="cpu-c" x="340" y="92" width="62" height="80" rx="6"/><text class="lb" x="371" y="136">CPU</text><text class="lb" x="371" y="148">soğutucu</text>' +
        '<rect class="gpu-c" x="150" y="182" width="210" height="26" rx="5"/><text class="lb" x="255" y="199">Ekran kartı</text>' +
        '<rect class="psu-c" x="100" y="238" width="200" height="38" rx="6"/><text class="lb" x="200" y="261">Güç kaynağı</text>' +
        paths + fans;
      const P = I > E ? "Pozitif" : I < E ? "Negatif" : (I === 0 ? "Akış yok" : "Dengeli");
      $("af-out").innerHTML =
        '<div class="ps"><small>Giriş / çıkış fanı</small><b>' + I + " / " + E + "</b></div>" +
        '<div class="ps"><small>Basınç</small><b>' + P + "</b></div>" +
        '<div class="ps"><small>Kasa içi ısınma (kabaca)</small><b>+' + tr(rise, 0) + " °C</b></div>";
      const note = $("af-note");
      let msg, cls = "callout mt1";
      if (I === 0 && E === 0) { msg = "Hiç fan yok: sıcak hava kasada hapis kalıyor. Bileşenler kendi ürettiği ısıda pişiyor."; cls = "callout warn mt1"; }
      else if (E === 0) { msg = "Sadece giriş var: hava içeri giriyor ama çıkacak yer bulamıyor. Kasa şişer, ısınmış hava aralıklardan zorla sızar. En az bir çıkış fanı ekle."; cls = "callout warn mt1"; }
      else if (I === 0) { msg = "Sadece çıkış var: hava kasa aralıklarından (filtresiz) içeri sızıyor, toz artıyor. Ön tarafa giriş fanı ekle."; cls = "callout fun mt1"; }
      else if (I > E) { msg = "<b>Pozitif basınç:</b> içeri giren hava çıkandan fazla. Hava filtreli girişlerden girer, dar aralıklardan çıkar: toz azalır. Çoğu kullanıcı için güzel bir denge."; }
      else if (I < E) { msg = "<b>Negatif basınç:</b> dışarı atılan hava içeri girenden fazla. Sıcak hava hızla atılır ama toz her aralıktan içeri çekilir; filtreler etkisiz kalır."; }
      else { msg = "<b>Dengeli akış:</b> giriş ve çıkış eşit. Ön ve alttan serin hava girer, arka ve üstten sıcak hava çıkar. İyi bir başlangıç."; }
      if (E > 0 && FANS.some(function (f) { return f.on && f.id[0] === "t"; })) msg += " Sıcak hava yükseldiği için üst fanlar doğal olarak işe yarar.";
      note.className = cls;
      note.innerHTML = msg;
    }
    $("af-fans").addEventListener("change", function (e) {
      const l = e.target.closest(".af-fan");
      FANS[+l.dataset.i].on = e.target.checked;
      l.classList.toggle("on", e.target.checked);
      render();
    });
    render();
  }
})();
