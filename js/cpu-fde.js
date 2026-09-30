/* Komut döngüsü demosu: Fetch → Decode → Execute → Write-back (GSAP) */
(function () {
  "use strict";
  const stage = document.getElementById("fde-stage");
  if (!stage || !window.gsap) return;

  const $ = function (id) { return document.getElementById(id); };
  const PROG = [
    { t: "LOAD R1, 5", op: "LOAD", d: 1, imm: 5 },
    { t: "LOAD R2, 3", op: "LOAD", d: 2, imm: 3 },
    { t: "ADD R3, R1, R2", op: "ADD", d: 3, a: 1, b: 2 },
    { t: "STORE [7], R3", op: "STORE", s: 3, addr: 7 },
    { t: "HALT", op: "HALT" }
  ];
  const PHASES = ["FETCH", "DECODE", "EXECUTE", "WRITE-BACK"];

  const memEl = $("fde-mem");
  memEl.innerHTML = PROG.map(function (p, i) {
    return '<div class="ram-row" id="fde-row' + i + '"><span class="a">' + i + "</span><span>" + p.t + "</span></div>";
  }).join("");

  let pc, cur, regs, data, phase, busy, halted, auto, master;

  function val(id, v, flash) {
    const el = $(id);
    el.querySelector("b").textContent = v;
    if (flash) gsap.fromTo(el, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,.5)" });
  }
  function hot(id, on) { $(id).classList.toggle("hot", !!on); }

  function setPhase(p) {
    $("fde-phases").querySelectorAll("span").forEach(function (s, i) { s.classList.toggle("on", i === p); });
  }

  function log(ph, text) {
    const ol = $("fde-log");
    ol.querySelectorAll("li.new").forEach(function (l) { l.classList.remove("new"); });
    const li = document.createElement("li");
    li.className = "new";
    li.innerHTML = "<b>" + ph + "</b> " + text;
    ol.appendChild(li);
    ol.scrollTop = ol.scrollHeight;
    gsap.from(li, { x: -14, opacity: 0, duration: 0.35 });
  }

  function fly(fromEl, toEl, label) {
    const c = stage.getBoundingClientRect();
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const p = document.createElement("div");
    p.className = "packet";
    p.textContent = label;
    stage.appendChild(p);
    gsap.set(p, { x: a.left - c.left + a.width / 2, y: a.top - c.top + a.height / 2, xPercent: -50, yPercent: -50, scale: 0.4, opacity: 0 });
    return gsap.timeline()
      .to(p, { scale: 1, opacity: 1, duration: 0.15 })
      .to(p, { x: b.left - c.left + b.width / 2, y: b.top - c.top + b.height / 2, duration: 0.65, ease: "power2.inOut" })
      .to(p, { scale: 0.4, opacity: 0, duration: 0.15, onComplete: function () { p.remove(); } });
  }

  function describe(i) {
    if (i.op === "LOAD") return "LOAD: R" + i.d + " ← " + i.imm;
    if (i.op === "ADD") return "ADD: R" + i.d + " ← R" + i.a + " + R" + i.b;
    if (i.op === "STORE") return "STORE: RAM[" + i.addr + "] ← R" + i.s;
    return "HALT: dur";
  }

  function build() {
    const tl = gsap.timeline({
      onComplete: function () {
        busy = false;
        phase = (phase + 1) % 4;
        if (halted) { auto = false; }
        refreshButtons();
        if (auto && !halted) gsap.delayedCall(0.4, step);
      }
    });

    if (phase === 0) { // FETCH
      const addr = pc;
      const ins = PROG[addr];
      const row = $("fde-row" + addr);
      tl.call(function () {
        setPhase(0);
        row.classList.add("active");
        hot("fde-pc", true);
        log("FETCH", "PC = " + addr + ". İşlemci bu adresi RAM'e gönderiyor: \"" + addr + " numaralı komutu ver.\"");
      });
      tl.add(fly($("fde-pc"), row, "adres " + addr));
      tl.add(fly(row, $("fde-ir"), ins.t));
      tl.call(function () {
        cur = ins;
        val("fde-ir", ins.t, true);
        hot("fde-pc", false);
        pc = addr + 1;
        val("fde-pc", pc, true);
        log("FETCH", "Komut IR'ye geldi. PC bir artırıldı (" + pc + ") ki sıradaki komut hazır olsun.");
      });
    } else if (phase === 1) { // DECODE
      tl.call(function () { setPhase(1); hot("fde-ir", true); });
      tl.add(fly($("fde-ir"), $("fde-cu"), cur.op));
      tl.call(function () {
        hot("fde-ir", false);
        hot("fde-cu", true);
        val("fde-cu", describe(cur), true);
        log("DECODE", "Kontrol birimi komutu çözdü → <code>" + describe(cur) + "</code>");
      });
    } else if (phase === 2) { // EXECUTE
      tl.call(function () { setPhase(2); hot("fde-cu", false); });
      if (cur.op === "LOAD") {
        tl.add(fly($("fde-cu"), $("fde-alu"), String(cur.imm)));
        tl.call(function () { hot("fde-alu", true); val("fde-alu", "geçir: " + cur.imm, true); log("EXECUTE", "Sabit değer (" + cur.imm + ") ALU'dan geçirilip hazırlandı."); });
      } else if (cur.op === "ADD") {
        const a = regs[cur.a], b = regs[cur.b];
        tl.add(fly($("fde-r" + cur.a), $("fde-alu"), String(a)));
        tl.add(fly($("fde-r" + cur.b), $("fde-alu"), String(b)), "<0.15");
        tl.call(function () {
          hot("fde-alu", true);
          val("fde-alu", a + " + " + b + " = " + (a + b), true);
          val("fde-zf", a + b === 0 ? 1 : 0, true);
          log("EXECUTE", "ALU iki register'ı topladı: " + a + " + " + b + " = " + (a + b) + ". Sonuç sıfır olmadığı için ZF = 0.");
        });
      } else if (cur.op === "STORE") {
        tl.add(fly($("fde-cu"), $("fde-alu"), "adres " + cur.addr));
        tl.call(function () { hot("fde-alu", true); val("fde-alu", "adres = " + cur.addr, true); log("EXECUTE", "Yazılacak adres hesaplandı: " + cur.addr + ". Değer R" + cur.s + "'ten okunacak."); });
      } else {
        tl.call(function () { val("fde-alu", "—"); log("EXECUTE", "HALT: işlemci durdu. Program bitti 🎉 Baştan izlemek için Sıfırla'ya bas."); halted = true; });
      }
    } else { // WRITE-BACK
      tl.call(function () { setPhase(3); });
      if (cur.op === "STORE") {
        const v = regs[cur.s];
        tl.add(fly($("fde-r" + cur.s), $("fde-data"), String(v)));
        tl.call(function () {
          data = v;
          val("fde-data", v, true);
          log("WRITE-BACK", "R" + cur.s + " değeri (" + v + ") RAM'deki 7 numaralı hücreye yazıldı.");
        });
      } else {
        const result = cur.op === "LOAD" ? cur.imm : regs[cur.a] + regs[cur.b];
        tl.add(fly($("fde-alu"), $("fde-r" + cur.d), String(result)));
        tl.call(function () {
          regs[cur.d] = result;
          val("fde-r" + cur.d, result, true);
          log("WRITE-BACK", "Sonuç (" + result + ") R" + cur.d + " register'ına yazıldı.");
        });
      }
      tl.call(function () {
        hot("fde-alu", false);
        val("fde-alu", "—");
        val("fde-cu", "bekliyor");
        val("fde-ir", "—");
        const done = $("fde-row" + (pc - 1));
        done.classList.remove("active");
        done.classList.add("done");
      });
    }
    return tl;
  }

  function step() {
    if (busy || halted) return;
    busy = true;
    refreshButtons();
    master = build();
  }

  function refreshButtons() {
    $("fde-step").disabled = busy || halted;
    $("fde-auto").textContent = auto ? "Durdur" : "Otomatik oynat";
    $("fde-auto").disabled = halted && !auto;
  }

  function reset() {
    if (master) master.kill();
    gsap.killTweensOf(step);
    stage.querySelectorAll(".packet").forEach(function (p) { p.remove(); });
    pc = 0; cur = null; regs = [0, 0, 0, 0]; data = 0; phase = 0; busy = false; halted = false; auto = false;
    val("fde-pc", 0); val("fde-ir", "—"); val("fde-cu", "bekliyor"); val("fde-alu", "—");
    val("fde-r1", 0); val("fde-r2", 0); val("fde-r3", 0); val("fde-zf", 0); val("fde-data", 0);
    ["fde-pc", "fde-ir", "fde-cu", "fde-alu"].forEach(function (id) { hot(id, false); });
    PROG.forEach(function (_, i) { $("fde-row" + i).className = "ram-row"; });
    setPhase(-1);
    $("fde-log").innerHTML = "";
    log("HAZIR", "Program 5 komut: R1 = 5, R2 = 3, R3 = R1 + R2, sonucu RAM'e yaz, dur. \"Adım\" tuşuyla başla.");
    refreshButtons();
  }

  $("fde-step").addEventListener("click", function () { auto = false; step(); });
  $("fde-auto").addEventListener("click", function () {
    if (auto) { auto = false; refreshButtons(); return; }
    auto = true;
    refreshButtons();
    step();
  });
  $("fde-reset").addEventListener("click", reset);
  reset();
})();
