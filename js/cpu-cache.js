/* Cache hız piramidi + "veri nerede?" arama animasyonu (GSAP) */
(function () {
  "use strict";
  const list = document.getElementById("lvl-list");
  const result = document.getElementById("cache-result");
  if (!list || !window.gsap) return;

  // 1 döngü ≈ 0,25 ns (4 GHz) varsayımı. "İnsan ölçeği": 1 döngü = 1 saniye.
  const L = [
    { name: "Register", size: "~128 bayt", cyc: 1, lat: "< 1 ns", human: "1 sn", w: 24,
      say: "Veri zaten işlemcinin elindeydi. Beklemek yok." },
    { name: "L1 cache", size: "32–64 KB", cyc: 4, lat: "~1 ns", human: "4 sn", w: 36,
      say: "En yakın cache'te buldu. Neredeyse hiç beklemedi." },
    { name: "L2 cache", size: "256 KB – 2 MB", cyc: 14, lat: "~3,5 ns", human: "14 sn", w: 48,
      say: "L1'de yoktu ama L2'de vardı. Hâlâ çok hızlı." },
    { name: "L3 cache", size: "8 – 96 MB", cyc: 44, lat: "~11 ns", human: "45 sn", w: 60,
      say: "Ortak cache'te buldu. RAM'e gitmekten çok daha iyi." },
    { name: "RAM", size: "8 – 64 GB", cyc: 300, lat: "~75 ns", human: "5 dakika", w: 74,
      say: "Hiçbir cache'te yoktu, RAM'e gidildi. Yüzlerce döngü boşa bekledi. Cache'in varlık sebebi tam olarak bu." },
    { name: "NVMe SSD", size: "0,5 – 4 TB", cyc: 320000, lat: "~80 µs", human: "3,7 gün", w: 88,
      say: "Veri diskteymiş. İşlemci ölçeğinde bu çağlar sürer; o yüzden işletim sistemi beklerken başka bir programı çalıştırır." },
    { name: "HDD", size: "1 – 20 TB", cyc: 40000000, lat: "~10 ms", human: "1,3 yıl", w: 100,
      say: "Mekanik disk kolunun dönüp konumlanması gerekti. İşlemci için bu neredeyse bir ömür." }
  ];

  list.innerHTML = L.map(function (l, i) {
    return '<button class="lvl" data-i="' + i + '" style="--w:' + l.w + '%">' +
      '<span class="bar"></span><span class="nm">' + l.name + '</span><span class="sz">' + l.size +
      '</span><span class="lt">' + l.lat + '</span><span class="hm">' + l.human + '</span><span class="st"></span></button>';
  }).join("");
  const rows = list.querySelectorAll(".lvl");

  let busy = false, tl = null;
  const fmt = function (n) { return Math.round(n).toLocaleString("tr-TR"); };

  function search(target) {
    if (busy) return;
    busy = true;
    rows.forEach(function (r) {
      r.classList.remove("scan", "hit", "miss");
      r.querySelector(".st").textContent = "";
    });
    result.innerHTML = 'Aranıyor... <span class="tick">0 döngü</span>';
    const tick = result.querySelector(".tick");
    const step = 0.45;
    const cnt = { v: 0 };
    tl = gsap.timeline({ onComplete: function () { busy = false; } });

    for (let k = 0; k <= target; k++) {
      tl.call(function () { rows[k].classList.add("scan"); }, null, k * step);
      tl.call(function () {
        const hit = k === target;
        rows[k].classList.remove("scan");
        rows[k].classList.add(hit ? "hit" : "miss");
        rows[k].querySelector(".st").textContent = hit ? "✓ bulundu" : "✗ yok";
        if (hit) gsap.fromTo(rows[k], { scale: 1.02 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,.4)" });
      }, null, k * step + step * 0.7);
    }
    const dur = Math.max(0.35, target * step + step * 0.7);
    tl.to(cnt, {
      v: L[target].cyc, duration: dur, ease: "power2.in",
      onUpdate: function () { tick.textContent = fmt(cnt.v) + " döngü"; }
    }, 0);
    tl.call(function () {
      const l = L[target];
      result.innerHTML = "<b>" + l.name + "</b>: yaklaşık <b>" + fmt(l.cyc) + " döngü</b> (" + l.lat + "). " +
        'İnsan ölçeğinde <b class="hl">' + l.human + "</b>.<br><span class=\"muted\">" + l.say + "</span>";
      gsap.from(result, { opacity: 0.3, y: 6, duration: 0.4 });
    });
  }

  list.addEventListener("click", function (e) {
    const b = e.target.closest(".lvl");
    if (b) search(+b.dataset.i);
  });

  if (window.ScrollTrigger) {
    gsap.from(list.querySelectorAll(".bar"), {
      scaleX: 0, transformOrigin: "0% 50%", duration: 0.9, stagger: 0.09, ease: "power3.out",
      scrollTrigger: { trigger: list, start: "top 85%", once: true }
    });
  }
})();
