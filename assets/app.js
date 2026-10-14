/* Calculator ka interface. Hisaab calc.js karta hai, rates rates.js mein hain. */
(function () {
  var SL = TaxRates.SALARIED_SLABS;
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    salary: $("salary"), exempt: $("exempt"), bonus: $("bonus"), err: $("err"), output: $("calc-output"), label: $("in-label"), hint: $("in-hint"),
    heroLabel: $("hero-label"), hero: $("hero"), mt: $("r-mt"), at: $("r-at"), eff: $("r-eff"), top: $("r-top"),
    keep: $("bar-keep"), tax: $("bar-tax"), lk: $("lg-keep"), lt: $("lg-tax"),
    body: $("breakdown"), slabs: $("slabs"), ladder: $("ladder"), toast: $("toast"), chips: $("chips"),
    printAssumptions: $("print-assumptions"), printResults: $("print-results"), printBreakdown: $("print-breakdown")
  };
  var comparison = {
    inputs: [[$("offer-a"), $("offer-bonus-a"), $("offer-exempt-a")],
      [$("offer-b"), $("offer-bonus-b"), $("offer-exempt-b")]],
    error: $("compare-error"), summary: $("compare-summary"), results: $("compare-results"),
    cells: ["compare-gross-a", "compare-bonus-a", "compare-exempt-a", "compare-taxable-a", "compare-monthly-tax-a",
      "compare-annual-tax-a", "compare-net-monthly-a", "compare-net-annual-a",
      "compare-effective-a"].map(function (id) {
        return [$(id), $(id.replace(/-a$/, "-b"))];
      })
  };
  var yearComparison = {
    section: $("year-comparison"),
    select: $("previous-year"),
    summary: $("year-comparison-summary"),
    selectedHeading: $("year-selected-heading"),
    currentHeading: $("year-current-heading"),
    surcharge: [$("year-surcharge-a"), $("year-surcharge-b")],
    cells: {
      annualTax: [$("year-annual-a"), $("year-annual-b")],
      monthlyTax: [$("year-monthly-a"), $("year-monthly-b")],
      netAnnual: [$("year-net-a"), $("year-net-b")],
      effectiveRate: [$("year-effective-a"), $("year-effective-b")]
    }
  };
  var languageToggle = $("language-toggle");
  var quiz = $("tax-quiz"), quizResult = $("quiz-result");
  var MAX_INPUT = 1e9;
  var language = "en";
  var urdu = {
    "mode-group": "آپ کیا جانتے ہیں؟",
    "period-group": "مدت",
    "mode-gross": "تنخواہ سے نیٹ تنخواہ",
    "mode-net": "نیٹ تنخواہ سے مجموعی تنخواہ",
    monthly: "ماہانہ",
    yearly: "سالانہ",
    "salary-month": "ماہانہ مجموعی تنخواہ",
    "salary-year": "سالانہ مجموعی تنخواہ",
    "net-month": "مطلوبہ ماہانہ نیٹ تنخواہ",
    "net-year": "مطلوبہ سالانہ نیٹ تنخواہ",
    "salary-hint": "ٹیکس سے پہلے کی تنخواہ درج کریں۔",
    "net-hint": "یہ رقم ٹیکس کے بعد حاصل کرنے کے لیے درکار مجموعی تنخواہ معلوم کریں۔",
    "allowance-bonus": "الاؤنس اور سالانہ بونس",
    "exempt-month": "ماہانہ تنخواہ کا ٹیکس سے مستثنیٰ حصہ",
    "exempt-hint": "صرف باقی رقم پر ٹیکس لگے گا۔ صرف تصدیق شدہ مستثنیٰ الاؤنس درج کریں۔",
    "bonus-annual": "اس ٹیکس سال کا سالانہ بونس یا غیر باقاعدہ تنخواہ",
    "bonus-hint": "اس رقم کو قابلِ ٹیکس تنخواہ سمجھ کر ٹیکس کو 12 ماہ پر تقسیم کیا جاتا ہے۔ اصل پے رول کٹوتی مختلف ہو سکتی ہے۔",
    "copy-result": "نتیجہ کاپی کریں",
    "print-summary-btn": "ٹیکس خلاصہ پرنٹ کریں",
    "share-link": "لنک شیئر کریں",
    reset: "دوبارہ ترتیب دیں",
    "privacy-note": "رازداری: حساب آپ کے براؤزر میں ہوتا ہے؛ تنخواہ محفوظ یا بھیجی نہیں جاتی۔ شیئر لنک میں تنخواہ، الاؤنس اور بونس شامل ہوتے ہیں۔",
    "package-title": "دو تنخواہی پیکجوں کا موازنہ",
    "package-intro": "ماہانہ تنخواہ، سالانہ بونس اور آپ کے درج کردہ ٹیکس سے مستثنیٰ ماہانہ الاؤنس کی بنیاد پر دو پیشکشوں کا موازنہ کریں۔",
    "offer-a-salary": "پیشکش A: ماہانہ مجموعی تنخواہ",
    "offer-a-bonus": "پیشکش A: سالانہ بونس",
    "offer-a-exempt": "پیشکش A: ماہانہ ٹیکس سے مستثنیٰ الاؤنس",
    "offer-b-salary": "پیشکش B: ماہانہ مجموعی تنخواہ",
    "offer-b-bonus": "پیشکش B: سالانہ بونس",
    "offer-b-exempt": "پیشکش B: ماہانہ ٹیکس سے مستثنیٰ الاؤنس",
    estimate: "تخمینہ",
    "offer-a": "پیشکش A",
    "offer-b": "پیشکش B",
    "annual-gross": "سالانہ مجموعی آمدنی",
    "annual-bonus": "سالانہ بونس",
    "annual-exempt": "سالانہ ٹیکس سے مستثنیٰ الاؤنس",
    "taxable-annual": "سالانہ قابلِ ٹیکس تنخواہ",
    "monthly-tax": "ماہانہ تخمینی ٹیکس",
    "annual-tax": "سالانہ تخمینی ٹیکس",
    "net-monthly": "اوسط ماہانہ نیٹ تنخواہ",
    "net-annual": "سالانہ نیٹ تنخواہ",
    "effective-rate": "مؤثر ٹیکس شرح",
    "package-disclaimer": "یہ تخمینہ صرف تنخواہ کے ٹیکس سلیب استعمال کرتا ہے۔ فوائد، کریڈٹ، دیگر آمدنی اور ذاتی حالات کے باعث اصل رقم مختلف ہو سکتی ہے۔",
    "year-compare-title": "ٹیکس سالوں کا موازنہ",
    "year-compare-intro": "اسی تنخواہ پر پچھلے اور موجودہ ٹیکس سال کے تنخواہی سلیب کے مطابق تخمینی ٹیکس دیکھیں۔",
    "previous-year": "کس ٹیکس سال سے موازنہ کریں",
    "year-compare-note": "یہ صرف تنخواہی آمدنی کا تاریخی تخمینہ ہے۔ شرحوں کو شائع شدہ خلاصوں سے ملایا گیا ہے، یہ قانونی مشورہ نہیں۔ متعلقہ فنانس ایکٹ اور FBR رہنمائی دیکھیں۔",
    "historical-surcharge": "زیادہ آمدنی پر سابقہ سرچارج، اگر لاگو ہو",
    "salary-error": "تنخواہ صفر یا اس سے زیادہ درج کریں۔",
    "bonus-error": "سالانہ بونس صفر یا اس سے زیادہ درج کریں۔",
    "offer-error": "دونوں پیشکشوں کے لیے صفر یا اس سے زیادہ، اور 1 ارب روپے تک رقم درج کریں۔",
    "quiz-title": "تنخواہ ٹیکس کا مختصر کوئز",
    "quiz-intro": "اندازے کے بارے میں اپنی سمجھ جانچیں۔ اس کوئز سے حساب تبدیل نہیں ہوتا۔",
    "quiz-q1": "اس کیلکولیٹر میں ٹیکس سلیب کا تعین کون سی رقم کرتی ہے؟",
    "quiz-q1-a": "سالانہ قابلِ ٹیکس تنخواہ",
    "quiz-q1-b": "ماہانہ نیٹ تنخواہ",
    "quiz-q1-c": "مراعات کی مالیت",
    "quiz-q2": "آمدنی زیادہ ٹیکس سلیب میں پہنچے تو اس سلیب کی شرح کس رقم پر لگتی ہے؟",
    "quiz-q2-a": "آپ کی پوری تنخواہ",
    "quiz-q2-b": "صرف اس سلیب میں آنے والی رقم",
    "quiz-q2-c": "صرف ماہانہ نیٹ تنخواہ",
    "quiz-q3": "یہ اندازہ ماہانہ ٹیکس کیسے دکھاتا ہے؟",
    "quiz-q3-a": "سالانہ ٹیکس کو 12 پر تقسیم کرکے",
    "quiz-q3-b": "سب سے زیادہ ٹیکس شرح کو ماہانہ تنخواہ سے ضرب دے کر",
    "quiz-q3-c": "سب کے لیے ایک مقررہ رقم",
    "quiz-check": "جوابات دیکھیں",
    "quiz-reset": "دوبارہ کوشش کریں",
    "quiz-incomplete": "جمع کرانے سے پہلے تینوں سوالات کے جواب دیں۔",
    "quiz-score": "آپ کے 3 میں سے {score} جواب درست ہیں۔"
  };
  var state = { mode: "g", period: "m", value: 100000, exempt: 0, bonus: 0 };
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
    var opts = { exemptMonthly: state.exempt, annualBonus: state.bonus };
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
    var exemptRaw = el.exempt.value, exemptValue = Number(exemptRaw);
    var bonusRaw = el.bonus.value, bonusValue = Number(bonusRaw);
    var invalidSalary = raw !== "" && (!isFinite(n) || n < 0 || n > MAX_INPUT);
    var invalidExempt = exemptRaw !== "" && (!isFinite(exemptValue) || exemptValue < 0 || exemptValue > MAX_INPUT);
    var invalidBonus = bonusRaw !== "" && (!isFinite(bonusValue) || bonusValue < 0 || bonusValue > MAX_INPUT);
    el.salary.setAttribute("aria-invalid", invalidSalary ? "true" : "false");
    el.exempt.setAttribute("aria-invalid", invalidExempt ? "true" : "false");
    el.bonus.setAttribute("aria-invalid", invalidBonus ? "true" : "false");
    el.err.textContent = invalidSalary ? (language === "ur" ? "تنخواہ صفر یا اس سے زیادہ اور 1 ارب روپے تک درج کریں۔" : "Enter a salary from 0 to Rs. 1,000,000,000.") :
      (invalidExempt ? (language === "ur" ? "مستثنیٰ الاؤنس صفر یا اس سے زیادہ اور 1 ارب روپے تک درج کریں۔" : "Enter a tax-exempt allowance from 0 to Rs. 1,000,000,000.") :
        (invalidBonus ? (language === "ur" ? "بونس صفر یا اس سے زیادہ اور 1 ارب روپے تک درج کریں۔" : "Enter an annual bonus from 0 to Rs. 1,000,000,000.") : ""));
    var invalid = invalidSalary || invalidExempt || invalidBonus;
    el.output.hidden = invalid;
    yearComparison.section.hidden = invalid;
    if (invalid) return null;
    var c = compute(), r = c.r, yearly = state.period === "y";

    // Hero number
    if (state.mode === "n") {
      el.heroLabel.textContent = language === "ur" ?
        (yearly ? urdu["salary-year"] : (state.bonus > 0 ? urdu["salary-month"] + " + بونس" : urdu["salary-month"])) :
        (yearly ? "Gross salary needed per year" :
          (state.bonus > 0 ? "Regular gross salary needed per month, plus bonus" : "Gross salary needed per month"));
      tween("hero", el.hero, yearly ? r.annualSalary : r.monthlyGross, fmt);
    } else {
      el.heroLabel.textContent = language === "ur" ?
        (yearly ? "سالانہ نیٹ تنخواہ" : (state.bonus > 0 ? "بونس سمیت اوسط ماہانہ نیٹ تنخواہ" : "ماہانہ نیٹ تنخواہ")) :
        (yearly ? "Take-home per year" :
          (state.bonus > 0 ? "Average take-home per month, including bonus" : "Take-home per month"));
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
    renderYearComparison();
    return c;
  }

  function renderComparison() {
    var packages = comparison.inputs.map(function (inputs) {
      return inputs.map(function (input) { return input.value; });
    });
    var invalid = packages.some(function (offer) {
      return offer.some(function (value) {
        return value === "" || !isFinite(Number(value)) || Number(value) < 0 || Number(value) > MAX_INPUT;
      });
    });
    comparison.error.textContent = invalid ? (language === "ur" ? urdu["offer-error"] : "Enter amounts from 0 to Rs. 1,000,000,000 for both salary offers.") : "";
    comparison.results.hidden = invalid;
    comparison.summary.textContent = "";
    if (invalid) return;

    var results = packages.map(function (offer) {
      return TaxCalc.salaryTax(Number(offer[0]), SL, {
        annualBonus: Number(offer[1]),
        exemptMonthly: Number(offer[2])
      });
    });
    var rows = [
      results.map(function (r) { return fmt(r.annualSalary); }),
      results.map(function (r) { return fmt(r.annualBonus); }),
      results.map(function (r) { return fmt(r.exemptMonthly * 12); }),
      results.map(function (r) { return fmt(r.annualTaxable); }),
      results.map(function (r) { return fmt(r.monthlyTax); }),
      results.map(function (r) { return fmt(r.annualTax); }),
      results.map(function (r) { return fmt(r.netMonthly); }),
      results.map(function (r) { return fmt(r.netAnnual); }),
      results.map(function (r) { return pct(r.effectiveRate); })
    ];
    rows.forEach(function (row, i) {
      row.forEach(function (value, j) {
        comparison.cells[i][j].textContent = value;
      });
    });

    var difference = Math.abs(results[0].netMonthly - results[1].netMonthly);
    if (difference < 0.01) {
      comparison.summary.textContent = language === "ur" ?
        "دونوں پیشکشوں کی تخمینی ماہانہ نیٹ تنخواہ برابر ہے۔" :
        "Both offers have the same estimated monthly take-home pay.";
    } else {
      var better = results[0].netMonthly > results[1].netMonthly ? "Offer A" : "Offer B";
      comparison.summary.textContent = language === "ur" ?
        (better === "Offer A" ? "پیشکش A" : "پیشکش B") + " کی تخمینی ماہانہ نیٹ تنخواہ " + fmt(difference) + " زیادہ ہے۔" :
        better + " has " + fmt(difference) + " more estimated take-home pay per month.";
    }
  }

  function renderYearComparison() {
    var c = compute(), current = c.r;
    var year = yearComparison.select.value;
    var oldConfig = TaxRates.TAX_YEARS[year];
    var prior = TaxCalc.salaryTax(current.monthlyGross, oldConfig.slabs, {
      annualBonus: state.bonus,
      exemptMonthly: state.exempt,
      surcharge: oldConfig.surcharge
    });
    yearComparison.selectedHeading.textContent = oldConfig.label;
    yearComparison.currentHeading.textContent = TaxRates.TAX_YEAR;
    yearComparison.surcharge[0].textContent = fmt(prior.annualSurcharge);
    yearComparison.surcharge[1].textContent = fmt(current.annualSurcharge);
    yearComparison.cells.annualTax[0].textContent = fmt(prior.annualTax);
    yearComparison.cells.annualTax[1].textContent = fmt(current.annualTax);
    yearComparison.cells.monthlyTax[0].textContent = fmt(prior.monthlyTax);
    yearComparison.cells.monthlyTax[1].textContent = fmt(current.monthlyTax);
    yearComparison.cells.netAnnual[0].textContent = fmt(prior.netAnnual);
    yearComparison.cells.netAnnual[1].textContent = fmt(current.netAnnual);
    yearComparison.cells.effectiveRate[0].textContent = pct(prior.effectiveRate);
    yearComparison.cells.effectiveRate[1].textContent = pct(current.effectiveRate);

    var difference = prior.annualTax - current.annualTax;
    if (Math.abs(difference) < 0.01) {
      yearComparison.summary.textContent = language === "ur" ?
        "دونوں ٹیکس سالوں میں تخمینی سالانہ ٹیکس برابر ہے۔" :
        "Estimated annual tax is the same in both tax years.";
    } else if (difference > 0) {
      yearComparison.summary.textContent = language === "ur" ?
        TaxRates.TAX_YEAR + " میں تخمینی سالانہ ٹیکس " + fmt(difference) + " کم ہے۔" :
        "Estimated annual tax is " + fmt(difference) + " lower in " + TaxRates.TAX_YEAR + " than in " + year + ".";
    } else {
      yearComparison.summary.textContent = language === "ur" ?
        TaxRates.TAX_YEAR + " میں تخمینی سالانہ ٹیکس " + fmt(Math.abs(difference)) + " زیادہ ہے۔" :
        "Estimated annual tax is " + fmt(Math.abs(difference)) + " higher in " + TaxRates.TAX_YEAR + " than in " + year + ".";
    }
  }

  function renderPrintSummary() {
    var c = compute(), r = c.r;
    var date = new Date().toLocaleDateString();
    el.printAssumptions.textContent = "Tax year " + TaxRates.TAX_YEAR + " | Prepared " + date +
      " | Estimates use the salaried slabs; any annual bonus entered is treated as taxable salary.";
    el.printResults.textContent = "";

    function addRow(label, value) {
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      var td = document.createElement("td");
      th.scope = "row";
      th.textContent = label;
      td.textContent = value;
      tr.appendChild(th);
      tr.appendChild(td);
      el.printResults.appendChild(tr);
    }

    addRow("Regular gross salary per month", fmt(r.monthlyGross));
    addRow("Regular gross salary per year", fmt(r.monthlyGross * 12));
    addRow("Annual bonus or irregular salary", fmt(r.annualBonus));
    addRow("Total annual gross salary", fmt(r.annualSalary));
    addRow("Tax-free allowance per month", fmt(r.exemptMonthly));
    addRow("Annual taxable salary", fmt(r.annualTaxable));
    addRow("Estimated tax per month (annual tax divided by 12)", fmt(r.monthlyTax));
    addRow("Estimated tax per year", fmt(r.annualTax));
    addRow("Average take-home per month", fmt(r.netMonthly));
    addRow("Take-home per year", fmt(r.netAnnual));
    addRow("Effective tax rate", pct(r.effectiveRate));

    el.printBreakdown.textContent = "";
    r.breakdown.forEach(function (row) {
      var tr = document.createElement("tr");
      var range = row.from === 0 ? "Up to " + fmt(row.to) :
        (row.to === Infinity ? "Above " + fmt(row.from) : fmt(row.from + 1) + " to " + fmt(row.to));
      [range, Math.round(row.rate * 100) + "%", fmt(row.amount), fmt(row.tax)].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      el.printBreakdown.appendChild(tr);
    });
  }

  function applyLanguage() {
    var localized = document.querySelectorAll(".localized");
    for (var i = 0; i < localized.length; i++) {
      localized[i].dir = language === "ur" ? "rtl" : "ltr";
      localized[i].lang = language;
    }
    var textNodes = document.querySelectorAll("[data-i18n]");
    for (var j = 0; j < textNodes.length; j++) {
      var key = textNodes[j].dataset.i18n;
      if (!textNodes[j].hasAttribute("data-i18n-en")) {
        textNodes[j].dataset.i18nEn = textNodes[j].textContent;
      }
      if (language === "ur" && urdu[key]) {
        textNodes[j].textContent = urdu[key];
      } else {
        textNodes[j].textContent = textNodes[j].dataset.i18nEn;
      }
    }
    var ariaNodes = document.querySelectorAll("[data-i18n-aria]");
    for (var k = 0; k < ariaNodes.length; k++) {
      var ariaKey = ariaNodes[k].dataset.i18nAria;
      ariaNodes[k].setAttribute("aria-label", language === "ur" && urdu[ariaKey] ?
        urdu[ariaKey] : ariaKey === "mode-group" ? "What do you know?" : "Period");
    }
    languageToggle.textContent = language === "ur" ? "English" : "اردو";
    languageToggle.setAttribute("aria-pressed", language === "ur" ? "true" : "false");
  }

  function syncUi() {
    var yearly = state.period === "y", net = state.mode === "n";
    if (language === "ur") {
      el.label.textContent = net ?
        (yearly ? urdu["net-year"] : urdu["net-month"]) :
        (yearly ? urdu["salary-year"] : urdu["salary-month"]);
      el.hint.textContent = net ? urdu["net-hint"] : urdu["salary-hint"];
    } else {
      el.label.textContent = (net ? "Take-home you want " : "Gross salary ") + (yearly ? "per year" : "per month");
      el.hint.textContent = net ? "We work backwards to the gross salary that leaves you this much after tax." : "The salary before tax, as written in your offer letter or payslip.";
    }
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

  function shareUrl() {
    var url = new URL(location.origin + location.pathname);
    url.searchParams.set("s", String(Math.round(TaxCalc.clean(state.value))));
    if (state.period === "y") url.searchParams.set("p", "y");
    if (state.mode === "n") url.searchParams.set("mode", "n");
    if (state.exempt > 0) url.searchParams.set("e", String(Math.round(state.exempt)));
    if (state.bonus > 0) url.searchParams.set("b", String(Math.round(state.bonus)));
    return url.href;
  }

  function readUrl() {
    var q = new URLSearchParams(location.search);
    if (q.has("s")) state.value = TaxCalc.clean(q.get("s"));
    if (q.get("p") === "y") state.period = "y";
    if (q.get("mode") === "n") state.mode = "n";
    if (q.has("e")) state.exempt = TaxCalc.clean(q.get("e"));
    if (q.has("b")) state.bonus = TaxCalc.clean(q.get("b"));
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
      "Annual bonus or irregular salary: " + fmt(r.annualBonus) + "\n" +
      "Total annual gross salary: " + fmt(r.annualSalary) + "\n" +
      "Monthly tax: " + fmt(r.monthlyTax) + "\n" +
      "Annual tax: " + fmt(r.annualTax) + "\n" +
      (r.annualBonus > 0 ? "Average take-home: " : "Take-home: ") + fmt(r.netMonthly) + " per month\n" +
      "Effective tax rate: " + pct(r.effectiveRate) + "\n" +
      "Estimate only: " + location.origin + location.pathname;
  }

  // Events
  el.salary.addEventListener("input", function () { state.value = el.salary.value === "" ? 0 : Number(el.salary.value); render(); });
  el.exempt.addEventListener("input", function () { state.exempt = el.exempt.value === "" ? 0 : TaxCalc.clean(el.exempt.value); render(); });
  el.bonus.addEventListener("input", function () { state.bonus = el.bonus.value === "" ? 0 : Number(el.bonus.value); render(); });
  comparison.inputs.forEach(function (offer) {
    offer.forEach(function (input) {
      input.addEventListener("input", renderComparison);
    });
  });
  yearComparison.select.addEventListener("change", renderYearComparison);
  quiz.addEventListener("submit", function (event) {
    event.preventDefault();
    var answers = ["a", "b", "a"], score = 0, complete = true;
    answers.forEach(function (answer, i) {
      var selected = quiz.querySelector('input[name="quiz-q' + (i + 1) + '"]:checked');
      if (!selected) complete = false;
      else if (selected.value === answer) score++;
    });
    if (!complete) {
      quizResult.textContent = language === "ur" ? urdu["quiz-incomplete"] :
        "Answer all three questions before checking your score.";
      return;
    }
    quizResult.textContent = language === "ur" ?
      urdu["quiz-score"].replace("{score}", score) :
      "You got " + score + " out of 3 correct.";
  });
  quiz.addEventListener("reset", function () { quizResult.textContent = ""; });
  languageToggle.addEventListener("click", function () {
    language = language === "en" ? "ur" : "en";
    applyLanguage();
    syncUi();
    render();
    renderComparison();
  });
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
    else if (b.id === "copy") {
      render();
      if (el.err.textContent) return;
      copyText(summary(), "Result copied");
    }
    else if (b.id === "print-report") {
      render();
      if (el.err.textContent) return;
      renderPrintSummary();
      window.print();
    }
    else if (b.id === "share") {
      render();
      if (el.err.textContent) return;
      var url = shareUrl();
      if (navigator.share) navigator.share({ title: document.title, text: summary(), url: url })
        .catch(function () { toast("Share cancelled or unavailable."); });
      else copyText(url, "Link copied");
    }
    else if (b.id === "reset") {
      state = { mode: "g", period: "m", value: 100000, exempt: 0, bonus: 0 };
      el.salary.value = 100000; el.exempt.value = ""; el.bonus.value = ""; syncUi(); render(); toast("Reset");
    }
  });

  readUrl();
  el.salary.value = state.value;
  el.exempt.value = state.exempt > 0 ? state.exempt : "";
  el.bonus.value = state.bonus > 0 ? state.bonus : "";
  applyLanguage();
  syncUi();
  render();
  renderComparison();
})();
