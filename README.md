# ParçaParça 🖥️

Bilgisayar donanım parçalarını **öğrenerek** keşfetmek için yaptığım küçük site.
Her parçanın kendi sayfası var; anlatım + etkileşimli demolar + mini quiz.

## Sayfalar
- **İşlemci (CPU)** — komut döngüsü, register'lar, bayraklar, cache, pipeline (GSAP animasyonlu)
- **Ekran Kartı (GPU)** — paralel çalışma, warp, render hattı, VRAM (GSAP animasyonlu)
- **RAM**, **Depolama**, **Anakart**, **Güç Kaynağı**, **Soğutma**

## Çalıştırma
Build gerekmiyor, düz HTML/CSS/JS. Bir statik sunucu yeterli:

```bash
python -m http.server 5173
```

Sonra `http://localhost:5173` adresini aç. (GSAP, CDN'den geliyor; internet lazım.)
