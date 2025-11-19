// Basic JS for menu + GSAP animations
document.addEventListener('DOMContentLoaded', ()=>{
  // small accessibility: current year
  document.getElementById('year').textContent = new Date().getFullYear();

  // keep native cursor visible while still showing ambient glow

  // menu toggle
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  toggle.addEventListener('click', ()=>{
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.style.display = expanded ? 'none' : 'flex';
  });

  // Smooth scroll for internal anchors (header nav, CTA buttons, footer links)
  function handleAnchorClick(e){
    const href = this.getAttribute('href');
    if(!href || !href.startsWith('#')) return;
    e.preventDefault();
    // special-case top
    if(href === '#' || href === '#top'){
      window.scrollTo({top:0, behavior:'smooth'});
    } else {
      const target = document.querySelector(href);
      if(target){
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }
    // if nav was opened on small screens, close it after click
    if(window.matchMedia && window.matchMedia('(max-width:900px)').matches){
      nav.style.display = 'none';
      toggle.setAttribute('aria-expanded','false');
    }
  }

  // attach to nav links and any anchor buttons in header/footer
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', handleAnchorClick));

  // GSAP animations
  if(typeof gsap !== 'undefined'){
    // register ScrollTrigger if available
    const DEBUG_SCROLL = false; // set to true while debugging to show markers
    try{
      if(typeof ScrollTrigger !== 'undefined'){
        gsap.registerPlugin(ScrollTrigger);
      } else if(gsap && gsap.plugins && gsap.plugins.ScrollTrigger){
        gsap.registerPlugin(gsap.plugins.ScrollTrigger);
      }
    }catch(e){ /* ignore plugin registration errors in production */ }

    /* scroll-logo behavior removed per user request */

    // header entrance
    gsap.from('.glass-card', {y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.2});

    // morphing the polygon by swapping points in a simple loop
    const blob = document.getElementById('blob');
    const shapes = [
      // a few different point sets for the polygon (normalized to SVG viewBox used in HTML)
      '300,40 460,90 550,230 480,350 300,370 140,320 70,190 120,80',
      '320,30 480,100 540,220 470,340 300,370 120,320 80,160 150,60',
      '300,60 490,110 560,240 470,360 300,380 150,330 60,190 120,80',
      '340,50 480,110 540,230 460,350 300,370 160,310 100,170 160,80'
    ];

    let si = 0;
    function morphTo(next){
      gsap.to(blob, {
        attr: { points: next },
        duration: 3.2,
        ease: 'sine.inOut',
        onComplete: ()=>{
          setTimeout(()=>{ si = (si+1)%shapes.length; morphTo(shapes[si]); }, 120);
        }
      });
    }
    morphTo(shapes[si]);

    // subtle parallax for blob on mouse move
    const hero = document.querySelector('.hero');
    hero.addEventListener('mousemove', (e)=>{
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - 0.5;
      const y = (e.clientY - r.top)/r.height - 0.5;
      gsap.to('.hero-blob', {x: x*20, y: y*12, rotation: x*6, duration: 0.7, ease:'power2.out'});
    });

    // footer social morph & float animations
    const socialBtns = gsap.utils.toArray('.social-btn');
    if(socialBtns.length){
      // subtle floating motion
      gsap.to(socialBtns, {y: -8, stagger: 0.14, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut'});

      // morph border-radius + scale in a loop for a 'morph' feeling
      const ft = gsap.timeline({repeat:-1, yoyo:true});
      ft.to(socialBtns, {borderRadius: '50%', stagger:0.12, duration:1.1, ease:'sine.inOut'})
        .to(socialBtns, {borderRadius: '12px', stagger:0.12, duration:1.1, ease:'sine.inOut'});
    }

    // small reveal for cards on scroll
    if(gsap && gsap.matchMedia){
      gsap.utils.toArray('.card').forEach((c, i)=>{
        gsap.from(c, {y: 16, opacity:0, duration:0.9, delay: i*0.08, scrollTrigger:{trigger:c, start:'top 90%'}});
      });
    } else {
      // fallback simple stagger
      gsap.from('.card', {y:16, opacity:1, duration:0.9, stagger:0.12, delay:0.3});
    }

  } else {
    /* GSAP not found — animations will be disabled */
  }

  /* Ambient cursor glow: a soft light-blue radial that follows the pointer. Low cost and smooth via rAF. */
  (function(){
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    document.body.appendChild(cursor);

    let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
    let curX = mouseX, curY = mouseY;

    const ease = 0.16; // smoothing
    // helper to detect interactive elements
    const interactiveSelector = 'a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])';
    function onMove(e){
      mouseX = e.clientX;
      mouseY = e.clientY;
      // make the glow smaller on touch devices if needed
      if(window.matchMedia && window.matchMedia('(max-width:600px)').matches){ cursor.classList.add('small'); } else { cursor.classList.remove('small'); }

      // detect element under pointer and toggle hover class for visual affordance
      try{
        const el = document.elementFromPoint(mouseX, mouseY);
        if(el && el.closest && el.closest(interactiveSelector)){
          cursor.classList.add('hover');
        } else {
          cursor.classList.remove('hover');
        }
      } catch(err){ /* elementFromPoint may fail in some exotic contexts - ignore */ }
    }

    function raf(){
      curX += (mouseX - curX) * ease;
      curY += (mouseY - curY) * ease;
      // position using translate so it doesn't affect layout; we keep width/height transitions in CSS
      cursor.style.transform = `translate(${curX}px, ${curY}px)`;
      requestAnimationFrame(raf);
    }
    window.addEventListener('mousemove', onMove, {passive:true});
    // on touch move, place at touch point
    window.addEventListener('touchstart', (ev)=>{ if(ev.touches && ev.touches[0]) onMove(ev.touches[0]); }, {passive:true});
    window.addEventListener('touchmove', (ev)=>{ if(ev.touches && ev.touches[0]) onMove(ev.touches[0]); }, {passive:true});

    // click feedback: briefly show pressed state so user knows the click landed
    window.addEventListener('mousedown', ()=>{ cursor.classList.add('pressed'); });
    window.addEventListener('mouseup', ()=>{ setTimeout(()=>cursor.classList.remove('pressed'), 120); });

    raf();
  })();

  /* Hero cards with navigation arrows: infinite looping carousel with prev/next buttons */
  (function(){
    const container = document.querySelector('.hero-cards');
    const btnPrev = document.querySelector('.hero-nav--prev');
    const btnNext = document.querySelector('.hero-nav--next');
    
    if(!container || !btnPrev || !btnNext) return;
    
    const original = Array.from(container.querySelectorAll('.hero-card'));
    if(original.length < 2) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // prevent double-init
    if(container.dataset.loopInit) return;
    container.dataset.loopInit = '1';

    // clone first and last for seamless looping
    const firstClone = original[0].cloneNode(true);
    const lastClone = original[original.length-1].cloneNode(true);
    container.appendChild(firstClone);
    container.insertBefore(lastClone, container.firstChild);

    // new cards list with clones
    const cards = Array.from(container.querySelectorAll('.hero-card'));
    // logical first real index after the prepended clone
    const FIRST_INDEX = 1;
    const LAST_INDEX = cards.length - 2; // last real card index

    let idx = FIRST_INDEX; // start at real first
    const DURATION = 4200;
    let timer = null;

    function cardCenterLeft(card){
      return card.offsetLeft - (container.clientWidth - card.clientWidth)/2;
    }

    let isAnimating = false;
    function scrollToIndex(i, smooth = true, onDone){
      const target = cards[i];
      if(!target) return;
      const left = cardCenterLeft(target);
      // prefer GSAP animation for consistent timing when available
      if(smooth && typeof gsap !== 'undefined' && !prefersReduced){
        isAnimating = true;
        try{
          gsap.to(container, {scrollLeft: left, duration:0.8, ease: 'power2.out', onComplete: ()=>{ isAnimating = false; if(typeof onDone === 'function') onDone(); }});
          return;
        }catch(err){ isAnimating = false; /* fallthrough to native */ }
      }
      try{
        container.scrollTo({left, behavior: smooth && !prefersReduced ? 'smooth' : 'auto'});
      }catch(e){ container.scrollLeft = left; }
      if(typeof onDone === 'function'){
        // best-effort callback after native smooth; duration approximated
        setTimeout(onDone, smooth ? 400 : 0);
      }
    }

    function show(i, fromButton = false){
      const prev = idx;
      idx = i;
      // animate visual swap: outgoing -> incoming
      try{
        if(typeof gsap !== 'undefined' && !prefersReduced){
          const outCard = cards[prev];
          const inCard = cards[idx === LAST_INDEX+1 ? LAST_INDEX+1 : (idx === -1 ? 0 : idx)];
          // gentle scale down outgoing and dim
          if(outCard) gsap.killTweensOf(outCard);
          if(inCard) gsap.killTweensOf(inCard);
          if(outCard) gsap.to(outCard, {scale:0.98, opacity:0.92, boxShadow:'0 10px 30px rgba(2,6,23,0.32)', duration:0.8, ease:'power2.out'});
          if(inCard) gsap.fromTo(inCard, {scale:0.98, opacity:0.92}, {scale:1.02, opacity:1, boxShadow:'0 28px 68px rgba(2,6,23,0.55)', duration:0.8, ease:'power2.out'});
        } else {
          // fallback: toggle helper classes
          const prevCard = cards[prev];
          const nextCard = cards[idx] || cards[FIRST_INDEX];
          if(prevCard){ prevCard.classList.remove('is-active'); prevCard.classList.add('is-passive'); }
          if(nextCard){ nextCard.classList.add('is-active'); nextCard.classList.remove('is-passive'); }
        }
      }catch(err){ /* swallow animation errors */ }

      // scroll to target with infinite loop handling
      if(idx === LAST_INDEX + 1){
        // going forward past last: scroll to appended clone, then jump to real first
        scrollToIndex(idx, true, ()=>{
          idx = FIRST_INDEX;
          scrollToIndex(idx, false);
        });
      } else if(idx === 0){
        // going backward past first: scroll to prepended clone, then jump to real last
        scrollToIndex(0, true, ()=>{
          idx = LAST_INDEX;
          scrollToIndex(idx, false);
        });
      } else {
        scrollToIndex(idx, true);
      }
      
      // restart autoplay after manual navigation
      if(fromButton && !prefersReduced){
        stop();
        setTimeout(()=>{ if(!timer) start(); }, 2000);
      }
    }

    function next(fromButton = false){ show(idx + 1, fromButton); }
    function prev(fromButton = false){ 
      if(idx === FIRST_INDEX){
        show(0, fromButton); // go to prepended clone
      } else {
        show(idx - 1, fromButton); 
      }
    }
    
    function start(){ 
      if(timer || prefersReduced) return; 
      timer = setInterval(()=>next(false), DURATION); 
    }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }

    // Button click handlers
    btnPrev.addEventListener('click', ()=>{ prev(true); });
    btnNext.addEventListener('click', ()=>{ next(true); });

    // Pause autoplay on hover/focus
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', ()=>{ if(!timer && !prefersReduced) start(); });
    container.addEventListener('focusin', stop);
    container.addEventListener('focusout', ()=>{ if(!timer && !prefersReduced) start(); });

    // Handle manual scroll: if user scrolls to sentinel clones, fix by jumping to equivalent real card
    let scrollDeb = null;
    container.addEventListener('scroll', ()=>{
      // pause autoplay during manual scroll
      stop();
      if(scrollDeb) clearTimeout(scrollDeb);
      scrollDeb = setTimeout(()=>{
        // determine nearest card index by distance to centers
        const centers = cards.map(c => cardCenterLeft(c));
        const cur = container.scrollLeft;
        let nearest = 0; let best = Infinity;
        for(let i=0;i<centers.length;i++){
          const d = Math.abs(centers[i] - cur);
          if(d < best){ best = d; nearest = i; }
        }
        // if at cloned last (prepended) -> jump to real last
        if(nearest === 0){ idx = LAST_INDEX; scrollToIndex(idx, false); }
        // if at cloned first (appended) -> jump to real first
        else if(nearest === cards.length-1){ idx = FIRST_INDEX; scrollToIndex(idx, false); }
        else { idx = nearest; }
        // resume autoplay shortly
        if(!prefersReduced){
          setTimeout(()=>{ if(!timer) start(); }, 900);
        }
      }, 150);
    }, {passive:true});

    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stop(); else if(!timer && !prefersReduced) start(); });

    // Keyboard navigation on arrow buttons
    btnPrev.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); prev(true); }
    });
    btnNext.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); next(true); }
    });

    // initialize at real first without animation
    scrollToIndex(FIRST_INDEX, false);
    if(!prefersReduced) start();
  })();

  

  // Safety: forward pointer events to underlying interactive elements when an overlay or other layer
  // prevents the native click from reaching them. This only forwards when the event target is not
  // an interactive element but an interactive element exists at the pointer coordinates.
  (function(){
    const interactiveSelector = 'a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])';
    function forwardIfNeeded(e){
      try{
        const x = (typeof mouseX !== 'undefined') ? mouseX : (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX));
        const y = (typeof mouseY !== 'undefined') ? mouseY : (e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY));
        if(typeof x === 'undefined' || typeof y === 'undefined') return;
        const topEl = document.elementFromPoint(x, y);
        if(!topEl) return;
        const wasInteractive = e.target && e.target.closest && e.target.closest(interactiveSelector);
        const isInteractive = topEl.closest && topEl.closest(interactiveSelector);
        // if the actual event target is not interactive but the element under the pointer is interactive,
        // forward the click/focus to that element.
        if(!wasInteractive && isInteractive){
          // Stop original so we don't double-trigger behaviour
          e.stopPropagation();
          e.preventDefault();
          const target = topEl.closest(interactiveSelector) || topEl;
          // focus then trigger a native click where possible
          try{ target.focus({preventScroll:true}); }catch(_){ try{ target.focus(); }catch(__){} }
          // dispatch a synthesized click event
          const clickEvt = new MouseEvent('click', {bubbles:true,cancelable:true,view:window});
          target.dispatchEvent(clickEvt);
        }
      }catch(err){ /* swallow */ }
    }

    // capture phase ensures we see the event before it bubbles to problematic overlays
    window.addEventListener('click', forwardIfNeeded, true);
    window.addEventListener('touchend', forwardIfNeeded, true);
  })();

  /* Loader overlay hide logic: fade out once window load finishes. */
  (function(){
    const loader = document.getElementById('loaderOverlay');
    if(!loader) return;
    // If the page is already loaded, hide immediately, else wait for load
    function hide(){
      loader.style.opacity = '0';
      // after transition, remove from DOM for cleanliness
      setTimeout(()=>{ if(loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 520);
    }
    if(document.readyState === 'complete'){
      // slight delay so the spinner is visible briefly
      setTimeout(hide, 240);
    } else {
      window.addEventListener('load', ()=>{ setTimeout(hide, 220); });
    }
  })();

  /* Precards interaction: allow selection via click or keyboard (Enter/Space).
     Selecting highlights the card (.selected) and reveals its text/media (handled by CSS).
  */
  (function(){
    const precards = Array.from(document.querySelectorAll('.precard'));
    if(!precards.length) return;

    precards.forEach(pc => {
      // make keyboard-focusable and announce as a button-like control
      pc.setAttribute('role','button');
      pc.setAttribute('aria-pressed','false');

      pc.addEventListener('click', (e)=>{
        e.stopPropagation();
        selectPrecard(pc);
      });

      pc.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          selectPrecard(pc);
        }
      });
    });

    function selectPrecard(target){
      precards.forEach(p => {
        const selected = (p === target);
        p.classList.toggle('selected', selected);
        p.setAttribute('aria-pressed', String(selected));
      });
    }

    // clicking anywhere outside the precards will clear selection
    document.addEventListener('click', (e)=>{
      if(!e.target.closest || !e.target.closest('.precard')){
        precards.forEach(p=>{ p.classList.remove('selected'); p.setAttribute('aria-pressed','false'); });
      }
    });
  })();

  /* Hero rotator: cycle through `.hero-content` slides at a fixed duration.
     Pauses on hover/focus and respects prefers-reduced-motion.
  */
  (function(){
    const rotator = document.querySelector('.hero-rotator');
    if(!rotator) return;
    const slides = Array.from(rotator.querySelectorAll('.hero-content'));
    if(slides.length < 2) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefersReduced) return; // don't auto-rotate for reduced-motion users

    let idx = 0;
    const DURATION = 4200; // ms per slide
    let timer = null;

    function show(i){
      slides.forEach((s, j)=>{
        const visible = j === i;
        s.classList.toggle('visible', visible);
        s.setAttribute('aria-hidden', String(!visible));
      });
    }

    function next(){ idx = (idx + 1) % slides.length; show(idx); }

    // start
    show(idx);
    timer = setInterval(next, DURATION);

    // pause on hover/focus
    rotator.addEventListener('mouseenter', ()=>{ if(timer){ clearInterval(timer); timer = null; } });
    rotator.addEventListener('mouseleave', ()=>{ if(!timer) timer = setInterval(next, DURATION); });
    rotator.addEventListener('focusin', ()=>{ if(timer){ clearInterval(timer); timer = null; } });
    rotator.addEventListener('focusout', ()=>{ if(!timer) timer = setInterval(next, DURATION); });

    // pause when tab is inactive to reduce work
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){ if(timer){ clearInterval(timer); timer = null; } }
      else { if(!timer) timer = setInterval(next, DURATION); }
    });

  })();

  /* Lazy-load card hover images: when a .card.big with data-img is hovered or focused,
     insert an <img> into its .card-media so the image appears on hover (keeps SVG placeholder otherwise).
  */
  (function(){
    const cards = Array.from(document.querySelectorAll('.card.big[data-img]'));
    if(!cards.length) return;

    function ensureImage(card){
      if(card.dataset._imgLoaded) return;
      const src = card.dataset.img;
      if(!src) return;
      const media = card.querySelector('.card-media');
      if(!media) return;
      const img = document.createElement('img');
      img.src = src;
      img.alt = card.querySelector('h3, h2') ? card.querySelector('h3, h2').textContent + ' image' : 'Preview image';
      img.loading = 'lazy';
      img.className = 'card-media-img';
      // when the image loads, mark loaded so we don't recreate it
      img.addEventListener('load', ()=>{ card.dataset._imgLoaded = '1'; });
      img.addEventListener('error', ()=>{ /* if image fails, keep SVG placeholder */ });
      // prepend image so it sits under text layering if needed (but CSS controls opacity)
      media.insertBefore(img, media.firstChild);
    }

    cards.forEach(c => {
      c.addEventListener('mouseenter', ()=> ensureImage(c), {passive:true});
      c.addEventListener('focusin', ()=> ensureImage(c));
      // also load on touchstart for mobile
      c.addEventListener('touchstart', ()=> ensureImage(c), {passive:true});
    });
  })();

});
