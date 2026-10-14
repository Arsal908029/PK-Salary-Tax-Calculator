/* Sirf rates aur source yahan hain. Har budget ke baad sirf yehi file badlein. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TaxRates = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var currentSlabs = [
    { from: 0,       base: 0,       rate: 0 },
    { from: 600000,  base: 0,       rate: 0.01 },
    { from: 1200000, base: 6000,    rate: 0.11 },
    { from: 2200000, base: 116000,  rate: 0.20 },
    { from: 3200000, base: 316000,  rate: 0.25 },
    { from: 4100000, base: 541000,  rate: 0.29 },
    { from: 5600000, base: 976000,  rate: 0.32 },
    { from: 7000000, base: 1424000, rate: 0.35 }
  ];
  var previousSlabs = [
    { from: 0,       base: 0,      rate: 0 },
    { from: 600000,  base: 0,      rate: 0.01 },
    { from: 1200000, base: 6000,   rate: 0.11 },
    { from: 2200000, base: 116000, rate: 0.23 },
    { from: 3200000, base: 346000, rate: 0.30 },
    { from: 4100000, base: 616000, rate: 0.35 }
  ];
  return {
    TAX_YEAR: "2026-27",
    LAST_UPDATED: "2026-10-13",
    TAX_YEARS: {
      "2025-26": {
        label: "2025-26",
        slabs: previousSlabs,
        surcharge: { threshold: 10000000, rate: 0.09 },
        sources: [
          { name: "Institute of Corporate and Taxation: 2025-26 salaried slabs", url: "https://www.ict.edu.pk/blogs/income-tax-slabs-pakistan-2025-26" },
          { name: "TaxCalc.pk: 2025-26 vs 2026-27 comparison", url: "https://taxcalc.pk/compare-tax-years" }
        ]
      },
      "2026-27": {
        label: "2026-27",
        slabs: currentSlabs,
        sources: [
          { name: "Institute of Corporate and Taxation: 2026-27 salaried slabs", url: "https://www.ict.edu.pk/blogs/income-tax-slabs-salaried-individuals-pakistan" },
          { name: "TaxCalc.pk: 2025-26 vs 2026-27 comparison", url: "https://taxcalc.pk/compare-tax-years" }
        ]
      }
    },
    // Cross-check published rates against the enacted Finance Act before using for filing.
    SOURCES: [
      { name: "Pakistan Observer", url: "https://pakobserver.net/new-tax-slabs-for-salaried-persons-in-pakistan-as-fy2026-27-begins/" },
      { name: "FBR Tax Slabs 2026-27 (taxcalcpk.com)", url: "https://taxcalcpk.com/tax-slabs-pakistan-2026-27" },
      { name: "ICT Blog", url: "https://www.ict.edu.pk/blogs/income-tax-slabs-salaried-individuals-pakistan" }
    ],
    // from = slab start, base = fixed tax to that point, rate = rate on excess
    SALARIED_SLABS: currentSlabs
  };
});
