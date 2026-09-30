/* Register bölümü: gezgin, RAX bit demosu, mini ALU + bayraklar, stack demosu */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const hasG = !!window.gsap;

  /* =========================================================
     1) Register gezgini
     ========================================================= */
  const CATS = [
    {
      id: "gpr", name: "Genel amaçlı", items: [
        { n: "RAX", bits: 64, role: "Accumulator (biriktirici)", sub: "EAX · AX · AH · AL",
          text: "Aritmetik sonuçların toplandığı klasik register. MUL / DIV gibi bazı komutlar sonucu zorunlu olarak buraya koyar. Bir fonksiyon değer döndürecekse, o değer RAX'te bulunur.",
          abi: "Fonksiyonun dönüş değeri (hem Windows hem Linux)" },
        { n: "RBX", bits: 64, role: "Base (taban)", sub: "EBX · BX · BH · BL",
          text: "Eskiden taban adres tutardı, bugün genel amaçlı kullanılıyor. Çağrılan fonksiyon bunu kullanacaksa değerini korumak zorunda (callee-saved): işi bitince eski değeri geri koyar.",
          abi: "Korunan register (callee-saved)" },
        { n: "RCX", bits: 64, role: "Counter (sayaç)", sub: "ECX · CX · CH · CL",
          text: "Döngü sayacı ve kaydırma miktarı için kullanılır. REP önekli komutlar (toplu kopyalama) kaç kez tekrarlayacağını RCX'ten okur.",
          abi: "Windows: 1. argüman · Linux: 4. argüman" },
        { n: "RDX", bits: 64, role: "Data (veri)", sub: "EDX · DX · DH · DL",
          text: "Çarpma ve bölmede ikinci yarıyı taşır: 64 bit × 64 bit çarpımın sonucu 128 bit olur ve RDX:RAX çiftine yazılır. Eski I/O port komutlarında port numarası da RDX'te.",
          abi: "Windows: 2. argüman · Linux: 3. argüman" },
        { n: "RSI", bits: 64, role: "Source index (kaynak)", sub: "ESI · SI · SIL",
          text: "Toplu bellek kopyalamalarında kaynak adresi tutar (MOVS gibi komutlar RSI'dan okuyup RDI'ya yazar).",
          abi: "Linux: 2. argüman" },
        { n: "RDI", bits: 64, role: "Destination index (hedef)", sub: "EDI · DI · DIL",
          text: "Toplu kopyalamalarda hedef adresi tutar. Linux'ta fonksiyona verilen ilk argüman bu register'la gelir.",
          abi: "Linux: 1. argüman" },
        { n: "RBP", bits: 64, role: "Base pointer (çerçeve tabanı)", sub: "EBP · BP · BPL",
          text: "Bir fonksiyonun yığın çerçevesinin (stack frame) tabanını gösterir. Yerel değişkenlere \"RBP'den şu kadar aşağıda\" diye erişilir. Bazı derleyiciler optimizasyon için bunu genel amaçlı kullanır.",
          abi: "Korunan register (callee-saved)" },
        { n: "RSP", bits: 64, role: "Stack pointer (yığın göstergesi)", sub: "ESP · SP · SPL",
          text: "Yığının en üstünü gösterir. PUSH, POP, CALL ve RET komutları RSP'yi otomatik günceller. Yığın aşağı doğru büyür, yani PUSH'ta RSP azalır. Aşağıdaki stack demosunda kendin görebilirsin.",
          abi: "Sürekli değişir, elle bozarsan program çöker" },
        { n: "R8 – R15", bits: 64, role: "Ek 8 register (x86-64 ile geldi)", sub: "R8D · R8W · R8B (R9..R15 için de aynı)",
          text: "32 bit çağının 8 register'ı yetmeyince x86-64 ile 8 tane daha eklendi. Bunların eski isimleri yok, sadece numara var. Sonek D, W, B sırasıyla 32, 16 ve 8 bit alt parçayı gösterir.",
          abi: "R8, R9: argüman geçişi · R12–R15: korunan register" }
      ]
    },
    {
      id: "special", name: "Özel amaçlı", items: [
        { n: "RIP", bits: 64, role: "Instruction pointer (Program Counter)", sub: "EIP · IP",
          text: "Sıradaki komutun bellekteki adresi. Komut döngüsündeki PC'nin gerçek adı. MOV ile doğrudan yazamazsın; sadece JMP, CALL, RET gibi komutlarla ya da kesmelerle değişir. RIP'i kontrol eden, programın nereye gideceğini kontrol eder (güvenlik açıklarının hedefi de bu yüzden RIP).",
          abi: "Program akışının kendisi" },
        { n: "RFLAGS", bits: 64, role: "Bayrak register'ı", sub: "EFLAGS · FLAGS",
          text: "Tek bitlik bayrakların toplandığı register: CF (elde), ZF (sıfır), SF (işaret), OF (taşma), PF, AF gibi durum bayrakları ile IF (kesmeler açık mı), DF (yön) gibi kontrol bayrakları. Bir önceki demoda ZF, SF, CF ve OF'u canlı görebilirsin.",
          abi: "ALU her işlemden sonra günceller" }
      ]
    },
    {
      id: "seg", name: "Segment", items: [
        { n: "CS", bits: 16, role: "Code segment", sub: "",
          text: "Kodun bulunduğu bölgeyi seçer. Aynı zamanda işlemcinin o anki ayrıcalık seviyesini (kernel mi, kullanıcı mı) da CS'in düşük bitleri taşır." , abi: "" },
        { n: "DS · ES · SS", bits: 16, role: "Data / Extra / Stack segment", sub: "",
          text: "Eski 16 bit modunda bellek bu segmentlere bölünürdü. 64 bit modda bunların çoğu \"taban 0\" kabul edilir ve etkisiz kalır; bellek yassı (flat) bir bütün gibi görünür.", abi: "" },
        { n: "FS · GS", bits: 16, role: "Ek segmentler, hâlâ canlı", sub: "",
          text: "Bunlar 64 bit modda bile kullanılıyor: işletim sistemi bunların tabanını thread'e özel verilere işaret ettirir. Windows'ta GS thread bilgi bloğuna (TEB), Linux'ta FS thread-local storage'a bakar.", abi: "" }
      ]
    },
    {
      id: "sys", name: "Kontrol / sistem", items: [
        { n: "CR0", bits: 64, role: "Kontrol register'ı 0", sub: "",
          text: "İşlemcinin ana modlarını açan kapatan bitler: PE (korumalı mod) ve PG (sayfalama / sanal bellek) burada.", abi: "" },
        { n: "CR2", bits: 64, role: "Page fault adresi", sub: "",
          text: "Program bellekte olmayan bir adrese dokununca (page fault) hatalı adres buraya yazılır; işletim sistemi bakıp gerekli sayfayı diskten getirir.", abi: "" },
        { n: "CR3", bits: 64, role: "Sayfa tablosu tabanı", sub: "",
          text: "Şu an çalışan programın sanal→fiziksel adres çeviri tablosunun yerini gösterir. İşletim sistemi bir programdan diğerine geçerken (context switch) CR3'ü değiştirir; her program kendi \"sanal dünyasını\" böyle görür.", abi: "" },
        { n: "CR4 · DR0–DR7", bits: 64, role: "Ek özellikler + hata ayıklama", sub: "",
          text: "CR4 ek özellik bitlerini (PAE, SIMD desteği, SMEP / SMAP gibi güvenlik korumaları) taşır. DR0–DR7 debugger'ların donanım breakpoint'i koymasını sağlar.", abi: "" }
      ]
    },
    {
      id: "simd", name: "Vektör / FPU", items: [
        { n: "XMM0 – XMM15", bits: 128, role: "SSE vektör register'ları", sub: "",
          text: "128 bit genişliğinde. İçine 4 tane float, 2 tane double ya da 16 bayt sığar. Tek komutla hepsi birden işlenir (SIMD: tek komut, çok veri). Ondalıklı sayılar da artık bunlarla işleniyor.", abi: "Ondalıklı argüman ve dönüş değerleri" },
        { n: "YMM0 – YMM15", bits: 256, role: "AVX / AVX2", sub: "",
          text: "256 bit. XMM'ler, YMM'lerin alt yarısıdır (tıpkı EAX'in RAX'in alt yarısı olması gibi). 8 float'ı aynı anda toplayabilirsin.", abi: "" },
        { n: "ZMM0 – ZMM31", bits: 512, role: "AVX-512", sub: "",
          text: "512 bit, üstelik 32 tane. YMM'nin üst yarısıdır. Yapay zekâ, bilimsel hesap ve video kodlamada büyük fark yaratır ama bol ısı da üretir.", abi: "" },
        { n: "ST0 – ST7", bits: 80, role: "x87 FPU yığını (eski)", sub: "",
          text: "Çok eski ondalıklı sayı birimi. 80 bit genişliğinde, yığın gibi çalışır. Yeni kodlar SSE / AVX kullandığı için bunlar artık nadiren görülür ama geriye dönük uyum için hâlâ çipte.", abi: "" }
      ]
    }
  ];

  const tabsEl = $("reg-tabs"), chipsEl = $("reg-chips"), detailEl = $("reg-detail");
  if (tabsEl && chipsEl && detailEl) {
    let cat = 0, item = 0;
    const renderTabs = function () {
      tabsEl.innerHTML = CATS.map(function (c, i) {
        return '<button class="tab' + (i === cat ? " active" : "") + '" data-i="' + i + '">' + c.name + "</button>";
      }).join("");
    };
    const renderChips = function (animate) {
      chipsEl.innerHTML = CATS[cat].items.map(function (r, i) {
        return '<button class="rchip' + (i === item ? " sel" : "") + '" data-i="' + i + '"><b>' + r.n + "</b><small>" + r.bits + " bit</small></button>";
      }).join("");
      if (animate && hasG) gsap.from(chipsEl.children, { y: 16, opacity: 0, scale: 0.9, duration: 0.4, stagger: 0.04, ease: "back.out(1.6)" });
    };
    const renderDetail = function (animate) {
      const r = CATS[cat].items[item];
      detailEl.innerHTML =
        "<h3>" + r.n + ' <span class="badge">' + r.bits + " bit</span></h3>" +
        '<p class="role">' + r.role + "</p><p>" + r.text + "</p>" +
        (r.sub || r.abi ? '<dl class="kv">' +
          (r.sub ? "<dt>Alt parçaları</dt><dd>" + r.sub + "</dd>" : "") +
          (r.abi ? "<dt>Kullanımı</dt><dd>" + r.abi + "</dd>" : "") + "</dl>" : "");
      if (animate && hasG) gsap.fromTo(detailEl.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" });
    };
    tabsEl.addEventListener("click", function (e) {
      const b = e.target.closest(".tab");
      if (!b) return;
      cat = +b.dataset.i; item = 0;
      renderTabs(); renderChips(true); renderDetail(true);
    });
    chipsEl.addEventListener("click", function (e) {
      const b = e.target.closest(".rchip");
      if (!b) return;
      item = +b.dataset.i;
      chipsEl.querySelectorAll(".rchip").forEach(function (c, i) { c.classList.toggle("sel", i === item); });
      renderDetail(true);
    });
    renderTabs(); renderChips(false); renderDetail(false);
  }

  /* =========================================================
     2) RAX'in içi
     ========================================================= */
  const bitsHost = $("bits64");
  if (bitsHost && typeof BigInt !== "undefined") {
    const MASK = 0xFFFFFFFFFFFFFFFFn;
    const INIT = 0x1122334455667788n;
    let rax = INIT;
    let alias = { name: "RAX", lo: 0, hi: 63 };
    const ALIASES = [
      { name: "RAX", lo: 0, hi: 63 }, { name: "EAX", lo: 0, hi: 31 }, { name: "AX", lo: 0, hi: 15 },
      { name: "AH", lo: 8, hi: 15 }, { name: "AL", lo: 0, hi: 7 }
    ];
    const OPS = [
      { label: "MOV AL, 0xAB", f: function () { return (rax & ~0xFFn) | 0xABn; },
        note: "<b>AL</b>'ye yazmak sadece alt 8 biti değiştirir. Kalan 56 bit olduğu gibi kalır." },
      { label: "MOV AH, 0xCD", f: function () { return (rax & ~0xFF00n) | (0xCDn << 8n); },
        note: "<b>AH</b>, AX'in üst baytıdır (bit 8–15). Sadece o 8 bit değişti." },
      { label: "MOV AX, 0xBEEF", f: function () { return (rax & ~0xFFFFn) | 0xBEEFn; },
        note: "16 bitlik yazma alt 16 biti değiştirir, üstteki 48 bit korunur." },
      { label: "MOV EAX, 0x12345678", f: function () { return 0x12345678n; },
        note: "<b>Dikkat, tuzak!</b> 32 bitlik yazma (EAX) üst 32 biti <b>sıfırlar</b>. x86-64'te bu kural var: 32 bit yazma 64 bite sıfırla genişler. 8 ve 16 bitlik yazmalarda böyle bir şey olmaz." },
      { label: "MOV RAX, 0xDEADBEEFCAFEBABE", f: function () { return 0xDEADBEEFCAFEBABEn; },
        note: "64 bitlik yazma register'ın tamamını değiştirir." },
      { label: "Başa dön", f: function () { return INIT; }, note: "RAX ilk değerine döndü: 0x1122334455667788." }
    ];

    // 64 bit'i 8 bayta böl (sol: en anlamlı bayt)
    let html = "";
    for (let b = 7; b >= 0; b--) {
      html += '<div class="byte"><div class="bl">bayt ' + b + '</div><div class="bitrow">';
      for (let k = 7; k >= 0; k--) html += '<span class="bit" data-i="' + (b * 8 + k) + '">0</span>';
      html += '</div><div class="hex" data-b="' + b + '">00</div></div>';
    }
    bitsHost.innerHTML = html;
    const bitEls = [];
    bitsHost.querySelectorAll(".bit").forEach(function (el) { bitEls[+el.dataset.i] = el; });
    const hexEls = [];
    bitsHost.querySelectorAll(".hex").forEach(function (el) { hexEls[+el.dataset.b] = el; });

    const hex = function (v, digits) { return "0x" + v.toString(16).toUpperCase().padStart(digits, "0"); };

    const paint = function (prev) {
      const changed = [];
      for (let i = 0; i < 64; i++) {
        const on = ((rax >> BigInt(i)) & 1n) === 1n;
        const el = bitEls[i];
        el.textContent = on ? "1" : "0";
        el.classList.toggle("one", on);
        el.classList.toggle("sel", i >= alias.lo && i <= alias.hi);
        if (prev !== null && (((prev ^ rax) >> BigInt(i)) & 1n) === 1n) changed.push(el);
      }
      for (let b = 0; b < 8; b++) hexEls[b].textContent = ((rax >> BigInt(b * 8)) & 0xFFn).toString(16).toUpperCase().padStart(2, "0");
      const width = alias.hi - alias.lo + 1;
      const v = (rax >> BigInt(alias.lo)) & ((1n << BigInt(width)) - 1n);
      $("alias-out").innerHTML = "<b>" + alias.name + "</b> = " + hex(v, width / 4) + " <span class=\"muted\">(" + v.toString(10) + ")</span>";
      if (hasG && changed.length) {
        gsap.fromTo(changed, { scale: 1.7, backgroundColor: "#fbbf24", color: "#06101f" },
          { scale: 1, duration: 0.9, ease: "elastic.out(1,.5)", stagger: { each: 0.012, from: "end" }, clearProps: "backgroundColor,color,scale" });
      }
    };

    $("alias-tabs").innerHTML = ALIASES.map(function (a, i) {
      return '<button class="tab' + (i === 0 ? " active" : "") + '" data-i="' + i + '">' + a.name + "</button>";
    }).join("");
    $("alias-tabs").addEventListener("click", function (e) {
      const b = e.target.closest(".tab");
      if (!b) return;
      alias = ALIASES[+b.dataset.i];
      $("alias-tabs").querySelectorAll(".tab").forEach(function (t, i) { t.classList.toggle("active", i === +b.dataset.i); });
      paint(null);
    });

    $("rax-ops").innerHTML = OPS.map(function (o, i) {
      return '<button class="btn sm' + (i === OPS.length - 1 ? " ghost" : "") + '" data-i="' + i + '"><span class="mono">' + o.label + "</span></button>";
    }).join("");
    $("rax-note").innerHTML = "Bir <code>MOV</code> komutu seç ve hangi bitlerin sarı yanıp söndüğüne bak.";
    $("rax-ops").addEventListener("click", function (e) {
      const b = e.target.closest("button");
      if (!b) return;
      const op = OPS[+b.dataset.i];
      const prev = rax;
      rax = op.f() & MASK;
      $("rax-note").innerHTML = "<code>" + op.label + "</code><br>" + op.note;
      paint(prev);
    });
    paint(null);
  }

  /* =========================================================
     3) Mini ALU + bayraklar
     ========================================================= */
  const aluView = $("alu-view");
  if (aluView) {
    const A = $("alu-a"), B = $("alu-b"), OP = $("alu-op");
    const sg = function (x) { return x > 127 ? x - 256 : x; };
    const bin = function (n) { return n.toString(2).padStart(8, "0"); };
    const clampv = function (el) {
      let v = parseInt(el.value, 10);
      if (isNaN(v)) v = 0;
      return Math.max(0, Math.min(255, v));
    };
    const PRESETS = [
      { t: "200 + 100 → CF", a: 200, b: 100, op: "ADD" },
      { t: "127 + 1 → OF", a: 127, b: 1, op: "ADD" },
      { t: "5 − 5 → ZF", a: 5, b: 5, op: "SUB" },
      { t: "3 − 5 → SF", a: 3, b: 5, op: "SUB" },
      { t: "CMP 7, 9 (if a < b)", a: 7, b: 9, op: "CMP" }
    ];
    $("alu-presets").innerHTML = PRESETS.map(function (p, i) {
      return '<button class="btn sm ghost" data-i="' + i + '">' + p.t + "</button>";
    }).join("");
    $("alu-presets").addEventListener("click", function (e) {
      const b = e.target.closest("button");
      if (!b) return;
      const p = PRESETS[+b.dataset.i];
      A.value = p.a; B.value = p.b; OP.value = p.op;
      calc();
    });

    const FLAGS = ["ZF", "SF", "CF", "OF"];
    const FNAMES = { ZF: "Zero (sıfır)", SF: "Sign (işaret)", CF: "Carry (elde)", OF: "Overflow (taşma)" };
    $("alu-flags").innerHTML = FLAGS.map(function (f) {
      return '<div class="flag-card" id="fl-' + f + '"><div class="top"><span class="nm">' + f + '</span><span class="v">0</span></div><div class="ttl">' + FNAMES[f] + '</div><small></small></div>';
    }).join("");
    const prevFlags = {};

    const JUMPS = [
      { n: "JE / JZ", d: "eşit", f: function (F) { return F.ZF; } },
      { n: "JNE / JNZ", d: "eşit değil", f: function (F) { return !F.ZF; } },
      { n: "JB / JC", d: "işaretsiz küçük", f: function (F) { return F.CF; } },
      { n: "JAE / JNC", d: "işaretsiz büyük-eşit", f: function (F) { return !F.CF; } },
      { n: "JA", d: "işaretsiz büyük", f: function (F) { return !F.CF && !F.ZF; } },
      { n: "JBE", d: "işaretsiz küçük-eşit", f: function (F) { return F.CF || F.ZF; } },
      { n: "JL", d: "işaretli küçük", f: function (F) { return F.SF !== F.OF; } },
      { n: "JGE", d: "işaretli büyük-eşit", f: function (F) { return F.SF === F.OF; } },
      { n: "JG", d: "işaretli büyük", f: function (F) { return !F.ZF && F.SF === F.OF; } },
      { n: "JLE", d: "işaretli küçük-eşit", f: function (F) { return F.ZF || F.SF !== F.OF; } }
    ];

    const calc = function () {
      const a = clampv(A), b = clampv(B), op = OP.value;
      let res, CF = 0, OF = 0, why = {};
      if (op === "ADD") {
        const r = a + b; res = r & 255; CF = r > 255 ? 1 : 0;
        const t = sg(a) + sg(b); OF = (t < -128 || t > 127) ? 1 : 0;
        why.CF = CF ? "A + B = " + r + ", 255'i aştı, 8 bite sığmadı → elde oluştu." : "A + B = " + r + ", 8 bite sığdı → elde yok.";
        why.OF = OF ? "İşaretli düşünürsen " + sg(a) + " + " + sg(b) + " = " + t + ", −128…127 aralığının dışında." : "İşaretli sonuç (" + t + ") −128…127 içinde.";
      } else if (op === "SUB" || op === "CMP") {
        const r = a - b; res = r & 255; CF = a < b ? 1 : 0;
        const t = sg(a) - sg(b); OF = (t < -128 || t > 127) ? 1 : 0;
        why.CF = CF ? "A < B (işaretsiz), çıkarmada borç (borrow) gerekti → CF = 1." : "A ≥ B (işaretsiz), borç gerekmedi.";
        why.OF = OF ? "İşaretli düşünürsen " + sg(a) + " − " + sg(b) + " = " + t + ", aralık dışı." : "İşaretli sonuç (" + t + ") aralık içinde.";
      } else {
        res = op === "AND" ? (a & b) : op === "OR" ? (a | b) : (a ^ b);
        why.CF = "Mantıksal işlemlerde CF her zaman 0'lanır.";
        why.OF = "Mantıksal işlemlerde OF her zaman 0'lanır.";
      }
      const ZF = res === 0 ? 1 : 0, SF = (res >> 7) & 1;
      why.ZF = ZF ? "Sonuç tam olarak 0." : "Sonuç 0 değil (" + res + ").";
      why.SF = SF ? "Sonucun en soldaki biti 1 → işaretli olarak negatif (" + sg(res) + ")." : "En soldaki bit 0 → işaretli olarak sıfır ya da pozitif.";
      const flags = { ZF: ZF, SF: SF, CF: CF, OF: OF };

      const sym = { ADD: "+", SUB: "−", CMP: "−", AND: "AND", OR: "OR", XOR: "XOR" }[op];
      const row = function (lab, n, cls) {
        return '<div class="binrow ' + (cls || "") + '"><span class="lab">' + lab + '</span><span class="digits">' + bin(n).replace(/(\d{4})(\d{4})/, "$1 $2") + '</span><span class="dec">' + n + " · işaretli " + sg(n) + "</span></div>";
      };
      aluView.innerHTML = row("A", a) + row("B", b) + '<div class="binline">' + sym + "</div>" +
        row(op === "CMP" ? "fark" : "sonuç", res, "res") +
        (op === "CMP" ? '<p class="demo-note" style="margin-top:6px">CMP sonucu saklamaz, sadece bayrakları günceller. Yani <code>if (a &lt; b)</code> aslında bir CMP ve ardından bayraklara bakan bir atlamadır.</p>' : "");

      FLAGS.forEach(function (f) {
        const card = $("fl-" + f);
        card.classList.toggle("on", !!flags[f]);
        card.querySelector(".v").textContent = flags[f];
        card.querySelector("small").textContent = why[f];
        if (hasG && prevFlags[f] !== undefined && prevFlags[f] !== flags[f]) {
          gsap.fromTo(card, { scale: 1.09 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,.45)" });
        }
        prevFlags[f] = flags[f];
      });

      const F = { ZF: !!ZF, SF: !!SF, CF: !!CF, OF: !!OF };
      $("alu-jumps").innerHTML = JUMPS.map(function (j) {
        return '<span class="jchip' + (j.f(F) ? " take" : "") + '" title="' + j.d + '">' + j.n + '<small>' + j.d + "</small></span>";
      }).join("");
      $("alu-jump-note").textContent = (op === "SUB" || op === "CMP")
        ? "Yeşil olanlar bu bayraklarla \"atlar\". JB/JA gibi olanlar işaretsiz sayılar (örn. bellek adresi), JL/JG gibi olanlar işaretli sayılar içindir."
        : "Şartlı atlamalar en çok CMP'den sonra kullanılır. Yukarıdan CMP'yi seçip A ve B'yi değiştirmeyi dene.";
    };
    [A, B, OP].forEach(function (el) { el.addEventListener("input", calc); });
    calc();
  }

  /* =========================================================
     4) Stack demosu
     ========================================================= */
  const memEl = $("stack-mem");
  if (memEl) {
    const SLOTS = 8, BASE = 0x1040;
    const VALUES = [0x2A, 0x10, 0xFF, 0x07, 0x63, 0xC8, 0x51, 0x9D];
    let stack, rsp, rip, vi;
    const cells = [];
    const hx = function (v, d) { return "0x" + v.toString(16).toUpperCase().padStart(d || 4, "0"); };

    let html = '<div class="scell base"><span class="ad">' + hx(BASE) + '</span><span>taban (yığının başlangıcı)</span></div>';
    for (let i = 0; i < SLOTS; i++) {
      html += '<div class="scell" data-i="' + i + '"><span class="ad">' + hx(BASE - 8 * (i + 1)) + '</span><span class="val">boş</span></div>';
    }
    html += '<div class="rsp-arrow" id="rsp-arrow">RSP ➜</div>';
    memEl.innerHTML = html;
    memEl.querySelectorAll(".scell[data-i]").forEach(function (c) { cells[+c.dataset.i] = c; });
    const arrow = $("rsp-arrow"), noteEl = $("st-note");

    const pitch = function () {
      const all = memEl.querySelectorAll(".scell");
      return all[1].offsetTop - all[0].offsetTop;
    };
    const moveArrow = function (instant) {
      const y = stack.length * pitch();
      if (hasG && !instant) gsap.to(arrow, { y: y, duration: 0.45, ease: "back.out(1.7)" });
      else if (hasG) gsap.set(arrow, { y: y });
      else arrow.style.transform = "translateY(" + y + "px)";
    };
    const regs = function () {
      $("st-rsp").textContent = hx(rsp);
      $("st-rip").textContent = hx(rip);
      if (hasG) {
        gsap.fromTo($("st-rsp").parentNode, { scale: 1.08 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,.5)" });
      }
    };
    const fillCell = function (i) {
      const s = stack[i];
      cells[i].classList.add("full");
      cells[i].classList.toggle("ret", s.kind === "ret");
      cells[i].querySelector(".val").textContent = s.kind === "ret" ? "dönüş adresi " + hx(s.v) : hx(s.v, 2) + " (veri)";
      if (hasG) gsap.fromTo(cells[i], { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
    };
    const clearCell = function (i) {
      cells[i].classList.remove("full", "ret");
      cells[i].querySelector(".val").textContent = "boş";
    };
    const say = function (t) { noteEl.innerHTML = t; };
    const shake = function () { if (hasG) gsap.fromTo(memEl, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1,.2)" }); };

    const push = function (kind, v) {
      if (stack.length >= SLOTS) { say("💥 <b>Stack overflow!</b> Yığın doldu, daha fazla yer yok. Sonsuz özyineleme (bir fonksiyonun kendini durmadan çağırması) tam olarak böyle çöker."); shake(); return false; }
      stack.push({ kind: kind, v: v });
      rsp -= 8;
      fillCell(stack.length - 1);
      moveArrow(); regs();
      return true;
    };
    const pop = function () {
      if (!stack.length) { say("⚠️ Yığın boş: <b>stack underflow</b>. Olmayan bir şeyi almaya çalıştın."); shake(); return null; }
      const s = stack.pop();
      clearCell(stack.length);
      rsp += 8;
      moveArrow(); regs();
      return s;
    };

    $("st-push").addEventListener("click", function () {
      const v = VALUES[vi++ % VALUES.length];
      if (push("data", v)) say("<code>PUSH " + hx(v, 2) + "</code> → önce RSP 8 azaldı (" + hx(rsp) + "), sonra değer o adrese yazıldı.");
    });
    $("st-pop").addEventListener("click", function () {
      const s = pop();
      if (s) say("<code>POP</code> → üstteki değer (" + (s.kind === "ret" ? hx(s.v) : hx(s.v, 2)) + ") okundu, RSP 8 arttı (" + hx(rsp) + "). Hücre silinmedi aslında, sadece \"artık sahipsiz\" sayıldı; demoda görsel olarak boşalttık.");
    });
    $("st-call").addEventListener("click", function () {
      const ret = rip + 5; // CALL komutu 5 bayt
      if (push("ret", ret)) { rip = 0x5000; regs(); say("<code>CALL 0x5000</code> → dönüş adresi (" + hx(ret) + ") yığına atıldı ve RIP fonksiyonun başına (0x5000) atladı. Fonksiyon bitince nereye döneceğini yığından bilecek."); }
    });
    $("st-ret").addEventListener("click", function () {
      const s = pop();
      if (!s) return;
      if (s.kind === "ret") { rip = s.v; regs(); say("<code>RET</code> → yığından dönüş adresi çekildi, RIP ← " + hx(s.v) + ". Program kaldığı yerden devam ediyor."); }
      else { rip = 0xDEAD; regs(); say("😱 <code>RET</code> yığından bir <b>veri</b> (" + hx(s.v, 2) + ") çekti ve onu adres sandı! RIP saçma bir yere gitti. Yığın dengesi bozulunca programlar böyle çöker (güvenlik açıkları da buradan çıkar)."); }
    });
    const reset = function () {
      stack = []; rsp = BASE; rip = 0x4010; vi = 0;
      cells.forEach(function (c, i) { clearCell(i); });
      moveArrow(true); regs();
      say("PUSH veya CALL'a bas. Yığının dolduğunu görene kadar devam et 😄");
    };
    $("st-reset").addEventListener("click", reset);
    reset();
    window.addEventListener("resize", function () { moveArrow(true); });
  }
})();
