# ParçaParça 🖥️

Bilgisayar donanım parçalarını **öğrenerek** keşfetmek için yaptığım küçük Türkçe site.
Her parçanın kendi sayfası var: anlatım + etkileşimli demolar.

## Sayfalar

| Sayfa | İçinde neler var |
|---|---|
| **İşlemci (CPU)** *(GSAP)* | Blok şeması, fetch-decode-execute animasyonu, **register'lar** (gezgin, RAX bit demosu, mini ALU + bayraklar, stack), cache hız piramidi, pipeline, Amdahl yasası |
| **Ekran Kartı (GPU)** *(GSAP)* | CPU–GPU yarışı, GPU mimarisi + SM içi, warp sapması, render hattı (üçgenden piksele), VRAM bant genişliği, ışın izleme, upscaling |
| **RAM** | DRAM hücresi ve yenileme, DDR nesilleri, hız/gecikme hesaplayıcı, dual channel, RAM dolunca ne olur |
| **Depolama** | HDD kafa simülasyonu, NAND hücre seviyeleri, SATA/NVMe, kopyalama yarışı |
| **Anakart** | Tıklanabilir anakart haritası, soket/chipset, PCIe hat bütçesi, açılış (boot) süreci |
| **Güç Kaynağı** | AC→DC dalga aşamaları, watt hesaplayıcı, 80 PLUS verimlilik eğrisi, konnektörler |
| **Soğutma** | Isı zinciri simülasyonu, ısı borusu, termal macun, kasa hava akışı |

## Çalıştırma

Build gerekmiyor, düz HTML/CSS/JS. Bir statik sunucu yeterli:

```bash
python -m http.server 5188
```

Sonra `http://localhost:5188` adresini aç. (GSAP ve fontlar CDN'den geliyor; internet lazım.)

## Yapı

```
index.html, cpu.html, gpu.html, ram.html, depolama.html, anakart.html, psu.html, sogutma.html
css/   style.css (ortak) + her sayfanın kendi css'i
js/    site.js (menü, ilerleme çubuğu, geçiş animasyonları) + gsap-common.js + sayfaya özel dosyalar
```

Yeni bir parça sayfası eklemek için `js/site.js` içindeki `PARTS` listesine bir satır eklemek yeterli;
menü, ana sayfa kartları ve sayfa altı gezinme oradan otomatik oluşuyor.

> Rakamlar mantığı oturtmak için yaklaşık değerlerdir; gerçek ürünlerde model ve nesle göre değişir.
