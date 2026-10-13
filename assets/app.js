/* Calculator ka interface. Hisaab calc.js karta hai, rates rates.js mein hain. */
(function () {
  var SL = TaxRates.SALARIED_SLABS;
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    salary: $("salary"), exempt: $("exempt"), err: $("err"), label: $("in-label"), hint: $("in-hint"),
    heroLabel: $("hero-label"), hero: $("hero"), mt: $("r-mt"), at: $("r-at"), eff: $("r-eff"), top: $("r-top"),
    keep: $("bar-keep"), tax: $("bar-tax"), lk: $("lg-keep"), lt: $("lg-tax"),
    body: $("breakdown"), slabs: $("slabs"), ladder: $("ladder"), toast: $("toast"), chips: $("chips")
  };
  var state = { mode: "g", period: "m", value: 100000, exempt: 0 };
  var shown = {}; // abhi screen par dikha hua number (count-up ke liye)
  var firstPaint = true;

  var fmt = function (n) { return "Rs. " + Math.round(n).toLocaleString("en-PK"); };
  var pct = function (n) { return (n * 100).toFixed(2) + "%"; };
  var compact = function (n) {
    if (n >= 1e6) return (+(n / 1e6).toFixed(2)) + "M";
    if (n >= 1e3) return (+(n / 1e3).toFixed(1)) + "k";
    return String(n);
  };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Number ko purane se naye tak chalana
  function tween(key, node, to, format) {
    var from = shown[key];
    shown[key] = to;
    if (firstPaint || reduce || from === undefined || from === to) { node.textContent = format(to); return; }
    var start = performance.now(), dur = 450;
    cancelAnimationFrame(node._raf);
    (function step(now) {
      var k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = format(from + (to - from) * e);
      if (k < 1) node._raf = requestAnimationFrame(step);
    })(start);
  }

  function monthlyInput() {
    var v = TaxCalc.clean(state.value);
    return state.period === "y" ? v / 12 : v;
  }

  function compute() {
    var opts = { exemptMonthly: state.exempt };
    var m = monthlyInput();
    var gross = state.mode === "n" ? TaxCalc.grossFromNet(m, SL, opts) : m;
    return { gross: gross, r: TaxCalc.salaryTax(gross, SL, opts) };
  }

  function drawLadder(idx, annualTaxable) {
    var W = 40, H = 120, g = el.ladder, html = "", i, h, top;
    for (i = 0; i < SL.length; i++) {
      h = 26 + i * 13; top = 14 + (H - h) + 20;
      var cls = "st" + (annualTaxable > SL[i].from ? " on" : "") + (i === idx && annualTaxable > 0 ? " cur" : "");
      html += '<rect class="' + cls + (firstPaint ? " rise" : "") + '" x="' + (i * W + 2) + '" y="' + top + '" width="' + (W - 4) + '" height="' + h + '" rx="4"' +
        (firstPaint ? ' style="animation-delay:' + (i * 70) + 'ms"' : "") + '/>' +
        '<text class="lbl" x="' + (i * W + W / 2) + '" y="' + (top + 17) + '">' + Math.round(SL[i].rate * 100) + '%</text>';
    }
    var yh = 26 + idx * 13, yx = idx * W + W / 2, yy = 14 + (H - yh) + 20 - 14;
    html += '<g class="you" style="transform:translate(' + yx + 'px,' + yy + 'px)"><circle r="7"/><text y="-13">You</text></g>';
    g.innerHTML = html;
    // transition chalane ke liye purani position se naye par le jana
    var you = g.querySelector(".you");
    if (el._lastYou && !reduce) {
      you.style.transition = "none";
      you.style.transform = el._lastYou;
      void you.getBoundingClientRect();
      you.style.transition = "";
      you.style.transform = "translate(" + yx + "px," + yy + "px)";
    }
    el._lastYou = "translate(" + yx + "px," + yy + "px)";
  }

  function render() {
    var raw = el.salary.value, n = Number(raw);
    el.err.textContent = (raw !== "" && (!isFinite(n) || n < 0)) ? "Enter 0 or more." : "";
    var c = compute(), r = c.r, yearly = state.period === "y";

    // Hero number
    if (state.mode === "n") {
      el.heroLabel.textContent = yearly ? "Gross salary needed per year" : "Gross salary needed per month";
      tween("hero", el.hero, yearly ? r.annualSalary : r.monthlyGross, fmt);
    } else {
      el.heroLabel.textContent = yearly ? "Take-home per year" : "Take-home per month";
      tween("hero", el.hero, yearly ? r.netAnnual : r.netMonthly, fmt);
    }
    tween("mt", el.mt, r.monthlyTax, fmt);
    tween("at", el.at, r.annualTax, fmt);
    tween("eff", el.eff, r.effectiveRate, pct);
    el.top.textContent = Math.round(r.marginalRate * 100) + "%";

    // Split bar
    var taxShare = r.annualSalary > 0 ? r.annualTax / r.annualSalary : 0;
    el.tax.style.width = (taxShare * 100) + "%";
    el.keep.style.width = ((1 - taxShare) * 100) + "%";
    el.lk.textContent = r.annualSalary > 0 ? fmt(yearly ? r.netAnnual : r.netMonthly) + " kept" : "-";
    el.lt.textContent = r.annualSalary > 0 ? fmt(yearly ? r.annualTax : r.monthlyTax) + " tax" : "-";

    // Breakdown
    var rows = r.breakdown.map(function (b) {
      var range = b.from === 0 ? "Up to " + fmt(b.to) : b.to === Infinity ? "Above " + fmt(b.from) : fmt(b.from + 1) + " to " + fmt(b.to);
      return "<tr><td>" + range + '</td><td class="n">' + Math.round(b.rate * 100) + '%</td><td class="n">' + fmt(b.amount) + '</td><td class="n">' + fmt(b.tax) + "</td></tr>";
    }).join("");
    el.body.innerHTML = rows || '<tr><td colspan="4">Enter a salary to see the breakdown.</td></tr>';

    // Slab table mein current row
    var trs = el.slabs.querySelectorAll("tbody tr");
    for (var i = 0; i < trs.length; i++) trs[i].className = (r.annualTaxable > 0 && i === r.slabIndex) ? "on" : "";

    drawLadder(r.slabIndex, r.annualTaxable);
    firstPaint = false;
    syncUrl();
    return c;
  }

  function syncUi() {
    var yearly = state.period === "y", net = state.mode === "n";
    el.label.textContent = (net ? "Take-home you want " : "Gross salary ") + (yearly ? "per year" : "per month");
    el.hint.textContent = net ? "We work backwards to the gross salary that leaves you this much after tax." : "The salary before tax, as written in your offer letter or payslip.";
    var btns = document.querySelectorAll("[data-mode],[data-period]");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i], on = b.dataset.mode ? b.dataset.mode === state.mode : b.dataset.period === state.period;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
    var cb = el.chips.querySelectorAll("button");
    for (var j = 0; j < cb.length; j++) {
      var mv = Number(cb[j].dataset.m), v = yearly ? mv * 12 : mv;
      cb[j].textContent = compact(v); cb[j].dataset.v = v;
    }
  }

  function syncUrl() {
    try {
      var q = new URLSearchParams();
      q.set("s", String(Math.round(TaxCalc.clean(state.value))));
      if (state.period === "y") q.set("p", "y");
      if (state.mode === "n") q.set("mode", "n");
      if (state.exempt > 0) q.set("e", String(Math.round(state.exempt)));
      history.replaceState(null, "", location.pathname + "?" + q.toString());
    } catch (e) {}
  }

  function readUrl() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.has("s")) state.value = TaxCalc.clean(q.get("s"));
      if (q.get("p") === "y") state.period = "y";
      if (q.get("mode") === "n") state.mode = "n";
      if (q.has("e")) state.exempt = TaxCalc.clean(q.get("e"));
    } catch (e) {}
  }

  function toast(msg) {
    el.toast.textContent = msg; el.toast.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.toast.classList.remove("show"); }, 1800);
  }

  function copyText(text, okMsg) {
    var done = function () { toast(okMsg); };
    var fallback = function () {
      var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      ok ? done() : toast("Copy failed. Select the text and copy it.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  function summary() {
    var c = compute(), r = c.r;
    return "Pakistan salary tax " + TaxRates.TAX_YEAR + "\n" +
      "Gross salary: " + fmt(r.monthlyGross) + " per month\n" +
      "Monthly tax: " + fmt(r.monthlyTax) + "\n" +
      "Annual tax: " + fmt(r.annualTax) + "\n" +
      "Take-home: " + fmt(r.netMonthly) + " per month\n" +
      "Effective tax rate: " + pct(r.effectiveRate) + "\n" +
      "Estimate only: " + location.origin + location.pathname;
  }

  // Events
  el.salary.addEventListener("input", function () { state.value = el.salary.value === "" ? 0 : Number(el.salary.value); render(); });
  el.exempt.addEventListener("input", function () { state.exempt = el.exempt.value === "" ? 0 : TaxCalc.clean(el.exempt.value); render(); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode && b.dataset.mode !== state.mode) { state.mode = b.dataset.mode; syncUi(); render(); }
    else if (b.dataset.period && b.dataset.period !== state.period) {
      // Number ko naye period mein badal dein taake salary wahi rahe
      var m = monthlyInput();
      state.period = b.dataset.period;
      state.value = Math.round(state.period === "y" ? m * 12 : m);
      el.salary.value = state.value; syncUi(); render();
    }
    else if (b.parentNode === el.chips) { state.value = Number(b.dataset.v); el.salary.value = state.value; render(); }
    else if (b.id === "copy") copyText(summary(), "Result copied");
    else if (b.id === "share") {
      var url = location.href;
      if (navigator.share) navigator.share({ title: document.title, text: summary(), url: url }).catch(function () {});
      else copyText(url, "Link copied");
    }
    else if (b.id === "reset") {
      state = { mode: "g", period: "m", value: 100000, exempt: 0 };
      el.salary.value = 100000; el.exempt.value = ""; syncUi(); render(); toast("Reset");
    }
  });

  readUrl();
  el.salary.value = state.value;
  el.exempt.value = state.exempt > 0 ? state.exempt : "";
  syncUi();
  render();
})();
