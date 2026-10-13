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
t("grossFromNet ghalat input", () => {
  [0, -1, "x", NaN].forEach((v) => assert.strictEqual(C.grossFromNet(v, R.SALARIED_SLABS), 0));
});

console.log("\n" + pass + " tests pass");
