/**
 * ============================================================================
 * THREE-SCENE.JS — 3D Showcase & Scroll-Driven Animation Engine
 * ============================================================================
 * Project: Environmental Sustainability Research & Interactive Showcase
 * Topics Demonstrated:
 *   1. WebGL Scene, Perspective Camera, and Directional Lighting with Shadows
 *   2. Procedural 3D Paper Stack Generation (stacked mesh layers with rotation)
 *   3. Low-Poly 3D Tree Generation (trunk cylinder + tiered geometric foliage)
 *   4. Scroll-Driven 3D Morphing (smooth lerp between Paper Stack and Tree)
 *   5. Mouse-Move Parallax & Inertial Tilt (Pitch & Yaw via Quaternion/Euler)
 *   6. Floating 3D Nature Particles (Leaves & Paper Pieces in 3D Space)
 *   7. Performance Optimization (Tab visibility pause & reduced-motion check)
 * ============================================================================
 */

(function () {
  'use strict';

  // Check if browser supports prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Verify Three.js is loaded from CDN
  if (typeof THREE === 'undefined') {
    console.warn('Three.js library is not loaded. 3D features will be disabled.');
    return;
  }

  // ==========================================================================
  // SECTION 1: HERO 3D SCENE (Only runs on Home Page index.html)
  // ==========================================================================
  const heroContainer = document.getElementById('hero3dContainer');

  if (heroContainer && !prefersReducedMotion) {
    initHero3DScene(heroContainer);
  }

  function initHero3DScene(container) {
    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup: Field of View = 45 deg, aspect ratio, near/far clipping planes
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.2, 5.5);

    // 3. Renderer setup: WebGL with antialiasing and transparent background
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance on laptops
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting Setup: Ambient light for base illumination + Directional sunlight with soft shadows
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    sunLight.position.set(4, 7, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Soft green fill light from the bottom for organic environmental glow
    const groundFillLight = new THREE.DirectionalLight(0x81c784, 0.45);
    groundFillLight.position.set(-3, -4, -2);
    scene.add(groundFillLight);

    // Master Group that holds both morph states and tilts with mouse
    const heroObjectGroup = new THREE.Group();
    scene.add(heroObjectGroup);

    // ------------------------------------------------------------------------
    // BUILD 3D OBJECT A: STACK OF PAPER SHEETS
    // ------------------------------------------------------------------------
    const paperStackGroup = new THREE.Group();
    heroObjectGroup.add(paperStackGroup);

    // Procedural stack of individual paper sheets
    const sheetCount = 28;
    const sheetWidth = 2.0;
    const sheetDepth = 2.6;
    const sheetHeight = 0.03;

    // Materials for the paper sheets (cream white with subtle variations)
    const paperMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xfbf9f5, roughness: 0.65, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0xf5f1e6, roughness: 0.70, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0xede6d6, roughness: 0.75, metalness: 0.05 })
    ];

    const sheetGeometry = new THREE.BoxGeometry(sheetWidth, sheetHeight, sheetDepth);

    for (let i = 0; i < sheetCount; i++) {
      const mat = paperMaterials[i % paperMaterials.length];
      const sheetMesh = new THREE.Mesh(sheetGeometry, mat);

      // Subtle organic jitter on position and rotation for realistic paper ream
      const yOffset = (i - sheetCount / 2) * (sheetHeight + 0.005);
      const rotJitter = (Math.sin(i * 1.7) * 0.045) + (Math.cos(i * 0.8) * 0.03);
      const xJitter = (Math.sin(i * 2.3) * 0.03);
      const zJitter = (Math.cos(i * 1.9) * 0.03);

      sheetMesh.position.set(xJitter, yOffset, zJitter);
      sheetMesh.rotation.y = rotJitter;
      sheetMesh.castShadow = true;
      sheetMesh.receiveShadow = true;

      paperStackGroup.add(sheetMesh);
    }

    // Add a printed document texture / lines on top sheet
    const topSheetCanvas = document.createElement('canvas');
    topSheetCanvas.width = 512;
    topSheetCanvas.height = 680;
    const tCtx = topSheetCanvas.getContext('2d');
    tCtx.fillStyle = '#faf8f3';
    tCtx.fillRect(0, 0, 512, 680);
    // Draw subtle printed lines and header
    tCtx.fillStyle = '#2e7d32';
    tCtx.fillRect(40, 50, 200, 16);
    tCtx.fillStyle = '#81c784';
    tCtx.fillRect(40, 80, 140, 10);
    tCtx.fillStyle = '#c5cfc5';
    for (let line = 120; line < 600; line += 24) {
      const lineWidth = 380 + (Math.sin(line) * 50);
      tCtx.fillRect(40, line, lineWidth, 6);
    }
    const topTexture = new THREE.CanvasTexture(topSheetCanvas);
    const topMat = new THREE.MeshStandardMaterial({ map: topTexture, roughness: 0.6 });
    const topSheet = new THREE.Mesh(new THREE.BoxGeometry(sheetWidth, 0.01, sheetDepth), topMat);
    topSheet.position.y = (sheetCount / 2) * (sheetHeight + 0.005) + 0.01;
    topSheet.rotation.y = 0.02;
    paperStackGroup.add(topSheet);

    // ------------------------------------------------------------------------
    // BUILD 3D OBJECT B: LOW-POLY ENVIRONMENTAL TREE
    // ------------------------------------------------------------------------
    const treeGroup = new THREE.Group();
    heroObjectGroup.add(treeGroup);
    treeGroup.scale.set(0.001, 0.001, 0.001); // Hidden initially, grows on scroll!

    // Tree Trunk: Low-poly cylinder/prism
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6d4c41,
      roughness: 0.85,
      flatShading: true
    });
    const trunkGeom = new THREE.CylinderGeometry(0.22, 0.35, 1.6, 7);
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = -0.3;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Tree Foliage: 3 Tiered low-poly cones in varying lush green shades
    const foliageLevels = [
      { radius: 1.35, height: 1.3, y: 0.7, color: 0x1b5e20 }, // Bottom deep green
      { radius: 1.10, height: 1.2, y: 1.4, color: 0x2e7d32 }, // Middle vibrant green
      { radius: 0.80, height: 1.1, y: 2.1, color: 0x43a047 }  // Top fresh sprout green
    ];

    foliageLevels.forEach(tier => {
      const foliageMat = new THREE.MeshStandardMaterial({
        color: tier.color,
        roughness: 0.75,
        flatShading: true
      });
      const foliageGeom = new THREE.ConeGeometry(tier.radius, tier.height, 7);
      const foliageMesh = new THREE.Mesh(foliageGeom, foliageMat);
      foliageMesh.position.y = tier.y;
      foliageMesh.castShadow = true;
      foliageMesh.receiveShadow = true;
      treeGroup.add(foliageMesh);
    });

    // Small decorative wooden planter base
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8, flatShading: true });
    const baseGeom = new THREE.CylinderGeometry(0.7, 0.5, 0.3, 8);
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = -1.15;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    treeGroup.add(baseMesh);

    // ------------------------------------------------------------------------
    // FLOATING 3D LEAVES & PAPER CONFETTI IN HERO SCENE
    // ------------------------------------------------------------------------
    const floatingParticles = [];
    const particleCount = isTouchDevice ? 12 : 24;

    // Leaf geometry (diamond shaped flat mesh)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.15);
    leafShape.quadraticCurveTo(0.12, 0, 0, 0.18);
    leafShape.quadraticCurveTo(-0.12, 0, 0, -0.15);
    const leafGeom = new THREE.ShapeGeometry(leafShape);

    // Paper piece geometry
    const paperPieceGeom = new THREE.PlaneGeometry(0.2, 0.28);

    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x81c784, side: THREE.DoubleSide });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x4caf50, side: THREE.DoubleSide });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xf5f1e6, side: THREE.DoubleSide });

    for (let p = 0; p < particleCount; p++) {
      const isLeaf = p % 2 === 0;
      const geom = isLeaf ? leafGeom : paperPieceGeom;
      const mat = isLeaf ? (p % 4 === 0 ? leafMat2 : leafMat1) : paperMat;
      const mesh = new THREE.Mesh(geom, mat);

      mesh.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 4
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      scene.add(mesh);

      floatingParticles.push({
        mesh: mesh,
        speedY: 0.004 + Math.random() * 0.008,
        speedRotX: (Math.random() - 0.5) * 0.02,
        speedRotY: (Math.random() - 0.5) * 0.02,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.02 + Math.random() * 0.02
      });
    }

    // ------------------------------------------------------------------------
    // MOUSE-MOVE PARALLAX & TILT LOGIC
    // ------------------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    window.addEventListener('mousemove', (e) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) / windowHalfX;
      mouseY = (e.clientY - windowHalfY) / windowHalfY;

      // Max ~8-12 degrees tilt
      targetRotationY = mouseX * 0.35;
      targetRotationX = mouseY * 0.25;
    }, { passive: true });

    // ------------------------------------------------------------------------
    // SCROLL-DRIVEN MORPH BETWEEN PAPER STACK AND TREE
    // ------------------------------------------------------------------------
    let scrollProgress = 0; // 0 = top of page (paper stack), 1 = scrolled past hero (tree)

    function updateScrollProgress() {
      const scrollY = window.scrollY || window.pageYOffset;
      const heroHeight = container.clientHeight || 500;
      // Normalise scroll over hero scroll range
      scrollProgress = Math.min(Math.max(scrollY / (heroHeight * 0.85), 0), 1);
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // Resize Handler
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }, { passive: true });

    // Animation Render Loop
    let isRunning = true;
    let clock = new THREE.Clock();

    function animate() {
      if (!isRunning) return;

      const elapsedTime = clock.getElapsedTime();

      // 1. Idle rotation and gentle floating bob
      heroObjectGroup.rotation.y += 0.004;
      heroObjectGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

      // 2. Smoothly lerp towards target mouse tilt
      heroObjectGroup.rotation.x += (targetRotationX - heroObjectGroup.rotation.x) * 0.05;
      heroObjectGroup.rotation.z += (-targetRotationY * 0.4 - heroObjectGroup.rotation.z) * 0.05;

      // 3. Scroll Morph Transition (Paper Stack -> Living Tree)
      // Ease curve for silky transition
      const t = scrollProgress; // 0 to 1
      const stackScale = Math.max(1 - t * 1.15, 0.001);
      const treeScale = Math.min(Math.max((t - 0.15) * 1.18, 0.001), 1.0);

      paperStackGroup.scale.set(stackScale, stackScale, stackScale);
      paperStackGroup.rotation.y = elapsedTime * 0.2 + t * Math.PI;

      treeGroup.scale.set(treeScale, treeScale, treeScale);
      treeGroup.rotation.y = elapsedTime * 0.35 + (1 - t) * Math.PI;

      // 4. Animate floating background leaves and paper
      floatingParticles.forEach(p => {
        p.swing += p.swingSpeed;
        p.mesh.position.y -= p.speedY;
        p.mesh.position.x += Math.sin(p.swing) * 0.005;
        p.mesh.rotation.x += p.speedRotX;
        p.mesh.rotation.y += p.speedRotY;

        // Wrap around when falling past bottom
        if (p.mesh.position.y < -3.0) {
          p.mesh.position.y = 3.0;
          p.mesh.position.x = (Math.random() - 0.5) * 6;
        }
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();

    // Pause when tab is hidden to save CPU/GPU cycles
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isRunning = false;
      } else {
        isRunning = true;
        clock.start();
        animate();
      }
    });
  }

  // ==========================================================================
  // SECTION 2: GLOBAL 3D BACKGROUND PARTICLES (Runs across all pages)
  // ==========================================================================
  const bgCanvas = document.getElementById('threeBackgroundCanvas');
  if (bgCanvas && !prefersReducedMotion) {
    initGlobal3DBackground(bgCanvas);
  }

  function initGlobal3DBackground(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // Ambient Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);

    // Drifting particles: soft green leaves and cream paper pieces
    const particleCount = isTouchDevice ? 10 : 20;
    const particles = [];

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.2);
    leafShape.quadraticCurveTo(0.15, 0, 0, 0.25);
    leafShape.quadraticCurveTo(-0.15, 0, 0, -0.2);
    const leafGeom = new THREE.ShapeGeometry(leafShape);
    const paperGeom = new THREE.PlaneGeometry(0.25, 0.35);

    const leafMat = new THREE.MeshBasicMaterial({ color: 0x81c784, transparent: true, opacity: 0.38, side: THREE.DoubleSide });
    const paperMat = new THREE.MeshBasicMaterial({ color: 0xf5f1e6, transparent: true, opacity: 0.35, side: THREE.DoubleSide });

    for (let i = 0; i < particleCount; i++) {
      const isLeaf = i % 2 === 0;
      const mesh = new THREE.Mesh(isLeaf ? leafGeom : paperGeom, isLeaf ? leafMat : paperMat);

      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 6
      );

      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(mesh);

      particles.push({
        mesh: mesh,
        speedY: 0.003 + Math.random() * 0.006,
        speedRot: (Math.random() - 0.5) * 0.015,
        swing: Math.random() * Math.PI * 2
      });
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });

    let running = true;
    function render() {
      if (!running) return;

      particles.forEach(p => {
        p.swing += 0.015;
        p.mesh.position.y -= p.speedY;
        p.mesh.position.x += Math.sin(p.swing) * 0.004;
        p.mesh.rotation.z += p.speedRot;
        p.mesh.rotation.x += p.speedRot * 0.5;

        if (p.mesh.position.y < -7) {
          p.mesh.position.y = 7;
          p.mesh.position.x = (Math.random() - 0.5) * 16;
        }
      });

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    render();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running = false;
      else { running = true; render(); }
    });
  }

})();
