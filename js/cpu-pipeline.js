/* Pipeline demosu: pipeline yok / var / yanlış dal tahmini (GSAP timeline) */
(function () {
  "use strict";
  const grid = document.getElementById("pipe-grid");
  if (!grid || !window.gsap) return;

  const ST = ["IF", "ID", "EX", "MEM", "WB"];
  // satır: [isim, başlangıç çevrimi, (yanlış yolsa) kaç aşama gördü]
  const MODES = [
    { id: "none", tab: "Pipeline yok",
      rows: [["1. LOAD", 0], ["2. ADD", 5], ["3. SUB", 10], ["4. AND", 15], ["5. STORE", 20]], useful: 5,
      note: "Her komut, öncekinin 5 aşamasının tamamen bitmesini bekliyor. Bir aşama çalışırken diğer dört birim boşta duruyor." },
    { id: "pipe", tab: "Pipeline var",
      rows: [["1. LOAD", 0], ["2. ADD", 1], ["3. SUB", 2], ["4. AND", 3], ["5. STORE", 4]], useful: 5,
      note: "Her çevrimde yeni bir komut hatta giriyor. 5. çevrimden sonra hat tamamen dolu ve her çevrimde bir komut bitiyor. Komut sayısı arttıkça ortalama 1 komut/çevrim'e yaklaşır." },
    { id: "flush", tab: "Yanlış dal tahmini",
      rows: [["1. LOAD", 0], ["2. ADD", 1], ["3. BEQ ⤴", 2], ["✕ yanlış yol 1", 3, 2], ["✕ yanlış yol 2", 4, 1], ["4. SUB (doğru yol)", 5], ["5. STORE", 6]], useful: 5,
      note: "BEQ'nun sonucu EX aşamasında belli oluyor. O zamana kadar işlemci tahmin ettiği yoldan iki komut daha getirmişti; tahmin yanlış çıkınca bunlar çöpe atılıyor (✕) ve doğru yoldan yeniden başlanıyor. İki çevrim boşa gitti. Gerçek işlemcilerde pipeline daha derin olduğu için kayıp çok daha büyük." }
  ];

  const tabs = document.getElementById("pipe-tabs");
  const stats = document.getElementById("pipe-stats");
  const noteEl = document.getElementById("pipe-note");
  let cur = 1, tl = null;

  tabs.innerHTML = MODES.map(function (m, i) {
    return '<button class="tab' + (i === cur ? " active" : "") + '" data-i="' + i + '">' + m.tab + "</button>";
  }).join("");

  function build() {
    const m = MODES[cur];
    let total = 0;
    m.rows.forEach(function (r) { total = Math.max(total, r[1] + (r[2] ? r[2] + 1 : 5)); });

    let html = '<div class="prow head"><div class="pl">Komut</div>';
    for (let c = 0; c < total; c++) html += '<div class="pc h">' + (c + 1) + "</div>";
    html += "</div>";
    m.rows.forEach(function (r) {
      const start = r[1], wrong = r[2];
      html += '<div class="prow"><div class="pl' + (wrong ? " bad" : "") + '">' + r[0] + "</div>";
      for (let c = 0; c < total; c++) {
        if (c >= start && c < start + (wrong || 5)) {
          const idx = c - start;
          html += '<div class="pc st ' + ST[idx] + (wrong ? " x" : "") + '" data-c="' + c + '">' + ST[idx] + "</div>";
        } else if (wrong && c === start + wrong) {
          html += '<div class="pc st flushed" data-c="' + c + '">✕</div>';
        } else {
          html += '<div class="pc"></div>';
        }
      }
      html += "</div>";
    });
    grid.innerHTML = html;
    grid.dataset.total = total;
    noteEl.textContent = m.note;
    return { total: total, m: m };
  }

  function play() {
    if (tl) tl.kill();
    const info = build();
    const cells = grid.querySelectorAll(".st");
    const dt = 0.17;
    stats.innerHTML =
      '<div class="ps"><small>Şu anki çevrim</small><b id="ps-now">0</b></div>' +
      '<div class="ps"><small>Toplam çevrim</small><b>' + info.total + "</b></div>" +
      '<div class="ps"><small>Biten yararlı komut</small><b id="ps-done">0</b></div>' +
      '<div class="ps"><small>Komut / çevrim</small><b id="ps-ipc">—</b></div>';
    const now = document.getElementById("ps-now"), done = document.getElementById("ps-done"), ipc = document.getElementById("ps-ipc");

    gsap.set(cells, { opacity: 0, scale: 0 });
    tl = gsap.timeline();
    cells.forEach(function (c) {
      tl.to(c, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, +c.dataset.c * dt);
    });
    for (let c = 0; c < info.total; c++) {
      tl.call(function () {
        now.textContent = c + 1;
        // bu çevrimde WB'sini tamamlayan yararlı komut sayısı
        let d = 0;
        info.m.rows.forEach(function (r) { if (!r[2] && r[1] + 4 <= c) d++; });
        done.textContent = d;
      }, null, c * dt);
    }
    tl.call(function () {
      ipc.textContent = (info.m.useful / info.total).toFixed(2).replace(".", ",");
      gsap.fromTo(ipc, { scale: 1.5, color: "#fbbf24" }, { scale: 1, color: "#ffffff", duration: 0.8, ease: "elastic.out(1,.4)" });
    }, null, info.total * dt + 0.2);
  }

  tabs.addEventListener("click", function (e) {
    const b = e.target.closest(".tab");
    if (!b) return;
    cur = +b.dataset.i;
    tabs.querySelectorAll(".tab").forEach(function (t, i) { t.classList.toggle("active", i === cur); });
    play();
  });
  document.getElementById("pipe-replay").addEventListener("click", play);

  if (window.ScrollTrigger) {
    ScrollTrigger.create({ trigger: grid, start: "top 80%", once: true, onEnter: play });
  } else {
    play();
  }
  build();
})();
