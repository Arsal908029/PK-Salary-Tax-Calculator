/* Static tax-slab background; redraw only when its size or theme changes. */
(function () {
  var canvas = document.getElementById("bg");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1;
  var colors = { line: "11,122,75", gold: "201,138,0", dark: false };

  // Each layer defines the step size, line opacity, and fill opacity.
  var layers = [
    { w: 120, h: 70, a: 0.10, off: 0.00, fill: 0.035, lw: 1.2 },
    { w: 84,  h: 50, a: 0.14, off: 0.45, fill: 0.045, lw: 1.3 },
    { w: 56,  h: 34, a: 0.18, off: 0.20, fill: 0.055, lw: 1.5 }
  ];
  var coins = [];

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    var l = cs.getPropertyValue("--bg-line").trim(), g = cs.getPropertyValue("--bg-gold").trim();
    if (l) colors.line = l;
    if (g) colors.gold = g;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    coins = [];
    var n = W < 600 ? 4 : 8;
    for (var i = 0; i < n; i++) coins.push({ layer: i % layers.length, s: Math.random() * 12, r: 3 + Math.random() * 2.5 });
    readColors();
    draw();
  }

  // Seedhi ka ek point: s = step number (tread phir riser). Seedhi neeche-baayen se oopar-daayen chadhti hai.
  function stairPoint(L, ox, oy, s) {
    var i = Math.floor(s), f = s - i;
    if (f < 0.5) return [ox + (i + f * 2) * L.w, oy - i * L.h];
    return [ox + (i + 1) * L.w, oy - (i + (f - 0.5) * 2) * L.h];
  }

  function origin(L, k, phase) {
    // Stairs start below and to the left of the viewport.
    var shift = phase % 1;
    var ox = -L.w * 2 + shift * L.w;
    var oy = H * (0.95 - k * 0.2) + L.h * 2 - shift * L.h;
    return [ox, oy];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var k = 0; k < layers.length; k++) {
      var L = layers[k];
      var o = origin(L, k, L.off);
      var steps = Math.ceil(W / L.w) + 5;
      ctx.beginPath();
      ctx.moveTo(o[0], o[1]);
      for (var i = 0; i < steps; i++) {
        ctx.lineTo(o[0] + (i + 1) * L.w, o[1] - i * L.h);
        ctx.lineTo(o[0] + (i + 1) * L.w, o[1] - (i + 1) * L.h);
      }
      ctx.strokeStyle = "rgba(" + colors.line + "," + L.a + ")";
      ctx.lineWidth = L.lw;
      ctx.lineJoin = "round";
      ctx.stroke();
      // seedhi ke neeche halka rang (terrain jaisa)
      ctx.lineTo(o[0] + steps * L.w, H + 50);
      ctx.lineTo(o[0], H + 50);
      ctx.closePath();
      ctx.fillStyle = "rgba(" + colors.line + "," + L.fill + ")";
      ctx.fill();
    }
    // sone ke sikke seedhi par chadhte hue
    for (var c = 0; c < coins.length; c++) {
      var cn = coins[c], CL = layers[cn.layer];
      var oo = origin(CL, cn.layer, CL.off);
      var steps2 = Math.ceil(W / CL.w) + 3;
      var s = cn.s % steps2;
      var p = stairPoint(CL, oo[0], oo[1], s);
      var fade = Math.min(1, Math.min(p[0] + 40, W - p[0] + 40) / 120) * Math.min(1, Math.max(0, (H - p[1] + 20) / 100));
      if (p[1] < -10 || p[1] > H + 10 || fade <= 0) continue;
      var rg = ctx.createRadialGradient(p[0], p[1] - cn.r - 2, 0, p[0], p[1] - cn.r - 2, cn.r * 4);
      rg.addColorStop(0, "rgba(" + colors.gold + "," + (0.35 * fade) + ")");
      rg.addColorStop(1, "rgba(" + colors.gold + ",0)");
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(p[0], p[1] - cn.r - 2, cn.r * 4, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(" + colors.gold + "," + (0.85 * fade) + ")";
      ctx.beginPath(); ctx.arc(p[0], p[1] - cn.r - 2, cn.r, 0, 6.2832); ctx.fill();
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("themechange", function () { readColors(); draw(); });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", function () { readColors(); draw(); });
  }
  resize();
})();
