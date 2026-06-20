// Astro Station — shared site JS
(function(){
  // Live dual studio clock — Miami + Los Angeles
  function fmt(tz){
    return new Date().toLocaleTimeString('en-US',{timeZone:tz,hour12:false,hour:'2-digit',minute:'2-digit'});
  }
  function tickClock(){
    var mia = fmt('America/New_York'), la = fmt('America/Los_Angeles');
    var el = document.getElementById('clock');
    if(el) el.textContent = 'MIA ' + mia + ' \u00b7 LA ' + la;
    var em = document.getElementById('time-mia'); if(em) em.textContent = mia + ' \u00b7 EST';
    var el2 = document.getElementById('time-la'); if(el2) el2.textContent = la + ' \u00b7 PST';
  }
  tickClock();
  setInterval(tickClock, 30000);

  // Portfolio filter chips (any page that has them)
  var filters = document.querySelectorAll('[data-filter-group] [data-filter]');
  filters.forEach(function(chip){
    chip.addEventListener('click', function(){
      var group = this.closest('[data-filter-group]');
      group.querySelectorAll('[data-filter]').forEach(function(c){c.classList.remove('active')});
      this.classList.add('active');
      var f = this.dataset.filter;
      var grid = group.parentElement.querySelector('[data-filter-grid]') || document.querySelector('[data-filter-grid]');
      if(!grid) return;
      grid.querySelectorAll('[data-tags]').forEach(function(item){
        var tags = item.dataset.tags || '';
        item.style.display = (f === 'all' || tags.indexOf(f) !== -1) ? '' : 'none';
      });
    });
  });

})();

// ── Lightbox — click any gallery/render image to expand ──
// Supports grouped galleries: a [data-gallery="src|src|..."] element opens its own set.
(function(){
  var SEL = [
    'div.proj img',
    '.cs-pair img','.cs-bleed img','.cs-photo img','.cs-plan img','.plan-grid img',
    '.ba-pair img','.rp-pair img',
    '.slide-img__frame img','.bleed img','.deliver-strip img',
    '.astro-anchor img','.astro-break img','.crew-photo img','.profile__photo img',
    '[data-lightbox] img'
  ].join(',');

  var pageImgs = Array.prototype.filter.call(document.querySelectorAll(SEL), function(im){
    return !im.closest('a') && !im.closest('.lb');
  });
  var hasGroups = document.querySelector('[data-gallery]');
  var hasAnchoredGal = document.querySelector('[data-lightbox] a, .pkg-gal a');
  if(!pageImgs.length && !hasGroups && !hasAnchoredGal) return;

  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role','dialog');
  lb.setAttribute('aria-label','Image viewer');
  lb.innerHTML =
    '<span class="lb__count"></span>'+
    '<button class="lb__btn lb__close" aria-label="Close">×</button>'+
    '<button class="lb__btn lb__prev" aria-label="Previous">←</button>'+
    '<img class="lb__img" alt="">'+
    '<button class="lb__btn lb__next" aria-label="Next">→</button>'+
    '<div class="lb__cap"></div>'+
    '<a class="lb__pdf" target="_blank" rel="noopener" style="display:none">Open full PDF ↗</a>';
  document.body.appendChild(lb);

  var elImg = lb.querySelector('.lb__img'),
      elCap = lb.querySelector('.lb__cap'),
      elCount = lb.querySelector('.lb__count'),
      elPdf = lb.querySelector('.lb__pdf'),
      list = [], idx = 0;

  function caption(im){
    var fig = im.closest('figure');
    var fc = fig && fig.querySelector('figcaption');
    return (fc && fc.textContent.trim()) || im.getAttribute('alt') || '';
  }

  // global page list
  var globalList = pageImgs.map(function(im){
    return { src: im.currentSrc || im.src, cap: caption(im), pdf: im.getAttribute('data-pdf') || '', el: im };
  });

  function show(i){
    idx = (i + list.length) % list.length;
    var it = list[idx];
    // gentle crossfade; never get stuck blank (safety reveal)
    elImg.style.opacity = '0';
    elImg.src = it.src;
    elImg.alt = it.cap || '';
    var reveal = function(){ elImg.style.opacity = '1'; };
    if(elImg.complete && elImg.naturalWidth){ reveal(); }
    else { elImg.onload = reveal; setTimeout(reveal, 400); }
    elCap.textContent = it.cap || '';
    elCount.textContent = (idx+1) + ' / ' + list.length;
    if(elPdf){ if(it.pdf){ elPdf.href = it.pdf; elPdf.style.display = ''; } else { elPdf.style.display = 'none'; elPdf.removeAttribute('href'); } }
    // preload neighbours
    [idx+1, idx-1].forEach(function(j){
      var n = list[(j+list.length)%list.length];
      if(n && !n._pre){ n._pre = new Image(); n._pre.src = n.src; }
    });
  }
  function open(newList, i){
    list = newList; show(i||0);
    lb.classList.add('open'); document.body.classList.add('lb-lock');
  }
  function close(){ lb.classList.remove('open'); document.body.classList.remove('lb-lock'); elImg.src=''; }

  // plain images → page-wide browsing (skip ones inside a gallery group)
  pageImgs.forEach(function(im,i){
    if(im.closest('[data-gallery]')) return;
    im.classList.add('lb-zoom');
    im.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); open(globalList, i); });
  });

  // grouped galleries
  document.querySelectorAll('[data-gallery]').forEach(function(g){
    var srcs = g.getAttribute('data-gallery').split('|').filter(Boolean);
    var cap = g.getAttribute('data-gcap') || '';
    var gl = srcs.map(function(s,k){ return { src: s, cap: cap + ' — ' + (k+1) + ' of ' + srcs.length }; });
    g.querySelectorAll('img').forEach(function(im){ im.classList.add('lb-zoom'); });
    g.style.cursor = 'pointer';
    g.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation(); open(gl, 0);
    });
  });

  // Anchored image galleries ([data-lightbox] with <a href="…jpg">) → browse the
  // group in the viewer (forward/back) instead of navigating away to the raw file.
  document.querySelectorAll('[data-lightbox]').forEach(function(g){
    var anchors = Array.prototype.slice.call(g.querySelectorAll('a')).filter(function(a){
      return /\.(jpe?g|png|webp|gif)$/i.test(a.getAttribute('href') || '');
    });
    if(!anchors.length) return;
    var gl = anchors.map(function(a){
      var im = a.querySelector('img');
      return { src: a.getAttribute('href'), cap: (im && im.alt) || '', pdf: a.getAttribute('data-pdf') || '' };
    });
    anchors.forEach(function(a,i){
      var im = a.querySelector('img'); if(im) im.classList.add('lb-zoom');
      a.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); open(gl, i); });
    });
  });

  // Package deliverable galleries → open as a swipeable presentation viewer
  document.querySelectorAll('.pkg-gal').forEach(function(g){
    var anchors = Array.prototype.slice.call(g.querySelectorAll('a'));
    if(!anchors.length) return;
    var total = anchors.length;
    var gl = anchors.map(function(a,k){
      return { src: a.getAttribute('href'), cap: 'Landscape package · Sheet ' + (k+1) + ' of ' + total };
    });
    anchors.forEach(function(a,i){
      Array.prototype.forEach.call(a.querySelectorAll('img'), function(im){ im.classList.add('lb-zoom'); });
      a.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); open(gl, i); });
    });
  });

  lb.querySelector('.lb__close').addEventListener('click', close);
  lb.querySelector('.lb__prev').addEventListener('click', function(e){ e.stopPropagation(); show(idx-1); });
  lb.querySelector('.lb__next').addEventListener('click', function(e){ e.stopPropagation(); show(idx+1); });
  lb.addEventListener('click', function(e){ if(e.target === lb) close(); });

  document.addEventListener('keydown', function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') show(idx-1);
    if(e.key === 'ArrowRight') show(idx+1);
  });

  var x0 = null;
  lb.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', function(e){
    if(x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 50){ dx > 0 ? show(idx-1) : show(idx+1); }
    x0 = null;
  }, {passive:true});
})();

// ── Justified galleries (.jgal) — lay images into equal-height rows that fill the
//    width at each image's TRUE aspect ratio: full images, no crop, no white gaps. ──
(function(){
  var gals = document.querySelectorAll('.jgal');
  if(!gals.length) return;
  function arOf(im){
    return parseFloat(im.getAttribute('data-ar')) ||
           (im.naturalWidth && im.naturalHeight ? im.naturalWidth/im.naturalHeight : 1);
  }
  function layout(gal){
    var imgs = gal._jimgs || (gal._jimgs = Array.prototype.slice.call(gal.querySelectorAll('img')));
    var W = gal.clientWidth; if(!W || !imgs.length) return;
    var gap = parseInt(gal.getAttribute('data-gap') || '10', 10);
    var target = parseInt(gal.getAttribute('data-row-h') || '320', 10);
    var frag = document.createDocumentFragment();
    var row = document.createElement('div'); row.className = 'jgal-row';
    var items = [], sum = 0;
    function flush(fill){
      items.forEach(function(o){
        o.img.style.aspectRatio = o.ar;
        if(fill){ o.img.style.flex = o.ar + ' 1 0'; o.img.style.width = ''; o.img.style.height = ''; }
        else { o.img.style.flex = '0 0 auto'; o.img.style.height = target + 'px'; o.img.style.width = 'auto'; }
        row.appendChild(o.img);
      });
      frag.appendChild(row);
      row = document.createElement('div'); row.className = 'jgal-row'; items = []; sum = 0;
    }
    imgs.forEach(function(im){
      var a = arOf(im); items.push({ img: im, ar: a }); sum += a;
      if((W - gap*(items.length-1)) / sum <= target) flush(true);
    });
    if(items.length){
      var h = (W - gap*(items.length-1)) / sum;
      flush(h <= target * 1.7);          // fill the last row unless it would blow up
    }
    while(gal.firstChild) gal.removeChild(gal.firstChild);
    gal.appendChild(frag);
  }
  function all(){ Array.prototype.forEach.call(gals, layout); }
  all();
  window.addEventListener('load', all);
  var t; window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(all, 150); });
})();

// ── Scroll-reveal — gentle fade/rise as content enters the viewport ──
// Safe by design: if IntersectionObserver is missing, everything is shown.
(function(){
  if(!('IntersectionObserver' in window)) return;            // no-op → content stays visible
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  var SEL = [
    '.section .wrap > *', '.portfolio-head', '.proj', '.rp-list > *',
    '.cs-intro', '.cs-split', '.cs-pair', '.cs-bleed', '.cs-section',
    '.tier', '.phase', '.member', '.team-circle', '.teaser-strip a',
    '.cosmo-grid figure', '.curnow__row', '.stats > *', '.promise'
  ].join(',');
  var nodes = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if(!nodes.length) return;
  document.documentElement.classList.add('has-reveal');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
  nodes.forEach(function(n,i){
    n.setAttribute('data-reveal','');
    // subtle stagger within a row of tiles
    n.style.transitionDelay = ((i % 6) * 45) + 'ms';
    io.observe(n);
  });
  // hard safety net: reveal anything still hidden after 2.5s
  setTimeout(function(){
    nodes.forEach(function(n){ n.classList.add('is-in'); });
  }, 2500);
})();

// ── Immersive project hero — overlay typology + title on the lead image ──
// Only runs on project case-study pages; degrades to the original layout if JS is off.
(function(){
  var hero = document.querySelector('.cs-hero');
  var intro = document.querySelector('.cs-intro');
  if(!hero || !intro) return;
  var left = intro.querySelector('.cs-intro__left');
  var h1 = left && left.querySelector('h1');
  var img = hero.querySelector('img');
  if(!h1 || !img) return;
  var typ = left.querySelector('.cs-typology');
  var cap = document.createElement('div');
  cap.className = 'cs-hero__cap';
  if(typ){
    var t = document.createElement('div');
    t.className = 'cs-hero__typology';
    t.textContent = typ.textContent.trim();
    cap.appendChild(t);
  }
  var ti = document.createElement('h1');
  ti.className = 'cs-hero__title';
  ti.textContent = h1.textContent.trim();
  cap.appendChild(ti);
  hero.appendChild(cap);
  hero.classList.add('is-immersive');
  intro.classList.add('cs-intro--solo');
})();

// ── Live project cards — each tile rotates through its own images ──
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tiles = Array.prototype.slice.call(document.querySelectorAll('[data-live]'));
  if(!tiles.length) return;
  tiles.forEach(function(t){
    t._imgs = Array.prototype.filter.call(t.children, function(el){ return el.tagName === 'IMG'; });
    t._i = 0; t._timer = null;
    if(t._imgs[0]) t._imgs[0].classList.add('is-active');
  });
  if(reduce) return;
  function load(t){ t._imgs.forEach(function(im){ if(im.dataset.src && !im.src) im.src = im.dataset.src; }); }
  function start(t){
    if(t._timer || t._imgs.length < 2) return;
    load(t);
    t._timer = setInterval(function(){
      t._imgs[t._i].classList.remove('is-active');
      t._i = (t._i + 1) % t._imgs.length;
      t._imgs[t._i].classList.add('is-active');
    }, 3600 + Math.floor(Math.random()*1400));
  }
  function stop(t){ if(t._timer){ clearInterval(t._timer); t._timer = null; } }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ (e.isIntersecting && !document.hidden) ? start(e.target) : stop(e.target); });
    }, { threshold: 0.25 });
    tiles.forEach(function(t){ io.observe(t); });
  } else { tiles.forEach(start); }
  document.addEventListener('visibilitychange', function(){ if(document.hidden) tiles.forEach(stop); });
})();

// ── Current Projects cinematic carousel ([data-cpx]) ──
(function(){
  var cpx = document.querySelector('[data-cpx]');
  if(!cpx) return;
  var track = cpx.querySelector('.cpx__track');
  var cards = Array.prototype.slice.call(track.querySelectorAll('.cpx__card'));
  if(!cards.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // per-card two-image crossfade
  cards.forEach(function(card){
    var imgs = card.querySelectorAll('.cpx__img');
    if(imgs.length < 2) return;
    if(imgs[1].dataset.src && !imgs[1].src) imgs[1].src = imgs[1].dataset.src;
    if(reduce) return;
    var a = 0;
    setInterval(function(){
      imgs[a].classList.remove('is-active');
      a = (a + 1) % imgs.length;
      imgs[a].classList.add('is-active');
    }, 3900 + Math.floor(Math.random()*900));
  });

  // dots
  var dotsWrap = document.getElementById('cpxDots');
  if(dotsWrap){
    cards.forEach(function(c,i){
      var d = document.createElement('button');
      d.className = 'cpx__dot' + (i===0 ? ' is-on' : '');
      d.setAttribute('aria-label','Project '+(i+1));
      d.addEventListener('click', function(){ scrollToCard(i); });
      dotsWrap.appendChild(d);
    });
  }
  var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];
  var cur = 0;
  function scrollToCard(i){
    var c = cards[i]; if(!c) return;
    track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.clientWidth)/2, behavior:'smooth' });
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          cur = cards.indexOf(e.target);
          dots.forEach(function(d,j){ d.classList.toggle('is-on', j===cur); });
        }
      });
    }, { root: track, threshold: 0.6 });
    cards.forEach(function(c){ io.observe(c); });
  }
  var prev = cpx.querySelector('.cpx__prev'), next = cpx.querySelector('.cpx__next');
  if(prev) prev.addEventListener('click', function(){ scrollToCard(Math.max(0, cur-1)); });
  if(next) next.addEventListener('click', function(){ scrollToCard(Math.min(cards.length-1, cur+1)); });

  if(!reduce){
    var timer = null;
    function advance(){ scrollToCard((cur+1) % cards.length); }
    function start(){ if(!timer) timer = setInterval(advance, 6500); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    cpx.addEventListener('pointerenter', stop);
    cpx.addEventListener('pointerleave', start);
    track.addEventListener('touchstart', stop, {passive:true});
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ (e.isIntersecting && !document.hidden) ? start() : stop(); }); }, {threshold:0.3}).observe(cpx);
    } else { start(); }
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
  }
})();

// ── Reusable cinematic slideshows ([data-cine]) — crossfade + Ken Burns ──
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('[data-cine]'), function(seq){
    var slides = seq.querySelectorAll('.cs');
    if(slides.length < 2) return;
    // ensure lazy frames have a src as they're about to be needed
    function preload(){ Array.prototype.forEach.call(slides, function(im){ if(im.dataset.src && !im.src) im.src = im.dataset.src; }); }
    setTimeout(preload, 600);
    if(reduce) return;
    var i = 0, timer = null;
    function step(){
      var prev = i;
      i = (i + 1) % slides.length;
      if(slides[i].dataset.src && !slides[i].src) slides[i].src = slides[i].dataset.src;
      // fade the incoming slide in ON TOP of the current one so the
      // container background never shows through during the crossfade
      slides[i].style.zIndex = '2';
      slides[i].classList.add('is-active');
      var p = slides[prev];
      setTimeout(function(){ p.classList.remove('is-active'); p.style.zIndex = ''; }, 1900);
    }
    function start(){ if(!timer) timer = setInterval(step, parseInt(seq.dataset.interval,10) || 4000); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ (e.isIntersecting && !document.hidden) ? start() : stop(); }); }, {threshold:0.2}).observe(seq);
    } else { start(); }
  });
})();

// ── Cinematic landing hero — crossfade + Ken Burns sequence ──
(function(){
  var seq = document.getElementById('heroSeq');
  if(!seq) return;
  var slides = Array.prototype.slice.call(seq.querySelectorAll('.hs'));
  if(slides.length < 2) return;
  var capEl = document.getElementById('heroCap');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // lazy-load the non-first frames shortly after load (keeps LCP on frame 1)
  function preload(){
    slides.forEach(function(im){
      if(im.dataset.src && !im.src){ im.src = im.dataset.src; }
    });
  }
  if(document.readyState === 'complete') setTimeout(preload, 800);
  else window.addEventListener('load', function(){ setTimeout(preload, 800); });

  if(!reduce){
    var i = 0, timer = null, DUR = 6000;
    function step(){
      var cur = slides[i];
      i = (i + 1) % slides.length;
      var nxt = slides[i];
      if(nxt.dataset.src && !nxt.src) nxt.src = nxt.dataset.src;
      cur.classList.remove('is-active','kb-alt');
      nxt.classList.add('is-active');
      if(i % 2 === 1) nxt.classList.add('kb-alt');
      if(capEl && nxt.dataset.cap){
        capEl.style.opacity = 0;
        setTimeout(function(){ capEl.textContent = nxt.dataset.cap; capEl.style.opacity = 1; }, 500);
      }
    }
    function start(){ if(!timer) timer = setInterval(step, DUR); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }

    // wire the on-screen + tab-visible rotation triggers
    function engage(){
      document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(es){
          es.forEach(function(e){ e.isIntersecting && !document.hidden ? start() : stop(); });
        },{threshold:0.15}).observe(seq.closest('.home-hero') || seq);
      } else { start(); }
    }

    // Begin the rotation on the astronaut (frame 0), restarting its Ken Burns from
    // a clean state, then engage the timer. Runs exactly once.
    var started = false;
    function beginHero(){
      if(started) return; started = true;
      slides.forEach(function(s){ s.classList.remove('is-active','kb-alt'); });
      void seq.offsetWidth;                           // reflow → Ken Burns restarts clean
      i = 0; slides[0].classList.add('is-active');
      if(capEl && slides[0].dataset.cap) capEl.textContent = slides[0].dataset.cap;
      engage();
    }

    // If the launch overlay is on top, hold on the astronaut underneath it and don't
    // advance. Hand off the instant the intro begins its dissolve (its reveal event),
    // so the astronaut is the very first image revealed — never the house. The
    // overlay-removal watch and a timeout are fallbacks if the event is missed.
    if(document.getElementById('as-launch')){
      window.addEventListener('astro:intro-reveal', beginHero, {once:true});
      if('MutationObserver' in window){
        var mo = new MutationObserver(function(){
          if(!document.getElementById('as-launch')){ mo.disconnect(); beginHero(); }
        });
        mo.observe(document.body, {childList:true, subtree:true});
      }
      setTimeout(function(){ if(!document.getElementById('as-launch')) beginHero(); }, 12000);
    } else {
      beginHero();
    }

    // subtle parallax on the sequence container (not the slides — preserves Ken Burns)
    var hero = seq.closest('.home-hero');
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(function(){
        var y = window.pageYOffset || 0;
        if(hero && y < hero.offsetHeight) seq.style.transform = 'translateY(' + (y * 0.16) + 'px)';
        ticking = false;
      });
    }, {passive:true});
  }
})();

// ── Cookie consent (luxury banner + preference management) ──────────────
(function(){
  var KEY='astro_consent';
  // ── Google Analytics 4 — loads ONLY after the visitor consents to Analytics ──
  // To activate: replace G-XXXXXXXXXX below with Astro Station's GA4 Measurement ID.
  var GA_ID='G-XXXXXXXXXX';
  // Google Consent Mode v2 — default everything to denied until the visitor accepts Analytics.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  window.gtag('consent','default',{ ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied' });
  window.astroLoadAnalytics=function(){
    if(!GA_ID || GA_ID.indexOf('XXXX')>-1) return;            // not configured yet → no-op
    window.gtag('consent','update',{ analytics_storage:'granted' });   // visitor accepted analytics
    var s=document.createElement('script'); s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip:true });           // IP anonymization
  };
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)); }catch(e){ return null; } }
  function write(c){ c.ts=Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(c)); }catch(e){} apply(c); }
  // Gate non-essential tracking. Scripts/pixels run ONLY when consented.
  function apply(c){
    if(c && c.analytics && typeof window.astroLoadAnalytics==='function' && !window.__astroAnalyticsLoaded){ window.__astroAnalyticsLoaded=true; try{ window.astroLoadAnalytics(); }catch(e){} }
    if(c && c.marketing && typeof window.astroLoadMarketing==='function' && !window.__astroMarketingLoaded){ window.__astroMarketingLoaded=true; try{ window.astroLoadMarketing(); }catch(e){} }
  }
  // relative path to root (handles /page.html and /services/page.html)
  var dir=location.pathname.replace(/[^\/]*$/,'');
  var depth=Math.max(0,(dir.match(/\//g)||[]).length-1);
  var PFX=depth>0 ? new Array(depth+1).join('../') : '';

  var el=document.createElement('div');
  el.className='cookie'; el.setAttribute('role','dialog');
  el.setAttribute('aria-label','Cookie consent'); el.setAttribute('aria-live','polite');
  el.innerHTML=
    '<div class="cookie__title">Cookies</div>'+
    '<p class="cookie__txt">We use cookies and similar technologies to improve your browsing experience, analyze site traffic, and understand how visitors interact with our website. By selecting Accept, you consent to our use of cookies. You may also manage your preferences. See our <a href="'+PFX+'privacy.html">Privacy Policy</a>.</p>'+
    '<div class="cookie__actions cookie__actions--main">'+
      '<button type="button" class="cookie__btn cookie__btn--solid" data-ck="accept">Accept</button>'+
      '<button type="button" class="cookie__btn" data-ck="decline">Decline</button>'+
      '<button type="button" class="cookie__btn cookie__btn--ghost" data-ck="manage">Manage Preferences</button>'+
    '</div>'+
    '<div class="cookie__manage">'+
      '<div class="cookie__row"><div class="cookie__row-txt"><h5>Strictly Necessary</h5><p>Required for the site to function and to remember your choices. Always active.</p></div><label class="cookie__tg"><input type="checkbox" checked disabled aria-label="Strictly necessary (always on)"><span></span></label></div>'+
      '<div class="cookie__row"><div class="cookie__row-txt"><h5>Analytics</h5><p>Help us understand how the site is used so we can improve it.</p></div><label class="cookie__tg"><input type="checkbox" id="ck-an" aria-label="Analytics cookies"><span></span></label></div>'+
      '<div class="cookie__row"><div class="cookie__row-txt"><h5>Marketing</h5><p>Used to measure the performance of our campaigns.</p></div><label class="cookie__tg"><input type="checkbox" id="ck-mk" aria-label="Marketing cookies"><span></span></label></div>'+
      '<div class="cookie__manage-actions"><button type="button" class="cookie__btn cookie__btn--solid" data-ck="save">Save Preferences</button><button type="button" class="cookie__btn" data-ck="acceptall">Accept All</button></div>'+
    '</div>';
  document.body.appendChild(el);

  var anIn=el.querySelector('#ck-an'), mkIn=el.querySelector('#ck-mk');
  function show(manage){ el.classList.toggle('is-managing',!!manage); requestAnimationFrame(function(){ el.classList.add('show'); }); }
  function hide(){ el.classList.remove('show'); }

  el.addEventListener('click', function(e){
    var b=e.target.closest('[data-ck]'); if(!b) return;
    var act=b.getAttribute('data-ck');
    if(act==='accept'||act==='acceptall'){ write({necessary:true,analytics:true,marketing:true}); hide(); }
    else if(act==='decline'){ write({necessary:true,analytics:false,marketing:false}); hide(); }
    else if(act==='manage'){ var c=read()||{}; anIn.checked=!!c.analytics; mkIn.checked=!!c.marketing; el.classList.add('is-managing'); }
    else if(act==='save'){ write({necessary:true,analytics:anIn.checked,marketing:mkIn.checked}); hide(); }
  });

  // Footer / page "Cookie Preferences" links reopen the manager
  document.addEventListener('click', function(e){
    var t=e.target.closest('[data-cookie-prefs]'); if(!t) return;
    e.preventDefault();
    var c=read()||{analytics:false,marketing:false};
    anIn.checked=!!c.analytics; mkIn.checked=!!c.marketing;
    show(true);
  });

  var saved=read();
  if(saved){ apply(saved); }
  else { setTimeout(function(){ show(false); }, 800); }
})();
