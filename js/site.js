/* ==========================================================
   Parça Parça — ortak JS
   - parça listesi (menü, ana sayfa kartları, sayfa altı gezinme)
   - scroll ilerleme çubuğu, reveal animasyonları
   - mini quiz + "tamamlandı" takibi (localStorage)
   ========================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  const ICONS = {
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4M12 2v4M15 2v4M9 18v4M12 18v4M15 18v4M2 9h4M2 12h4M2 15h4M18 9h4M18 12h4M18 15h4"/></svg>',
    gpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5.5" width="20" height="11.5" rx="2"/><circle cx="8.5" cy="11.2" r="3"/><circle cx="15.5" cy="11.2" r="3"/><path d="M5 17v2.5M8 17v2.5M11 17v2.5"/></svg>',
    ram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6.5" width="20" height="9.5" rx="1.5"/><rect x="5" y="9" width="3" height="4.2" rx=".6"/><rect x="10.5" y="9" width="3" height="4.2" rx=".6"/><rect x="16" y="9" width="3" height="4.2" rx=".6"/><path d="M5 16v2.5M8 16v2.5M11 16v2.5M14 16v2.5M17 16v2.5"/></svg>',
    depolama: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7 9h10M7 12.5h6"/><circle cx="17" cy="15.5" r="1.1"/></svg>',
    anakart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6.5" y="6.5" width="6" height="6" rx="1"/><path d="M16 7h2.5M16 10h2.5M7 16.5h10M15 13.5h3.5"/></svg>',
    psu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M13 8.5l-3 4h4l-3 3.5"/></svg>',
    sogutma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.4"/><path d="M12 2v7.6M12 14.4V22M2 12h7.6M14.4 12H22M5 5l5.3 5.3M13.7 13.7L19 19M19 5l-5.3 5.3M10.3 13.7L5 19"/></svg>'
  };

  // Öğrenme sırası da bu sıra
  const PARTS = [
    { id: "cpu", rgb: "56,189,248", url: "cpu.html", name: "İşlemci", full: "İşlemci (CPU)", tag: "Bilgisayarın beyni. Komutları tek tek okuyup çalıştırır, register'larla oynar.", chips: ["Register", "Cache", "Pipeline"], gsap: true },
    { id: "gpu", rgb: "167,139,250", url: "gpu.html", name: "Ekran Kartı", full: "Ekran Kartı (GPU)", tag: "Binlerce küçük çekirdekle aynı anda binlerce piksel boyar.", chips: ["Paralel", "VRAM", "Shader"], gsap: true },
    { id: "ram", rgb: "52,211,153", url: "ram.html", name: "RAM", full: "Bellek (RAM)", tag: "İşlemcinin çalışma masası. Hızlı ama kalıcı değil.", chips: ["DDR5", "Gecikme", "Dual channel"] },
    { id: "depolama", rgb: "251,113,133", url: "depolama.html", name: "Depolama", full: "Depolama (SSD / HDD)", tag: "Verilerin kalıcı evi. Bilgisayar kapansa da silinmez.", chips: ["NAND", "NVMe", "HDD"] },
    { id: "anakart", rgb: "251,191,36", url: "anakart.html", name: "Anakart", full: "Anakart", tag: "Tüm parçaları birbirine bağlayan devre kartı, şehrin yol haritası.", chips: ["Chipset", "PCIe", "BIOS"] },
    { id: "psu", rgb: "251,146,60", url: "psu.html", name: "Güç Kaynağı", full: "Güç Kaynağı (PSU)", tag: "Prizden gelen gücü parçaların yiyebileceği hale çevirir.", chips: ["12V", "80 PLUS", "Watt"] },
    { id: "sogutma", rgb: "45,212,191", url: "sogutma.html", name: "Soğutma", full: "Soğutma", tag: "Isıyı dışarı atmazsan parçalar yavaşlar, hatta yanar.", chips: ["Fan", "Heatpipe", "AIO"] }
  ];

  const REPO = "https://github.com/egemenoral1-jpg/Computer-Hardware";
  const page = document.body.dataset.page || "home";

  /* ---------- tamamlandı takibi ---------- */
  function readDone() {
    try { return JSON.parse(localStorage.getItem("pp-done") || "[]"); } catch (e) { return []; }
  }
  function isDone(id) { return readDone().indexOf(id) !== -1; }
  function markDone(id) {
    const d = readDone();
    if (d.indexOf(id) === -1) {
      d.push(id);
      try { localStorage.setItem("pp-done", JSON.stringify(d)); } catch (e) { /* olsun */ }
    }
  }
  window.PP = { PARTS: PARTS, ICONS: ICONS, isDone: isDone, markDone: markDone };

  /* ---------- header / footer ---------- */
  function buildHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
    const links = PARTS.map(function (p) {
      return '<a href="' + p.url + '"' + (p.id === page ? ' class="active"' : "") + ">" + p.name + "</a>";
    }).join("");
    host.outerHTML =
      '<header class="nav"><div class="nav-inner">' +
      '<a class="logo" href="index.html" aria-label="Ana sayfa">' +
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="18" height="18" rx="3.5"/><rect x="12" y="12" width="8" height="8" rx="1.5" fill="currentColor" fill-opacity=".25"/><path d="M12 2.5v4.5M16 2.5v4.5M20 2.5v4.5M12 25v4.5M16 25v4.5M20 25v4.5M2.5 12h4.5M2.5 16h4.5M2.5 20h4.5M25 12h4.5M25 16h4.5M25 20h4.5"/></svg>' +
      "<span>Parça<em>Parça</em></span></a>" +
      '<button class="nav-toggle" aria-label="Menüyü aç" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '<nav class="nav-links" id="nav-links"><a href="index.html"' + (page === "home" ? ' class="active"' : "") + ">Ana Sayfa</a>" + links + "</nav>" +
      "</div></header>";

    const btn = document.querySelector(".nav-toggle");
    const nav = document.getElementById("nav-links");
    btn.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  function buildFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    host.outerHTML =
      '<footer class="footer"><div class="container footer-inner">' +
      "<div><strong>ParçaParça</strong> · bilgisayarı parça parça öğreniyoruz.<br>Rakamlar yaklaşık değerlerdir, amaç mantığı oturtmak.</div>" +
      '<div><a href="' + REPO + '" target="_blank" rel="noopener">Kaynak kodu GitHub&#39;da</a></div>' +
      "</div></footer>";
  }

  function buildPager() {
    const host = document.getElementById("pager");
    if (!host) return;
    const i = PARTS.findIndex(function (p) { return p.id === page; });
    if (i === -1) return;
    const prev = PARTS[i - 1];
    const next = PARTS[i + 1];
    let html = "";
    if (prev) html += '<a class="prev" href="' + prev.url + '"><small>← Önceki</small><span class="title">' + prev.full + "</span></a>";
    else html += '<a class="prev" href="index.html"><small>← Başa dön</small><span class="title">Ana Sayfa</span></a>';
    if (next) html += '<a class="next" href="' + next.url + '"><small>Sıradaki →</small><span class="title">' + next.full + "</span></a>";
    else html += '<a class="next" href="index.html"><small>Bitti 🎉</small><span class="title">Ana Sayfaya dön</span></a>';
    host.className = "pager";
    host.innerHTML = html;
  }

  /* ---------- scroll ilerleme + reveal ---------- */
  function initProgress() {
    const bar = document.createElement("div");
    bar.className = "progress";
    document.body.appendChild(bar);
    let ticking = false;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  let io = null;
  function initReveal(root) {
    const els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    }
    els.forEach(function (el) { io.observe(el); });
  }
  window.PP.reveal = initReveal;

  /* ---------- quiz ---------- */
  function initQuiz() {
    const root = document.querySelector(".quiz");
    const dataEl = document.getElementById("quiz-data");
    if (!root || !dataEl) return;
    const qs = JSON.parse(dataEl.textContent);

    function render() {
      let answered = 0, correct = 0;
      root.innerHTML =
        qs.map(function (q, i) {
          return '<div class="quiz-q" data-i="' + i + '"><h3><span class="n">' + (i + 1) + ".</span>" + q.q + "</h3>" +
            '<div class="quiz-opts">' + q.o.map(function (o, j) {
              return '<button class="quiz-opt" data-j="' + j + '">' + o + "</button>";
            }).join("") + '</div><div class="quiz-exp">' + q.e + "</div></div>";
        }).join("") +
        '<div class="quiz-result"><div class="score"></div><p class="msg"></p><button class="btn sm ghost retry">Tekrar dene</button></div>';

      root.onclick = function (e) {
        const retry = e.target.closest(".retry");
        if (retry) { render(); return; }
        const btn = e.target.closest(".quiz-opt");
        if (!btn || btn.disabled) return;
        const qEl = btn.closest(".quiz-q");
        const q = qs[+qEl.dataset.i];
        const pick = +btn.dataset.j;
        qEl.querySelectorAll(".quiz-opt").forEach(function (b, j) {
          b.disabled = true;
          if (j === q.a) b.classList.add("right");
          else if (j === pick) b.classList.add("wrong");
        });
        qEl.querySelector(".quiz-exp").classList.add("show");
        answered++;
        if (pick === q.a) correct++;
        if (answered === qs.length) {
          const res = root.querySelector(".quiz-result");
          res.classList.add("show");
          res.querySelector(".score").textContent = correct + " / " + qs.length + " doğru";
          const ok = correct / qs.length >= 0.6;
          res.querySelector(".msg").textContent = ok
            ? "Güzel! Bu konuyu bitirdin sayılır. Sıradaki parçaya geçebilirsin."
            : "Fena değil ama biraz daha göz gezdirip tekrar deneyebilirsin. Demoları kurcalamak çok işe yarıyor.";
          if (ok) { markDone(page); }
          res.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      };
    }
    render();
  }

  buildHeader();
  buildFooter();
  buildPager();
  initProgress();
  initReveal();
  initQuiz();
})();
