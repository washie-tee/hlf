// Mobile navigation toggle and header scroll behavior
(function () {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  const header = document.getElementById('site-header');

  // Mobile menu
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Header solid on scroll
  if (header) {
    const onScroll = () => {
      const threshold = 60; // px before switching to solid
      const solid = window.scrollY > threshold;
      header.classList.toggle('header--solid', solid);
      header.classList.toggle('header--overlay', !solid);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', onScroll);
    onScroll();
  }
})();

// Hero Slider
(function () {
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  // Auto slide every 5 seconds
  setInterval(nextSlide, 5000);

  // Initial show
  showSlide(currentSlide);
})();

// Simple Lightbox for Gallery
(function () {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const imageEl = lightbox.querySelector('.lightbox-image');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const items = Array.from(document.querySelectorAll('#gallery .gallery-item'));
  let current = -1;

  function open(index) {
    if (index < 0 || index >= items.length) return;
    current = index;
    const href = items[current].getAttribute('href');
    // Reset any previous transforms from pinch-zoom before showing a new image
    imageEl.style.transform = '';
    imageEl.classList.remove('dragging');
    imageEl.src = href;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    imageEl.removeAttribute('src');
    document.body.style.overflow = '';
  }

  function show(offset) {
    const nextIndex = (current + offset + items.length) % items.length;
    open(nextIndex);
  }

  items.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      open(i);
    });
  });

  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', () => show(-1));
  nextBtn?.addEventListener('click', () => show(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(-1);
    if (e.key === 'ArrowRight') show(1);
  });
})();

// Classes Filter and cleanup
(function () {
  const filterContainer = document.querySelector('.classes-filter');
  if (!filterContainer) return;

  // Remove price badges, teacher titles, and Join Now buttons as requested
  document.querySelectorAll('.price-badge, .teacher, .classes .class-card .class-footer .btn').forEach(el => el.remove());

  const buttons = Array.from(filterContainer.querySelectorAll('.filter-btn'));
  const cards = Array.from(document.querySelectorAll('.classes .class-card'));

  function setActive(btn) {
    buttons.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
  }

  function applyFilter(category) {
    cards.forEach(card => {
      const cat = card.getAttribute('data-category');
      const show = category === 'all' || cat === category;
      card.classList.toggle('hidden', !show);
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter') || 'all';
      setActive(btn);
      applyFilter(category);
    });
  });

  // Initialize based on the active button
  const initial = buttons.find(b => b.classList.contains('active')) || buttons[0];
  if (initial) {
    setActive(initial);
    applyFilter(initial.getAttribute('data-filter') || 'all');
  }
})();

// Footer year + Scroll-to-top behavior + WhatsApp helper
(function () {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll to top button
  const topBtn = document.getElementById('scrollTop');
  function updateTopBtn() {
    if (!topBtn) return;
    const show = window.scrollY > 250;
    topBtn.classList.toggle('fab--hidden', !show);
  }
  window.addEventListener('scroll', updateTopBtn, { passive: true });
  window.addEventListener('load', updateTopBtn);
  topBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // WhatsApp links (placeholder for analytics)
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
    link.addEventListener('click', () => {
      // analytics placeholder
    });
  });
})();

// Lightbox pinch-zoom and pan (mobile-friendly)
(function () {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const imageEl = lightbox.querySelector('.lightbox-image');
  if (!imageEl) return;

  let scale = 1, tx = 0, ty = 0; // current transform
  let lastTx = 0, lastTy = 0;     // last committed pan
  const minScale = 1;
  const maxScale = 4;

  const pointers = new Map();
  let startDist = 0;   // initial pinch distance
  let startScale = 1;  // scale at pinch start
  let startX = 0, startY = 0; // pan start

  function setTransform() {
    imageEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function resetTransform() {
    scale = 1; tx = 0; ty = 0; lastTx = 0; lastTy = 0;
    setTransform();
    imageEl.classList.remove('dragging');
  }

  function distance2Pointers() {
    const pts = [...pointers.values()];
    if (pts.length < 2) return 0;
    const [a, b] = pts;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // Observe open/close to reset transforms each time
  const observer = new MutationObserver(() => {
    const isOpen = lightbox.classList.contains('open');
    if (isOpen) resetTransform();
  });
  observer.observe(lightbox, { attributes: true, attributeFilter: ['class'] });

  imageEl.addEventListener('pointerdown', (e) => {
    imageEl.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      startX = e.clientX; startY = e.clientY;
      imageEl.classList.add('dragging');
    } else if (pointers.size === 2) {
      startDist = distance2Pointers();
      startScale = scale;
      imageEl.classList.remove('dragging');
    }
    e.preventDefault();
  }, { passive: false });

  imageEl.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const d = distance2Pointers();
      if (startDist > 0) {
        scale = Math.max(minScale, Math.min(maxScale, startScale * (d / startDist)));
        setTransform();
      }
      e.preventDefault();
      return;
    }

    if (pointers.size === 1 && scale > 1) {
      tx = lastTx + (e.clientX - startX);
      ty = lastTy + (e.clientY - startY);
      setTransform();
      e.preventDefault();
    }
  }, { passive: false });

  function endPointer(e) {
    if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      lastTx = tx; lastTy = ty;
      imageEl.classList.remove('dragging');
    } else if (pointers.size === 1) {
      // Re-anchor pan start at remaining pointer
      const p = [...pointers.values()][0];
      startX = p.x; startY = p.y;
      lastTx = tx; lastTy = ty;
    }
  }

  imageEl.addEventListener('pointerup', endPointer);
  imageEl.addEventListener('pointercancel', endPointer);
  imageEl.addEventListener('pointerleave', endPointer);
})();