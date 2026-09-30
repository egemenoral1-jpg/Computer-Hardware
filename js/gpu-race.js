/* CPU vs GPU yarışı: iki GSAP timeline yan yana (basitleştirilmiş simülasyon) */
(function () {
  "use strict";
  const boardC = document.getElementById("board-cpu");
  const boardG = document.getElementById("board-gpu");
  if (!boardC || !boardG || !window.gsap) return;

  const $ = function (id) { return document.getElementById(id); };
  const SIDE = 16, TOTAL = SIDE * SIDE;
  const T_CPU = 0.04;           // CPU çekirdeği bir "iş"i bu sürede yapar
  const T_GPU = T_CPU * 4;      // GPU çekirdeği 4 kat daha yavaş
  const CPU_CORES = 4;

  const MODES = {
    par: {
      n: TOTAL,
      desc: "256 pikselin her biri bağımsız, birinin rengi diğerine bağlı değil. CPU 4'er 4'er boyar (64 tur). GPU'nun 256 çekirdeği ise hepsini aynı anda boyar. GPU çekirdeği tek başına 4 kat yavaş olsa bile fark çok büyük."
    },
    seq: {
      n: 32,
      desc: "Her adımın girdisi bir önceki adımın sonucu (mesela zincirleme bir hesap). Aynı anda sadece bir adım çalışabilir, yani 4 ya da 256 çekirdek olması hiçbir şey değiştirmez. Bu durumda tek çekirdeğin hızı belirleyici: CPU kazanır."
    }
  };

  let colC = [], colG = [];
  function mk(board, cols, sat, hue0, spread) {
    let h = "";
    for (let k = 0; k < TOTAL; k++) {
      const x = k % SIDE, y = Math.floor(k / SIDE);
      cols.push("hsl(" + ((hue0 + (x + y) * spread) % 360).toFixed(0) + " " + sat + "% 62%)");
      h += '<div class="rc"></div>';
    }
    board.innerHTML = h;
    return board.querySelectorAll(".rc");
  }
  const cellsC = mk(boardC, colC, 90, 195, 1.2);
  const cellsG = mk(boardG, colG, 85, 255, 3.2);

  let mode = "par", tlC = null, tlG = null;
  const fmt = function (s) { return s.toFixed(2).replace(".", ",") + " sn"; };

  function reset() {
    if (tlC) tlC.kill();
    if (tlG) tlG.kill();
    tlC = tlG = null;
    [cellsC, cellsG].forEach(function (cells) {
      gsap.set(cells, { clearProps: "backgroundColor" });
      cells.forEach(function (c, k) { c.classList.toggle("off", k >= MODES[mode].n); });
    });
    $("t-cpu").textContent = fmt(0);
    $("t-gpu").textContent = fmt(0);
    $("s-cpu").textContent = "hazır";
    $("s-gpu").textContent = "hazır";
    $("racer-cpu").classList.remove("win");
    $("racer-gpu").classList.remove("win");
    $("race-desc").textContent = MODES[mode].desc;
    $("race-result").innerHTML = "Yarışı başlat ve iki tarafı izle.";
    $("race-go").disabled = false;
  }

  function go() {
    reset();
    $("race-go").disabled = true;
    const par = mode === "par", n = MODES[mode].n;
    let finished = 0, first = null;

    function finish(who, tl, tEl, sEl) {
      tEl.textContent = fmt(tl.duration());
      sEl.textContent = "bitti ✓";
      finished++;
      if (!first) {
        first = who;
        $("racer-" + who).classList.add("win");
        sEl.textContent = "🏁 önce bitirdi";
      }
      if (finished === 2) {
        const tc = tlC.duration(), tg = tlG.duration();
        const ratio = (Math.max(tc, tg) / Math.min(tc, tg)).toFixed(0);
        $("race-result").innerHTML = par
          ? "<b>GPU ≈ " + ratio + " kat hızlı bitirdi.</b> İş 256 bağımsız parçaya bölünebildiği için çekirdek sayısı belirleyici oldu. Ekrandaki pikseller tam olarak böyle bir iş: her pikselin rengi ayrı hesaplanır."
          : "<b>CPU ≈ " + ratio + " kat hızlı bitirdi.</b> İş sıralı olduğu için GPU'nun binlerce çekirdeği boşa durdu ve tek bir yavaş çekirdek işi yaptı. Bu yüzden her iş GPU'ya uygun değil.";
        $("race-go").disabled = false;
        gsap.from($("race-result"), { opacity: 0.2, y: 8, duration: 0.5 });
      }
    }

    tlC = gsap.timeline({ onComplete: function () { finish("cpu", tlC, $("t-cpu"), $("s-cpu")); } });
    tlG = gsap.timeline({ onComplete: function () { finish("gpu", tlG, $("t-gpu"), $("s-gpu")); } });
    for (let k = 0; k < n; k++) {
      const atC = par ? Math.floor(k / CPU_CORES) * T_CPU : k * T_CPU;
      const atG = par ? 0 : k * T_GPU;
      tlC.to(cellsC[k], { backgroundColor: colC[k], duration: T_CPU, ease: "none" }, atC);
      tlG.to(cellsG[k], { backgroundColor: colG[k], duration: T_GPU, ease: "none" }, atG);
    }
    tlC.eventCallback("onUpdate", function () { if (tlC.isActive()) $("t-cpu").textContent = fmt(tlC.time()); });
    tlG.eventCallback("onUpdate", function () { if (tlG.isActive()) $("t-gpu").textContent = fmt(tlG.time()); });
    $("s-cpu").textContent = par ? "4 çekirdek çalışıyor..." : "1 çekirdek çalışıyor...";
    $("s-gpu").textContent = par ? "256 çekirdek çalışıyor..." : "1 çekirdek çalışıyor, 255'i bekliyor...";
  }

  $("race-tabs").addEventListener("click", function (e) {
    const b = e.target.closest(".tab");
    if (!b) return;
    mode = b.dataset.m;
    $("race-tabs").querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t === b); });
    reset();
  });
  $("race-go").addEventListener("click", go);
  $("race-reset").addEventListener("click", reset);
  reset();
})();
