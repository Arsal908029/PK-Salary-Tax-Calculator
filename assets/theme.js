/* Theme controls; saved preference is applied inline before styles render. */
(function () {
  var KEY = "pktt-theme", root = document.documentElement;
  function isDark() {
    var a = root.getAttribute("data-theme");
    if (a) return a === "dark";
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("theme");
    if (!b) return;
    b.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      window.dispatchEvent(new Event("themechange"));
    });
  });
})();
