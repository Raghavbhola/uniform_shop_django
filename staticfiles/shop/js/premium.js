/* ============================================================
   SHREE KRISHAN UNIFORM — PREMIUM JAVASCRIPT 2026
   GSAP Animations, Interactive Components, Charts
   ============================================================ */

// ============================================================
// DESIGN TOKENS & CONFIG
// ============================================================

const CONFIG = {
  animations: {
    duration: {
      fast: 0.3,
      normal: 0.5,
      slow: 0.8,
      slower: 1.2
    },
    ease: {
      out: 'power2.out',
      spring: 'back.out(1.5)',
      bounce: 'elastic.out(1, 0.5)',
      expo: 'expo.out'
    }
  },
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1280
  },
  colors: {
    navy: '#061d49',
    blue: '#1557b7',
    blueLight: '#2675df',
    gold: '#ffc928',
    green: '#16a34a',
    red: '#dc2626'
  }
};

// ============================================================
// GSAP SETUP & UTILITIES
// ============================================================

// Initialize GSAP if available
let gsap = null;
let ScrollTrigger = null;
let ScrollToPlugin = null;

async function loadGSAP() {
  if (typeof window.gsap !== 'undefined') {
    gsap = window.gsap;
    ScrollTrigger = window.ScrollTrigger;
    ScrollToPlugin = window.ScrollToPlugin;
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    return true;
  }

  // Load GSAP from CDN
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
    script.onload = () => {
      gsap = window.gsap;
      const stScript = document.createElement('script');
      stScript.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js';
      stScript.onload = () => {
        ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        resolve(true);
      };
      document.head.appendChild(stScript);
    };
    document.head.appendChild(script);
  });
}

// Animation utilities
const animate = {
  fadeIn: (target, opts = {}) => gsap.fromTo(target,
    { opacity: 0, y: opts.y || 30 },
    { opacity: 1, y: 0, duration: opts.duration || CONFIG.animations.duration.normal, ease: opts.ease || CONFIG.animations.ease.out, ...opts }
  ),

  fadeInUp: (targets, stagger = 0.1, opts = {}) => gsap.fromTo(targets,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: CONFIG.animations.duration.slow, ease: CONFIG.animations.ease.out, stagger, ...opts }
  ),

  scaleIn: (target, opts = {}) => gsap.fromTo(target,
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: CONFIG.animations.duration.normal, ease: CONFIG.animations.ease.spring, ...opts }
  ),

  slideInLeft: (target, opts = {}) => gsap.fromTo(target,
    { opacity: 0, x: -60 },
    { opacity: 1, x: 0, duration: CONFIG.animations.duration.slow, ease: CONFIG.animations.ease.expo, ...opts }
  ),

  slideInRight: (target, opts = {}) => gsap.fromTo(target,
    { opacity: 0, x: 60 },
    { opacity: 1, x: 0, duration: CONFIG.animations.duration.slow, ease: CONFIG.animations.ease.expo, ...opts }
  ),

  counter: (element, endValue, opts = {}) => {
    const obj = { value: opts.start || 0 };
    gsap.to(obj, {
      value: endValue,
      duration: opts.duration || 2,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toLocaleString(opts.locale || 'en-IN');
      },
      onComplete: () => {
        element.textContent = endValue.toLocaleString(opts.locale || 'en-IN');
      },
      ...opts
    });
  },

  textReveal: (target, opts = {}) => {
    const chars = target.textContent.split('');
    target.innerHTML = chars.map(c => `<span class="char" style="display: inline-block;">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    gsap.fromTo(target.querySelectorAll('.char'),
      { opacity: 0, y: '100%', rotateX: -90 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: 'back.out(1.5)', stagger: 0.03, ...opts }
    );
  }
};

// ============================================================
// COMPONENT: NAVIGATION
// ============================================================

class Navigation {
  constructor() {
    this.nav = document.querySelector('.topbar, header.topbar');
    this.mobileMenu = document.getElementById('mobileMenu');
    this.menuToggle = document.querySelector('.nav-menu-toggle, .mobile-menu-btn');
    this.lastScroll = 0;
    this.init();
  }

  init() {
    if (!this.nav) return;
    this.handleScroll();
    this.handleMobileMenu();
    this.handleActiveLinks();
  }

  handleScroll() {
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      const isScrolled = currentScroll > 50;

      this.nav.classList.toggle('scrolled', isScrolled);
      this.nav.classList.toggle('nav-hidden', currentScroll > this.lastScroll && currentScroll > 200);
      this.lastScroll = currentScroll;
    }, { passive: true });
  }

  handleMobileMenu() {
    if (!this.menuToggle || !this.mobileMenu) return;

    this.menuToggle.addEventListener('click', () => {
      const isOpen = this.mobileMenu.classList.toggle('open');
      this.menuToggle.classList.toggle('active', isOpen);
      this.menuToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    this.mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeMenu();
    });
  }

  closeMenu() {
    this.mobileMenu.classList.remove('open');
    this.menuToggle.classList.remove('active');
    this.menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  handleActiveLinks() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.navlinks a, .mobile-menu a').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  }
}

// ============================================================
// COMPONENT: HERO SECTION
// ============================================================

class HeroSection {
  constructor() {
    this.section = document.querySelector('.hero');
    this.uniformCard = document.getElementById('uniformCard');
    this.uniformArt = document.querySelector('.uniform-art');
    this.uniformRotator = document.querySelector('.uniform-rotator');
    this.uniformStamp = document.querySelector('.uniform-stamp');
    this.visualGlow = document.querySelector('.visual-glow');
    this.items = [
      { emoji: '👕', name: 'Shirts', svg: 'shirt' },
      { emoji: '👖', name: 'Trousers', svg: 'trouser' },
      { emoji: '👟', name: 'Shoes', svg: 'shoes' },
      { emoji: '🎒', name: 'School Bags', svg: 'bag' },
      { emoji: '🧦', name: 'Socks', svg: 'socks' },
      { emoji: '👔', name: 'Ties', svg: 'tie' },
      { emoji: '🍱', name: 'Lunch Box', svg: 'tiffin' },
      { emoji: '🧥', name: 'Sweaters', svg: 'sweater' }
    ];
    this.currentIndex = 0;
    this.init();
  }

  init() {
    if (!this.section) return;
    this.setupParallax();
    this.startRotation();
    this.setupHoverEffects();
    this.animateEntrance();
  }

  setupParallax() {
    if (!gsap) return;

    gsap.to(this.visualGlow, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: this.section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });

    gsap.to(this.uniformCard, {
      yPercent: 15,
      rotate: 2,
      ease: 'none',
      scrollTrigger: {
        trigger: this.section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5
      }
    });
  }

  startRotation() {
    if (!this.uniformCard) return;

    const rotate = () => {
      this.currentIndex = (this.currentIndex + 1) % this.items.length;
      const item = this.items[this.currentIndex];

      gsap.timeline()
        .to(this.uniformCard, {
          opacity: 0,
          scale: 0.9,
          rotateY: 90,
          duration: 0.4,
          ease: 'power2.in'
        })
        .to(this.uniformArt, {
          textContent: item.emoji,
          duration: 0
        })
        .to(this.uniformRotator, {
          textContent: item.name,
          duration: 0
        }, '<')
        .to(this.uniformCard, {
          opacity: 1,
          scale: 1,
          rotateY: 0,
          duration: 0.6,
          ease: 'back.out(1.5)'
        });
    };

    this.rotationInterval = setInterval(rotate, 3000);

    // Pause on hover
    this.uniformCard.addEventListener('mouseenter', () => clearInterval(this.rotationInterval));
    this.uniformCard.addEventListener('mouseleave', () => {
      this.rotationInterval = setInterval(rotate, 3000);
    });
  }

  setupHoverEffects() {
    if (!this.uniformCard || !gsap) return;

    this.uniformCard.addEventListener('mousemove', (e) => {
      const rect = this.uniformCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(this.uniformCard, {
        rotateY: x * 15,
        rotateX: -y * 15,
        duration: 0.5,
        ease: 'power2.out'
      });
    });

    this.uniformCard.addEventListener('mouseleave', () => {
      gsap.to(this.uniformCard, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)'
      });
    });
  }

  animateEntrance() {
    if (!gsap) return;

    const tl = gsap.timeline({ delay: 0.3 });

    tl.from('.hero .eyebrow', { opacity: 0, y: 30, duration: 0.8, ease: 'power2.out' })
      .from('.hero h1', { opacity: 0, y: 40, duration: 1, ease: 'expo.out' }, '-=0.4')
      .from('.hero-copy', { opacity: 0, y: 30, duration: 0.8, ease: 'power2.out' }, '-=0.6')
      .from('.actions .btn', { opacity: 0, y: 30, duration: 0.6, ease: 'back.out(1.5)', stagger: 0.1 }, '-=0.4')
      .from('.trust span', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out', stagger: 0.08 }, '-=0.3')
      .from(this.uniformCard, { opacity: 0, scale: 0.9, duration: 1, ease: 'elastic.out(1, 0.5)' }, '-=1')
      .from(this.uniformStamp, { opacity: 0, scale: 0.5, rotation: -180, duration: 0.8, ease: 'back.out(2)' }, '-=0.5');
  }
}

// ============================================================
// COMPONENT: SCROLL REVEAL
// ============================================================

class ScrollReveal {
  constructor() {
    this.elements = document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale');
    this.init();
  }

  init() {
    if (!gsap || !ScrollTrigger || !this.elements.length) return;

    this.elements.forEach(el => {
      const direction = el.classList.contains('reveal-left') ? -1 :
                        el.classList.contains('reveal-right') ? 1 : 0;
      const scale = el.classList.contains('reveal-scale');

      gsap.fromTo(el,
        {
          opacity: 0,
          y: direction === 0 ? 50 : 30,
          x: direction * 50,
          scale: scale ? 0.9 : 1
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
            once: true
          }
        }
      );
    });

    // Staggered children
    document.querySelectorAll('.stagger-children').forEach(container => {
      const children = container.children;
      gsap.fromTo(children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            once: true
          }
        }
      );
    });
  }
}

// ============================================================
// COMPONENT: STAT COUNTERS
// ============================================================

class StatCounters {
  constructor() {
    this.counters = document.querySelectorAll('[data-counter]');
    this.init();
  }

  init() {
    if (!gsap || !ScrollTrigger || !this.counters.length) return;

    this.counters.forEach(counter => {
      const target = parseInt(counter.dataset.counter, 10) || 0;
      const suffix = counter.dataset.suffix || '';
      const prefix = counter.dataset.prefix || '';
      const decimals = parseInt(counter.dataset.decimals, 10) || 0;

      ScrollTrigger.create({
        trigger: counter,
        start: 'top 80%',
        once: true,
        onEnter: () => this.animateCounter(counter, target, suffix, prefix, decimals)
      });
    });
  }

  animateCounter(el, target, suffix, prefix, decimals) {
    const obj = { value: 0 };
    gsap.to(obj, {
      value: target,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = prefix + obj.value.toFixed(decimals).toLocaleString('en-IN') + suffix;
      },
      onComplete: () => {
        el.textContent = prefix + target.toLocaleString('en-IN') + suffix;
      }
    });
  }
}

// ============================================================
// COMPONENT: INTERACTIVE CHARTS
// ============================================================

class InteractiveCharts {
  constructor() {
    this.charts = document.querySelectorAll('.chart-bar, .chart-line, .chart-donut, .chart-area');
    this.init();
  }

  init() {
    this.charts.forEach(chart => {
      if (chart.classList.contains('chart-bar')) this.initBarChart(chart);
      else if (chart.classList.contains('chart-line')) this.initLineChart(chart);
      else if (chart.classList.contains('chart-donut')) this.initDonutChart(chart);
      else if (chart.classList.contains('chart-area')) this.initAreaChart(chart);
    });
  }

  initBarChart(container) {
    const data = JSON.parse(container.dataset.chartData || '[]');
    const max = Math.max(...data.map(d => d.value), 1);
    const colors = container.dataset.colors ? JSON.parse(container.dataset.colors) : [CONFIG.colors.blue, CONFIG.colors.blueLight];

    container.innerHTML = data.map((d, i) => `
      <div class="chart-bar-item" style="--height: ${(d.value / max) * 100}%; --color: ${colors[i % colors.length]};" data-value="${d.value}" data-label="${d.label}">
        <span class="chart-bar-value">${d.value.toLocaleString()}</span>
        <div class="chart-bar-fill"></div>
        <span class="chart-bar-label">${d.label}</span>
      </div>
    `).join('');

    if (gsap && ScrollTrigger) {
      gsap.fromTo(container.querySelectorAll('.chart-bar-fill'),
        { height: 0 },
        {
          height: '100%',
          duration: 1,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            once: true
          }
        }
      );
    }
  }

  initLineChart(container) {
    const data = JSON.parse(container.dataset.chartData || '[]');
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - (d.value / Math.max(...data.map(d => d.value), 1)) * 90
    })).map(p => `${p.x}% ${p.y}%`).join(',');

    container.innerHTML = `
      <svg class="chart-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${CONFIG.colors.blue}"/>
            <stop offset="100%" stop-color="${CONFIG.colors.blueLight}"/>
          </linearGradient>
        </defs>
        <polygon class="chart-area-fill" points="0,100 ${points} 100,100" fill="url(#lineGradient)" opacity="0.15"/>
        <polyline class="chart-line-path" points="${points}" fill="none" stroke="url(#lineGradient)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>
        ${data.map((d, i) => `
          <circle class="chart-point" cx="${(i / (data.length - 1)) * 100}%" cy="${100 - (d.value / Math.max(...data.map(d => d.value), 1)) * 90}%" r="1.2" fill="${CONFIG.colors.blue}"/>
        `).join('')}
      </svg>
      <div class="chart-tooltip" aria-hidden="true"></div>
    `;

    // Hover interaction
    const svg = container.querySelector('.chart-line-svg');
    const tooltip = container.querySelector('.chart-tooltip');
    const maxVal = Math.max(...data.map(d => d.value), 1);

    svg.addEventListener('mousemove', (e) => {
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const index = Math.round(x * (data.length - 1));
      const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
      const point = data[clampedIndex];

      tooltip.style.left = `${x * 100}%`;
      tooltip.style.opacity = 1;
      tooltip.innerHTML = `<strong>${point.label}</strong><br>${point.value.toLocaleString()}`;
    });

    svg.addEventListener('mouseleave', () => {
      tooltip.style.opacity = 0;
    });

    if (gsap && ScrollTrigger) {
      gsap.fromTo(container.querySelector('.chart-line-path'),
        { strokeDasharray: '1000', strokeDashoffset: '1000' },
        {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            once: true
          }
        }
      );
    }
  }

  initDonutChart(container) {
    const data = JSON.parse(container.dataset.chartData || '[]');
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90;

    const segments = data.map((d, i) => {
      const angle = (d.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const largeArc = angle > 180 ? 1 : 0;
      const start = this.polarToCartesian(50, 50, 40, startAngle);
      const end = this.polarToCartesian(50, 50, 40, endAngle);

      const path = `M ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y}`;
      const color = d.color || `hsl(${i * 60}, 70%, 50%)`;

      return `<path class="donut-segment" d="${path}" stroke="${color}" stroke-width="32" fill="none" stroke-linecap="round" data-value="${d.value}" data-label="${d.label}" style="--angle: ${angle}deg; --color: ${color};"/>`;
    }).join('');

    container.innerHTML = `
      <svg class="chart-donut-svg" viewBox="0 0 100 100">
        <circle class="donut-bg" cx="50" cy="50" r="40" fill="none" stroke="${CONFIG.colors.borderLight || '#e3ebf6'}" stroke-width="32"/>
        ${segments}
      </svg>
      <div class="donut-center">
        <span class="donut-total">${total.toLocaleString()}</span>
        <span class="donut-label">${container.dataset.totalLabel || 'Total'}</span>
      </div>
      <ul class="donut-legend">
        ${data.map(d => `
          <li><span class="legend-color" style="background: ${d.color || `hsl(${data.indexOf(d) * 60}, 70%, 50%)`}"></span><span class="legend-label">${d.label}</span><span class="legend-value">${d.value.toLocaleString()}</span></li>
        `).join('')}
      </ul>
    `;

    if (gsap && ScrollTrigger) {
      gsap.fromTo(container.querySelectorAll('.donut-segment'),
        { strokeDasharray: '0 251', strokeDashoffset: 0 },
        {
          strokeDasharray: (i, el) => {
            const angle = parseFloat(el.style.getPropertyValue('--angle')) || 0;
            return `${(angle / 360) * 251} 251`;
          },
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            once: true
          }
        }
      );
    }
  }

  polarToCartesian(cx, cy, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians)
    };
  }

  initAreaChart(container) {
    // Similar to line chart but with filled area
    this.initLineChart(container);
  }
}

// ============================================================
// COMPONENT: PRODUCT CARDS
// ============================================================

class ProductCards {
  constructor() {
    this.cards = document.querySelectorAll('.product-card, .product');
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      this.setupHoverAnimation(card);
      this.setupAddToCart(card);
    });
  }

  setupHoverAnimation(card) {
    if (!gsap) return;

    const image = card.querySelector('img, .product-icon');
    const badge = card.querySelector('.product-badge');
    const btn = card.querySelector('.add-cart, .btn');

    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -8, boxShadow: 'var(--shadow-xl)', duration: 0.3, ease: 'power2.out' });
      if (image) gsap.to(image, { scale: 1.05, duration: 0.4, ease: 'power2.out' });
      if (badge) gsap.to(badge, { scale: 1.1, rotate: 5, duration: 0.3, ease: 'back.out(2)' });
      if (btn) gsap.to(btn, { y: -4, duration: 0.3, ease: 'power2.out' });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, boxShadow: 'var(--shadow-sm)', duration: 0.4, ease: 'power2.out' });
      if (image) gsap.to(image, { scale: 1, duration: 0.4, ease: 'power2.out' });
      if (badge) gsap.to(badge, { scale: 1, rotate: 0, duration: 0.3, ease: 'power2.out' });
      if (btn) gsap.to(btn, { y: 0, duration: 0.3, ease: 'power2.out' });
    });
  }

  setupAddToCart(card) {
    const btn = card.querySelector('.add-cart, [data-add-to-cart]');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.id || btn.dataset.productId;

      // Animation feedback
      gsap.timeline()
        .to(btn, { scale: 0.9, duration: 0.1 })
        .to(btn, { scale: 1.1, duration: 0.2, ease: 'back.out(2)' })
        .to(btn, { scale: 1, duration: 0.2 });

      // Update text temporarily
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ Added';
      btn.classList.add('btn-success');

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('btn-success');
      }, 1500);

      // Trigger custom event
      card.dispatchEvent(new CustomEvent('product:add', {
        detail: { productId, card },
        bubbles: true
      }));
    });
  }
}

// ============================================================
// COMPONENT: SIDEBAR NAVIGATION (Dashboard/Admin)
// ============================================================

class SidebarNav {
  constructor() {
    this.sidebar = document.querySelector('.sidebar, .admin-sidebar');
    this.toggleBtn = document.querySelector('.sidebar-toggle, .mobile-sidebar-btn');
    this.backdrop = document.querySelector('.sidebar-backdrop');
    this.isCollapsed = false;
    this.init();
  }

  init() {
    if (!this.sidebar) return;
    this.handleToggle();
    this.handleResize();
    this.handleActiveState();
    this.setupTooltips();
  }

  handleToggle() {
    if (!this.toggleBtn) return;

    this.toggleBtn.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.sidebar.classList.toggle('collapsed', this.isCollapsed);
      this.toggleBtn.setAttribute('aria-expanded', !this.isCollapsed);

      if (window.innerWidth < 1024) {
        this.sidebar.classList.toggle('open', !this.isCollapsed);
        this.backdrop?.classList.toggle('open', !this.isCollapsed);
        document.body.style.overflow = this.sidebar.classList.contains('open') ? 'hidden' : '';
      }
    });

    this.backdrop?.addEventListener('click', () => this.close());
  }

  close() {
    this.sidebar.classList.remove('open');
    this.backdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  handleResize() {
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        this.sidebar.classList.remove('open');
        this.backdrop?.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  handleActiveState() {
    const currentPath = window.location.pathname;
    this.sidebar.querySelectorAll('a').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
        // Expand parent if in collapsed mode
        const parent = link.closest('.nav-group');
        if (parent) parent.classList.add('expanded');
      }
    });
  }

  setupTooltips() {
    if (!this.isCollapsed) return;

    this.sidebar.querySelectorAll('a[title], button[title]').forEach(el => {
      const tooltip = document.createElement('div');
      tooltip.className = 'sidebar-tooltip';
      tooltip.textContent = el.getAttribute('title');
      el.removeAttribute('title');
      el.appendChild(tooltip);

      el.addEventListener('mouseenter', () => {
        tooltip.style.opacity = 1;
        tooltip.style.transform = 'translateX(8px)';
      });

      el.addEventListener('mouseleave', () => {
        tooltip.style.opacity = 0;
        tooltip.style.transform = 'translateX(0)';
      });
    });
  }
}

// ============================================================
// COMPONENT: NOTIFICATIONS
// ============================================================

class Notifications {
  constructor() {
    this.bell = document.getElementById('notifyBtn');
    this.box = document.getElementById('notifyBox');
    this.content = document.getElementById('notificationContent');
    this.badge = document.getElementById('notifyBadge');
    this.markAll = document.getElementById('markAll');
    this.url = this.bell?.dataset.notifyUrl;
    this.seen = new Set();
    this.lastData = null;
    this.init();
  }

  init() {
    if (!this.bell || !this.box) return;

    this.loadSeen();
    this.bell.addEventListener('click', () => this.toggle());
    this.markAll?.addEventListener('click', () => this.markAllRead());

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.notification')) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    this.content.addEventListener('click', (e) => {
      const item = e.target.closest('.notification-item');
      if (item?.dataset.id) {
        this.seen.add(item.dataset.id);
        this.saveSeen();
        item.classList.remove('unread');
        this.updateBadge();
      }
    });

    // Initial load
    if (!document.hidden) this.fetch();
    setInterval(() => { if (!document.hidden) this.fetch(); }, 30000);
  }

  async fetch() {
    if (!this.url) return;
    try {
      const res = await fetch(this.url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      this.lastData = await res.json();
      this.render();
    } catch (e) {
      console.error('Notifications fetch failed:', e);
    }
  }

  render() {
    if (!this.lastData) return;

    const nc = this.lastData.new_customers || [];
    const no = this.lastData.new_orders || [];
    const pp = this.lastData.pending_payments || [];
    const uc = this.lastData.unpaid_bills || [];
    const ev = this.lastData.events || [];

    const sections = [
      { title: '🆕 New Customers', items: nc, fmt: this.fmtCustomer, countable: true },
      { title: '📦 New Orders', items: no, fmt: this.fmtOrder, countable: true },
      { title: '💰 Pending UPI', items: pp, fmt: this.fmtOrder, countable: true },
      { title: '⚠️ Unpaid COD', items: uc, fmt: this.fmtOrder, countable: true },
      { title: '🔔 Recent Activity', items: ev, fmt: this.fmtEvent, countable: false }
    ];

    this.content.innerHTML = sections.map(s => this.renderSection(s)).join('');

    // Animate new items
    if (gsap) {
      gsap.from(this.content.querySelectorAll('.notification-item'), {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.05
      });
    }

    this.updateBadge();
  }

  fmtCustomer(i) {
    return [i.phone, `Registered: ${i.created_at || ''}`];
  }

  fmtOrder(i) {
    return [`${i.bill_no || ''} - ${i.customer || ''}`, `₹${i.amount ?? ''} | ${i.payment || ''} | ${i.status || ''}`];
  }

  fmtEvent(i) {
    return [i.title, i.message];
  }

  idOf(i) {
    return [i.bill_no || i.phone || i.title || i.link || '', i.status || '', i.created_at || ''].join('|');
  }

  renderSection({ title, items, fmt, countable }) {
    let html = `<h4>${title} (${items.length})</h4>`;
    if (!items.length) return html + '<div class="notification-empty">No records found.</div>';

    items.forEach(i => {
      const [name, detail] = fmt(i);
      const id = this.idOf(i);
      const unread = countable && !this.seen.has(id);
      const link = i.link && i.link.startsWith('/') && !i.link.startsWith('//') ? i.link : '#';

      html += `
        <a class="notification-item ${unread ? 'unread' : ''}" data-id="${this.esc(id)}" href="${this.esc(link)}">
          <b>${this.esc(name)}</b>
          <p>${this.esc(detail)}</p>
          ${i.created_at && fmt !== this.fmtCustomer ? `<small>${this.esc(i.created_at)}</small>` : ''}
          <span>View Details →</span>
        </a>
      `;
    });
    return html;
  }

  updateBadge() {
    if (!this.lastData || !this.badge) return;

    const unseen = new Set();
    [...(this.lastData.new_customers || []), ...(this.lastData.new_orders || []),
     ...(this.lastData.pending_payments || []), ...(this.lastData.unpaid_bills || [])]
      .forEach(i => { const id = this.idOf(i); if (!this.seen.has(id)) unseen.add(id); });

    this.badge.textContent = unseen.size > 99 ? '99+' : unseen.size;
    this.badge.style.display = unseen.size ? 'flex' : 'none';

    // Animate badge
    if (gsap && unseen.size) {
      gsap.fromTo(this.badge, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
    }
  }

  markAllRead() {
    if (!this.lastData) return;
    [...(this.lastData.new_customers || []), ...(this.lastData.new_orders || []),
     ...(this.lastData.pending_payments || []), ...(this.lastData.unpaid_bills || [])]
      .forEach(i => this.seen.add(this.idOf(i)));
    this.saveSeen();
    this.render();
  }

  toggle() {
    const open = this.box.classList.toggle('open');
    this.bell.setAttribute('aria-expanded', open);
    if (open) this.fetch();
  }

  close() {
    this.box.classList.remove('open');
    this.bell.setAttribute('aria-expanded', 'false');
  }

  loadSeen() {
    try {
      this.seen = new Set(JSON.parse(localStorage.getItem('sku_seen_notifications') || '[]'));
    } catch (e) {}
  }

  saveSeen() {
    try {
      localStorage.setItem('sku_seen_notifications', JSON.stringify([...this.seen].slice(-500)));
    } catch (e) {}
  }

  esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
  }
}

// ============================================================
// COMPONENT: TOAST NOTIFICATIONS
// ============================================================

class Toast {
  static container = null;

  static init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  static show(message, type = 'info', title = '', duration = 5000) {
    this.init();

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${this.esc(title)}</div>` : ''}
        <div class="toast-message">${this.esc(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">✕</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => this.dismiss(toast));
    this.container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto dismiss
    setTimeout(() => this.dismiss(toast), duration);

    return toast;
  }

  static dismiss(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }

  static esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
  }
}

// ============================================================
// COMPONENT: FORM VALIDATION & ENHANCEMENT
// ============================================================

class FormEnhancer {
  constructor() {
    this.forms = document.querySelectorAll('form[data-enhanced], form.enhanced');
    this.init();
  }

  init() {
    this.forms.forEach(form => this.enhanceForm(form));
    // Auto-enhance forms with validation attributes
    document.querySelectorAll('form:not([data-enhanced])').forEach(form => {
      if (form.querySelector('[required], [pattern], [min], [max]')) {
        this.enhanceForm(form);
      }
    });
  }

  enhanceForm(form) {
    form.setAttribute('novalidate', '');
    form.dataset.enhanced = 'true';

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });

    form.addEventListener('submit', (e) => this.handleSubmit(e, form));
  }

  validateField(input) {
    const validity = input.validity;
    let message = '';

    if (validity.valueMissing) message = 'This field is required';
    else if (validity.typeMismatch) message = 'Please enter a valid format';
    else if (validity.patternMismatch) message = input.dataset.patternMessage || 'Invalid format';
    else if (validity.rangeUnderflow) message = `Minimum value is ${input.min}`;
    else if (validity.rangeOverflow) message = `Maximum value is ${input.max}`;
    else if (validity.tooShort) message = `Minimum ${input.minLength} characters`;
    else if (validity.tooLong) message = `Maximum ${input.maxLength} characters`;

    if (message) {
      this.showError(input, message);
      return false;
    } else {
      this.clearError(input);
      return true;
    }
  }

  showError(input, message) {
    input.classList.add('error');
    let errorEl = input.parentNode.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      input.parentNode.appendChild(errorEl);
    }
    errorEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>${message}`;

    if (gsap) {
      gsap.from(errorEl, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.out' });
    }
  }

  clearError(input) {
    input.classList.remove('error');
    const errorEl = input.parentNode.querySelector('.field-error');
    if (errorEl) {
      if (gsap) {
        gsap.to(errorEl, { opacity: 0, y: -10, duration: 0.2, onComplete: () => errorEl.remove() });
      } else {
        errorEl.remove();
      }
    }
  }

  handleSubmit(e, form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) isValid = false;
    });

    if (!isValid) {
      e.preventDefault();
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    // Show loading state on submit button
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.classList.add('btn-loading');
      submitBtn.disabled = true;
    }

    return true;
  }
}

// ============================================================
// COMPONENT: CART DRAWER
// ============================================================

class CartDrawer {
  constructor() {
    this.fab = document.getElementById('cartFab');
    this.panel = document.getElementById('cartPanel');
    this.overlay = document.getElementById('cartOverlay');
    this.closeBtn = document.getElementById('cartClose');
    this.itemsContainer = document.getElementById('cartItems');
    this.countEl = document.getElementById('cartCount');
    this.totalEl = document.getElementById('cartTotal');
    this.cart = [];
    this.init();
  }

  init() {
    if (!this.panel) return;

    this.loadCart();
    this.render();

    this.fab?.addEventListener('click', () => this.open());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  loadCart() {
    try {
      this.cart = JSON.parse(localStorage.getItem('sku_cart') || '[]');
      if (!Array.isArray(this.cart)) this.cart = [];
    } catch (e) { this.cart = []; }
  }

  saveCart() {
    try {
      localStorage.setItem('sku_cart', JSON.stringify(this.cart));
    } catch (e) {}
    this.render();
  }

  addItem(product, size = '') {
    const key = `${product.id}|${size}`;
    const existing = this.cart.find(i => i.key === key);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({
        key, id: product.id, name: product.name,
        school: product.school, cls: product.cls || '',
        size, price: Number(product.price), qty: 1
      });
    }
    this.saveCart();
    this.open();

    // Animate FAB
    if (gsap && this.fab) {
      gsap.fromTo(this.fab, { scale: 1 }, { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  }

  updateQty(key, delta) {
    const item = this.cart.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) this.cart = this.cart.filter(i => i.key !== key);
    this.saveCart();
  }

  removeItem(key) {
    this.cart = this.cart.filter(i => i.key !== key);
    this.saveCart();
  }

  open() {
    this.panel.classList.add('open');
    this.overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.panel.setAttribute('aria-hidden', 'false');
  }

  close() {
    this.panel.classList.remove('open');
    this.overlay?.classList.remove('open');
    document.body.style.overflow = '';
    this.panel.setAttribute('aria-hidden', 'true');
  }

  render() {
    this.countEl.textContent = this.cart.reduce((sum, i) => sum + i.qty, 0);

    if (!this.cart.length) {
      this.itemsContainer.innerHTML = '<div class="cart-empty">Cart is empty.<br>Add uniforms to get started.</div>';
      this.totalEl.textContent = '₹0';
      return;
    }

    this.itemsContainer.innerHTML = this.cart.map(item => `
      <div class="ci" data-key="${this.esc(item.key)}">
        <div class="info">
          <b>${this.esc(item.name)}</b>
          <small>${this.esc(item.school)}${item.cls ? ' | ' + this.esc(item.cls) : ''}${item.size ? ' | Size ' + this.esc(item.size) : ''}</small>
          <small>₹${Number(item.price).toLocaleString('en-IN')} each</small>
        </div>
        <div class="qty">
          <button type="button" data-act="dec" aria-label="Decrease">−</button>
          <b>${item.qty}</b>
          <button type="button" data-act="inc" aria-label="Increase">+</button>
        </div>
        <button type="button" class="del" data-act="del" aria-label="Remove">✕</button>
      </div>
    `).join('');

    this.totalEl.textContent = '₹' + this.cart.reduce((sum, i) => sum + i.price * i.qty, 0).toLocaleString('en-IN');

    // Bind events
    this.itemsContainer.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = btn.closest('.ci').dataset.key;
        const act = btn.dataset.act;
        if (act === 'inc') this.updateQty(key, 1);
        else if (act === 'dec') this.updateQty(key, -1);
        else if (act === 'del') this.removeItem(key);
      });
    });
  }

  esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
  }
}

// ============================================================
// COMPONENT: SEARCH & FILTER
// ============================================================

class SearchFilter {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.filters = document.querySelectorAll('[data-filter]');
    this.cards = document.querySelectorAll('[data-search]');
    this.noResults = document.getElementById('noResults');
    this.init();
  }

  init() {
    if (!this.searchInput && !this.filters.length) return;

    this.searchInput?.addEventListener('input', () => this.filter());
    this.filters.forEach(f => f.addEventListener('change', () => this.filter()));
  }

  filter() {
    const search = this.searchInput?.value.toLowerCase().trim() || '';
    const activeFilters = {};

    this.filters.forEach(f => {
      if (f.value) activeFilters[f.dataset.filter] = f.value;
    });

    let visible = 0;

    this.cards.forEach(card => {
      const searchData = card.dataset.search?.toLowerCase() || '';
      const matchSearch = searchData.includes(search);

      let matchFilters = true;
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (card.dataset[key] !== value) matchFilters = false;
      });

      if (matchSearch && matchFilters) {
        card.style.display = '';
        visible++;
        if (gsap) gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      } else {
        card.style.display = 'none';
      }
    });

    if (this.noResults) {
      this.noResults.style.display = visible === 0 && this.cards.length > 0 ? 'block' : 'none';
    }
  }
}

// ============================================================
// COMPONENT: PROGRESS RINGS / CIRCULAR PROGRESS
// ============================================================

class ProgressRing {
  static create(container, value, max = 100, options = {}) {
    const percentage = Math.min(value / max, 1);
    const radius = options.radius || 48;
    const strokeWidth = options.strokeWidth || 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percentage);
    const color = options.color || CONFIG.colors.blue;
    const bgColor = options.bgColor || CONFIG.colors.borderLight;
    const showLabel = options.showLabel !== false;

    container.innerHTML = `
      <svg class="progress-ring" width="${radius * 2 + strokeWidth}" height="${radius * 2 + strokeWidth}" viewBox="0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}">
        <circle class="progress-ring-bg" cx="${radius + strokeWidth/2}" cy="${radius + strokeWidth/2}" r="${radius}" fill="none" stroke="${bgColor}" stroke-width="${strokeWidth}"/>
        <circle class="progress-ring-fill" cx="${radius + strokeWidth/2}" cy="${radius + strokeWidth/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${circumference}; transition: stroke-dashoffset 1s ease-out;"/>
        ${showLabel ? `<text class="progress-ring-text" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${radius * 0.4}" font-weight="700" fill="${options.textColor || CONFIG.colors.ink900}">${Math.round(percentage * 100)}%</text>` : ''}
      </svg>
    `;

    // Animate
    requestAnimationFrame(() => {
      const fill = container.querySelector('.progress-ring-fill');
      if (fill) fill.style.strokeDashoffset = offset;
    });

    return container;
  }
}

// ============================================================
// COMPONENT: TOOLTIP
// ============================================================

class Tooltip {
  static instances = [];

  constructor(trigger, content, options = {}) {
    this.trigger = trigger;
    this.content = content;
    this.options = { position: 'top', delay: 150, ...options };
    this.tooltip = null;
    this.timeout = null;
    this.init();
    Tooltip.instances.push(this);
  }

  init() {
    this.trigger.addEventListener('mouseenter', () => this.show());
    this.trigger.addEventListener('mouseleave', () => this.hide());
    this.trigger.addEventListener('focus', () => this.show());
    this.trigger.addEventListener('blur', () => this.hide());
  }

  show() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.tooltip = document.createElement('div');
      this.tooltip.className = `tooltip tooltip-${this.options.position}`;
      this.tooltip.innerHTML = this.content;
      document.body.appendChild(this.tooltip);

      this.position();
      requestAnimationFrame(() => this.tooltip.classList.add('show'));
    }, this.options.delay);
  }

  hide() {
    clearTimeout(this.timeout);
    if (this.tooltip) {
      this.tooltip.classList.remove('show');
      setTimeout(() => this.tooltip?.remove(), 200);
      this.tooltip = null;
    }
  }

  position() {
    if (!this.tooltip) return;
    const rect = this.trigger.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const gap = 8;

    let top, left;

    switch (this.options.position) {
      case 'top':
        top = rect.top - tooltipRect.height - gap;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + gap;
        break;
    }

    this.tooltip.style.top = `${top + window.scrollY}px`;
    this.tooltip.style.left = `${left + window.scrollX}px`;
  }

  static hideAll() {
    this.instances.forEach(i => i.hide());
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

let initialized = false;

async function initPremium() {
  if (initialized) return;
  initialized = true;

  // Load GSAP first
  await loadGSAP();

  // Initialize all components
  new Navigation();
  new HeroSection();
  new ScrollReveal();
  new StatCounters();
  new InteractiveCharts();
  new ProductCards();
  new SidebarNav();
  new Notifications();
  new FormEnhancer();
  new CartDrawer();
  new SearchFilter();

  // Global toast access
  window.Toast = Toast;

  // Dispatch ready event
  document.dispatchEvent(new CustomEvent('premium:ready'));

  console.log('🎨 Premium UI initialized');
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPremium);
} else {
  initPremium();
}

// Export for manual initialization
window.PremiumUI = {
  init: initPremium,
  animate,
  Toast,
  CONFIG
};