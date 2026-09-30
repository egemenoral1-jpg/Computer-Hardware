/* ana sayfa: parça kartları + animasyonlu bağlantı diyagramı */
(function () {
  "use strict";
  const PP = window.PP;
  if (!PP) return;

  /* ---------- kartlar ---------- */
  const grid = document.getElementById("part-grid");
  if (grid) {
    grid.innerHTML = PP.PARTS.map(function (p, i) {
      const badge = p.gsap ? '<span class="badge">GSAP</span>' : "";
      return '<a class="card hoverable part-card reveal d' + (i % 3) + '" href="' + p.url + '" style="--accent-rgb:' + p.rgb + ';--accent:rgb(' + p.rgb + ')">' +
        '<div class="top"><div class="ico">' + PP.ICONS[p.id] + "</div>" + badge + "</div>" +
        "<h3>" + p.full + "</h3><p>" + p.tag + "</p>" +
        '<div class="tags">' + p.chips.map(function (c) { return "<span>" + c + "</span>"; }).join("") + "</div>" +
        '<span class="go">Sayfayı aç →</span></a>';
    }).join("");
    PP.reveal(grid);
  }

  /* ---------- diyagram ---------- */
  const host = document.getElementById("net");
  if (!host) return;
  const cx = 260, cy = 260, R = 178;
  const sats = ["gpu", "ram", "depolama", "psu", "sogutma", "anakart"];
  let lines = "", packets = "", nodes = "";

  sats.forEach(function (id, i) {
    const p = PP.PARTS.find(function (x) { return x.id === id; });
    const a = (-90 + i * 60) * Math.PI / 180;
    const x = Math.round(cx + R * Math.cos(a));
    const y = Math.round(cy + R * Math.sin(a));
    const dur = (2.4 + (i % 3) * 0.5).toFixed(1);
    lines += '<line class="net-line" x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '"/>';
    packets += '<circle r="4.5" fill="rgb(' + p.rgb + ')"><animateMotion dur="' + dur + 's" repeatCount="indefinite" begin="' + (i * 0.4) + 's" path="M' + cx + "," + cy + " L" + x + "," + y + '"/></circle>';
    const icon = PP.ICONS[id].replace("<svg ", '<svg x="-15" y="-19" width="30" height="30" ');
    nodes += '<a href="' + p.url + '" class="net-node" style="color:rgb(' + p.rgb + ')"><g transform="translate(' + x + "," + y + ')"><g class="float" style="animation-delay:-' + i * 0.8 + 's">' +
      '<circle class="bg" r="40" stroke="rgb(' + p.rgb + ')"/>' + icon +
      '<text y="26">' + p.name + "</text></g></g></a>";
  });

  const core =
    '<a href="cpu.html" class="net-core"><g transform="translate(' + cx + "," + cy + ')">' +
    '<rect class="glow" x="-58" y="-58" width="116" height="116" rx="22"/>' +
    '<rect class="body" x="-42" y="-42" width="84" height="84" rx="14"/>' +
    '<g stroke="rgb(56,189,248)" stroke-width="3" stroke-linecap="round">' +
    '<path d="M-24 -42v-12M-8 -42v-12M8 -42v-12M24 -42v-12M-24 42v12M-8 42v12M8 42v12M24 42v12M-42 -24h-12M-42 -8h-12M-42 8h-12M-42 24h-12M42 -24h12M42 -8h12M42 8h12M42 24h12"/></g>' +
    '<text y="7">CPU</text></g></a>';

  host.innerHTML =
    '<svg viewBox="0 0 520 520" role="img"><defs><radialGradient id="bgGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(56,189,248,.18)"/><stop offset="1" stop-color="transparent"/></radialGradient></defs>' +
    '<rect width="520" height="520" fill="url(#bgGlow)"/>' +
    lines + packets + core + nodes + "</svg>";
})();
