/**
 * ============================================================================
 * BACKGROUND3D.JS — Shared 3D Background & Header Object Showcase Engine
 * ============================================================================
 * Project: Environmental Sustainability Research & Interactive Showcase
 * Topics Demonstrated:
 *   1. Full-screen WebGL Background Canvas with floating leaves, paper sheets,
 *      and origami paper-planes.
 *   2. Page-Specific 3D Showcase (reads data-scene attribute on <body>):
 *      - "home": Stack of paper morphing into a low-poly tree on scroll
 *      - "lifecycle": Stack of paper turning into a rustic wooden log
 *      - "impact": A translucent water drop paired with a flourishing tree
 *      - "compare": A paper sheet standing side-by-side with a modern laptop
 *      - "solutions": Recycling arrows symbol crafted from organic leaves
 *      - other pages: Floating leaves and ecological symbols
 *   3. Performance & Accessibility:
 *      - Single animation loop with visibility change detection (pauses when hidden)
 *      - Particle count capped at ~60 particles
 *      - Device pixel ratio capped at 2 for silky 60fps on laptop screens
 *      - Reduced motion support (prefers-reduced-motion)
 *      - aria-hidden="true" for screen readers
 * ============================================================================
 */

(function () {
  'use strict';

  // 1. Accessibility & Performance settings
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Safety check: verify Three.js is available from CDN
  if (typeof THREE === 'undefined') {
    console.warn('Three.js library not loaded. 3D features will be disabled.');
    return;
  }

  // Active scene mode from body tag: data-scene="home|lifecycle|impact|compare|solutions|..."
  const sceneType = document.body.getAttribute('data-scene') || 'default';

  // ==========================================================================
  // PART A: FULL-SCREEN SHARED 3D BACKGROUND (Floating Leaves, Sheets & Planes)
  // ==========================================================================
  let bgRenderer, bgScene, bgCamera;
  const bgParticles = [];
  const TOTAL_BG_PARTICLES = 60; // strictly limited to ~60 for optimal laptop performance

  function initBackground3D() {
    let canvas = document.getElementById('bg3dCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg3dCanvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    // Set fixed background styling via JavaScript if not in CSS
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';

    // Scene & Camera
    bgScene = new THREE.Scene();
    bgCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    bgCamera.position.z = 18;

    // WebGL Renderer
    bgRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    bgRenderer.setSize(window.innerWidth, window.innerHeight);
    bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ambient and Directional lighting for soft organic shading
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    bgScene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xe8f5e9, 0.7);
    dirLight.position.set(5, 10, 7);
    bgScene.add(dirLight);

    // Reusable Materials
    const leafMatGreen1 = new THREE.MeshLambertMaterial({ color: 0x43a047, side: THREE.DoubleSide });
    const leafMatGreen2 = new THREE.MeshLambertMaterial({ color: 0x81c784, side: THREE.DoubleSide });
    const leafMatMint = new THREE.MeshLambertMaterial({ color: 0xa5d6a7, side: THREE.DoubleSide });
    const paperMatWhite = new THREE.MeshLambertMaterial({ color: 0xfcfbf7, side: THREE.DoubleSide });
    const paperMatCream = new THREE.MeshLambertMaterial({ color: 0xf0ede0, side: THREE.DoubleSide });

    // 1. Procedural Leaf Geometry (organic pointed curve shape)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.4);
    leafShape.quadraticCurveTo(0.35, 0, 0, 0.55);
    leafShape.quadraticCurveTo(-0.35, 0, 0, -0.4);
    const leafGeo = new THREE.ShapeGeometry(leafShape);

    // 2. Procedural Paper Sheet Geometry (mini rectangular sheet)
    const sheetGeo = new THREE.PlaneGeometry(0.55, 0.75);

    // 3. Procedural Origami Paper-Plane Geometry (3D folded triangle shape)
    const planeGeo = new THREE.BufferGeometry();
    const planeVertices = new Float32Array([
      // Left wing
      0.0, 0.0, 0.5,
      -0.5, 0.1, -0.4,
      0.0, 0.2, -0.4,
      // Right wing
      0.0, 0.0, 0.5,
      0.0, 0.2, -0.4,
      0.5, 0.1, -0.4,
      // Bottom keel/body
      0.0, 0.0, 0.5,
      0.0, -0.15, -0.3,
      0.0, 0.2, -0.4
    ]);
    planeGeo.setAttribute('position', new THREE.BufferAttribute(planeVertices, 3));
    planeGeo.computeVertexNormals();

    // Spawn 60 balanced particles: ~25 leaves, ~23 paper sheets, ~12 paper planes
    for (let i = 0; i < TOTAL_BG_PARTICLES; i++) {
      let mesh, type;
      const randType = Math.random();

      if (randType < 0.42) {
        // Organic Leaf
        type = 'leaf';
        const colors = [leafMatGreen1, leafMatGreen2, leafMatMint];
        mesh = new THREE.Mesh(leafGeo, colors[i % colors.length]);
        const s = 0.5 + Math.random() * 0.6;
        mesh.scale.set(s, s, s);
      } else if (randType < 0.8) {
        // Floating Paper Sheet
        type = 'sheet';
        const colors = [paperMatWhite, paperMatCream];
        mesh = new THREE.Mesh(sheetGeo, colors[i % colors.length]);
        const s = 0.6 + Math.random() * 0.7;
        mesh.scale.set(s, s, s);
      } else {
        // Origami Paper Plane
        type = 'plane';
        mesh = new THREE.Mesh(planeGeo, paperMatWhite);
        const s = 0.7 + Math.random() * 0.5;
        mesh.scale.set(s, s, s);
      }

      // Random 3D space distribution
      mesh.position.set(
        (Math.random() - 0.5) * 32,
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 14
      );

      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      bgScene.add(mesh);

      bgParticles.push({
        mesh: mesh,
        type: type,
        speedY: 0.007 + Math.random() * 0.012,
        speedRotX: (Math.random() - 0.5) * 0.014,
        speedRotY: (Math.random() - 0.5) * 0.016,
        speedRotZ: (Math.random() - 0.5) * 0.012,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.01 + Math.random() * 0.015,
        swingAmp: 0.008 + Math.random() * 0.01
      });
    }

    // Resize listener for background canvas
    window.addEventListener('resize', () => {
      bgCamera.aspect = window.innerWidth / window.innerHeight;
      bgCamera.updateProjectionMatrix();
      bgRenderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });
  }

  // ==========================================================================
  // PART B: PAGE-SPECIFIC 3D HEADER SHOWCASE (Right Side of Page Header)
  // ==========================================================================
  let headerRenderer, headerScene, headerCamera;
  let headerMainObjectGroup;
  let headerTargetRotX = 0, headerTargetRotY = 0;
  let isHeaderActive = false;

  // Extra Home Page specific morph elements
  let homePaperStack, homeTreeGroup;

  function initHeaderShowcase() {
    // Look for header container: either #hero3dContainer (Home) or #pageHeader3d (Other pages)
    let headerContainer = document.getElementById('hero3dContainer') || document.getElementById('pageHeader3d');

    if (!headerContainer) return;

    isHeaderActive = true;
    const width = headerContainer.clientWidth || 360;
    const height = headerContainer.clientHeight || 300;

    // Header Scene & Camera
    headerScene = new THREE.Scene();
    headerCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    if (sceneType === 'home') {
      headerCamera.position.set(0, 0.25, 3.7);
    } else {
      headerCamera.position.set(0, 0.8, 5.2);
    }

    // Header Renderer
    headerRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    headerRenderer.setSize(width, height);
    headerRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    headerRenderer.shadowMap.enabled = true;
    headerRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    headerContainer.appendChild(headerRenderer.domElement);

    // Warm Ambient Light + Key Sunlight + Mint Fill Light
    const amb = new THREE.AmbientLight(0xfffbf2, 0.95);
    headerScene.add(amb);

    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(4, 7, 5);
    sun.castShadow = true;
    headerScene.add(sun);

    const mintFill = new THREE.DirectionalLight(0x81c784, 0.5);
    mintFill.position.set(-3, -3, -2);
    headerScene.add(mintFill);

    // Master Group that tilts with mouse movement
    headerMainObjectGroup = new THREE.Group();
    headerScene.add(headerMainObjectGroup);

    // Build the specific 3D model according to data-scene attribute
    buildSceneObject(sceneType, headerMainObjectGroup);

    // Mouse tilt tracking
    window.addEventListener('mousemove', (e) => {
      const halfX = window.innerWidth / 2;
      const halfY = window.innerHeight / 2;
      const mouseX = (e.clientX - halfX) / halfX;
      const mouseY = (e.clientY - halfY) / halfY;
      headerTargetRotY = mouseX * 0.35;
      headerTargetRotX = mouseY * 0.25;
    }, { passive: true });

    // Resize listener for header viewport
    window.addEventListener('resize', () => {
      if (!headerContainer) return;
      const w = headerContainer.clientWidth;
      const h = headerContainer.clientHeight;
      if (w > 0 && h > 0) {
        headerCamera.aspect = w / h;
        headerCamera.updateProjectionMatrix();
        headerRenderer.setSize(w, h);
      }
    }, { passive: true });
  }

  /**
   * Builds the low-poly 3D object for each page
   */
  function buildSceneObject(type, parentGroup) {
    switch (type) {
      case 'home':
        buildHomeStudioShowcase(parentGroup);
        break;

      case 'lifecycle':
        buildLifecycleLogObject(parentGroup);
        break;

      case 'impact':
        buildImpactWaterDropObject(parentGroup);
        break;

      case 'compare':
        buildCompareLaptopObject(parentGroup);
        break;

      case 'solutions':
        buildSolutionsRecycleObject(parentGroup);
        break;

      default:
        buildDefaultEcoOrbObject(parentGroup);
        break;
    }
  }

  // --------------------------------------------------------------------------
  // MODEL 1: HOME PAGE — Rabbit R1 & Vibram Inspired 3D Eco Studio Engine
  // --------------------------------------------------------------------------
  let homeStudioModels = {};
  let studioActiveMode = 'r1';
  let isExploded = false;
  let isAutoOrbiting = true;
  let studioExplodeProgress = 0;
  let isUserDragging = false;
  let lastPointerX = 0, lastPointerY = 0;
  let dragVelX = 0, dragVelY = 0;
  let updateHomeStudioScene = null;

  function createRabbitScreenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0f1418';
    ctx.fillRect(0, 0, 512, 640);

    // Status bar
    ctx.fillStyle = '#81c784';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('10:09 AM', 36, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('r1', 440, 52);

    // Eco Leaf indicator dot
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(412, 45, 9, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Rabbit Silhouette (Exact mascot from reference video)
    ctx.save();
    ctx.translate(256, 310);

    // Soft Orange/Green Glow Aura
    const radGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 140);
    radGlow.addColorStop(0, 'rgba(235, 77, 38, 0.35)');
    radGlow.addColorStop(1, 'rgba(235, 77, 38, 0)');
    ctx.fillStyle = radGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 140, 0, Math.PI * 2);
    ctx.fill();

    // Head Base (Rounded droplet/egg)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 20, 64, 54, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left Ear
    ctx.beginPath();
    ctx.ellipse(-26, -58, 17, 50, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.beginPath();
    ctx.ellipse(26, -58, 17, 50, 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Cute Dark Eyes
    ctx.fillStyle = '#0f1418';
    ctx.beginPath();
    ctx.arc(-22, 18, 6.5, 0, Math.PI * 2);
    ctx.arc(22, 18, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Bottom Status Kicker
    ctx.fillStyle = '#81c784';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ECO COMPANION • OS', 256, 520);

    ctx.fillStyle = '#a5d6a7';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('paperless mode active', 256, 556);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function buildHomeStudioShowcase(group) {
    homeStudioModels = {};

    // ------------------------------------------------------------------------
    // 1. MODEL R1: Rabbit R1 Eco Companion Device (Direct Reference Video Match)
    // ------------------------------------------------------------------------
    const r1Group = new THREE.Group();
    group.add(r1Group);
    homeStudioModels.r1 = r1Group;

    const r1FrontShell = new THREE.Group();
    const r1BackShell = new THREE.Group();
    const r1ScreenGroup = new THREE.Group();
    const r1CircuitGroup = new THREE.Group();
    r1Group.add(r1FrontShell);
    r1Group.add(r1BackShell);
    r1Group.add(r1ScreenGroup);
    r1Group.add(r1CircuitGroup);

    const r1OrangeMat = new THREE.MeshStandardMaterial({
      color: 0xeb4d26,
      roughness: 0.35,
      metalness: 0.08
    });
    const r1DarkMat = new THREE.MeshStandardMaterial({
      color: 0x181a1b,
      roughness: 0.45,
      metalness: 0.25
    });
    const r1MetalMat = new THREE.MeshStandardMaterial({
      color: 0xd0d4d8,
      roughness: 0.22,
      metalness: 0.88
    });

    // Front Shell Body (Width 2.45, Height 2.55, Depth 0.24)
    const mainBodyFront = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.55, 0.24), r1OrangeMat);
    mainBodyFront.position.z = 0.12;
    mainBodyFront.castShadow = true;
    mainBodyFront.receiveShadow = true;
    r1FrontShell.add(mainBodyFront);

    // Back Shell Body
    const mainBodyBack = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.55, 0.22), r1OrangeMat);
    mainBodyBack.position.z = -0.11;
    mainBodyBack.castShadow = true;
    r1BackShell.add(mainBodyBack);

    // Beveled corner bumpers for soft industrial radius
    const cornerGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.24, 16);
    [
      [-1.14, 1.18, 0.12],
      [-1.14, -1.18, 0.12],
      [1.14, -1.18, 0.12]
    ].forEach(pos => {
      const bumper = new THREE.Mesh(cornerGeo, r1OrangeMat);
      bumper.position.set(pos[0], pos[1], pos[2]);
      r1FrontShell.add(bumper);
    });

    // Top-Right Camera Recess & 360° Rotational Eye
    const eyeCutout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.32, 28),
      new THREE.MeshStandardMaterial({ color: 0x1c1f21, roughness: 0.6, metalness: 0.3 })
    );
    eyeCutout.position.set(0.92, 0.92, 0.12);
    r1FrontShell.add(eyeCutout);

    const eyePodGroup = new THREE.Group();
    eyePodGroup.position.set(0.92, 0.92, 0.15);
    r1FrontShell.add(eyePodGroup);
    homeStudioModels.r1EyePod = eyePodGroup;

    const eyePodCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.44, 30),
      r1DarkMat
    );
    eyePodGroup.add(eyePodCyl);

    const eyeRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.08, 30),
      r1MetalMat
    );
    eyeRing.position.y = 0.19;
    eyePodGroup.add(eyeRing);

    // Glossy camera lens glass
    const lensRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.04, 12, 28),
      r1MetalMat
    );
    lensRing.position.set(0, 0, 0.34);
    eyePodGroup.add(lensRing);

    const lensGlass = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 28),
      new THREE.MeshStandardMaterial({ color: 0x051a2e, roughness: 0.08, metalness: 0.96 })
    );
    lensGlass.position.set(0, 0, 0.345);
    eyePodGroup.add(lensGlass);

    const irisDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 12),
      new THREE.MeshBasicMaterial({ color: 0x64b5f6 })
    );
    irisDot.position.set(0.04, 0.04, 0.348);
    eyePodGroup.add(irisDot);

    // Analog Scroll Wheel (Right Edge)
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(1.22, 0.16, 0.12);
    r1FrontShell.add(wheelGroup);
    homeStudioModels.r1ScrollWheel = wheelGroup;

    const scrollWheelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.48, 28),
      r1MetalMat
    );
    scrollWheelMesh.castShadow = true;
    wheelGroup.add(scrollWheelMesh);

    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.75 });
    for (let r = 0; r < 14; r++) {
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.252, 0.012, 6, 24), ridgeMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = (r - 7) * 0.032;
      wheelGroup.add(ringMesh);
    }

    // Push-to-Talk Button (Right Lower Edge)
    const pttButton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0xc83d18, roughness: 0.4, metalness: 0.15 })
    );
    pttButton.rotation.x = Math.PI / 2;
    pttButton.position.set(1.02, -0.48, 0.25);
    pttButton.castShadow = true;
    r1FrontShell.add(pttButton);

    const micDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0x882a10, roughness: 0.8 })
    );
    micDot.position.set(1.02, -0.48, 0.315);
    r1FrontShell.add(micDot);

    // Display Screen with Glowing Rabbit Mascot
    const screenBezel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.48, 1.85),
      new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.2, metalness: 0.6 })
    );
    screenBezel.position.set(-0.35, 0.08, 0.246);
    r1ScreenGroup.add(screenBezel);

    const screenTexture = createRabbitScreenTexture();
    const screenDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 1.78),
      new THREE.MeshBasicMaterial({ map: screenTexture })
    );
    screenDisplay.position.set(-0.35, 0.08, 0.252);
    r1ScreenGroup.add(screenDisplay);

    // Inner Emerald Circuit Board (Revealed on Explode)
    const pcbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 2.25, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.4, metalness: 0.3 })
    );
    r1CircuitGroup.add(pcbMesh);

    const cpuMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.3, metalness: 0.8 })
    );
    cpuMesh.position.set(-0.2, 0.1, 0.035);
    r1CircuitGroup.add(cpuMesh);

    const goldTraceMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, roughness: 0.2, metalness: 0.95 });
    for (let t = 0; t < 6; t++) {
      const trace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8 + t * 0.12, 0.02), goldTraceMat);
      trace.position.set(-0.7 + t * 0.26, -0.2, 0.03);
      r1CircuitGroup.add(trace);
    }

    r1CircuitGroup.scale.set(0.001, 0.001, 0.001);
    homeStudioModels.r1Elements = { r1FrontShell, r1BackShell, r1ScreenGroup, r1CircuitGroup, eyePodGroup, wheelGroup };

    // ------------------------------------------------------------------------
    // 2. MODEL REAM: Paper Ream, Kraft Band, Inner Timber Core, Sprout
    // ------------------------------------------------------------------------
    const reamGroup = new THREE.Group();
    group.add(reamGroup);
    homeStudioModels.ream = reamGroup;
    reamGroup.scale.set(0.001, 0.001, 0.001); // Inactive initially (r1 is active)

    const topStack = new THREE.Group();
    reamGroup.add(topStack);

    const bottomStack = new THREE.Group();
    reamGroup.add(bottomStack);

    const paperWhiteMat = new THREE.MeshLambertMaterial({ color: 0xfcfbf7 });
    const paperCreamMat = new THREE.MeshLambertMaterial({ color: 0xf3ede1 });
    const paperEdgeMat = new THREE.MeshLambertMaterial({ color: 0xe8e1cf });

    const sheetCount = 26;
    const sheetW = 2.4, sheetD = 3.1, sheetH = 0.042;

    for (let i = 0; i < sheetCount; i++) {
      const isTop = (i === sheetCount - 1);
      const isTopHalf = i >= sheetCount / 2;
      const mat = isTop ? paperWhiteMat : (i % 2 === 0 ? paperCreamMat : paperEdgeMat);
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(sheetW, sheetH, sheetD), mat);
      
      const localY = (i - sheetCount / 2) * sheetH;
      sheet.rotation.y = (Math.sin(i * 1.7) * 0.03);
      sheet.castShadow = true;
      sheet.receiveShadow = true;

      if (isTopHalf) {
        sheet.position.y = localY - (sheetCount / 4) * sheetH;
        topStack.add(sheet);
      } else {
        sheet.position.y = localY + (sheetCount / 4) * sheetH;
        bottomStack.add(sheet);
      }
    }
    topStack.position.y = (sheetCount / 4) * sheetH;
    bottomStack.position.y = -(sheetCount / 4) * sheetH;

    // Kraft Band with FSC Leaf Seal
    const bandMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
    const wrapperBand = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.48, 3.14), bandMat);
    wrapperBand.position.y = 0;
    wrapperBand.castShadow = true;
    reamGroup.add(wrapperBand);

    const sealMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    const seal = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), sealMat);
    seal.position.set(0, 0, 1.575);
    wrapperBand.add(seal);

    // Hidden Timber Core
    const timberCoreGroup = new THREE.Group();
    const barkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037, flatShading: true });
    const timberCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 1.0, 16), barkMat);
    timberCyl.rotation.z = Math.PI / 2;
    timberCoreGroup.add(timberCyl);

    const ringMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8, flatShading: true });
    const ring1 = new THREE.Mesh(new THREE.CircleGeometry(0.47, 16), ringMat);
    ring1.position.x = 0.501;
    ring1.rotation.y = Math.PI / 2;
    timberCoreGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.CircleGeometry(0.51, 16), ringMat);
    ring2.position.x = -0.501;
    ring2.rotation.y = -Math.PI / 2;
    timberCoreGroup.add(ring2);

    timberCoreGroup.scale.set(0.001, 0.001, 0.001);
    reamGroup.add(timberCoreGroup);

    // Budding Sprout
    const sproutGroup = new THREE.Group();
    sproutGroup.position.set(0, (sheetCount / 4) * sheetH + sheetH, 0);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x43a047 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 6), stemMat);
    stem.position.y = 0.22;
    sproutGroup.add(stem);

    const leafMat = new THREE.MeshLambertMaterial({ color: 0x81c784, side: THREE.DoubleSide });
    const leafGeo = new THREE.ConeGeometry(0.14, 0.36, 5);
    const leaf1 = new THREE.Mesh(leafGeo, leafMat);
    leaf1.position.set(0.12, 0.4, 0);
    leaf1.rotation.z = -Math.PI / 3;
    sproutGroup.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeo, leafMat);
    leaf2.position.set(-0.12, 0.38, 0);
    leaf2.rotation.z = Math.PI / 3;
    sproutGroup.add(leaf2);
    topStack.add(sproutGroup);

    homeStudioModels.reamElements = { topStack, bottomStack, wrapperBand, timberCoreGroup };

    // ------------------------------------------------------------------------
    // 3. MODEL DIGITAL: Ultra-thin E-Reader Tablet with Tactile Dial & Circuit Nodes
    // ------------------------------------------------------------------------
    const digitalGroup = new THREE.Group();
    group.add(digitalGroup);
    homeStudioModels.digital = digitalGroup;
    digitalGroup.scale.set(0.001, 0.001, 0.001);

    const chassisMat = new THREE.MeshLambertMaterial({ color: 0xe8eaed });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 3.2), chassisMat);
    chassis.castShadow = true;
    digitalGroup.add(chassis);

    const screenMat = new THREE.MeshLambertMaterial({ color: 0xfdfbf7 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.8), screenMat);
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.065;
    digitalGroup.add(screen);

    const barGreen1 = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    const barGreen2 = new THREE.MeshLambertMaterial({ color: 0x81c784 });
    const barGreen3 = new THREE.MeshLambertMaterial({ color: 0x43a047 });

    const chartBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.2), barGreen1);
    chartBar1.rotation.x = -Math.PI / 2;
    chartBar1.position.set(-0.55, 0.07, 0.3);
    digitalGroup.add(chartBar1);

    const chartBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.7), barGreen2);
    chartBar2.rotation.x = -Math.PI / 2;
    chartBar2.position.set(0, 0.07, 0.05);
    digitalGroup.add(chartBar2);

    const chartBar3 = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 2.1), barGreen3);
    chartBar3.rotation.x = -Math.PI / 2;
    chartBar3.position.set(0.55, 0.07, -0.15);
    digitalGroup.add(chartBar3);

    const dialRingMat = new THREE.MeshLambertMaterial({ color: 0x43a047 });
    const tactileDial = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 16), dialRingMat);
    tactileDial.position.set(1.15, 0.14, 1.2);
    tactileDial.rotation.z = Math.PI / 2;
    digitalGroup.add(tactileDial);
    homeStudioModels.digitalWheel = tactileDial;

    const nodesGroup = new THREE.Group();
    const nodeMat = new THREE.MeshLambertMaterial({ color: 0x81c784 });
    const nodeGeo = new THREE.DodecahedronGeometry(0.12, 0);
    for (let n = 0; n < 4; n++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (n / 4) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 1.8, (n % 2 === 0 ? 0.35 : -0.35), Math.sin(angle) * 1.8);
      nodesGroup.add(node);
    }
    digitalGroup.add(nodesGroup);
    homeStudioModels.digitalNodes = nodesGroup;

    // ------------------------------------------------------------------------
    // 4. MODEL FOREST: Rustic Birch Log with Annual Rings & Living Foliage Sprout
    // ------------------------------------------------------------------------
    const forestGroup = new THREE.Group();
    group.add(forestGroup);
    homeStudioModels.forest = forestGroup;
    forestGroup.scale.set(0.001, 0.001, 0.001);

    const forestBarkMat = new THREE.MeshLambertMaterial({ color: 0xe0dbd1, flatShading: true });
    const forestLog = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 2.6, 16), forestBarkMat);
    forestLog.rotation.z = Math.PI / 2;
    forestLog.castShadow = true;
    forestGroup.add(forestLog);

    const fleckMat = new THREE.MeshLambertMaterial({ color: 0x3e2723, flatShading: true });
    for (let f = 0; f < 14; f++) {
      const fleck = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.04), fleckMat);
      const angle = (f / 14) * Math.PI * 2;
      fleck.position.set(
        (f % 2 === 0 ? 0.6 : -0.6) * (Math.sin(f * 2.1)),
        Math.cos(angle) * 0.71,
        Math.sin(angle) * 0.71
      );
      fleck.rotation.z = angle;
      forestGroup.add(fleck);
    }

    const logRingMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8, flatShading: true });
    const endRing1 = new THREE.Mesh(new THREE.CircleGeometry(0.66, 16), logRingMat);
    endRing1.position.x = 1.301;
    endRing1.rotation.y = Math.PI / 2;
    forestGroup.add(endRing1);

    const endRing2 = new THREE.Mesh(new THREE.CircleGeometry(0.70, 16), logRingMat);
    endRing2.position.x = -1.301;
    endRing2.rotation.y = -Math.PI / 2;
    forestGroup.add(endRing2);

    const forestSprout = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), stemMat);
    forestSprout.position.set(0, 0.88, 0);
    forestGroup.add(forestSprout);

    // ------------------------------------------------------------------------
    // 5. MODEL CIRCULAR: Origami Faceted Sustainable Tree & Circular Recycling Arrows
    // ------------------------------------------------------------------------
    const circularGroup = new THREE.Group();
    group.add(circularGroup);
    homeStudioModels.circular = circularGroup;
    circularGroup.scale.set(0.001, 0.001, 0.001);

    const origamiTrunkMat = new THREE.MeshLambertMaterial({ color: 0xf5f3ed, flatShading: true });
    const origamiTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.44, 1.5, 6), origamiTrunkMat);
    origamiTrunk.position.y = -0.4;
    circularGroup.add(origamiTrunk);

    const origamiLeaves1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.1, 6), new THREE.MeshLambertMaterial({ color: 0x1b5e20, flatShading: true }));
    origamiLeaves1.position.y = 0.3;
    circularGroup.add(origamiLeaves1);

    const origamiLeaves2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.95, 6), new THREE.MeshLambertMaterial({ color: 0x2e7d32, flatShading: true }));
    origamiLeaves2.position.y = 0.95;
    circularGroup.add(origamiLeaves2);

    const origamiLeaves3 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.85, 6), new THREE.MeshLambertMaterial({ color: 0x43a047, flatShading: true }));
    origamiLeaves3.position.y = 1.55;
    circularGroup.add(origamiLeaves3);

    const recycleRingGroup = new THREE.Group();
    const arrowMat = new THREE.MeshLambertMaterial({ color: 0x81c784 });
    for (let a = 0; a < 3; a++) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 5), arrowMat);
      const ang = (a / 3) * Math.PI * 2;
      arrow.position.set(Math.cos(ang) * 1.8, 0.4, Math.sin(ang) * 1.8);
      arrow.rotation.z = -Math.PI / 2;
      arrow.rotation.y = -ang;
      recycleRingGroup.add(arrow);
    }
    circularGroup.add(recycleRingGroup);
    homeStudioModels.recycleRing = recycleRingGroup;

    // ------------------------------------------------------------------------
    // SETUP DRAG & ORBIT LISTENER ON HERO CONTAINER
    // ------------------------------------------------------------------------
    const heroBox = document.getElementById('hero3dContainer');
    if (heroBox) {
      heroBox.addEventListener('pointerdown', (e) => {
        isUserDragging = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        dragVelX = 0;
        dragVelY = 0;
      });

      window.addEventListener('pointermove', (e) => {
        if (!isUserDragging) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;

        dragVelX = dx * 0.008;
        dragVelY = dy * 0.008;

        group.rotation.y += dragVelX;
        group.rotation.x += dragVelY;
        group.rotation.x = Math.max(-0.6, Math.min(0.6, group.rotation.x));
      });

      window.addEventListener('pointerup', () => {
        isUserDragging = false;
      });
      window.addEventListener('pointercancel', () => {
        isUserDragging = false;
      });
    }

    // ------------------------------------------------------------------------
    // WIRE UP STUDIO CONTROLS & LISTENERS
    // ------------------------------------------------------------------------
    initStudioUiListeners(group);

    // Initial orientation
    group.rotation.set(0.12, -0.32, 0);

    // ------------------------------------------------------------------------
    // UPDATE FUNCTION CALLED ON EVERY FRAME IN ANIMATE LOOP
    // ------------------------------------------------------------------------
    updateHomeStudioScene = function (elapsed, delta) {
      // 1. Inertia & Auto-Spin
      if (!isUserDragging) {
        group.rotation.y += dragVelX;
        group.rotation.x += dragVelY;
        dragVelX *= 0.93;
        dragVelY *= 0.93;

        if (isAutoOrbiting && Math.abs(dragVelX) < 0.001) {
          group.rotation.y += 0.006;
        }
        group.rotation.x = Math.max(-0.6, Math.min(0.6, group.rotation.x));
      }

      // Gentle floating bob
      group.position.y = Math.sin(elapsed * 1.5) * 0.07;

      // 2. Smooth Explode Progress
      const targetExplode = isExploded ? 1.0 : 0.0;
      studioExplodeProgress += (targetExplode - studioExplodeProgress) * 0.09;

      // Explode for R1
      if (homeStudioModels.r1Elements) {
        const { r1FrontShell, r1BackShell, r1ScreenGroup, r1CircuitGroup, eyePodGroup, wheelGroup } = homeStudioModels.r1Elements;
        if (r1FrontShell && r1BackShell && r1ScreenGroup && r1CircuitGroup) {
          r1FrontShell.position.z = studioExplodeProgress * 0.65;
          r1ScreenGroup.position.z = studioExplodeProgress * 1.15;
          r1BackShell.position.z = -studioExplodeProgress * 0.75;
          const pcbScale = Math.max(0.001, studioExplodeProgress * 1.0);
          r1CircuitGroup.scale.set(pcbScale, pcbScale, pcbScale);
        }
        if (eyePodGroup) {
          eyePodGroup.rotation.y = Math.sin(elapsed * 1.8) * 0.45;
        }
        if (wheelGroup) {
          wheelGroup.rotation.y += 0.025;
        }
      }

      // Explode for Ream
      if (homeStudioModels.reamElements) {
        const { topStack, bottomStack, wrapperBand, timberCoreGroup } = homeStudioModels.reamElements;
        if (topStack && bottomStack && wrapperBand && timberCoreGroup) {
          topStack.position.y = 0.28 + studioExplodeProgress * 1.45;
          bottomStack.position.y = -0.28 - studioExplodeProgress * 1.25;
          wrapperBand.position.z = studioExplodeProgress * 1.35;
          wrapperBand.scale.set(1 + studioExplodeProgress * 0.16, 1, 1 + studioExplodeProgress * 0.16);

          const coreScale = Math.max(0.001, studioExplodeProgress * 1.0);
          timberCoreGroup.scale.set(coreScale, coreScale, coreScale);
        }
      }

      // 3. Smooth Scale Transition between Modes
      const modes = ['r1', 'ream', 'digital', 'forest'];
      modes.forEach(m => {
        const obj = homeStudioModels[m];
        if (!obj) return;
        const targetScale = (m === studioActiveMode) ? 1.0 : 0.001;
        const cur = obj.scale.x;
        const next = cur + (targetScale - cur) * 0.1;
        obj.scale.set(next, next, next);
        obj.visible = (next > 0.015);
      });

      // 4. Digital Node Orbit & Circular Recycle Ring Rotation
      if (homeStudioModels.digitalNodes && studioActiveMode === 'digital') {
        homeStudioModels.digitalNodes.rotation.y += 0.02;
        if (homeStudioModels.digitalWheel) {
          homeStudioModels.digitalWheel.rotation.x += 0.03;
        }
      }
      if (homeStudioModels.recycleRing && studioActiveMode === 'circular') {
        homeStudioModels.recycleRing.rotation.y += 0.015;
      }
    };
  }

  /**
   * Wires up buttons, range slider, telemetry segments, callout drawer, and dynamic badges
   */
  function initStudioUiListeners(mainGroup) {
    // A. Explode Layers Button
    const btnExplode = document.getElementById('btnExplodeLayers');
    const lblExplode = document.getElementById('explodeBtnLabel');
    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        isExploded = !isExploded;
        btnExplode.classList.toggle('active', isExploded);
        btnExplode.setAttribute('aria-pressed', isExploded ? 'true' : 'false');
        if (lblExplode) lblExplode.textContent = isExploded ? '↺ Collapse Layers' : '✦ Explode Layers';
      });
    }

    // B. Auto-Orbit Button
    const btnSpin = document.getElementById('btnToggleSpin');
    const lblSpin = document.getElementById('spinBtnLabel');
    if (btnSpin) {
      btnSpin.addEventListener('click', () => {
        isAutoOrbiting = !isAutoOrbiting;
        btnSpin.classList.toggle('active', isAutoOrbiting);
        btnSpin.setAttribute('aria-pressed', isAutoOrbiting ? 'true' : 'false');
        if (lblSpin) lblSpin.textContent = isAutoOrbiting ? '⟳ Auto-Orbit' : '❚❚ Orbit Paused';
      });
    }

    // C. Reset Camera Button
    const btnReset = document.getElementById('btnResetCamera');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        mainGroup.rotation.set(0.12, -0.32, 0);
        dragVelX = 0;
        dragVelY = 0;
        isExploded = false;
        if (btnExplode) {
          btnExplode.classList.remove('active');
          btnExplode.setAttribute('aria-pressed', 'false');
          if (lblExplode) lblExplode.textContent = '✦ Explode Layers';
        }
      });
    }

    // D. Left Stacked Mode Cards (Rabbit R1 style)
    const stackBtns = document.querySelectorAll('.studio-card-btn');
    const bgText = document.getElementById('heroGiantBgText');
    const modelBadge = document.getElementById('studioModelBadge');

    const modeMeta = {
      r1: { bg: 'R1', badge: 'MOD. 01 / RABBIT R1 COMPANION' },
      ream: { bg: 'PAPER', badge: 'MOD. 02 / RECYCLED REAM' },
      digital: { bg: 'DIGITAL', badge: 'MOD. 03 / DIGITAL SLATE' },
      forest: { bg: 'FOREST', badge: 'MOD. 04 / INDUSTRIAL TIMBER' }
    };

    const modeCallouts = {
      r1: [
        { metric: 'water', icon: '👁️', val: '360° Rotational Eye', sub: 'Environmental document vision' },
        { metric: 'timber', icon: '🎙️', val: 'Push-to-Talk AI', sub: 'Instant zero-paper queries' },
        { metric: 'waste', icon: '⚙️', val: 'Analog Scroll Wheel', sub: 'Tactile digital navigation' },
        { metric: 'digital', icon: '⚡', val: 'Pocket Companion', sub: 'Replaces 25 lbs notebooks' }
      ],
      ream: [
        { metric: 'water', icon: '💧', val: '10 L / Sheet', sub: 'Chemical pulping washing' },
        { metric: 'timber', icon: '🌲', val: '24 Trees / Ton', sub: 'Virgin industrial timber' },
        { metric: 'waste', icon: '♻️', val: '26% Landfill', sub: 'Anaerobic methane decay' },
        { metric: 'digital', icon: '⚡', val: '92% Carbon Cut', sub: 'Digital workflow threshold' }
      ],
      digital: [
        { metric: 'water', icon: '☁️', val: 'Cloud Portals', sub: 'Paperless digital workflows' },
        { metric: 'timber', icon: '🌲', val: '0 Virgin Trees', sub: '100% forest preservation' },
        { metric: 'waste', icon: '💧', val: '98% Water Conserved', sub: 'Closed-loop data centers' },
        { metric: 'digital', icon: '⚡', val: '92% Carbon Cut', sub: 'Amortized across lifespan' }
      ],
      forest: [
        { metric: 'water', icon: '🌲', val: 'Boreal Canopy', sub: 'Critical carbon reservoir' },
        { metric: 'timber', icon: '🪓', val: '40% Global Wood', sub: 'Commercial pulp harvest' },
        { metric: 'waste', icon: '🌱', val: 'Soil Carbon Loss', sub: 'Loss of root stabilization' },
        { metric: 'digital', icon: '⏳', val: '50-Yr Recovery', sub: 'Decades to regrow' }
      ]
    };

    function updateCalloutCardsForMode(mode) {
      const items = modeCallouts[mode];
      if (!items) return;
      const calloutCards = document.querySelectorAll('.tech-callout-card');
      calloutCards.forEach((card, idx) => {
        if (items[idx]) {
          const item = items[idx];
          const iconEl = card.querySelector('.callout-icon');
          const valEl = card.querySelector('.callout-val');
          const subEl = card.querySelector('.callout-sub');
          if (iconEl) iconEl.textContent = item.icon;
          if (valEl) valEl.textContent = item.val;
          if (subEl) subEl.textContent = item.sub;
          card.dataset.metric = item.metric;
        }
      });
    }

    stackBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (!mode || mode === studioActiveMode) return;
        studioActiveMode = mode;

        stackBtns.forEach(b => {
          const isActive = (b === btn);
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (modeMeta[mode]) {
          if (bgText) {
            bgText.style.opacity = '0';
            bgText.style.transform = 'translate(-50%, -50%) scale(0.92)';
            setTimeout(() => {
              bgText.textContent = modeMeta[mode].bg;
              bgText.style.opacity = '1';
              bgText.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 200);
          }
          if (modelBadge) {
            modelBadge.textContent = modeMeta[mode].badge;
          }
        }

        updateCalloutCardsForMode(mode);
      });
    });

    // Initial callout sync
    updateCalloutCardsForMode(studioActiveMode);

    // E. Telemetry Quick Dial (Slider & Segments)
    const rangeInput = document.getElementById('telemetryRangeInput');
    const segBtns = document.querySelectorAll('#telemetrySegments .seg-pill');
    const txtReams = document.getElementById('telemetryReamsText');
    const txtSheets = document.getElementById('telemetrySheetsText');
    const valTrees = document.getElementById('telemetryTrees');
    const valWater = document.getElementById('telemetryWater');
    const valCarbon = document.getElementById('telemetryCarbon');
    const valEnergy = document.getElementById('telemetryEnergy');

    function updateTelemetry(reams) {
      reams = Math.max(1, Math.min(500, parseInt(reams, 10) || 25));
      if (rangeInput) rangeInput.value = reams;
      segBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.reams, 10) === reams);
      });

      const trees = (reams * 0.06).toFixed(reams < 10 ? 2 : 1);
      const waterLit = reams * 5000;
      const waterDisplay = waterLit >= 1000000 ? (waterLit / 1000000).toFixed(1) + 'M' : Math.round(waterLit / 1000) + 'k';
      const carbon = Math.round(reams * 4.8);
      const energy = Math.round(reams * 12.5);

      if (txtReams) txtReams.textContent = `${reams} Ream${reams > 1 ? 's' : ''}`;
      if (txtSheets) txtSheets.textContent = `(${(reams * 500).toLocaleString()} Sheets)`;
      if (valTrees) valTrees.textContent = trees;
      if (valWater) valWater.textContent = waterDisplay;
      if (valCarbon) valCarbon.textContent = carbon;
      if (valEnergy) valEnergy.textContent = energy;
    }

    if (rangeInput) {
      rangeInput.addEventListener('input', (e) => updateTelemetry(e.target.value));
    }
    segBtns.forEach(btn => {
      btn.addEventListener('click', () => updateTelemetry(btn.dataset.reams));
    });

    // F. Technical Callout Cards & Detail Drawer
    const calloutCards = document.querySelectorAll('.tech-callout-card');
    const drawer = document.getElementById('calloutDrawer');
    const drawerClose = document.getElementById('drawerCloseBtn');
    const drawerTitle = document.getElementById('drawerTitle');
    const drawerBadge = document.getElementById('drawerBadge');
    const drawerBody = document.getElementById('drawerBody');
    const drawerHighlight = document.getElementById('drawerHighlight');
    const drawerLink = document.getElementById('drawerLink');

    const calloutData = {
      eye: {
        title: '360° Rotational Computer Vision Eye',
        badge: 'HARDWARE SPECIFICATION',
        body: 'Equipped with an omnidirectional rotating camera module that captures physical paper textbooks and documents for instant AI OCR digitization and cloud indexing.',
        highlight: '360° Mechanical Rotation • Optical Document Extraction',
        link: 'paper-vs-digital.html'
      },
      ptt: {
        title: 'Push-to-Talk AI Eco Assistant',
        badge: 'INTERACTIVE VOICE MODEL',
        body: 'Instant natural voice interface enabling team members and researchers to query organizational sustainability guidelines, calculate print footprints, and retrieve reports paperlessly.',
        highlight: 'Instant Voice Interaction • Zero-Paper Queries',
        link: 'solutions.html'
      },
      wheel: {
        title: 'Tactile Analog Scroll Wheel',
        badge: 'PRECISION ERGONOMICS',
        body: 'A knurled aerospace-grade aluminum rotary dial offering fluid scrolling through complex documents, e-books, and digital portal files without printing single sheets.',
        highlight: 'Tactile Rotary Navigation • Zero Page Turning Loss',
        link: 'solutions.html'
      },
      companion: {
        title: 'Ultra-Compact Pocket Companion',
        badge: 'HARDWARE AMORTIZATION',
        body: 'Consolidates pounds of paper notebooks, printed handouts, and binders into a single pocketable AI hardware unit with negligible lifetime environmental footprint.',
        highlight: '92% Carbon Cut • Cloud Amortization Threshold',
        link: 'calculator.html'
      },
      water: {
        title: 'Industrial Freshwater Depletion',
        badge: 'WATER CONSUMPTION',
        body: 'Pulping and chemical chlorine bleaching require 5 to 10 liters of freshwater per single A4 sheet. A 500-sheet ream embodies between 2,500 and 5,000 liters.',
        highlight: '10 Liters / Sheet • FAO Forest & Water Database 2024',
        link: 'calculator.html'
      },
      timber: {
        title: 'Commercial Timber Deforestation',
        badge: 'FOREST LOSS',
        body: 'Worldwide, roughly 40% of all commercially logged industrial wood feeds directly into pulp mills. Producing 1 metric ton of standard copy paper fells approximately 24 mature trees.',
        highlight: '24 Trees / Tonne • WWF Pulp & Paper Global Assessment',
        link: 'impact.html'
      },
      waste: {
        title: 'Municipal Solid Waste & Methane',
        badge: 'LANDFILL EMISSIONS',
        body: 'Paper products constitute ~26% of all municipal solid waste in landfills. Compressing without oxygen, paper undergoes anaerobic decomposition, releasing methane (CH₄).',
        highlight: '26% Solid Waste • US EPA Municipal Stream Report',
        link: 'lifecycle.html'
      },
      digital: {
        title: 'Digital Lifecycle Carbon Offset',
        badge: 'DIGITAL AMORTIZATION',
        body: 'Transitioning to digital platforms offsets its embodied hardware carbon after roughly 33 reams (or 25-30 textbooks), yielding up to 92% lifetime emissions savings.',
        highlight: '92% Net Carbon Cut • IEEE Green Computing Evaluation',
        link: 'paper-vs-digital.html'
      }
    };

    calloutCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = card.dataset.metric;
        if (!calloutData[m] || !drawer) return;
        const d = calloutData[m];
        if (drawerTitle) drawerTitle.textContent = d.title;
        if (drawerBadge) drawerBadge.textContent = d.badge;
        if (drawerBody) drawerBody.textContent = d.body;
        if (drawerHighlight) drawerHighlight.innerHTML = `<strong>${d.highlight}</strong>`;
        if (drawerLink) drawerLink.setAttribute('href', d.link);
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
      });
    });

    if (drawerClose && drawer) {
      drawerClose.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
      });
    }
    document.addEventListener('click', (e) => {
      if (drawer && drawer.classList.contains('is-open') && !drawer.contains(e.target) && !e.target.closest('.tech-callout-card')) {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // --------------------------------------------------------------------------
    // MODEL 2: LIFECYCLE — A Stack of Paper Turning into a Rustic Log
  // --------------------------------------------------------------------------
  function buildLifecycleLogObject(group) {
    // Stack of Paper (Left side)
    const paperGroup = new THREE.Group();
    paperGroup.position.set(-0.9, 0, 0);
    const paperMat = new THREE.MeshLambertMaterial({ color: 0xfdfbf7 });
    for (let i = 0; i < 16; i++) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.035, 1.5), paperMat);
      sheet.position.y = (i - 8) * 0.035;
      sheet.rotation.y = (i % 2 === 0 ? 0.02 : -0.02);
      sheet.castShadow = true;
      paperGroup.add(sheet);
    }
    group.add(paperGroup);

    // Rustic Wood Log (Right side / connected)
    const logGroup = new THREE.Group();
    logGroup.position.set(0.9, 0, 0);
    logGroup.rotation.z = Math.PI / 2; // horizontal log

    // Log bark
    const barkMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41, flatShading: true });
    const logCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 1.6, 9), barkMat);
    logCylinder.castShadow = true;
    logGroup.add(logCylinder);

    // Tree growth rings at both ends
    const ringMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8, flatShading: true });
    const endCapTop = new THREE.Mesh(new THREE.CircleGeometry(0.53, 9), ringMat);
    endCapTop.position.y = 0.801;
    endCapTop.rotation.x = -Math.PI / 2;
    logGroup.add(endCapTop);

    const endCapBottom = new THREE.Mesh(new THREE.CircleGeometry(0.56, 9), ringMat);
    endCapBottom.position.y = -0.801;
    endCapBottom.rotation.x = Math.PI / 2;
    logGroup.add(endCapBottom);

    // Small green sprout emerging from the log
    const sproutMat = new THREE.MeshLambertMaterial({ color: 0x43a047, side: THREE.DoubleSide });
    const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), sproutMat);
    sprout.position.set(0.55, 0.2, 0.1);
    sprout.rotation.z = -Math.PI / 4;
    logGroup.add(sprout);

    group.add(logGroup);

    // Gentle connecting arrow/bridge indicating transformation
    const arrowMat = new THREE.MeshLambertMaterial({ color: 0x81c784 });
    const arrowMesh = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 6), arrowMat);
    arrowMesh.rotation.z = -Math.PI / 2;
    arrowMesh.position.set(0, 0, 0);
    group.add(arrowMesh);
  }

  // --------------------------------------------------------------------------
  // MODEL 3: IMPACT — A Translucent Water Drop with a Small Tree
  // --------------------------------------------------------------------------
  function buildImpactWaterDropObject(group) {
    // 1. Water Drop (Combination of bottom sphere + top cone)
    const dropGroup = new THREE.Group();
    dropGroup.position.set(-0.55, 0.1, 0);

    const waterMat = new THREE.MeshPhongMaterial({
      color: 0x29b6f6,
      emissive: 0x0288d1,
      emissiveIntensity: 0.15,
      specular: 0xffffff,
      shininess: 90,
      transparent: true,
      opacity: 0.82
    });

    const dropBottom = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), waterMat);
    dropBottom.position.y = -0.2;
    dropGroup.add(dropBottom);

    const dropTop = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.25, 16), waterMat);
    dropTop.position.y = 0.5;
    dropGroup.add(dropTop);

    group.add(dropGroup);

    // 2. Small Thriving Tree (Right side, sustained by water conservation)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(1.1, -0.4, 0);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.22, 0.9, 8),
      new THREE.MeshLambertMaterial({ color: 0x5d4037 })
    );
    trunk.position.y = 0.2;
    treeGroup.add(trunk);

    const leaves1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 0.85, 7),
      new THREE.MeshLambertMaterial({ color: 0x2e7d32, flatShading: true })
    );
    leaves1.position.y = 0.85;
    treeGroup.add(leaves1);

    const leaves2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.75, 7),
      new THREE.MeshLambertMaterial({ color: 0x43a047, flatShading: true })
    );
    leaves2.position.y = 1.35;
    treeGroup.add(leaves2);

    group.add(treeGroup);
  }

  // --------------------------------------------------------------------------
  // MODEL 4: COMPARE — A Paper Sheet Standing Next to a Modern Laptop
  // --------------------------------------------------------------------------
  function buildCompareLaptopObject(group) {
    // 1. Paper Sheet (Left)
    const sheetGroup = new THREE.Group();
    sheetGroup.position.set(-1.1, 0, 0);
    sheetGroup.rotation.y = 0.35;

    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.6, 0.025),
      new THREE.MeshLambertMaterial({ color: 0xfcfbf7 })
    );
    paper.castShadow = true;
    sheetGroup.add(paper);

    // Add printed lines texture effect on paper
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x78909c });
    for (let i = 0; i < 5; i++) {
      const textLine = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.03, 0.03), lineMat);
      textLine.position.set(0, 0.5 - i * 0.22, 0.015);
      sheetGroup.add(textLine);
    }
    group.add(sheetGroup);

    // 2. Modern Slim Laptop (Right)
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0.9, -0.3, 0);
    laptopGroup.rotation.y = -0.45;

    // Laptop Base / Keyboard deck
    const silverMat = new THREE.MeshLambertMaterial({ color: 0x90a4ae });
    const darkDeckMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.1), silverMat);
    base.position.y = 0;
    laptopGroup.add(base);

    // Keyboard recess
    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.065, 0.55), darkDeckMat);
    keyboard.position.set(0, 0.01, -0.12);
    laptopGroup.add(keyboard);

    // Laptop Screen Lid (Open at 115 degrees)
    const screenLid = new THREE.Group();
    screenLid.position.set(0, 0.03, -0.52);
    screenLid.rotation.x = -Math.PI * 0.38;

    const screenBack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 0.05), silverMat);
    screenBack.position.y = 0.52;
    screenLid.add(screenBack);

    // Glowing Teal Eco Display Screen
    const screenDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.92, 0.055),
      new THREE.MeshBasicMaterial({ color: 0x004d40 })
    );
    screenDisplay.position.set(0, 0.52, 0.005);
    screenLid.add(screenDisplay);

    // Mint UI bar on screen
    const displayBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.12, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x80cbc4 })
    );
    displayBar.position.set(0, 0.55, 0.01);
    screenLid.add(displayBar);

    laptopGroup.add(screenLid);
    group.add(laptopGroup);
  }

  // --------------------------------------------------------------------------
  // MODEL 5: SOLUTIONS — Recycling Arrows Symbol Made of Organic Leaves
  // --------------------------------------------------------------------------
  function buildSolutionsRecycleObject(group) {
    const recycleGroup = new THREE.Group();
    const arrowCount = 3;
    const radius = 1.15;

    // 3 Curved Arrow Arms positioned in an equilateral triangle (120 deg apart)
    for (let i = 0; i < arrowCount; i++) {
      const angle = (i * 2 * Math.PI) / arrowCount;
      const armGroup = new THREE.Group();
      armGroup.rotation.z = angle;

      // Curved leafy body
      const curveGeo = new THREE.TorusGeometry(radius, 0.12, 8, 14, Math.PI * 0.42);
      const leafGreen = (i % 2 === 0) ? 0x2e7d32 : 0x43a047;
      const leafMat = new THREE.MeshLambertMaterial({ color: leafGreen, flatShading: true });
      const curveMesh = new THREE.Mesh(curveGeo, leafMat);
      armGroup.add(curveMesh);

      // Arrowhead Cone
      const headGeo = new THREE.ConeGeometry(0.24, 0.5, 6);
      const headMat = new THREE.MeshLambertMaterial({ color: 0x81c784, flatShading: true });
      const headMesh = new THREE.Mesh(headGeo, headMat);

      // Position arrowhead at the tip of the torus segment
      headMesh.position.set(
        Math.cos(Math.PI * 0.42) * radius,
        Math.sin(Math.PI * 0.42) * radius,
        0
      );
      headMesh.rotation.z = Math.PI * 0.42 - Math.PI / 2;
      armGroup.add(headMesh);

      recycleGroup.add(armGroup);
    }

    // Central small sprout inside recycling circle
    const centerLeafMat = new THREE.MeshLambertMaterial({ color: 0x81c784, side: THREE.DoubleSide });
    const centerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 5), centerLeafMat);
    centerLeaf.position.y = 0;
    recycleGroup.add(centerLeaf);

    group.add(recycleGroup);
  }

  // --------------------------------------------------------------------------
  // MODEL 6: DEFAULT / OTHER PAGES — Floating Eco Orb with Leaves
  // --------------------------------------------------------------------------
  function buildDefaultEcoOrbObject(group) {
    const orbGroup = new THREE.Group();

    // Central translucent emerald sphere
    const orbMat = new THREE.MeshPhongMaterial({
      color: 0x2e7d32,
      emissive: 0x1b5e20,
      specular: 0x81c784,
      shininess: 60,
      transparent: true,
      opacity: 0.85,
      flatShading: true
    });
    const orb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), orbMat);
    orbGroup.add(orb);

    // Orbiting leaf rings
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x81c784, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), ringMat);
      const a = (i * Math.PI) / 2;
      leaf.position.set(Math.cos(a) * 1.5, Math.sin(a) * 0.6, Math.sin(a) * 1.2);
      leaf.rotation.x = Math.PI / 3;
      orbGroup.add(leaf);
    }

    group.add(orbGroup);
  }

  // ==========================================================================
  // PART C: UNIFIED ANIMATION RENDER LOOP & VISIBILITY CONTROL
  // ==========================================================================
  let isRunning = true;
  const clock = new THREE.Clock();

  function animate() {
    if (!isRunning) return;

    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // 1. RENDER BACKGROUND CANVAS PARTICLES (Floating leaves, sheets, planes)
    if (bgRenderer && bgScene && bgCamera) {
      if (!prefersReducedMotion) {
        bgParticles.forEach(p => {
          p.swing += p.swingSpeed;
          p.mesh.position.y -= p.speedY;
          p.mesh.position.x += Math.sin(p.swing) * p.swingAmp;
          p.mesh.rotation.x += p.speedRotX;
          p.mesh.rotation.y += p.speedRotY;
          p.mesh.rotation.z += p.speedRotZ;

          // Wrap particles from bottom to top seamlessly
          if (p.mesh.position.y < -14) {
            p.mesh.position.y = 14;
            p.mesh.position.x = (Math.random() - 0.5) * 30;
          }
        });
      }
      bgRenderer.render(bgScene, bgCamera);
    }

    // 2. RENDER HEADER 3D SHOWCASE OBJECT
    if (isHeaderActive && headerRenderer && headerScene && headerCamera && headerMainObjectGroup) {
      if (!prefersReducedMotion) {
        if (sceneType === 'home' && updateHomeStudioScene) {
          updateHomeStudioScene(elapsed, delta);
        } else {
          // Slow idle 3D rotation
          headerMainObjectGroup.rotation.y += 0.007;

          // Gentle floating bob
          headerMainObjectGroup.position.y = Math.sin(elapsed * 1.6) * 0.07;

          // Smooth mouse tilt lerp
          headerMainObjectGroup.rotation.x += (headerTargetRotX - headerMainObjectGroup.rotation.x) * 0.05;
          headerMainObjectGroup.rotation.z += (-headerTargetRotY * 0.35 - headerMainObjectGroup.rotation.z) * 0.05;
        }
      }
      headerRenderer.render(headerScene, headerCamera);
    }
  }

  // Tab visibility detection to pause loop and save laptop battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
    } else {
      isRunning = true;
      clock.start();
      requestAnimationFrame(animate);
    }
  });

  // ==========================================================================
  // INITIALIZATION ON DOM READY
  // ==========================================================================
  function init() {
    initBackground3D();
    initHeaderShowcase();
    requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
