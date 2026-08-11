import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Real 3D flower model (pink rose .glb): lazy-loaded, client-only, draggable.
export default function HeroOrchid3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const bounds = mount.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width || mount.clientWidth || window.innerWidth));
    const height = Math.max(1, Math.floor(bounds.height || mount.clientHeight || window.innerHeight));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0.18, 0.12, 4.9);

    // soft image-based lighting for believable PBR materials
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // multi-tone key/rim/fill so the pink rose has dimension (not flat)
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 3.2, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff66b3, 1.05);
    rim.position.set(-3.5, 1.5, -2.5);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0x8a7bff, 0.55);
    fill.position.set(-1, -2, 2.5);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const group = new THREE.Group();
    scene.add(group);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotateSpeed = 0.85;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.target.set(0, -0.04, 0);

    let disposed = false;
    let model = null;
    const isMobileHero = () => window.matchMedia('(max-width: 767px)').matches;
    const frameScene = () => {
      const mobile = isMobileHero();
      camera.fov = mobile ? 32 : 34;
      camera.position.set(mobile ? 0.08 : 0.18, mobile ? 0.06 : 0.12, mobile ? 4.15 : 4.75);
      controls.target.set(0, mobile ? -0.06 : -0.04, 0);

      if (model?.userData?.maxDim) {
        const centerOffset = model.userData.centerOffset || new THREE.Vector3();
        model.scale.setScalar((mobile ? 2.22 : 1.95) / model.userData.maxDim);
        model.position.set(centerOffset.x, centerOffset.y + (mobile ? -0.06 : -0.04), centerOffset.z);
        model.rotation.set(mobile ? 0.16 : 0.04, mobile ? -0.34 : -0.24, mobile ? -0.03 : -0.05);
      }

      camera.updateProjectionMatrix();
    };
    const disposeMaterial = (material, disposeTextures = true) => {
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((mat) => {
        if (!mat) return;
        if (disposeTextures) {
          ['map', 'alphaMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach((keyName) => {
            if (mat[keyName]) mat[keyName].dispose();
          });
        }
        mat.dispose();
      });
    };
    const tuneMaterial = (mesh) => {
      const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const map = source?.map;

      if (map) {
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        map.needsUpdate = true;
      }

      const tuned = map
        ? new THREE.MeshBasicMaterial({
            map,
            alphaMap: source.alphaMap || null,
            alphaTest: Math.max(source.alphaTest || 0, 0.015),
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: Boolean(source.transparent || source.alphaMap),
            toneMapped: false,
          })
        : new THREE.MeshStandardMaterial({
            color: 0xf37ab4,
            roughness: 0.82,
            metalness: 0,
            side: THREE.DoubleSide,
          });

      disposeMaterial(mesh.material, false);
      mesh.material = tuned;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    };
    const loader = new GLTFLoader();
    loader.load(
      '/models/pink_rose.glb',
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        model.traverse((object) => {
          if (object.isMesh) tuneMaterial(object);
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.userData.maxDim = maxDim;
        model.userData.centerOffset = model.position.clone();
        frameScene();
        group.add(model);
      },
      undefined,
      () => {},
    );

    let raf = null;
    let isInViewport = true;

    const renderFrame = () => {
      if (disposed || !isInViewport || document.hidden) {
        raf = null;
        return;
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderFrame);
    };

    const startRendering = () => {
      if (disposed || raf !== null || !isInViewport || document.hidden) return;
      raf = requestAnimationFrame(renderFrame);
    };

    const stopRendering = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isInViewport = Boolean(entry?.isIntersecting);
        if (isInViewport) startRendering();
        else stopRendering();
      },
      { rootMargin: '120px 0px' },
    );
    visibilityObserver.observe(mount);

    const onVisibilityChange = () => {
      if (document.hidden) stopRendering();
      else startRendering();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    startRendering();

    const onResize = () => {
      const nextBounds = mount.getBoundingClientRect();
      const w = Math.max(1, Math.floor(nextBounds.width || mount.clientWidth));
      const h = Math.max(1, Math.floor(nextBounds.height || mount.clientHeight));
      if (!w || !h) return;
      camera.aspect = w / h;
      renderer.setSize(w, h, false);
      frameScene();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      stopRendering();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      controls.dispose();
      pmrem.dispose();
      if (model) {
        model.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) disposeMaterial(o.material);
        });
      }
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="orchid-canvas" ref={mountRef} aria-hidden="true" />;
}
