(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Nav: scroll state + mobile toggle                                  */
  /* ------------------------------------------------------------------ */
  var nav = document.getElementById("siteNav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var progress = document.getElementById("scrollProgress");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle("is-scrolled", y > 20);

    var doc = document.documentElement;
    var scrollTop = y;
    var scrollHeight = doc.scrollHeight - doc.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progress.style.width = pct + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", function () {
    nav.classList.toggle("is-open");
  });
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("is-open"); });
  });

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                      */
  /* ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll("[data-reveal]");
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var siblingsBefore = Array.prototype.indexOf.call(
          el.parentElement ? el.parentElement.children : [],
          el
        );
        el.style.transitionDelay = (Math.min(siblingsBefore, 6) * 70) + "ms";
        el.classList.add("is-visible");
        revealObserver.unobserve(el);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
  revealEls.forEach(function (el) { revealObserver.observe(el); });

  /* ------------------------------------------------------------------ */
  /* Stat counters                                                      */
  /* ------------------------------------------------------------------ */
  var statEls = document.querySelectorAll(".stat-number");
  var statObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1400;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var progressT = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progressT, 3);
        var value = Math.round(eased * target);
        el.textContent = value + suffix;
        if (progressT < 1) {
          requestAnimationFrame(step);
        } else {
          el.classList.add("is-counting");
        }
      }
      requestAnimationFrame(step);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  statEls.forEach(function (el) { statObserver.observe(el); });

  /* ------------------------------------------------------------------ */
  /* Process line draw                                                  */
  /* ------------------------------------------------------------------ */
  var processTrack = document.getElementById("processTrack");
  if (processTrack) {
    var processObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          processTrack.classList.add("is-drawn");
          processObserver.unobserve(processTrack);
        }
      });
    }, { threshold: 0.35 });
    processObserver.observe(processTrack);
  }

  /* ------------------------------------------------------------------ */
  /* Split section parallax (desktop only, mouse-driven)                */
  /* ------------------------------------------------------------------ */
  var splitVisual = document.getElementById("splitVisual");
  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (splitVisual && !isTouch) {
    var cards = splitVisual.querySelectorAll(".float-card");
    splitVisual.addEventListener("mousemove", function (e) {
      var rect = splitVisual.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      cards.forEach(function (card, i) {
        var depth = (i + 1) * 6;
        card.style.transform = "translate(" + (relX * depth) + "px, " + (relY * depth) + "px)";
      });
    });
    splitVisual.addEventListener("mouseleave", function () {
      cards.forEach(function (card) { card.style.transform = "translate(0,0)"; });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero glow follows cursor (desktop only)                            */
  /* ------------------------------------------------------------------ */
  var heroGlow = document.getElementById("heroGlow");
  var heroSection = document.querySelector(".hero");
  if (heroGlow && heroSection && !isTouch) {
    heroSection.addEventListener("mousemove", function (e) {
      var rect = heroSection.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      heroGlow.style.transform = "translate(" + (x - 350) + "px, " + (y - 350) + "px)";
    });
  }

  /* ------------------------------------------------------------------ */
  /* ASCII / dot data-map canvas                                        */
  /* Draws an abstract "data topology" — a soft field of characters     */
  /* clustered into continent-like blobs, twinkling gently over time.   */
  /* ------------------------------------------------------------------ */
  function initDataMap(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cellSize = 16;
    var chars = ["·", "+", "•"];
    var blobs = [];
    var cols, rows, cellData;

    function seededBlobs(w, h) {
      var count = Math.max(4, Math.round((w * h) / 260000));
      var arr = [];
      for (var i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.9 + h * 0.05,
          r: Math.random() * 160 + 90,
          seed: Math.random() * 1000
        });
      }
      return arr;
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(rect.width / cellSize);
      rows = Math.ceil(rect.height / cellSize);
      blobs = seededBlobs(rect.width, rect.height);

      cellData = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var px = c * cellSize;
          var py = r * cellSize;
          var density = 0;
          for (var b = 0; b < blobs.length; b++) {
            var blob = blobs[b];
            var dx = px - blob.x;
            var dy = py - blob.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var falloff = Math.max(0, 1 - dist / blob.r);
            density += falloff * falloff;
          }
          if (density > 0.12) {
            cellData.push({
              x: px, y: py,
              density: Math.min(density, 1),
              phase: Math.random() * Math.PI * 2,
              speed: 0.6 + Math.random() * 0.8,
              char: chars[Math.floor(Math.random() * chars.length)]
            });
          }
        }
      }
    }

    var t = 0;
    function draw() {
      var rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle";
      for (var i = 0; i < cellData.length; i++) {
        var cell = cellData[i];
        var twinkle = (Math.sin(t * cell.speed + cell.phase) + 1) / 2;
        var alpha = cell.density * (0.15 + twinkle * 0.35);
        ctx.fillStyle = "rgba(65,65,252," + alpha.toFixed(3) + ")";
        ctx.fillText(cell.char, cell.x, cell.y);
      }
      t += 0.02;
      requestAnimationFrame(draw);
    }

    resize();
    draw();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });
  }

  initDataMap(document.getElementById("heroMap"));
  initDataMap(document.getElementById("ctaMap"));

  /* ------------------------------------------------------------------ */
  /* Smooth-scroll offset correction for fixed nav (native scroll-margin
     handles most cases; this just ensures the mobile menu closes first) */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length > 1) {
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
})();
