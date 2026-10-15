import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function symbolTexture(kind: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = '#d3e1ff'; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind === 0) {
    ctx.roundRect(52, 75, 152, 112, 10); ctx.moveTo(58, 82); ctx.lineTo(128, 135); ctx.lineTo(198, 82);
  } else if (kind === 1) {
    ctx.roundRect(62, 66, 132, 128, 12); ctx.moveTo(62, 103); ctx.lineTo(194, 103);
    ctx.moveTo(94, 52); ctx.lineTo(94, 80); ctx.moveTo(162, 52); ctx.lineTo(162, 80);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.rect(88 + i * 34, 125 + j * 32, 5, 5);
  } else if (kind === 2) {
    ctx.moveTo(78, 57); ctx.lineTo(153, 57); ctx.lineTo(184, 88); ctx.lineTo(184, 199); ctx.lineTo(78, 199); ctx.closePath();
    ctx.moveTo(153, 57); ctx.lineTo(153, 88); ctx.lineTo(184, 88);
    [118, 147, 173].forEach(y => { ctx.moveTo(103, y); ctx.lineTo(159, y); });
  } else if (kind === 3) {
    ctx.roundRect(52, 66, 152, 113, 24); ctx.moveTo(85, 179); ctx.lineTo(85, 203); ctx.lineTo(114, 179);
    [92, 128, 164].forEach(x => { ctx.moveTo(x, 121); ctx.arc(x, 121, 3, 0, Math.PI * 2); });
  } else {
    ctx.moveTo(62, 61); ctx.lineTo(62, 192); ctx.lineTo(202, 192);
    ctx.rect(89, 127, 18, 45); ctx.rect(129, 95, 18, 77); ctx.rect(169, 64, 18, 108);
  }
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLogo() {
  const group = new THREE.Group();
  const polygons = [
    [[0, 0], [219, 161], [219, 264], [91, 167], [91, 291], [0, 349]],
    [[438, 0], [219, 161], [219, 264], [347, 167], [347, 291], [438, 349]],
  ];
  polygons.forEach((points, index) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => {
      const px = (x / 438 - .5) * 2.9;
      const py = (.5 - y / 349) * 2.32;
      if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
    });
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .27, bevelEnabled: true, bevelThickness: .045, bevelSize: .027, bevelSegments: 4, steps: 1 });
    geometry.computeVertexNormals();
    const material = new THREE.MeshPhysicalMaterial({ color: index ? '#1744bc' : '#366fff', roughness: .25, metalness: .68, clearcoat: .65, clearcoatRoughness: .2 });
    const mesh = new THREE.Mesh(geometry, material); mesh.position.z = -.14; group.add(mesh);
  });
  return group;
}

export default function SystemCore({ connected = true }: { connected?: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const target = useRef(connected ? 1 : 0);
  const renderOnce = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { target.current = connected ? 1 : 0; renderOnce.current?.(); }, [connected]);

  useEffect(() => {
    const container = mount.current;
    if (!container) return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motionQuery.matches;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x080a0f, 0);
    renderer.domElement.setAttribute('aria-label', 'A blue Moki M connects an envelope, calendar, documents, chat, and reporting into one business system.');
    renderer.domElement.setAttribute('role', 'img');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 40);
    camera.position.set(0, .1, 11.7);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .9;
    room.dispose();
    scene.add(new THREE.AmbientLight(0xffffff, .8));
    const light = new THREE.DirectionalLight(0xd7e8ff, 4); light.position.set(-3, 6, 5); scene.add(light);
    const rim = new THREE.PointLight(0x3a71ff, 70, 20); rim.position.set(2, -1, 4); scene.add(rim);
    const system = new THREE.Group(); scene.add(system);
    const logo = makeLogo(); logo.rotation.set(.1, -.26, -.04); system.add(logo);
    const silver = new THREE.MeshStandardMaterial({ color: '#9aa6b9', metalness: .95, roughness: .26 });
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.5, .027, 12, 160), silver);
    orbit.rotation.set(.72, .34, -.47); system.add(orbit);
    const outerOrbit = new THREE.Mesh(new THREE.TorusGeometry(3.16, .009, 8, 160), new THREE.MeshBasicMaterial({ color: '#1f385f', transparent: true, opacity: .6 }));
    outerOrbit.rotation.set(.44, -.3, -.42); system.add(outerOrbit);
    const positions = [new THREE.Vector3(-2.3, 1.1, .3), new THREE.Vector3(2.18, 1.6, -.25), new THREE.Vector3(-2.05, -1.8, .65), new THREE.Vector3(2.5, -1.2, .1), new THREE.Vector3(.1, 2.64, -.3)];
    const tiles = positions.map((position, i) => {
      const tile = new THREE.Group();
      const box = new THREE.Mesh(new RoundedBoxGeometry(.91, .91, .2, 3, .1), new THREE.MeshStandardMaterial({ color: i === 3 ? '#21345e' : '#272d3b', roughness: .36, metalness: .55 }));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(.72, .72), new THREE.MeshBasicMaterial({ map: symbolTexture(i), transparent: true, depthWrite: false }));
      face.position.z = .108; tile.add(box, face); tile.position.copy(position);
      tile.rotation.set(.1 + i * .04, i % 2 ? -.3 : .26, i % 2 ? .12 : -.1);
      system.add(tile); return tile;
    });
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#427eff', transparent: true, opacity: .36 });
    const lines = positions.map((p) => {
      const curve = new THREE.QuadraticBezierCurve3(p.clone().multiplyScalar(.82), new THREE.Vector3(p.x * .35, p.y * .7, -.3), new THREE.Vector3(0, 0, -.35));
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), lineMaterial); system.add(line); return { line, curve };
    });
    const pulses = lines.map(() => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 8), new THREE.MeshBasicMaterial({ color: '#a9c6ff' })); system.add(p); return p;
    });
    const starCount = 48;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) { const angle = i * 2.399; const radius = 2 + (i % 13) * .23; starCoords[i * 3] = Math.cos(angle) * radius; starCoords[i * 3 + 1] = Math.sin(angle) * radius; starCoords[i * 3 + 2] = -1 - (i % 7) * .12; }
    const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#7c9acd', size: .018, transparent: true, opacity: .5 })));
    let frame = 0, disposed = false, inView = true, clockTime = 0, lastTime = 0;
    let assembly = target.current;
    const pointer = { x: 0, y: 0 };
    const draw = (time: number) => {
      frame = 0;
      if (disposed) return;
      if (time - lastTime >= 30 || reduced) {
        const dt = Math.min((time - lastTime) / 1000, .05); lastTime = time;
        if (!reduced) clockTime += dt;
        assembly = reduced ? target.current : THREE.MathUtils.lerp(assembly, target.current, .055);
        const t = clockTime;
        system.rotation.y = reduced ? 0 : THREE.MathUtils.lerp(system.rotation.y, pointer.x * .16, .035);
        system.rotation.x = reduced ? 0 : THREE.MathUtils.lerp(system.rotation.x, pointer.y * .1, .035);
        logo.rotation.y = -.26 + (reduced ? 0 : Math.sin(t * .4) * .08);
        logo.position.y = reduced ? 0 : Math.sin(t * .65) * .07;
        orbit.rotation.z = -.47 + (reduced ? 0 : Math.sin(t * .23) * .055);
        orbit.material = silver; silver.color.set(assembly > .5 ? '#9aa6b9' : '#4b5260');
        tiles.forEach((tile, i) => {
          const p = positions[i];
          tile.position.set(p.x * (1.25 - assembly * .25), p.y + (reduced ? 0 : Math.sin(t * .65 + i) * .09), p.z);
          tile.rotation.z = (i % 2 ? .12 : -.1) + (1 - assembly) * (i % 2 ? .3 : -.25);
        });
        lineMaterial.opacity = assembly * .36;
        pulses.forEach((p, i) => { p.visible = assembly > .5; p.position.copy(lines[i].curve.getPoint((t * .15 + i * .2) % 1)); });
        renderer.render(scene, camera);
      }
      if (!reduced && inView && document.visibilityState !== 'hidden') frame = requestAnimationFrame(draw);
    };
    const start = () => { if (!disposed && !frame) frame = requestAnimationFrame(draw); };
    renderOnce.current = start;
    const resize = () => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.position.z = w / h < .9 ? 13.5 : 11.7; camera.updateProjectionMatrix(); start(); };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
    const intersection = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) start(); else { cancelAnimationFrame(frame); frame = 0; } }); intersection.observe(container);
    const onMove = (e: PointerEvent) => { const rect = container.getBoundingClientRect(); pointer.x = (e.clientX - rect.left) / rect.width - .5; pointer.y = (e.clientY - rect.top) / rect.height - .5; };
    const onLeave = () => { pointer.x = pointer.y = 0; };
    const visibility = () => { if (document.visibilityState === 'visible') start(); else { cancelAnimationFrame(frame); frame = 0; } };
    const onMotion = () => { reduced = motionQuery.matches; start(); };
    container.addEventListener('pointermove', onMove); container.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', visibility); motionQuery.addEventListener('change', onMotion);
    resize(); setReady(true);
    return () => {
      disposed = true; cancelAnimationFrame(frame); renderOnce.current = null;
      resizeObserver.disconnect(); intersection.disconnect();
      container.removeEventListener('pointermove', onMove); container.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', visibility); motionQuery.removeEventListener('change', onMotion);
      scene.traverse(obj => { const mesh = obj as THREE.Mesh; mesh.geometry?.dispose(); if (mesh.material) { const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; mats.forEach(mat => { (mat as THREE.MeshBasicMaterial).map?.dispose(); mat.dispose(); }); } });
      environment.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className={`system-core ${ready ? 'core-ready' : ''}`} ref={mount}>
    <img className="core-fallback" src="/images/moki-core.webp" alt="Sculptural blue Moki M" fetchPriority="high" />
  </div>;
}
