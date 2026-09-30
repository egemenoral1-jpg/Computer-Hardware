/* Anakart sayfası: hero çizimi, tıklanabilir harita, PCIe hat bütçesi, açılış adımları */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };

  /* =========================================================
     Anakart çizimi (hem hero hem harita)
     ========================================================= */
  function boardSVG(interactive) {
    const lb = function (x, y, t) { return interactive ? '<text class="lb" x="' + x + '" y="' + y + '">' + t + "</text>" : ""; };
    const hs = function (k, inner) {
      return interactive
        ? '<g class="hs" data-k="' + k + '" tabindex="0" role="button" aria-label="' + INFO[k].t + '">' + inner + "</g>"
        : "<g>" + inner + "</g>";
    };
    const tr = [];
    for (let y = 130; y <= 210; y += 16) tr.push("M272 " + y + " H306");
    tr.push("M180 232 V290", "M212 232 V290", "M244 232 V290", "M272 226 H352 L392 330", "M382 365 H172", "M452 350 H478 V228", "M132 170 H148", "M180 80 V108", "M240 80 V108", "M250 263 H300");
    const traces = tr.map(function (d) { return '<path class="tr" d="' + d + '"/>'; }).join("");

    let ram = "";
    for (let i = 0; i < 4; i++) ram += '<rect class="ram" x="' + (306 + i * 22) + '" y="44" width="16" height="190" rx="3"/>';

    const dots = ["M272 130 H306", "M212 232 V290", "M272 226 H352 L392 330", "M382 365 H172"].map(function (p, i) {
      return '<circle class="dotp" r="2.6"><animateMotion dur="' + (1.6 + i * 0.4) + 's" repeatCount="indefinite" path="' + p + '"/></circle>';
    }).join("");

    return '<svg viewBox="0 0 500 500" role="img"' + (interactive ? "" : ' class="deco"') + ">" +
      '<rect class="pcb" x="14" y="14" width="472" height="472" rx="16"/>' +
      '<g class="traces">' + traces + "</g>" +
      hs("io", '<rect class="comp io" x="24" y="44" width="62" height="160" rx="6"/>' + lb(55, 128, "I/O")) +
      hs("vrm", '<rect class="comp heat" x="96" y="44" width="170" height="34" rx="6"/><rect class="comp heat" x="96" y="44" width="34" height="150" rx="6"/>' + lb(181, 65, "VRM")) +
      hs("eps", '<rect class="comp con" x="110" y="24" width="70" height="12" rx="2"/>' + lb(145, 20, "8-pin CPU")) +
      hs("fan", '<rect class="comp con" x="200" y="88" width="20" height="10" rx="2"/>' + lb(210, 84, "FAN")) +
      hs("cpu", '<rect class="socket" x="148" y="108" width="124" height="124" rx="8"/><rect class="cpu" x="164" y="124" width="92" height="92" rx="6"/>' + lb(210, 174, "CPU") + lb(210, 186, "soket")) +
      hs("ram", ram + lb(350, 254, "RAM (DIMM)")) +
      hs("atx24", '<rect class="comp con" x="452" y="50" width="22" height="104" rx="3"/>' + lb(463, 46, "24-pin")) +
      hs("sata", '<rect class="comp con" x="452" y="170" width="22" height="58" rx="3"/>' + lb(463, 240, "SATA")) +
      hs("m2", '<rect class="comp m2" x="150" y="256" width="100" height="14" rx="3"/>' + lb(200, 282, "M.2")) +
      hs("pcie", '<rect class="comp slot" x="50" y="292" width="300" height="16" rx="3"/><rect class="comp slot" x="50" y="326" width="120" height="10" rx="3"/><rect class="comp slot" x="50" y="350" width="120" height="10" rx="3"/><rect class="comp slot" x="50" y="374" width="200" height="10" rx="3"/>' + lb(200, 322, "PCIe x16 / x1 / x4")) +
      hs("chipset", '<rect class="comp heat" x="382" y="326" width="70" height="70" rx="8"/>' + lb(417, 366, "Chipset")) +
      hs("bios", '<rect class="comp chip" x="98" y="430" width="34" height="24" rx="3"/>' + lb(115, 468, "BIOS")) +
      hs("cmos", '<circle class="comp bat" cx="178" cy="442" r="17"/>' + lb(178, 468, "CMOS pil")) +
      hs("fp", '<rect class="comp con" x="286" y="446" width="150" height="16" rx="3"/>' + lb(361, 474, "ön panel / USB başlıkları")) +
      (interactive ? "" : '<g class="dots">' + dots + "</g>") +
      "</svg>";
  }

  const INFO = {
    cpu: { t: "CPU soketi", d: "İşlemcinin oturduğu yuva. Soketin türü, hangi işlemcilerin takılabileceğini belirler. Üstüne işlemci, onun da üstüne soğutucu gelir. Anakartın en önemli noktası: diğer bütün yollar buraya çıkar.", a: "Şehrin belediye binası: bütün ana yollar buraya çıkar.", f: ["Intel'de LGA (pinler anakartta), AMD AM4'te PGA (pinler işlemcide), AM5'te LGA.", "İşlemci sayfasında içinde neler döndüğünü görebilirsin."] },
    ram: { t: "RAM yuvaları (DIMM)", d: "Genelde 2 ya da 4 yuva bulunur. Çubuğun çentiği yuvadaki çıkıntıya uymalı, uymuyorsa yanlış nesil RAM'sin. Dual channel için çubukları doğru yuvalara takmak gerekir (genelde 2. ve 4. yuva).", a: "Yakın depo: işlemcinin masasına en kısa yolla bağlı.", f: ["RAM'in hızı ve türü (DDR4/DDR5) işlemciye ve anakarta bağlıdır.", "RAM sayfasında dual channel'ı anlatıyoruz."] },
    pcie: { t: "PCIe yuvaları", d: "Ekran kartı, ağ kartı, ses kartı, yakalama kartı gibi genişleme kartları buraya takılır. En uzun yuva (x16) ekran kartı içindir. Dikkat: yuvanın uzunluğu her zaman hızını göstermez; bazı uzun yuvalar arka planda sadece x4 hatla çalışır.", a: "Otoyol girişleri: kaç şerit varsa o kadar veri akar.", f: ["Ekran kartı genelde doğrudan işlemcinin PCIe hatlarına bağlanır.", "Hatların nasıl paylaşıldığını aşağıdaki demoda deneyebilirsin."] },
    m2: { t: "M.2 yuvası", d: "NVMe (ve bazen SATA) SSD'lerin takıldığı ince yuva. SSD yatay olarak yerleşir ve tek bir vidayla sabitlenir. Birçok anakartta üzerine SSD'yi soğutan bir ısı emici de gelir.", a: "Depo ile işlemci arasında hızlı bir asansör.", f: ["Bir M.2 yuvası her zaman NVMe desteklemez, kılavuza bak.", "Depolama sayfasında NVMe ile SATA farkını anlattık."] },
    chipset: { t: "Chipset", d: "İşlemcinin doğrudan yönetmediği ek bağlantıları toplar: ek USB, SATA, PCIe hatları, ağ, ses. İşlemciye tek bir hızlı bağlantıyla (DMI/PCIe) bağlıdır. Hangi özelliklerin sunulduğunu (hız aşırtma, USB sayısı, hat sayısı) chipset belirler.", a: "Yardımcı kavşak: ana yola çıkmadan önce küçük yollar burada birleşir.", f: ["Chipset'in yukarı bağlantısı sınırlıdır, yani arkasındaki cihazlar bant genişliğini paylaşır.", "Yeni nesil chipset'ler ısınabildiği için üstünde soğutucu bulunur."] },
    vrm: { t: "VRM (voltaj düzenleyici modül)", d: "Güç kaynağından gelen 12 V'u işlemcinin ihtiyacı olan yaklaşık 1 V'a düşürür. Bu sırada yüzlerce amper akım geçer. Bobinler, kondansatörler ve MOSFET'lerden oluşur ve çalışırken ısınır, o yüzden üstünde soğutucu olur.", a: "Trafo merkezi: yüksek voltajı evlerin kullanabileceği seviyeye indirir.", f: ["Güçlü işlemci + zayıf VRM = ısınma ve kararsızlık.", "Faz sayısı ne kadar çoksa yük o kadar dağılır."] },
    atx24: { t: "24 pin ATX güç girişi", d: "Anakartın ana güç girişi. Güç kaynağından gelen kalın kablo demeti buraya takılır. 3,3 V, 5 V ve 12 V hatlarının yanında \"aç\" ve \"güç tamam\" gibi kontrol sinyalleri de bu konnektörden geçer.", a: "Ana elektrik girişi: şehrin şebeke bağlantısı.", f: ["Güç kaynağı sayfasında kablo türlerini göreceksin.", "Tam oturmadan bilgisayar açılmaz."] },
    eps: { t: "8 pin CPU (EPS) güç girişi", d: "Sadece işlemciye giden ek güç. İşlemci çok akım çektiği için 24 pin yetmez. Güçlü işlemcilerde 8+4 pin ya da çift 8 pin bulunur.", a: "Belediye binasına giden ayrı, kalın bir elektrik hattı.", f: ["Ekran kartı gücü (PCIe 8 pin) ile karıştırma; kablo şekilleri benzer ama farklı!", "Unutulursa bilgisayar açılmaz."] },
    sata: { t: "SATA portları", d: "HDD, 2,5\" SATA SSD ya da optik sürücü bu portlara veri kablosuyla bağlanır. Güç ayrıca güç kaynağından SATA güç kablosuyla gelir. Kart üzerindeki bazı M.2 yuvalarını kullanırsan bir SATA portu devre dışı kalabilir.", a: "Eski usul kargo hattı: iş görür, ama yavaş.", f: ["Yaklaşık 550 MB/s ile sınırlıdır.", "Anakart kılavuzu port paylaşımlarını gösterir."] },
    bios: { t: "BIOS / UEFI çipi", d: "Anakartın kendi flash belleği. Açılışta işlemci ilk komutunu buradan okur. Donanımı başlatan, ayar menüsünü sunan ve işletim sistemini bulup çağıran yazılım burada yaşar. Güncelleme (flash) yapılabilir.", a: "Şehrin açılış töreni yönergesi: her sabah önce bunu okurlar.", f: ["Bazı anakartlarda BIOS Flashback ile işlemci takılı olmadan da güncelleme yapılır.", "Güncelleme sırasında elektriği kesme!"] },
    cmos: { t: "CMOS pili (CR2032)", d: "Küçük bir 3 V pil. Bilgisayar prizden çekiliyken saati ve BIOS ayarlarını hafızada tutar. Piller yıllar sonra biter; saat sürekli sıfırlanıyorsa ya da ayarlar kayboluyorsa suçlu genelde budur.", a: "Anakartın cep saati.", f: ["Piliyi çıkarıp takmak BIOS ayarlarını sıfırlar (CMOS clear).", "Değiştirmek için özel bir şey gerekmez, marketten bulunur."] },
    io: { t: "Arka panel (I/O)", d: "USB, ağ (Ethernet), ses jakları ve ekran çıkışları. Dikkat: ayrı bir ekran kartın varsa monitörünü anakartın çıkışına değil ekran kartının çıkışına bağla, yoksa görüntü dahili grafikten gelir.", a: "Şehrin giriş kapıları.", f: ["İşlemcinin iGPU'su varsa anakartta HDMI/DP çıkışı bulunur.", "Bazı anakartlarda I/O kalkanı önceden takılıdır."] },
    fp: { t: "Ön panel ve USB başlıkları", d: "Kasanın güç düğmesi, reset düğmesi, LED'leri, ön USB portları ve ses girişi anakartın altındaki bu pin sıralarına takılır. Pin dizilimi karışabilir, en güvenlisi anakart kılavuzundaki şemaya bakmak.", a: "Kasanın kumanda paneli.", f: ["Güç düğmesi kablosunu yanlış takarsan bilgisayar açılmaz.", "Tek tek kablolar için küçük şemalar anakartın üstünde de basılıdır."] },
    fan: { t: "Fan başlığı", d: "Fanların takıldığı 3 ya da 4 pinlik konnektör. 4 pinlik olanlar (PWM) hızı ince ince ayarlar. CPU_FAN başlığı boş kalırsa çoğu anakart uyarı verip açılışta durur, çünkü işlemcinin soğutmasız çalışmasını istemez.", a: "Soğutma sisteminin elektrik prizi.", f: ["Soğutma sayfasında fan hızı ve sıcaklık ilişkisine bakacağız.", "Kasa fanları için ayrı SYS_FAN başlıkları vardır."] }
  };

  /* ---------- hero ve harita ---------- */
  const hero = $("board-hero");
  if (hero) hero.innerHTML = boardSVG(false);

  const map = $("board-map"), info = $("board-info");
  if (map && info) {
    map.innerHTML = boardSVG(true);
    function show(k) {
      const o = INFO[k];
      map.querySelectorAll(".hs").forEach(function (g) { g.classList.toggle("sel", g.dataset.k === k); });
      info.innerHTML = "<h3>" + o.t + "</h3><p>" + o.d + '</p><div class="analogy">💡 ' + o.a + "</div><ul>" +
        o.f.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
    }
    map.addEventListener("click", function (e) {
      const g = e.target.closest(".hs");
      if (g) show(g.dataset.k);
    });
    map.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest(".hs");
      if (g) { e.preventDefault(); show(g.dataset.k); }
    });
    show("cpu");
  }

  /* =========================================================
     PCIe hat bütçesi
     ========================================================= */
  const devsEl = $("ln-devs");
  if (devsEl) {
    const DEVS = [
      { id: "gpu", n: "Ekran kartı", x: 16, on: true },
      { id: "n1", n: "NVMe SSD #1", x: 4, on: true },
      { id: "n2", n: "NVMe SSD #2", x: 4, on: false },
      { id: "cap", n: "Yakalama kartı", x: 4, on: false },
      { id: "nic", n: "10G ağ kartı", x: 4, on: false }
    ];
    devsEl.innerHTML = DEVS.map(function (d, i) {
      return '<label class="ln-dev' + (d.on ? " on" : "") + '" data-i="' + i + '"><input type="checkbox"' + (d.on ? " checked" : "") + "> " + d.n + " <b>x" + d.x + "</b></label>";
    }).join("");
    const cpuSel = $("ln-cpu");

    function update() {
      let left = +cpuSel.value;
      const direct = [], chip = [];
      DEVS.forEach(function (d) {
        if (!d.on) return;
        if (left >= d.x) { direct.push(d); left -= d.x; } else chip.push(d);
      });
      const used = +cpuSel.value - left;
      $("ln-cpu-used").textContent = used + " / " + cpuSel.value + " hat kullanımda";
      const chipHtml = function (arr, cls) {
        return arr.length ? arr.map(function (d) { return '<span class="ln-pill ' + cls + '">x' + d.x + " " + d.n + "</span>"; }).join("") : '<span class="ln-empty">boş</span>';
      };
      $("ln-direct").innerHTML = chipHtml(direct, "d");
      $("ln-chip").innerHTML = chipHtml(chip, "c");
      const note = $("ln-note");
      if (!chip.length) {
        note.className = "callout mt1";
        note.innerHTML = "Hepsi işlemciye <b>doğrudan</b> bağlı: her cihaz tam hızda çalışır.";
      } else {
        const heavy = chip.filter(function (d) { return d.id === "n1" || d.id === "n2"; }).length;
        note.className = "callout fun mt1";
        note.innerHTML = "<b>" + chip.length + " cihaz chipset'in arkasında.</b> Bunlar tek bir x4'lük yukarı bağlantıyı paylaşır." +
          (heavy ? " Chipset'e bağlı bir NVMe SSD'yi başka cihazlarla aynı anda yoğun kullanırsan darboğaz oluşabilir." : "") +
          " Gerçek anakartlarda hangi yuvanın CPU'ya, hangisinin chipset'e bağlı olduğu kılavuzda yazar.";
      }
    }
    devsEl.addEventListener("change", function (e) {
      const l = e.target.closest(".ln-dev");
      DEVS[+l.dataset.i].on = e.target.checked;
      l.classList.toggle("on", e.target.checked);
      update();
    });
    cpuSel.addEventListener("change", update);
    update();
  }

  /* =========================================================
     Açılış süreci
     ========================================================= */
  const rail = $("boot-rail");
  if (rail) {
    const STEPS = [
      { t: "Güç düğmesine basıldı", d: "Anakart güç kaynağına \"aç\" sinyali (PS_ON) gönderir. Anakartın küçük bekleme devresi zaten 5 V standby ile uyanıktı." },
      { t: "Güç kaynağı voltajları verir", d: "Voltajlar oturunca güç kaynağı \"Power Good\" sinyali yollar. Bu gelmeden işlemci başlatılmaz." },
      { t: "İşlemci sıfırlanır", d: "CPU sıfırlanır ve ilk komutunu sabit bir adresten, yani BIOS/UEFI çipinden okur." },
      { t: "POST: kendi kendine test", d: "BIOS işlemciyi, RAM'i ve ekran kartını yoklar. Sorun varsa bip sesi veya hata kodu verip durur." },
      { t: "Donanım başlatılır", d: "PCIe cihazları, USB ve depolama aygıtları taranır. CMOS'taki ayarlar (RAM hızı, boot sırası, XMP) uygulanır." },
      { t: "Önyükleme aygıtı bulunur", d: "Boot sırasındaki ilk uygun disk seçilir; üzerindeki EFI bölümünden önyükleyici (bootloader) okunur." },
      { t: "İşletim sistemi yüklenir", d: "Önyükleyici işletim sistemi çekirdeğini SSD'den RAM'e yükler ve kontrolü ona verir. Artık Windows / Linux devrede." }
    ];
    let idx = -1, timer = null;
    rail.innerHTML = STEPS.map(function (s, i) {
      return '<li data-i="' + i + '"><span class="bn">' + (i + 1) + '</span><div><h4>' + s.t + "</h4><p>" + s.d + "</p></div></li>";
    }).join("");
    const items = rail.querySelectorAll("li");
    function render() {
      items.forEach(function (li, i) {
        li.classList.toggle("active", i === idx);
        li.classList.toggle("done", i < idx);
      });
      $("boot-next").disabled = idx >= STEPS.length - 1;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } $("boot-auto").textContent = "Otomatik oynat"; }
    $("boot-next").addEventListener("click", function () { stop(); if (idx < STEPS.length - 1) { idx++; render(); } });
    $("boot-auto").addEventListener("click", function () {
      if (timer) { stop(); return; }
      if (idx >= STEPS.length - 1) idx = -1;
      $("boot-auto").textContent = "Durdur";
      timer = setInterval(function () {
        if (idx < STEPS.length - 1) { idx++; render(); } else stop();
      }, 1800);
      if (idx < STEPS.length - 1) { idx++; render(); }
    });
    $("boot-reset").addEventListener("click", function () { stop(); idx = -1; render(); });
    rail.addEventListener("click", function (e) {
      const li = e.target.closest("li");
      if (li) { stop(); idx = +li.dataset.i; render(); }
    });
    render();
  }
})();
