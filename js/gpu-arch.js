/* GPU mimarisi: tüm kart + tek SM diyagramı, ortak bilgi paneli (GSAP) */
(function () {
  "use strict";
  const chipEl = document.getElementById("chip-diagram");
  const smEl = document.getElementById("sm-diagram");
  const info = document.getElementById("gpu-info");
  if (!chipEl || !smEl || !info) return;

  const D = {
    sched: { t: "İş dağıtıcı (GigaThread / komut işlemcisi)", d: "Sürücüden gelen işleri alır ve SM'lere paylaştırır. Binlerce thread'i tek tek yönetmek yerine, onları bloklar halinde gruplayıp boşta olan SM'ye yollar.", a: "Şantiye şefi: kim ne yapacak, hangi ekip boşta, o dağıtır.", f: ["GPU'nun \"kontrol\" tarafı çok küçük tutulur; çip alanı hesaba ayrılır.", "Sürücü ve API (DirectX, Vulkan...) işi buraya iletir."] },
    sm: { t: "SM (Streaming Multiprocessor)", d: "GPU'nun ana yapı taşı. Bir SM'nin içinde CUDA çekirdekleri, tensor çekirdekleri, RT çekirdeği, warp scheduler'lar, dev bir register dosyası ve hızlı paylaşımlı bellek bulunur. Üst seviye kartlarda onlarca, hatta yüzü aşkın SM olur. Aşağıdaki ikinci diyagramda SM'nin içine bakabilirsin.", a: "SM, kendi mutfağı ve aşçıları olan tam bir restoran şubesi. GPU da bu şubelerden onlarca tane.", f: ["AMD'de karşılığı CU (Compute Unit), Intel'de Xe-core.", "Kart modelleri arasındaki fark çoğunlukla SM sayısındadır."] },
    l2: { t: "L2 cache (ortak)", d: "Bütün SM'lerin paylaştığı cache. VRAM'e gitmeden önceki son durak olduğu için hem hızı hem de VRAM trafiğini azaltır. Yeni kartlarda onlarca MB olabiliyor (AMD'de buna Infinity Cache de deniyor).", a: "Ortak depo: her şubenin arka kapısındaki paylaşımlı soğuk hava deposu.", f: ["Büyük cache, dar bir bellek yolunu (bus) kısmen telafi edebilir.", "CPU'daki L3'ün GPU versiyonu gibi düşünebilirsin."] },
    mc: { t: "Bellek denetleyicileri", d: "VRAM çipleriyle konuşur. Bir bellek çipi 32 bitlik bir kanaldan bağlanır; 8 çip = 256 bit bus. Bus genişliği ve bellek hızı birlikte bant genişliğini belirler (VRAM bölümünde hesaplayacağız).", a: "Depoya giden yolun kaç şeritli olduğunu belirleyen kavşak.", f: ["128, 192, 256, 384 bit gibi değerler görürsün; ne kadar geniş, o kadar çok veri aynı anda.", "Bu yüzden VRAM miktarı tek başına yetmez, bus da önemli."] },
    vram: { t: "VRAM (GDDR / HBM)", d: "Kartın kendi hafızası: dokular, 3D modeller, kare tamponları ve yapay zekâ modelleri burada durur. GDDR6 / GDDR6X / GDDR7 bellekler çipin etrafına lehimlenir. Sunucu kartlarında HBM adında çipin hemen yanına yığılmış çok geniş bellek kullanılır.", a: "GPU'nun kendi kileri: sistem RAM'ine gitmekten çok daha hızlı.", f: ["Kullanıcı sonradan VRAM ekleyemez, kartla birlikte gelir.", "VRAM dolarsa veriler sistem RAM'ine taşar ve kare hızı sert düşer."] },
    pcie: { t: "PCIe x16 arayüzü", d: "Kartın anakarta bağlandığı yol. İşlemci ve RAM ile veri alışverişi buradan olur. PCIe 4.0 x16 her yönde kabaca 32 GB/s verir; bu, VRAM'in yüzlerce GB/s hızının yanında çok yavaş. Bu yüzden oyunlar verileri bir kez VRAM'e yükler ve orada tutar.", a: "Şehirler arası otoyol: hızlı ama şehir içi (VRAM) yollarından dar.", f: ["Yeni nesil kartlar geriye dönük uyumlu: PCIe 5.0 kart 4.0 yuvada da çalışır.", "Anakart sayfasında PCIe hatlarını anlatıyoruz."] },
    io: { t: "Ekran çıkışları ve display engine", d: "HDMI ve DisplayPort çıkışları. Kartın içindeki ekran motoru (display engine) hazır kareyi alıp monitörün anlayacağı sinyale çevirir, yenileme hızını ve çözünürlüğü yönetir.", a: "Restoranın servis penceresi: hazır tabak buradan müşteriye gider.", f: ["Yüksek yenileme hızlı monitör için DisplayPort ya da yeni HDMI sürümü gerekir.", "Monitörü ekran kartına takın, anakartın çıkışına değil!"] },
    l1: { t: "L1 / paylaşımlı bellek", d: "SM'nin içindeki çok hızlı küçük bellek (kabaca 100 KB civarı). Aynı bloktaki thread'ler bununla birbirine veri aktarabilir. Programcı buraya elle veri yerleştirebilir; \"shared memory\" denir.", a: "Restoran şubesinin tezgahı: aşçıların ortak kullandığı yakın alan.", f: ["Bant genişliği VRAM'den kat kat yüksektir.", "İyi yazılmış GPU kodları verileri buraya alıp orada işler."] },
    rt: { t: "RT çekirdeği (Ray tracing)", d: "Işın izleme için ışının hangi üçgene çarptığını bulan özel donanım. Bu iş yazılımla yapılırsa çok yavaştır; RT çekirdekleri kutu ve üçgen kesişim testlerini donanımda yapar.", a: "Işın avcısı: 'bu ışın hangi duvara çarptı?' sorusunda uzman.", f: ["AMD'de Ray Accelerator, Intel'de RT Unit denir.", "Aşağıdaki 'Işın izleme' bölümünde küçük bir demosu var."] },
    warp: { t: "Warp scheduler", d: "32 thread'lik gruplara warp denir. Scheduler hangi warp'ın sıradaki komutunun çalışacağını seçer. Bir warp bellek beklerken hemen başka bir warp'a geçer; GPU bellek gecikmesini bu şekilde gizler.", a: "Kavşaktaki trafik polisi: biri bekliyorsa diğerine yeşil yakar.", f: ["Warp içindeki 32 thread aynı komutu aynı anda yürütür (SIMT).", "Warp bölümünde bunun bir demosu var."] },
    cuda: { t: "CUDA çekirdekleri (shader core)", d: "GPU'nun temel hesap birimleri. Her biri döngüde bir float veya tamsayı işlemi yapar. 32 tanesi bir warp'ı birlikte çalıştırır. Kutuda yazan \"binlerce çekirdek\" bu birimlerin toplamıdır.", a: "Mutfaktaki tek tek aşçılar. Basit ama çok kalabalık.", f: ["Tek başına bir CPU çekirdeğinden çok daha basit ve yavaştır.", "Gücü sayısından gelir."] },
    regs: { t: "Register dosyası", d: "GPU'nun register dosyası devasa (SM başına yüzlerce KB). Binlerce thread'in her birinin kendi register'ları burada aynı anda tutulur. Bu yüzden thread değiştirmek neredeyse bedavadır, değerler zaten çip üstünde.", a: "Her aşçının kendi cebi var; hepsi aynı anda çalışabilir.", f: ["CPU'da bir çekirdekte ~16 register vardı, burada sayı yüzbinlerle ifade edilir.", "Register'lar CPU sayfasında anlatılıyor."] },
    tensor: { t: "Tensor çekirdekleri", d: "Küçük matrisleri (örneğin 4×4) tek adımda çarpıp toplayan özel birimler. Yapay zekâ ve DLSS gibi çözünürlük yükseltme teknikleri bu çekirdeklerle çok hızlı çalışır.", a: "Tek hamlede tüm hamur işini yapan özel makine.", f: ["AMD'de AI accelerator, Intel'de XMX engine denir.", "Matris çarpımı sinir ağlarının temel işlemidir."] }
  };

  const chipHTML =
    '<button class="cd-b top" data-k="sched">İş dağıtıcı</button>' +
    '<div class="cd-sms">' + '<button class="cd-b smb" data-k="sm">SM</button>'.repeat(8) + "</div>" +
    '<button class="cd-b wide" data-k="l2">L2 cache (ortak)</button>' +
    '<button class="cd-b wide" data-k="mc">Bellek denetleyicileri</button>' +
    '<div class="cd-vram">' + '<button class="cd-b vr" data-k="vram">GDDR</button>'.repeat(8) + "</div>" +
    '<div class="cd-io"><button class="cd-b" data-k="pcie">PCIe x16 ↔ anakart</button><button class="cd-b" data-k="io">HDMI / DP → monitör</button></div>';
  chipEl.innerHTML = chipHTML;

  let quads = "";
  for (let q = 0; q < 4; q++) {
    quads += '<div class="quad"><button class="cd-b sm-b" data-k="warp">Warp scheduler</button>' +
      '<button class="cd-b cores" data-k="cuda" aria-label="CUDA çekirdekleri">' + "<i></i>".repeat(32) + "</button>" +
      '<div class="quad-row"><button class="cd-b sm-b tn" data-k="tensor">Tensor</button><button class="cd-b sm-b" data-k="regs">Register</button></div></div>';
  }
  smEl.innerHTML =
    '<div class="smd-top"><button class="cd-b sm-b" data-k="l1">L1 / paylaşımlı bellek</button><button class="cd-b sm-b rt" data-k="rt">RT çekirdeği</button></div>' +
    '<div class="smd-quads">' + quads + "</div>";

  function show(k, animate) {
    const o = D[k];
    document.querySelectorAll(".cd-b").forEach(function (b) { b.classList.toggle("sel", b.dataset.k === k); });
    info.innerHTML = "<h3>" + o.t + "</h3><p>" + o.d + '</p><div class="analogy">💡 ' + o.a + "</div><ul>" +
      o.f.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
    if (animate && window.gsap) {
      gsap.fromTo(info.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: "power2.out" });
      const sel = document.querySelectorAll('.cd-b[data-k="' + k + '"]');
      gsap.fromTo(sel, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,.5)", stagger: 0.03 });
      if (k === "cuda") {
        gsap.fromTo(document.querySelectorAll(".cores i"), { scale: 0.2, opacity: 0.3 }, { scale: 1, opacity: 1, duration: 0.4, stagger: { each: 0.008, from: "random" }, ease: "back.out(2)" });
      }
    }
  }

  document.querySelector(".arch-wrap").addEventListener("click", function (e) {
    const b = e.target.closest(".cd-b");
    if (b) show(b.dataset.k, true);
  });
  show("sm", false);

  if (window.gsap && window.ScrollTrigger) {
    gsap.from(document.querySelectorAll(".cd-sms .cd-b, .cd-vram .cd-b"), {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power2.out",
      scrollTrigger: { trigger: chipEl, start: "top 82%", once: true }
    });
    gsap.from(document.querySelectorAll(".cores i"), {
      scale: 0, opacity: 0, duration: 0.35, stagger: { each: 0.004, from: "random" }, ease: "back.out(2)",
      scrollTrigger: { trigger: smEl, start: "top 85%", once: true }
    });
  }
})();
