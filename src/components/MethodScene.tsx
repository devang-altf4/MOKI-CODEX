import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { connections, easeBetween, toolKinds, toolPose } from './methodMotion';

export type MethodRenderer = ((progress: number) => void) | null;
type ToolKind = typeof toolKinds[number];

function extrude(points: number[][], depth = .22) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .055, bevelSize: .045, bevelSegments: 3, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function tool(kind: ToolKind, body: THREE.Material, detail: THREE.Material) {
  const group = new THREE.Group(), pieces: THREE.BufferGeometry[] = [];
  const box = (w: number, h: number, d: number) => new RoundedBoxGeometry(w, h, d, 3, .075);
  let geometry: THREE.BufferGeometry;
  if (kind === 'document') geometry = extrude([[-.51, .72], [.2, .72], [.51, .4], [.51, -.72], [-.51, -.72]]);
  else if (kind === 'folder') geometry = extrude([[-.78, .48], [-.33, .48], [-.16, .32], [.78, .32], [.78, -.54], [-.78, -.54]], .28);
  else geometry = box(kind === 'mail' ? 1.64 : 1.42, kind === 'mail' ? 1.14 : kind === 'calendar' ? 1.4 : 1.2, .28);
  group.add(new THREE.Mesh(geometry, body));
  const segment = (a: number[], b: number[], radius = .018) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), direction = to.clone().sub(from);
    const line = new THREE.CylinderGeometry(radius, radius, direction.length(), 6);
    line.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
    line.translate(...from.add(to).multiplyScalar(.5).toArray()); pieces.push(line.toNonIndexed());
  };
  const rectangle = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const raised = box(w, h, d); raised.translate(x, y, z); pieces.push(raised.index ? raised.toNonIndexed() : raised);
  };
  if (kind === 'mail') {
    segment([-.72, .43, .18], [0, -.08, .24], .026); segment([0, -.08, .24], [.72, .43, .18], .026);
    segment([-.72, -.43, .18], [-.18, -.06, .18]); segment([.18, -.06, .18], [.72, -.43, .18]);
  } else if (kind === 'calendar') {
    segment([-.58, .28, .18], [.58, .28, .18]);
    for (const x of [-.4, .4]) { const ring = new THREE.TorusGeometry(.13, .045, 8, 16); ring.rotateX(.65); ring.translate(x, .7, .14); pieces.push(ring.toNonIndexed()); }
    for (const x of [-.36, 0, .36]) for (const y of [-.05, -.4]) rectangle(.19, .19, .07, x, y, .2);
  } else if (kind === 'chat') {
    for (const x of [-.36, 0, .36]) { const dot = new THREE.SphereGeometry(.08, 12, 8); dot.scale(1, 1, .5); dot.translate(x, 0, .2); pieces.push(dot.toNonIndexed()); }
    const tail = extrude([[-.48, -.45], [-.48, -.82], [-.1, -.45]], .2); group.add(new THREE.Mesh(tail, body));
  } else if (kind === 'chart') {
    for (const [i, height] of [.3, .58, .86].entries()) rectangle(.2, height, .14, -.38 + i * .38, -.4 + height / 2, .24);
  } else if (kind === 'document') {
    segment([.19, .62, .18], [.19, .34, .18]); segment([.19, .34, .18], [.44, .34, .18]);
    for (const y of [.1, -.14, -.38]) segment([-.3, y, .18], [.28, y, .18], .019);
  } else {
    segment([-.67, .17, .19], [.67, .17, .19], .025);
  }
  const relief = mergeGeometries(pieces);
  if (relief) group.add(new THREE.Mesh(relief, detail));
  pieces.forEach(piece => piece.dispose());
  return group;
}

function mark() {
  const group = new THREE.Group();
  const polygons = [[[0, 0], [219, 161], [219, 264], [91, 167], [91, 291], [0, 349]], [[438, 0], [219, 161], [219, 264], [347, 167], [347, 291], [438, 349]]];
  polygons.forEach((points, index) => group.add(new THREE.Mesh(extrude(points.map(([x, y]) => [(x / 438 - .5) * 3, (.5 - y / 349) * 2.4]), .3), new THREE.MeshPhysicalMaterial({ color: index ? '#103fa4' : '#2059ea', roughness: .25, metalness: .62, clearcoat: .7 }))));
  return group;
}

/** Render on demand: no video clock, seeking, or geometry allocation in the draw loop. */
export default function MethodScene({ onRenderer }: { onRenderer: (renderer: MethodRenderer) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); } catch { onRenderer(null); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth <= 700 ? 1.3 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.setClearColor('#080a0f'); renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
    const environmentGenerator = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
    const environment = environmentGenerator.fromScene(room, .04); room.dispose();
    scene.environment = environment.texture; scene.environmentIntensity = .8;
    scene.add(new THREE.AmbientLight('#dde6ff', .5));
    const key = new THREE.DirectionalLight('#ffffff', 3); key.position.set(-4, 5, 7); scene.add(key);
    const rim = new THREE.DirectionalLight('#6a90ff', 2); rim.position.set(5, 1, -2); scene.add(rim);
    const soft = new THREE.DirectionalLight('#d5e0ff', 1.2); soft.position.set(2, -4, 5); scene.add(soft);
    const system = new THREE.Group(); scene.add(system);
    const body = new THREE.MeshStandardMaterial({ color: '#3a3e46', roughness: .37, metalness: .6 });
    const detail = new THREE.MeshStandardMaterial({ color: '#727982', roughness: .32, metalness: .68 });
    const tools = toolKinds.map(kind => { const item = tool(kind, body, detail); system.add(item); return item; });
    const logo = mark(); system.add(logo);
    const blue = new THREE.MeshStandardMaterial({ color: '#3871ff', emissive: '#194fef', emissiveIntensity: .8, metalness: .55, roughness: .27 });
    const wireGeometry = new THREE.CylinderGeometry(1, 1, 1, 6), nodeGeometry = new RoundedBoxGeometry(.13, .13, .13, 1, .025);
    const wires = connections.map(() => { const wire = new THREE.Mesh(wireGeometry, blue), pulse = new THREE.Mesh(nodeGeometry, blue); system.add(wire, pulse); return { wire, pulse }; });
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.12, .022, 8, 96), new THREE.MeshStandardMaterial({ color: '#b5bfd1', roughness: .2, metalness: 1 })); system.add(orbit);
    const glowOrbit = new THREE.Mesh(new THREE.TorusGeometry(2.5, .008, 5, 96), blue); system.add(glowOrbit);
    const start = new THREE.Vector3(), finish = new THREE.Vector3(), difference = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const poses = toolKinds.map((_, i) => toolPose(0, i));
    // Warm every material while all objects are visible, before scrolling reveals the mark.
    const warmup = renderer.compileAsync(scene, camera);
    let lastProgress = 0, narrow = false, lost = false, frames = 0, disposed = false;
    const draw = (p: number) => {
      lastProgress = p;
      if (lost || document.visibilityState === 'hidden') return;
      const before = performance.now(), integrated = easeBetween(.72, 1, p), built = easeBetween(.44, .7, p);
      tools.forEach((item, index) => {
        const pose = toolPose(p, index); poses[index] = pose;
        item.position.set(pose.x, pose.y, pose.z); item.rotation.set(pose.rx, pose.ry, pose.rz); item.scale.setScalar(Math.max(.001, pose.scale)); item.visible = pose.scale > .005;
      });
      system.rotation.set(.025 * p, -.12 + p * .22, -.025 + p * .045);
      logo.visible = integrated > .001; logo.scale.setScalar(Math.max(.001, integrated * 1.1)); logo.rotation.set(.08, -1.2 + integrated, -.035); logo.position.z = .45;
      orbit.visible = glowOrbit.visible = integrated > .01;
      orbit.scale.setScalar(integrated); orbit.rotation.set(1.05, .3, -.6 + integrated * .8);
      glowOrbit.scale.setScalar(integrated); glowOrbit.rotation.set(.75, -.2, -.5 + integrated * .5);
      wires.forEach(({ wire, pulse }, index) => {
        const [a, b] = connections[index];
        start.set(poses[a].x, poses[a].y, poses[a].z - .15); finish.set(poses[b].x, poses[b].y, poses[b].z - .15);
        const spoke = poses[index % 6];
        start.x += (spoke.x - start.x) * integrated; start.y += (spoke.y - start.y) * integrated; start.z += (spoke.z - .15 - start.z) * integrated;
        finish.multiplyScalar(1 - integrated);
        const growth = Math.min(1, Math.max(0, built * 1.6 - index * .08));
        difference.copy(finish).sub(start);
        wire.visible = pulse.visible = growth > .001;
        wire.position.copy(start).addScaledVector(difference, growth * .5);
        wire.scale.set(.018, difference.length() * growth, .018); wire.quaternion.setFromUnitVectors(up, difference.normalize());
        pulse.position.copy(start).lerp(finish, ((p * 6 + index * .17) % 1) * growth);
        pulse.scale.setScalar(Math.min(1, growth * 3));
      });
      renderer.render(scene, camera);
      container.dataset.renderProgress = p.toFixed(5); container.dataset.renderCount = String(++frames);
      container.dataset.drawMs = (performance.now() - before).toFixed(2);
    };
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height) return;
      narrow = width <= 700;
      renderer.setSize(width, height); camera.aspect = width / height; camera.position.set(0, 0, narrow ? 12 : 14); camera.updateProjectionMatrix();
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.position.z;
      system.position.set(narrow ? 0 : viewHeight * camera.aspect * .17, narrow ? -.12 : .05, 0); system.scale.setScalar(narrow ? Math.min(.88, viewHeight * camera.aspect / 7.6) : 1.18);
      draw(lastProgress);
    };
    // Change the existing scene in place: theme switches must not rebuild WebGL
    // or reset the visitor's chapter and scroll position.
    const updateTheme = () => {
      const light = document.documentElement.dataset.theme === 'light';
      renderer.setClearColor(light ? '#ffffff' : '#080a0f');
      body.color.set(light ? '#c4cfdd' : '#3a3e46');
      detail.color.set(light ? '#667b96' : '#727982');
      blue.emissiveIntensity = light ? .35 : .8;
      draw(lastProgress);
    };
    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    updateTheme();
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; onRenderer(null); };
    const contextRestored = () => { lost = false; onRenderer(draw); draw(lastProgress); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost); renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    void warmup.then(() => { if (!disposed) onRenderer(draw); }).catch(() => { if (!disposed) onRenderer(null); });
    return () => {
      disposed = true;
      onRenderer(null); observer.disconnect(); themeObserver.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', contextLost); renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.geometry) geometries.add(mesh.geometry); if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => materials.add(material)); });
      renderer.domElement.remove();
      // Parallel compilation still reads the program cache. Release it after that
      // work settles, including a quick route change or React's development remount.
      const release = () => {
        geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
        environment.dispose(); environmentGenerator.dispose(); renderer.dispose();
      };
      void warmup.then(release, release);
    };
  }, [onRenderer]);
  return <div className="method-webgl" ref={mount} />;
}
