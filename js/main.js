/* ==========================================================================
   VIONIX GALACTIC MOTION & SCENE ENGINE
   ========================================================================== */

(function() {
  'use strict';

  // State Management & Hardware Adaptation
  const state = {
    isPaused: localStorage.getItem('vionix_anim_paused') === 'true',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    fps: 60,
    lastFrameTime: performance.now(),
    particleScale: 1.0,
    pointer: { x: -1000, y: -1000, targetX: -1000, targetY: -1000 },
    activeScene: document.body.dataset.scene || 'home'
  };

  // E. Adaptive Quality Throttling
  let frameTimes = [];
  function monitorPerformance(now) {
    const delta = now - state.lastFrameTime;
    state.lastFrameTime = now;
    frameTimes.push(delta);
    if (frameTimes.length > 30) {
      frameTimes.shift();
      const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      if (avgDelta > 20 && state.particleScale > 0.4) {
        state.particleScale -= 0.1; // Throttle particle density dynamically
      }
    }
  }

  // B1. Canvas Particle Neural Network Engine
  class NeuralNetworkCanvas {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.init();
      window.addEventListener('resize', () => this.resize());
    }

    init() {
      this.resize();
      this.createParticles();
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2);
      this.canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
    }

    createParticles() {
      const isMobile = window.innerWidth < 768;
      const baseCount = isMobile ? 600 : 2200;
      const count = Math.floor(baseCount * state.particleScale);
      this.particles = [];
      
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 0.5,
          color: Math.random() > 0.3 ? '#22E4FF' : '#7B3FE4'
        });
      }
    }

    render() {
      if (!this.ctx || state.isPaused || state.reducedMotion) return;
      
      const width = this.canvas.width;
      const height = this.canvas.height;
      this.ctx.clearRect(0, 0, width, height);

      // Render connected network
      for (let i = 0; i < this.particles.length; i++) {
        let p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Pointer repulsion/attraction
        const dx = state.pointer.x * Math.min(window.devicePixelRatio, 2) - p.x;
        const dy = state.pointer.y * Math.min(window.devicePixelRatio, 2) - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x -= (dx / dist) * 0.8;
          p.y -= (dy / dist) * 0.8;
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      }
    }
  }

  // B6. Magnetic Cursor Controller
  function initMagneticCursor() {
    if (matchMedia('(pointer: coarse)').matches || state.reducedMotion) return;

    const cursorDot = document.createElement('div');
    cursorDot.className = 'vionix-cursor-dot';
    cursorDot.style.cssText = `
      position: fixed; top:0; left:0; width: 8px; height: 8px;
      background: #22E4FF; border-radius: 50%; pointer-events: none;
      z-index: 9999; transform: translate(-50%, -50%);
      box-shadow: 0 0 10px #22E4FF; transition: transform 0.08s ease;
    `;
    document.body.appendChild(cursorDot);

    window.addEventListener('pointermove', (e) => {
      state.pointer.targetX = e.clientX;
      state.pointer.targetY = e.clientY;
    });

    function updateCursor() {
      state.pointer.x += (state.pointer.targetX - state.pointer.x) * 0.2;
      state.pointer.y += (state.pointer.targetY - state.pointer.y) * 0.2;
      cursorDot.style.left = `${state.pointer.x}px`;
      cursorDot.style.top = `${state.pointer.y}px`;

      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Attach magnetic effect to buttons & CTAs
    document.querySelectorAll('.btn, .social-icon-btn, .galactic-card').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.2;
        const deltaY = (e.clientY - centerY) * 0.2;
        el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.03)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // B7. 3D Card Tilt Engine
  function initCardTilt() {
    if (matchMedia('(pointer: coarse)').matches || state.reducedMotion) return;

    document.querySelectorAll('.galactic-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -8;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  // B2. Three.js Interactive 3D Globe Loader & Setup
  function init3DGlobe() {
    const container = document.getElementById('hero-globe-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Procedural Dot Sphere Globe
    const geometry = new THREE.BufferGeometry();
    const count = 1800;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 2.2;

      positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x22E4FF, size: 0.035, transparent: true, opacity: 0.85 });
    const globeSphere = new THREE.Points(geometry, material);
    scene.add(globeSphere);

    camera.position.z = 6;

    function animateGlobe() {
      if (!state.isPaused) {
        globeSphere.rotation.y += 0.002;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(animateGlobe);
    }
    animateGlobe();
  }

  // Pause Controls Toggle Implementation
  function initPauseToggle() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'vionix-pause-toggle btn-ghost';
    toggleBtn.innerHTML = state.isPaused ? '▶ Play Motion' : '⏸ Pause Motion';
    toggleBtn.style.cssText = 'position: fixed; bottom: 16px; right: 16px; z-index: 999; backdrop-filter: blur(8px);';
    document.body.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => {
      state.isPaused = !state.isPaused;
      localStorage.setItem('vionix_anim_paused', state.isPaused);
      toggleBtn.innerHTML = state.isPaused ? '▶ Play Motion' : '⏸ Pause Motion';
    });
  }

  // Initialize Scene Engine on Page Load
  document.addEventListener('DOMContentLoaded', () => {
    const network = new NeuralNetworkCanvas('bg-canvas');
    initMagneticCursor();
    initCardTilt();
    initPauseToggle();
    if (window.THREE) init3DGlobe();

    function mainLoop(now) {
      monitorPerformance(now);
      if (network) network.render();
      requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
  });
})();
