/* ==========================================================================
   EXTINTORES CONDOR — interações e motion
   ========================================================================== */
(function () {
  'use strict';

  // Reforço do "sempre abre no topo" para quando o navegador restaura a
  // página do cache (voltar/avançar) sem reexecutar o script inline do <head>.
  window.addEventListener('pageshow', () => {
    if (!location.hash) window.scrollTo(0, 0);
  });

  // ?motion=0 força motion desligado; ?motion=1 força ligado (ambos para QA)
  const motionParam = new URLSearchParams(location.search).get('motion');
  const motionOff = motionParam === '0';
  const prefersReducedMotion = motionOff ||
    (motionParam !== '1' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (motionOff) document.documentElement.classList.add('motion-off');
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Header: estado de scroll + barra de progresso ---------- */
  const header = document.getElementById('header');
  const progress = document.getElementById('scrollProgress');

  // Histerese: liga em 40px e só desliga abaixo de 14px. Um único limiar
  // (ex.: y > 10) faz a classe ligar/desligar em rajada quando o scroll
  // oscila perto do valor — e como a altura do header tem transição, isso
  // aparecia como o header "expandindo e encolhendo" sem parar.
  let headerScrolled = false;
  function onScroll() {
    const y = window.scrollY;
    if (!headerScrolled && y > 40) headerScrolled = true;
    else if (headerScrolled && y < 14) headerScrolled = false;
    header.classList.toggle('is-scrolled', headerScrolled);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    updateSpy();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Scroll spy ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  // Ordena por posição no documento: #licenciamento fica dentro de #servicos,
  // e a ordem do menu não bate com a ordem das seções na página.
  const spyTargets = navLinks
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);

  function updateSpy() {
    const probe = window.scrollY + 160;
    let current = spyTargets[0];
    for (const el of spyTargets) {
      if (el.getBoundingClientRect().top + window.scrollY <= probe) current = el;
    }
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + current.id);
    });
  }

  /* ---------- Nav mobile ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');

  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.addEventListener('click', e => {
    if (e.target.closest('.nav-link') && nav.classList.contains('is-open')) navToggle.click();
  });

  /* ---------- Hero slider ---------- */
  const hero = document.querySelector('.hero');
  const slides = Array.from(document.querySelectorAll('.hero-slider .slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dot'));
  const SLIDE_MS = 6500;
  let current = 0;
  let timer = null;
  let heroVisible = true;

  function restartDot(dot) {
    const bar = dot.querySelector('b s');
    bar.style.animation = 'none';
    void bar.offsetWidth; // força reflow para reiniciar a animação
    bar.style.animation = '';
  }

  function goTo(index, fromUser) {
    const next = (index + slides.length) % slides.length;
    if (next === current && fromUser) return;
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    dots[current].removeAttribute('aria-current');
    current = next;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    dots[current].setAttribute('aria-current', 'true');
    restartDot(dots[current]);
    hero.classList.toggle('on-light', slides[current].classList.contains('slide-light'));
    schedule();
  }

  // Estados de pausa: botão do usuário (persistente), hover, foco e aba oculta
  let userPaused = false;
  let hoverPaused = false;
  let focusPaused = false;

  function schedule() {
    clearTimeout(timer);
    if (prefersReducedMotion || userPaused || hoverPaused || focusPaused) return;
    timer = setTimeout(() => goTo(current + 1), SLIDE_MS);
  }

  function pauseAuto() {
    clearTimeout(timer);
    hero.classList.add('is-paused');
  }

  // Reinicia a barra do dot junto com o timer para não dessincronizar
  function resumeAuto() {
    if (userPaused || hoverPaused || focusPaused) return;
    hero.classList.remove('is-paused');
    restartDot(dots[current]);
    schedule();
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i, true)));

  // Botão pausar/retomar (WCAG 2.2.2 — visível também no touch/teclado)
  const pauseBtn = document.getElementById('heroPause');
  if (prefersReducedMotion) {
    pauseBtn.hidden = true;
  } else {
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      pauseBtn.classList.toggle('is-paused', userPaused);
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Retomar rotação automática' : 'Pausar rotação automática');
      if (userPaused) pauseAuto(); else resumeAuto();
    });
  }

  // Pausa no hover (desktop), no foco via teclado e quando a aba perde o foco
  if (finePointer) {
    hero.addEventListener('mouseenter', () => { hoverPaused = true; pauseAuto(); });
    hero.addEventListener('mouseleave', () => { hoverPaused = false; resumeAuto(); });
  }
  hero.addEventListener('focusin', () => { focusPaused = true; pauseAuto(); });
  hero.addEventListener('focusout', e => {
    if (hero.contains(e.relatedTarget)) return;
    focusPaused = false;
    resumeAuto();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAuto(); else resumeAuto();
  });

  // Swipe no mobile (só troca slide se o gesto for mais horizontal que vertical)
  let touchX = null, touchY = null;
  hero.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) goTo(current + (dx < 0 ? 1 : -1), true);
    touchX = touchY = null;
  }, { passive: true });

  // Teclado — ignora campos de formulário e só age com o hero na tela
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const t = e.target;
    if (t instanceof Element && (t.closest('input, textarea, select') || t.isContentEditable)) return;
    const r = hero.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    goTo(current + (e.key === 'ArrowLeft' ? -1 : 1), true);
  });

  schedule();

  // O 1º slide já nasce com is-active no HTML (pra funcionar sem JS), então
  // a transição de entrada (crossfade + leve escala) nunca disparava nele —
  // só nas trocas seguintes via goTo(). Força o estado "antes" via inline
  // style e libera em dois frames seguintes pra tocar a mesma transição
  // também na primeira carga da página.
  if (!prefersReducedMotion) {
    const firstSlide = slides[current];
    firstSlide.style.transition = 'none';
    firstSlide.style.opacity = '0';
    firstSlide.style.transform = 'scale(1.035)';
    requestAnimationFrame(() => {
      firstSlide.style.transition = '';
      requestAnimationFrame(() => {
        firstSlide.style.opacity = '';
        firstSlide.style.transform = '';
      });
    });
  }

  /* ---------- Brasas (partículas) no hero ---------- */
  const canvas = document.getElementById('embers');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let running = false;
    let raf = null;
    const COUNT = window.innerWidth < 768 ? 18 : 38;

    function resize() {
      canvas.width = hero.clientWidth;
      canvas.height = hero.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn(randomY) {
      return {
        x: Math.random() * canvas.width,
        y: randomY ? Math.random() * canvas.height : canvas.height + 8,
        r: 0.8 + Math.random() * 2.1,
        vy: 0.25 + Math.random() * 0.7,
        drift: 0.4 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.15 + Math.random() * 0.4,
        hue: Math.random() < 0.75 ? 24 + Math.random() * 16 : 145 // brasas + fagulhas verdes da marca
      };
    }
    particles = Array.from({ length: COUNT }, () => spawn(true));

    function tick(t) {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.vy;
        p.x += Math.sin(t / 1400 + p.phase) * p.drift * 0.4;
        if (p.y < -10) Object.assign(p, spawn(false));
        const flicker = 0.75 + Math.sin(t / 220 + p.phase) * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 58%, ${p.alpha * flicker})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible && !running) { running = true; raf = requestAnimationFrame(tick); }
      if (!heroVisible && running) { running = false; cancelAnimationFrame(raf); }
    }, { threshold: 0.05 }).observe(hero);
  }

  /* ---------- Marquee de clientes ---------- */
  const marquee = document.querySelector('.marquee');
  if (marquee) {
    const track = marquee.querySelector('.marquee-track');
    // O carrossel de logos é decorativo, lento e já pausa no hover (mecanismo
    // de pausa do WCAG 2.2.2), então roda mesmo com prefers-reduced-motion —
    // só ?motion=0 (QA) desliga de fato.
    const speed = motionOff ? 0 : parseFloat(marquee.dataset.speed || '0.6');

    // Com motion desligado (QA) o marquee fica estático: sem clones, sem rAF
    if (speed) {
      // Duplica para loop contínuo; clones ficam fora da árvore de acessibilidade
      Array.from(track.children).forEach(node => {
        const clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        if (clone.tagName === 'IMG') clone.alt = '';
        track.appendChild(clone);
      });

      let offset = 0;
      let paused = false;
      let raf = null;

      marquee.addEventListener('mouseenter', () => { paused = true; });
      marquee.addEventListener('mouseleave', () => { paused = false; });

      function loop() {
        if (raf === null) return;
        if (!paused) {
          offset -= speed;
          const half = track.scrollWidth / 2;
          if (-offset >= half) offset += half;
          track.style.transform = `translateX(${offset}px)`;
        }
        raf = requestAnimationFrame(loop);
      }

      // Só anima com a faixa visível
      new IntersectionObserver(entries => {
        const inView = entries[0].isIntersecting;
        if (inView && raf === null) { raf = requestAnimationFrame(loop); }
        if (!inView && raf !== null) { cancelAnimationFrame(raf); raf = null; }
      }, { threshold: 0 }).observe(marquee);
    }
  }

  /* ---------- Scroll reveal (com stagger) ---------- */
  // O stagger é aplicado via setTimeout (e não transition-delay) para não
  // atrasar as transições de hover dos cards depois do reveal.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = prefersReducedMotion ? 0 : parseInt(entry.target.dataset.revealDelay || '0', 10);
      if (delay) {
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
      } else {
        entry.target.classList.add('is-visible');
      }
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.stagger').forEach(group => {
    Array.from(group.querySelectorAll('.reveal')).forEach((el, i) => {
      el.dataset.revealDelay = String(i * 90);
    });
  });

  /* ---------- Aparição de letras: títulos entram palavra a palavra ---------- */
  // Preserva <em> (gradiente) e <br> — cada palavra vira um <span class="rw">
  // que entra em cascata via --wi + transition-delay no CSS.
  if (!prefersReducedMotion) {
    document.querySelectorAll('.section-title, .avcb-copy h3, .cta-band h2').forEach(title => {
      let wi = 0;
      const frag = document.createDocumentFragment();
      Array.from(title.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'rw';
            w.style.setProperty('--wi', wi++);
            w.textContent = part;
            frag.appendChild(w);
          });
        } else if (node.nodeName === 'BR') {
          frag.appendChild(node.cloneNode());
        } else if (node.nodeName === 'EM') {
          const w = document.createElement('span');
          w.className = 'rw';
          w.style.setProperty('--wi', wi++);
          w.appendChild(node.cloneNode(true));
          frag.appendChild(w);
        } else {
          frag.appendChild(node.cloneNode(true));
        }
      });
      title.textContent = '';
      title.appendChild(frag);
      title.classList.add('split');
      if (!title.classList.contains('reveal')) revealObserver.observe(title);
    });
  }

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Contadores ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      counterObserver.unobserve(el);
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      if (prefersReducedMotion) { el.textContent = target + suffix; return; }
      const dur = 1600;
      const start = performance.now();
      (function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

  /* ---------- Glow que segue o mouse ---------- */
  if (finePointer) {
    document.querySelectorAll('.glow-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ---------- Botões magnéticos ---------- */
  if (finePointer && !prefersReducedMotion) {
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- FAQ accordion animado ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const summary = item.querySelector('summary');
    const body = item.querySelector('.faq-body');

    summary.addEventListener('click', e => {
      e.preventDefault();
      if (item.hasAttribute('data-animating')) return;
      item.setAttribute('data-animating', '');

      if (item.open) {
        const anim = body.animate(
          [{ height: body.scrollHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: prefersReducedMotion ? 0 : 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
        anim.onfinish = () => { item.open = false; item.removeAttribute('data-animating'); };
      } else {
        item.open = true;
        const anim = body.animate(
          [{ height: '0px', opacity: 0 }, { height: body.scrollHeight + 'px', opacity: 1 }],
          { duration: prefersReducedMotion ? 0 : 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
        anim.onfinish = () => { item.removeAttribute('data-animating'); };
      }
    });
  });

  /* ---------- Formulário → WhatsApp ---------- */
  const form = document.getElementById('quoteForm');
  const WHATS = '5519974042095';

  const formError = document.getElementById('formError');

  form.addEventListener('submit', e => {
    e.preventDefault();
    let firstInvalid = null;

    ['fNome', 'fTelefone', 'fServico'].forEach(id => {
      const input = document.getElementById(id);
      const field = input.closest('.field');
      const ok = input.value.trim() !== '';
      field.classList.toggle('has-error', !ok);
      if (!ok) {
        input.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) firstInvalid = input;
      } else {
        input.removeAttribute('aria-invalid');
      }
    });
    if (firstInvalid) {
      formError.hidden = false;
      firstInvalid.focus();
      return;
    }
    formError.hidden = true;

    const nome = document.getElementById('fNome').value.trim();
    const tel = document.getElementById('fTelefone').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const servico = document.getElementById('fServico').value;
    const msg = document.getElementById('fMensagem').value.trim();

    const texto = [
      'Olá! Vim pelo site e gostaria de um orçamento.',
      '',
      `*Nome:* ${nome}`,
      `*Telefone:* ${tel}`,
      email ? `*E-mail:* ${email}` : null,
      `*Serviço:* ${servico}`,
      msg ? `*Mensagem:* ${msg}` : null
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  });

  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      input.closest('.field').classList.remove('has-error');
      if (!form.querySelector('.has-error')) formError.hidden = true;
    });
  });

  /* ---------- Ano no rodapé ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  onScroll();
})();
