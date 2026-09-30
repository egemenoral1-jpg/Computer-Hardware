/* CPU blok şeması: kutulara tıklayınca bilgi paneli (GSAP ile) */
(function () {
  "use strict";
  const map = document.getElementById("blockmap");
  const info = document.getElementById("block-info");
  if (!map || !info) return;

  const GROUPS = [
    { title: "Çekirdeğin beyni", ids: ["cu", "alu", "fpu"] },
    { title: "Çekirdeğin cebi", ids: ["regs", "bp", "mmu"] },
    { title: "Hafıza katmanları", ids: ["l1", "l2", "l3"] },
    { title: "Dış dünyayla ilişki", ids: ["clk", "mc", "io"] }
  ];

  const B = {
    cu: {
      name: "Kontrol birimi (CU)", tag: "orkestra şefi",
      desc: "Programın akışını yönetir. PC'nin gösterdiği komutu getirtir, komutun ne demek olduğunu çözer (decode) ve diğer birimlere \"sen topla, sen bellekten getir\" diye emir verir.",
      analogy: "Şef aşçı: kendisi doğramaz, ama kimin ne yapacağını o söyler.",
      facts: ["Komut çözücü (decoder) de burada. x86'da komutlar değişken uzunlukta olduğu için bu iş zordur.", "Modern çekirdekler komutları micro-op denen daha küçük parçalara böler."],
      rel: ["regs", "alu", "bp"]
    },
    alu: {
      name: "ALU (Aritmetik Mantık Birimi)", tag: "hesap makinesi",
      desc: "Toplama, çıkarma, AND / OR / XOR, kaydırma ve karşılaştırma gibi tamsayı işlemlerini yapar. Sonucun yanında bayrakları da (ZF, CF, SF, OF) üretir. Bayraklar \"if\" kararlarının hammaddesidir.",
      analogy: "Tezgahtaki hesap makinesi. Girdiyi verirsin, sonucu ve \"sıfır çıktı mı, taştı mı\" bilgisini alırsın.",
      facts: ["Bir çekirdekte birden fazla ALU vardır; aynı anda birkaç toplama yapılabilir.", "Register bölümündeki ALU demosunda bayrakların nasıl oluştuğunu kendin deneyebilirsin."],
      rel: ["regs", "cu"]
    },
    fpu: {
      name: "FPU ve SIMD birimleri", tag: "ondalık + toplu iş",
      desc: "FPU ondalıklı (floating point) sayılarla çalışır: 3,14 gibi. SIMD (SSE / AVX) birimleri ise tek komutla birden fazla veriyi birlikte işler. Örneğin 8 float'ı aynı anda toplamak gibi.",
      analogy: "Tek tek yumurta kırmak yerine, aynı anda 8 yumurta kıran makine.",
      facts: ["Oyunlar, video ve yapay zekâ kodları bu birimleri çok kullanır.", "Register'lar bölümünde XMM / YMM / ZMM register'larına bakacağız."],
      rel: ["regs"]
    },
    regs: {
      name: "Register dosyası", tag: "en hızlı hafıza",
      desc: "İşlemcinin doğrudan içinde duran, çok küçük ve çok hızlı hafıza hücreleri. Komutların çoğu verilerini buradan alır ve sonucunu buraya yazar. Hemen aşağıda ayrı bir bölümü var.",
      analogy: "Aşçının elindeki malzeme: uzanmana bile gerek yok.",
      facts: ["x86-64'te 16 tane genel amaçlı 64-bit register var (RAX, RBX ... R15).", "Erişim süresi pratikte bir döngüden az."],
      rel: ["alu", "cu", "l1"]
    },
    bp: {
      name: "Dal tahmincisi (Branch predictor)", tag: "fal bakan birim",
      desc: "Bir \"if\" ya da döngüde program hangi yöne gidecek? Cevabı beklemek yerine işlemci tahmin eder ve o yoldan devam eder. Tahmin doğruysa zaman kazanılır; yanlışsa yapılan iş çöpe gider.",
      analogy: "Kavşakta yol tabelasını beklemeden \"herhalde sağa\" deyip gitmek. %95+ tutturursa çok kazanırsın.",
      facts: ["Modern tahmin ediciler %95-99 doğruluğa ulaşır.", "Pipeline bölümündeki demoda yanlış tahminin bedelini göreceksin."],
      rel: ["cu"]
    },
    mmu: {
      name: "MMU ve TLB", tag: "adres çevirmeni",
      desc: "Programlar gerçek RAM adreslerini görmez, kendilerine ait sanal adresleri kullanır. MMU (Memory Management Unit) sanal adresi fiziksel adrese çevirir. TLB bu çevirilerin küçük bir cache'idir.",
      analogy: "Otel resepsiyonu: sen \"12 numaralı oda\" dersin, o gerçek kata ve kapıya çevirir.",
      facts: ["Her program kendi adres alanında çalıştığını sanır; birbirlerinin belleğini göremez.", "CR3 register'ı sayfa tablosunun yerini gösterir."],
      rel: ["l1", "mc"]
    },
    l1: {
      name: "L1 önbellek", tag: "en yakın, en hızlı",
      desc: "Çekirdeğe en yakın cache. Genelde komutlar (L1I) ve veriler (L1D) için ayrıdır ve çekirdek başına 32-64 KB kadardır. Erişimi yaklaşık 4-5 döngü sürer.",
      analogy: "Tezgahın üstü: uzanınca yetişirsin.",
      facts: ["Çok küçüktür çünkü hızlı olması için fiziksel olarak çekirdeğe çok yakın olmalı.", "Cache bölümünde hız farklarının sayılarına bakacağız."],
      rel: ["regs", "l2"]
    },
    l2: {
      name: "L2 önbellek", tag: "yakın komşu",
      desc: "L1'den büyük ama biraz yavaş. Çekirdek başına yaklaşık 256 KB - 2 MB arası olur. L1'de bulunamayan veri burada aranır.",
      analogy: "Mutfaktaki çekmece: birkaç adım gerek.",
      facts: ["Erişim yaklaşık 12-15 döngü.", "Çoğu tasarımda her çekirdeğin kendi L2'si vardır."],
      rel: ["l1", "l3"]
    },
    l3: {
      name: "L3 önbellek", tag: "ortak havuz",
      desc: "Bütün çekirdeklerin paylaştığı büyük cache. Onlarca MB olabilir. Çekirdekler arasında veri paylaşımını da kolaylaştırır. RAM'e gitmeden önceki son durak.",
      analogy: "Mutfak dolabı: ortak kullanılır, yürümen gerekir ama markete gitmekten iyidir.",
      facts: ["Erişim yaklaşık 40-50 döngü.", "Bazı işlemcilerde 3D V-Cache gibi tekniklerle üst üste eklenip çok büyütülür; oyunlarda faydalıdır."],
      rel: ["l2", "mc"]
    },
    clk: {
      name: "Saat (clock)", tag: "metronom",
      desc: "Bütün birimleri senkron tutan düzenli tık sesi. 4,5 GHz demek saniyede 4,5 milyar tık demek. Her adım bir tık kadar zaman alır.",
      analogy: "Orkestradaki metronom. Herkes aynı tempoda çalar.",
      facts: ["Frekans arttıkça ısı ve güç tüketimi de hızla artar.", "Modern işlemciler yüke göre saat hızını sürekli değiştirir (boost)."],
      rel: ["cu"]
    },
    mc: {
      name: "Bellek denetleyicisi", tag: "RAM'in kapıcısı",
      desc: "RAM ile konuşan birim. Eskiden anakartta ayrı bir çipteydi, artık çoğu işlemcinin içinde. Hangi bellek türünün (DDR4 / DDR5) ve kaç kanalın kullanılabileceği de buna bağlıdır.",
      analogy: "Kilerin kapısındaki görevli: kim ne istiyor, hangi raftan alınacak.",
      facts: ["Dual channel çalışma da burada tanımlıdır (RAM sayfasında anlatıyoruz).", "İşlemciyle uyumlu RAM türünün sabit olmasının sebebi de bu."],
      rel: ["l3", "mmu"]
    },
    io: {
      name: "PCIe ve I/O bağlantıları", tag: "dış yollar",
      desc: "İşlemcinin ekran kartı (PCIe x16), NVMe SSD ve chipset ile konuştuğu hatlar. Bir işlemcinin kaç PCIe hattı sunduğu, kaç hızlı parça takabileceğini de belirler.",
      analogy: "Şehirdeki otoyol çıkışları: kaç şerit varsa o kadar trafik akar.",
      facts: ["Ekran kartı genelde doğrudan işlemcinin PCIe hatlarına bağlanır.", "Anakart sayfasında chipset ile ilişkisini anlatıyoruz."],
      rel: ["mc"]
    }
  };

  map.innerHTML = GROUPS.map(function (g) {
    return '<div class="bgroup"><h5>' + g.title + '</h5><div class="row">' +
      g.ids.map(function (id) {
        return '<button class="blk" data-id="' + id + '">' + B[id].name.split(" (")[0] + "<small>" + B[id].tag + "</small></button>";
      }).join("") + "</div></div>";
  }).join("");

  function show(id, animate) {
    const b = B[id];
    map.querySelectorAll(".blk").forEach(function (el) {
      el.classList.toggle("sel", el.dataset.id === id);
      el.classList.toggle("rel", b.rel.indexOf(el.dataset.id) !== -1);
    });
    info.innerHTML =
      "<h3>" + b.name + "</h3><p>" + b.desc + '</p><div class="analogy">💡 ' + b.analogy + "</div>" +
      "<ul>" + b.facts.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>";
    if (animate && window.gsap) {
      gsap.fromTo(info.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: "power2.out" });
      const sel = map.querySelector(".blk.sel");
      gsap.fromTo(sel, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      gsap.fromTo(map.querySelectorAll(".blk.rel"), { scale: 1 }, { scale: 1.05, duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" });
    }
  }

  map.addEventListener("click", function (e) {
    const btn = e.target.closest(".blk");
    if (btn) show(btn.dataset.id, true);
  });

  show("cu", false);

  if (window.gsap && window.ScrollTrigger) {
    gsap.from(map.querySelectorAll(".blk"), {
      y: 24, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power2.out",
      scrollTrigger: { trigger: map, start: "top 82%", once: true }
    });
  }
})();
