/* ==========================================================================
   BD CARMET — interactions & cinematic canvas scenes
   ========================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  window.addEventListener('load', function () {
    setTimeout(function () {
      document.body.classList.remove('is-loading');
    }, prefersReduced ? 0 : 1200);
  });
  // Safety: never trap the user behind the preloader.
  setTimeout(function () {
    document.body.classList.remove('is-loading');
  }, 4000);

  /* ---------- Nav ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');

  function onScrollNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  burger.addEventListener('click', function () {
    var open = navLinks.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      navLinks.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1800;
    var start = null;
    function fmt(n) {
      return n.toLocaleString('en-US').replace(/,/g, ' ');
    }
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    if (prefersReduced) {
      el.textContent = fmt(target) + suffix;
    } else {
      requestAnimationFrame(frame);
    }
  }
  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) {
    countObserver.observe(el);
  });

  /* ---------- Parallax ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function applyParallax() {
    ticking = false;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      var center = rect.top + rect.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (center * speed * -1).toFixed(1) + 'px,0)';
    });
  }
  if (!prefersReduced && parallaxEls.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyParallax);
      }
    }, { passive: true });
    applyParallax();
  }

  /* ---------- Blueprint grids inside project SVGs ---------- */
  document.querySelectorAll('.bp-grid').forEach(function (g) {
    var ns = 'http://www.w3.org/2000/svg';
    var html = '';
    for (var x = 0; x <= 400; x += 40) {
      html += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="300" stroke="rgba(125,135,148,0.10)" stroke-width="0.5"/>';
    }
    for (var y = 0; y <= 300; y += 40) {
      html += '<line x1="0" y1="' + y + '" x2="400" y2="' + y + '" stroke="rgba(125,135,148,0.10)" stroke-width="0.5"/>';
    }
    g.innerHTML = html;
    void ns;
  });

  /* ---------- Contact form (mailto handoff, no backend) ---------- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var msg = form.message.value.trim();
    if (!name || !email || !msg) {
      note.textContent = '// Please fill in name, email and project brief.';
      note.style.color = '#ff7a1a';
      return;
    }
    var subject = encodeURIComponent('[BD Carmet] Quote request — ' + form.type.value);
    var body = encodeURIComponent(
      'Name: ' + name + '\nEmail: ' + email + '\nProject type: ' + form.type.value + '\n\n' + msg
    );
    window.location.href = 'mailto:office@bdcarmet.com?subject=' + subject + '&body=' + body;
    note.style.color = '';
    note.textContent = '// Opening your email client — we reply within 48h.';
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = String(new Date().getFullYear());

  /* ==========================================================================
     CANVAS SCENE HELPERS
     ========================================================================== */

  function setupCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return {
      ctx: ctx,
      size: function () { return { w: w, h: h }; }
    };
  }

  // Only run a scene's rAF loop while its canvas is on screen.
  function runWhenVisible(canvas, tick) {
    var running = false;
    var rafId = 0;
    var last = 0;
    function loop(ts) {
      if (!running) return;
      var dt = Math.min((ts - last) / 1000, 0.05) || 0.016;
      last = ts;
      tick(dt, ts / 1000);
      rafId = requestAnimationFrame(loop);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !running) {
          running = true;
          last = performance.now();
          rafId = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(rafId);
        }
      });
    }, { threshold: 0.01 });
    io.observe(canvas);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ==========================================================================
     HERO SCENE — cinematic MIG weld along a seam
     ========================================================================== */

  (function heroWeldScene() {
    var canvas = document.getElementById('weldCanvas');
    if (!canvas) return;
    var s = setupCanvas(canvas);
    var ctx = s.ctx;

    if (prefersReduced) {
      // Static frame: ambient lighting only.
      var dim = s.size();
      var grd = ctx.createRadialGradient(dim.w * 0.7, dim.h * 0.75, 0, dim.w * 0.7, dim.h * 0.75, dim.w * 0.5);
      grd.addColorStop(0, 'rgba(255,122,26,0.10)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, dim.w, dim.h);
      return;
    }

    var sparks = [];
    var smoke = [];
    var weldT = 0;          // 0..1 position along the seam
    var weldDir = 1;
    var arcFlicker = 1;

    function weldPoint(dim) {
      // Seam: gentle curve across the lower third of the screen.
      var x = dim.w * (0.12 + 0.76 * weldT);
      var y = dim.h * 0.72 + Math.sin(weldT * Math.PI * 2.2) * dim.h * 0.025;
      return { x: x, y: y };
    }

    function spawnSparks(p, dt) {
      var n = Math.round(rand(2, 6) * (dt * 60));
      for (var i = 0; i < n && sparks.length < 320; i++) {
        var a = rand(-Math.PI, 0) * 0.9 - 0.15; // mostly upward fan
        var sp = rand(60, 460);
        sparks.push({
          x: p.x, y: p.y,
          vx: Math.cos(a) * sp + weldDir * 40,
          vy: Math.sin(a) * sp,
          life: rand(0.4, 1.6),
          age: 0,
          r: rand(0.6, 1.9)
        });
      }
      if (Math.random() < dt * 2.4 && smoke.length < 26) {
        smoke.push({
          x: p.x + rand(-8, 8), y: p.y - rand(0, 10),
          vx: rand(-6, 6), vy: rand(-30, -14),
          life: rand(2.5, 4.5), age: 0,
          r: rand(14, 34)
        });
      }
    }

    function sparkColor(t) {
      // white -> yellow -> orange -> deep red
      if (t < 0.15) return 'rgba(255,255,245,' + (1 - t) + ')';
      if (t < 0.45) return 'rgba(255,196,90,' + (1 - t * 0.8) + ')';
      if (t < 0.75) return 'rgba(255,122,26,' + (1 - t * 0.9) + ')';
      return 'rgba(180,40,12,' + Math.max(1 - t, 0) + ')';
    }

    runWhenVisible(canvas, function (dt, time) {
      var dim = s.size();
      ctx.clearRect(0, 0, dim.w, dim.h);

      // Move the torch.
      weldT += weldDir * dt * 0.055;
      if (weldT > 1) { weldT = 1; weldDir = -1; }
      if (weldT < 0) { weldT = 0; weldDir = 1; }
      var p = weldPoint(dim);

      arcFlicker += (rand(0.55, 1.25) - arcFlicker) * 0.5;

      // --- Ambient industrial lighting (blue left / orange right) ---
      var blue = ctx.createRadialGradient(dim.w * 0.08, dim.h * 0.25, 0, dim.w * 0.08, dim.h * 0.25, dim.w * 0.55);
      blue.addColorStop(0, 'rgba(46,155,255,0.10)');
      blue.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = blue;
      ctx.fillRect(0, 0, dim.w, dim.h);

      // --- Seam line: already-welded part glows faintly ---
      ctx.save();
      ctx.beginPath();
      var steps = 60;
      for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        var sx = dim.w * (0.12 + 0.76 * t);
        var sy = dim.h * 0.72 + Math.sin(t * Math.PI * 2.2) * dim.h * 0.025;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = 'rgba(110,120,132,0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Hot trail behind the torch.
      ctx.beginPath();
      var trailLen = 0.1;
      var t0 = weldDir > 0 ? Math.max(weldT - trailLen, 0) : weldT;
      var t1 = weldDir > 0 ? weldT : Math.min(weldT + trailLen, 1);
      for (var j = 0; j <= 20; j++) {
        var tt = t0 + (t1 - t0) * (j / 20);
        var tx = dim.w * (0.12 + 0.76 * tt);
        var ty = dim.h * 0.72 + Math.sin(tt * Math.PI * 2.2) * dim.h * 0.025;
        if (j === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      }
      ctx.strokeStyle = 'rgba(255,122,26,0.55)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255,122,26,0.9)';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();

      // --- Smoke (drawn under the arc) ---
      ctx.save();
      for (var k = smoke.length - 1; k >= 0; k--) {
        var sm = smoke[k];
        sm.age += dt;
        if (sm.age > sm.life) { smoke.splice(k, 1); continue; }
        sm.x += sm.vx * dt;
        sm.y += sm.vy * dt;
        sm.r += dt * 10;
        var sa = (1 - sm.age / sm.life) * 0.05;
        var g = ctx.createRadialGradient(sm.x, sm.y, 0, sm.x, sm.y, sm.r);
        g.addColorStop(0, 'rgba(170,180,190,' + sa + ')');
        g.addColorStop(1, 'rgba(170,180,190,0)');
        ctx.fillStyle = g;
        ctx.fillRect(sm.x - sm.r, sm.y - sm.r, sm.r * 2, sm.r * 2);
      }
      ctx.restore();

      // --- Arc glow ---
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var glowR = dim.h * 0.22 * arcFlicker;
      var arc = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      arc.addColorStop(0, 'rgba(220,242,255,' + 0.85 * arcFlicker + ')');
      arc.addColorStop(0.12, 'rgba(120,200,255,' + 0.5 * arcFlicker + ')');
      arc.addColorStop(0.4, 'rgba(46,155,255,' + 0.16 * arcFlicker + ')');
      arc.addColorStop(1, 'rgba(46,155,255,0)');
      ctx.fillStyle = arc;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Molten pool.
      var pool = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
      pool.addColorStop(0, 'rgba(255,255,250,0.95)');
      pool.addColorStop(0.5, 'rgba(255,180,71,0.8)');
      pool.addColorStop(1, 'rgba(255,122,26,0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // --- Sparks ---
      spawnSparks(p, dt);
      for (var m = sparks.length - 1; m >= 0; m--) {
        var sp = sparks[m];
        sp.age += dt;
        if (sp.age > sp.life) { sparks.splice(m, 1); continue; }
        sp.vy += 540 * dt;       // gravity
        sp.vx *= (1 - 0.6 * dt); // drag
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        // bounce off the "floor"
        if (sp.y > dim.h * 0.92 && sp.vy > 0) {
          sp.vy *= -rand(0.25, 0.45);
          sp.vx *= 0.6;
        }
        var lt = sp.age / sp.life;
        ctx.strokeStyle = sparkColor(lt);
        ctx.lineWidth = sp.r;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x - sp.vx * 0.022, sp.y - sp.vy * 0.022);
        ctx.stroke();
      }

      // Occasional bright flash filling the frame.
      if (Math.random() < 0.012) {
        ctx.fillStyle = 'rgba(150,205,255,0.05)';
        ctx.fillRect(0, 0, dim.w, dim.h);
      }
      ctx.restore();
      void time;
    });
  })();

  /* ==========================================================================
     PROCESS SCENE — fiber laser cutting a flange plate
     ========================================================================== */

  (function laserScene() {
    var canvas = document.getElementById('laserCanvas');
    if (!canvas) return;
    var s = setupCanvas(canvas);
    var ctx = s.ctx;
    if (prefersReduced) return;

    // Cut path defined in a 0..1 unit square (a hex flange with bolt circle).
    function buildPath() {
      var pts = [];
      var cx = 0.5, cy = 0.5, R = 0.34;
      var i, a;
      // Hexagon outline.
      for (i = 0; i <= 6 * 14; i++) {
        a = -Math.PI / 2 + (i / (6 * 14)) * Math.PI * 2;
        var seg = Math.floor((a + Math.PI / 2) / (Math.PI / 3));
        var a0 = -Math.PI / 2 + seg * Math.PI / 3;
        var a1 = a0 + Math.PI / 3;
        var p0 = [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R];
        var p1 = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R];
        var tt = ((a + Math.PI / 2) % (Math.PI / 3)) / (Math.PI / 3);
        pts.push([p0[0] + (p1[0] - p0[0]) * tt, p0[1] + (p1[1] - p0[1]) * tt]);
      }
      // Center hole.
      for (i = 0; i <= 40; i++) {
        a = (i / 40) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * 0.10, cy + Math.sin(a) * 0.10]);
      }
      // Bolt holes.
      for (var b = 0; b < 6; b++) {
        var ba = -Math.PI / 2 + (b / 6) * Math.PI * 2;
        var bx = cx + Math.cos(ba) * 0.22;
        var by = cy + Math.sin(ba) * 0.22;
        for (i = 0; i <= 18; i++) {
          a = (i / 18) * Math.PI * 2;
          pts.push([bx + Math.cos(a) * 0.035, by + Math.sin(a) * 0.035]);
        }
      }
      return pts;
    }
    var path = buildPath();
    var progress = 0; // index into path (float)
    var sparks = [];

    function mapPt(pt, dim) {
      var size = Math.min(dim.w, dim.h) * 0.78;
      var ox = dim.w * 0.62 - size / 2;
      var oy = dim.h * 0.5 - size / 2;
      return { x: ox + pt[0] * size, y: oy + pt[1] * size };
    }

    runWhenVisible(canvas, function (dt) {
      var dim = s.size();
      ctx.clearRect(0, 0, dim.w, dim.h);

      var size = Math.min(dim.w, dim.h) * 0.78;
      var ox = dim.w * 0.62 - size / 2;
      var oy = dim.h * 0.5 - size / 2;

      // --- Steel plate ---
      ctx.save();
      var plate = ctx.createLinearGradient(ox, oy, ox + size, oy + size);
      plate.addColorStop(0, '#1d242b');
      plate.addColorStop(0.45, '#141a20');
      plate.addColorStop(0.55, '#222a32');
      plate.addColorStop(1, '#10151a');
      ctx.fillStyle = plate;
      ctx.fillRect(ox, oy, size, size);
      // Brushed lines.
      ctx.strokeStyle = 'rgba(255,255,255,0.022)';
      ctx.lineWidth = 1;
      for (var bl = 0; bl < size; bl += 5) {
        ctx.beginPath();
        ctx.moveTo(ox, oy + bl);
        ctx.lineTo(ox + size, oy + bl);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.strokeRect(ox + 0.5, oy + 0.5, size - 1, size - 1);
      ctx.restore();

      // --- Advance the laser head ---
      progress += dt * 38;
      if (progress >= path.length - 1) {
        progress = 0;
        sparks.length = 0;
      }
      var idx = Math.floor(progress);

      // --- Cut so far (cooling gradient) ---
      ctx.save();
      for (var i = 1; i <= idx; i++) {
        var a = mapPt(path[i - 1], dim);
        var b = mapPt(path[i], dim);
        // Skip jumps between sub-shapes.
        var d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > size * 0.12) continue;
        var age = (idx - i);
        var heat = Math.max(1 - age / 26, 0);
        if (heat > 0.02) {
          ctx.strokeStyle = 'rgba(255,' + Math.round(120 + 110 * heat) + ',' + Math.round(30 + 60 * heat) + ',' + (0.25 + 0.75 * heat) + ')';
          ctx.lineWidth = 1.5 + heat * 2;
          ctx.shadowColor = 'rgba(255,140,40,' + heat + ')';
          ctx.shadowBlur = 10 * heat;
        } else {
          ctx.strokeStyle = 'rgba(8,10,12,0.9)';
          ctx.lineWidth = 1.6;
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();

      // --- Laser head + beam ---
      var head = mapPt(path[Math.min(idx, path.length - 1)], dim);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Beam from above the frame.
      var beam = ctx.createLinearGradient(head.x, 0, head.x, head.y);
      beam.addColorStop(0, 'rgba(76,195,255,0)');
      beam.addColorStop(0.7, 'rgba(76,195,255,0.16)');
      beam.addColorStop(1, 'rgba(220,245,255,0.85)');
      ctx.strokeStyle = beam;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(head.x, 0);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();
      // Kerf flash.
      var flash = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 26);
      flash.addColorStop(0, 'rgba(255,255,250,0.95)');
      flash.addColorStop(0.3, 'rgba(140,215,255,0.5)');
      flash.addColorStop(1, 'rgba(76,195,255,0)');
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 26, 0, Math.PI * 2);
      ctx.fill();

      // --- Sparks ejected downward through the kerf ---
      var n = Math.round(rand(1, 4));
      for (var sN = 0; sN < n && sparks.length < 180; sN++) {
        sparks.push({
          x: head.x, y: head.y,
          vx: rand(-90, 90),
          vy: rand(60, 320),
          life: rand(0.25, 0.9),
          age: 0
        });
      }
      for (var m = sparks.length - 1; m >= 0; m--) {
        var sp = sparks[m];
        sp.age += dt;
        if (sp.age > sp.life) { sparks.splice(m, 1); continue; }
        sp.vy += 420 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        var lt = 1 - sp.age / sp.life;
        ctx.strokeStyle = 'rgba(255,' + Math.round(150 + 90 * lt) + ',60,' + lt + ')';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x - sp.vx * 0.016, sp.y - sp.vy * 0.016);
        ctx.stroke();
      }
      ctx.restore();
    });
  })();

})();
