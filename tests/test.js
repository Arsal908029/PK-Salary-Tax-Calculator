// Chalane ka tareeqa: node tests/test.js
const assert = require("assert");
const R = require("../assets/rates.js");
const C = require("../assets/calc.js");

let pass = 0;
function t(name, fn) { fn(); pass++; console.log("PASS", name); }
const tax = (m) => Math.round(C.salaryTax(m, R.SALARIED_SLABS).annualTax);

// Haath ke hisaab (workflow ki Step 6 table + 150k)
t("50,000/mahina -> 0", () => assert.strictEqual(tax(50000), 0));
t("100,000/mahina -> 6,000", () => assert.strictEqual(tax(100000), 6000));
t("150,000/mahina -> 72,000", () => assert.strictEqual(tax(150000), 72000));
t("200,000/mahina -> 156,000", () => assert.strictEqual(tax(200000), 156000));
t("500,000/mahina -> 1,104,000", () => assert.strictEqual(tax(500000), 1104000));

// Hadd (boundary) ke qareeb: slab ki hadd par dono taraf ka tax barabar hona chahiye
t("hadd par continuity", () => {
  R.SALARIED_SLABS.slice(1).forEach((s) => {
    const prev = R.SALARIED_SLABS[R.SALARIED_SLABS.indexOf(s) - 1];
    const atEdge = prev.base + (s.from - prev.from) * prev.rate;
    assert.ok(Math.abs(atEdge - s.base) < 1e-6, "slab " + s.from + " ka base ghalat");
  });
});
t("historical and current tax-year slabs are continuous", () => {
  Object.keys(R.TAX_YEARS).forEach((year) => {
    const slabs = R.TAX_YEARS[year].slabs;
    slabs.slice(1).forEach((s, i) => {
      const prev = slabs[i];
      const atEdge = prev.base + (s.from - prev.from) * prev.rate;
      assert.ok(Math.abs(atEdge - s.base) < 1e-6, year + " slab " + s.from + " ka base ghalat");
    });
  });
});

// Ghalat input
t("khali/0/negative/text -> 0", () => {
  [ "", 0, -5000, "abc", null, undefined, NaN ].forEach((v) => assert.strictEqual(tax(v), 0));
});
t("lamba number crash nahi karta", () => {
  const r = C.salaryTax(1e30, R.SALARIED_SLABS);
  assert.ok(isFinite(r.annualTax));
});

// Breakdown ka jama == total tax
t("breakdown ka jama == annual tax", () => {
  [75000, 123456, 350000, 900000].forEach((m) => {
    const r = C.salaryTax(m, R.SALARIED_SLABS);
    const sum = r.breakdown.reduce((a, b) => a + b.tax, 0);
    assert.ok(Math.abs(sum - r.annualTax) < 1e-6);
  });
});

// Net + tax = gross
t("net + tax = gross", () => {
  const r = C.salaryTax(200000, R.SALARIED_SLABS);
  assert.ok(Math.abs(r.netMonthly + r.monthlyTax - 200000) < 1e-6);
});

// Naye features
t("exempt allowance: 150k gross, 50k exempt -> tax 6,000", () => {
  const r = C.salaryTax(150000, R.SALARIED_SLABS, { exemptMonthly: 50000 });
  assert.strictEqual(Math.round(r.annualTax), 6000);
  assert.strictEqual(Math.round(r.netMonthly), 149500);
});
t("exempt gross se zyada ho to tax 0", () => {
  assert.strictEqual(C.salaryTax(40000, R.SALARIED_SLABS, { exemptMonthly: 90000 }).annualTax, 0);
});
t("annual bonus is included in annual taxable salary", () => {
  const r = C.salaryTax(100000, R.SALARIED_SLABS, { annualBonus: 300000 });
  assert.strictEqual(r.annualSalary, 1500000);
  assert.strictEqual(r.annualTaxable, 1500000);
  assert.strictEqual(Math.round(r.annualTax), 39000);
  assert.strictEqual(Math.round(r.netMonthly), 121750);
});
t("2025-26 and 2026-27 tax-year comparison", () => {
  const salary = 200000;
  const priorTax = C.salaryTax(salary, R.TAX_YEARS["2025-26"].slabs).annualTax;
  const currentTax = C.salaryTax(salary, R.TAX_YEARS["2026-27"].slabs).annualTax;
  assert.strictEqual(Math.round(priorTax), 162000);
  assert.strictEqual(Math.round(currentTax), 156000);
  assert.strictEqual(Math.round(priorTax - currentTax), 6000);
});
t("2025-26 high-income comparison includes reported salary surcharge", () => {
  const prior = C.salaryTax(1000000, R.TAX_YEARS["2025-26"].slabs, {
    surcharge: R.TAX_YEARS["2025-26"].surcharge
  });
  const current = C.salaryTax(1000000, R.TAX_YEARS["2026-27"].slabs);
  assert.strictEqual(prior.annualSurcharge, 304290);
  assert.strictEqual(prior.annualTax, 3685290);
  assert.strictEqual(current.annualSurcharge, 0);
});
t("salary package estimate includes allowance and bonus", () => {
  const r = C.salaryTax(200000, R.SALARIED_SLABS, {
    annualBonus: 300000,
    exemptMonthly: 20000
  });
  assert.strictEqual(r.annualSalary, 2700000);
  assert.strictEqual(r.annualTaxable, 2460000);
  assert.strictEqual(Math.round(r.annualTax), 168000);
});
t("slabIndex aur marginalRate", () => {
  assert.strictEqual(C.salaryTax(50000, R.SALARIED_SLABS).slabIndex, 0);
  assert.strictEqual(C.salaryTax(100000, R.SALARIED_SLABS).slabIndex, 1);
  assert.strictEqual(C.salaryTax(200000, R.SALARIED_SLABS).marginalRate, 0.20);
  assert.strictEqual(C.salaryTax(900000, R.SALARIED_SLABS).slabIndex, 7);
});
t("take-home se gross wapas aata hai (roundtrip)", () => {
  [50000, 99500, 187000, 408000, 1500000].forEach((m) => {
    const net = C.salaryTax(m, R.SALARIED_SLABS).netMonthly;
    assert.ok(Math.abs(C.grossFromNet(net, R.SALARIED_SLABS) - m) < 0.01, "roundtrip " + m);
  });
});
t("roundtrip exempt ke saath", () => {
  const o = { exemptMonthly: 30000 };
  const net = C.salaryTax(250000, R.SALARIED_SLABS, o).netMonthly;
  assert.ok(Math.abs(C.grossFromNet(net, R.SALARIED_SLABS, o) - 250000) < 0.01);
});
t("take-home roundtrip with annual bonus", () => {
  const o = { annualBonus: 300000 };
  const net = C.salaryTax(100000, R.SALARIED_SLABS, o).netMonthly;
  assert.ok(Math.abs(C.grossFromNet(net, R.SALARIED_SLABS, o) - 100000) < 0.01);
});
t("comparing 150k and 200k monthly offers", () => {
  const a = C.salaryTax(150000, R.SALARIED_SLABS);
  const b = C.salaryTax(200000, R.SALARIED_SLABS);
  assert.strictEqual(Math.round(a.netMonthly), 144000);
  assert.strictEqual(Math.round(b.netMonthly), 187000);
  assert.strictEqual(Math.round(b.annualTax - a.annualTax), 84000);
});
t("grossFromNet ghalat input", () => {
  [0, -1, "x", NaN].forEach((v) => assert.strictEqual(C.grossFromNet(v, R.SALARIED_SLABS), 0));
});

console.log("\n" + pass + " tests pass");
