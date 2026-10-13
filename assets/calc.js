/* Hisaab ka function. Browser aur Node dono mein chalta hai (tests ke liye). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TaxCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var MAX_MONTHLY = 1e9; // bohot bade number se bachao

  function clean(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) return 0;
    return Math.min(n, MAX_MONTHLY);
  }

  // Annual taxable salary par tax (slabs: from, base, rate)
  function annualTax(annualSalary, slabs) {
    var slab = slabs[0];
    for (var i = 0; i < slabs.length; i++) {
      if (annualSalary > slabs[i].from) slab = slabs[i];
    }
    return slab.base + (annualSalary - slab.from) * slab.rate;
  }

  // Annual income kis slab mein hai (0 se shuru)
  function slabIndex(annualSalary, slabs) {
    var idx = 0;
    for (var i = 0; i < slabs.length; i++) {
      if (annualSalary > slabs[i].from) idx = i;
    }
    return idx;
  }

  // Har slab mein kitni income aayi aur us par kitna tax (breakdown table ke liye)
  function breakdown(annualSalary, slabs) {
    var rows = [];
    for (var i = 0; i < slabs.length; i++) {
      var lo = slabs[i].from;
      var hi = i + 1 < slabs.length ? slabs[i + 1].from : Infinity;
      if (annualSalary <= lo) break;
      var part = Math.min(annualSalary, hi) - lo;
      rows.push({ from: lo, to: hi, rate: slabs[i].rate, amount: part, tax: part * slabs[i].rate });
    }
    return rows;
  }

  // opts.exemptMonthly: monthly salary ka woh hissa jis par tax nahi lagta (allowances)
  function salaryTax(monthlyGross, slabs, opts) {
    var monthly = clean(monthlyGross);
    var exempt = Math.min(clean(opts && opts.exemptMonthly), monthly);
    var taxableMonthly = monthly - exempt;
    var annual = monthly * 12;
    var taxable = taxableMonthly * 12;
    var tax = annualTax(taxable, slabs);
    var idx = slabIndex(taxable, slabs);
    return {
      monthlyGross: monthly,
      exemptMonthly: exempt,
      annualSalary: annual,
      annualTaxable: taxable,
      annualTax: tax,
      monthlyTax: tax / 12,
      netMonthly: monthly - tax / 12,
      netAnnual: annual - tax,
      effectiveRate: annual > 0 ? tax / annual : 0,
      slabIndex: idx,
      marginalRate: slabs[idx].rate,
      breakdown: breakdown(taxable, slabs)
    };
  }

  // Ulta hisaab: monthly take-home se monthly gross nikalna (bisection)
  function grossFromNet(targetNetMonthly, slabs, opts) {
    var target = clean(targetNetMonthly);
    if (target === 0) return 0;
    var lo = target, hi = Math.min(target * 3 + 1000, MAX_MONTHLY);
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      if (salaryTax(mid, slabs, opts).netMonthly < target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  return {
    annualTax: annualTax, salaryTax: salaryTax, breakdown: breakdown,
    slabIndex: slabIndex, grossFromNet: grossFromNet, clean: clean
  };
});
