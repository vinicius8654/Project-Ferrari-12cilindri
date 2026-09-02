// main.js — visualizador completo
import { RGBELoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_FOLDER = "12c"; // <- ajuste aqui caso sua pasta não seja "12c"
const MODEL_URL = `./models/${MODEL_FOLDER}/scene.gltf`;
const container = document.getElementById("container3D");

// Cena e câmera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 2000);
camera.position.set(0, 1.0, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;

// Carrega o ambiente HDR e aplica reflexo realista em toda a cena
// IMPORTANTE: troque o conteúdo de env.hdr por um HDRI de "estúdio"
// (grátis em polyhaven.com/hdris/studio) para o resultado ficar
// parecido com fotos profissionais de carro — sem isso, o reflexo
// existe mas fica mais "morno".
rgbeLoader.load(
  './models/12c/monochrome_studio_02_4k.hdr',
  (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdrTexture;
  },
  undefined,
  (err) => console.error('❌ Erro ao carregar env.hdr:', err)
);

function upgradeToClearcoat(mesh) {
  const upgrade = (old) => new THREE.MeshPhysicalMaterial({
    color: old.color,
    map: old.map || null,
    metalness: old.metalness,
    roughness: old.roughness,
    clearcoat: 1.0,
    clearcoatRoughness: 0.5,
    envMapIntensity: 1.5, // era 1.5 — reflexo mais forte
  });

  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map(upgrade);
  } else {
    mesh.material = upgrade(mesh.material);
  }
}

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.screenSpacePanning = false;

// Luzes
const ambient = new THREE.AmbientLight(0xffffff, 0.60);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.8);
dir.position.set(10, 30, 10);
dir.castShadow = true;
dir.shadow.camera.top = 20;
dir.shadow.camera.bottom = -20;
dir.shadow.camera.left = -20;
dir.shadow.camera.right = 20;
dir.shadow.mapSize.set(2048, 2048);
scene.add(dir);
dir.shadow.bias = -0.0005;

const fillLight = new THREE.PointLight(0xffffff, 0.5, 50);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// Ground (recebe sombras)
const texLoader = new THREE.TextureLoader();
const blackTex = texLoader.load("https://res.cloudinary.com/dmxgurkfj/image/upload/v1760130854/textura_viiztg.png");

blackTex.wrapS = blackTex.wrapT = THREE.RepeatWrapping;
blackTex.repeat.set(24, 24);
blackTex.encoding = THREE.sRGBEncoding;
blackTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({
  map: blackTex,
  roughness: 0.9,
  metalness: 0.0
});

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
ground.receiveShadow = true;
scene.add(ground);

// GLTF Loader
const loader = new GLTFLoader();
let model = null;
let originalMaterials = new Map();
let paintCandidates = [];

loader.load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;
    model.scale.set(30, 30, 30);
    model.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) {
          if (Array.isArray(c.material)) {
            c.material.forEach(adjustMaterial);
          } else adjustMaterial(c.material);
        }
      }
    });

    scene.add(model);
    normalizeAndFrame(model);
    identifyPaintMeshes(model);
    console.log("✅ Modelo carregado:", MODEL_URL);
  },
  (xhr) => {
    const p = ((xhr.loaded / (xhr.total || xhr.loaded)) * 100).toFixed(1);
    console.log(`🔄 ${p}% loaded`);
  },
  (err) => {
    console.error("❌ Erro ao carregar GLTF:", err);
    showFallbackCube();
  }
);

function adjustMaterial(mat) {
  if (!mat) return;
  originalMaterials.set(mat.uuid, mat);
  if (mat.map) mat.map.encoding = THREE.sRGBEncoding;
  if (mat.emissiveMap) mat.emissiveMap.encoding = THREE.sRGBEncoding;
  mat.needsUpdate = true;
}

function identifyPaintMeshes(root) {
  paintCandidates = [];
  root.traverse((c) => {
    if (c.isMesh) {
      const name = (c.name || "").toLowerCase();
      if (name.includes("body") || name.includes("paint") || name.includes("car_paint") || name.includes("carrosserie") || name.includes("chassis") || name.includes("metallic")) {
        paintCandidates.push(c);
      }
    }
  });
  if (paintCandidates.length === 0) {
    const arr = [];
    root.traverse((c) => {
      if (c.isMesh) {
        const box = new THREE.Box3().setFromObject(c);
        const size = box.getSize(new THREE.Vector3());
        const vol = size.x * size.y * size.z;
        arr.push({ mesh: c, vol });
      }
    });
    arr.sort((a, b) => b.vol - a.vol);
    paintCandidates = arr.slice(0, 4).map(x => x.mesh);
  }

  paintCandidates.forEach(upgradeToClearcoat);
  console.log("🎨 Paint candidates:", paintCandidates.map(m => m.name || m.uuid));
}

function normalizeAndFrame(object3D) {
  object3D.traverse((c) => {
    if (c.isMesh) c.frustumCulled = false;
  });

  const box = new THREE.Box3().setFromObject(object3D);
  const center = box.getCenter(new THREE.Vector3());
  object3D.position.sub(center);

  camera.position.set(3.2, 0.0, 4.5);
  controls.target.set(0, 0.0, 0);
  camera.lookAt(0, 0.5, 0);
  controls.update();
}

let params = {
  paintColor: "#ff0000",
  metalness: 0.6,
  roughness: 0.1,
  exposure: 1.0,
  autoRotate: false,
  resetCamera: () => resetCamera(),
  screenshot: () => takeScreenshot()
};

function applyPaintColor() {
  const color = new THREE.Color(params.paintColor);
  paintCandidates.forEach(mesh => {
    let mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach(m => setMatColor(m, color));
    } else setMatColor(mat, color);
  });
  function setMatColor(m, color) {
    if (!m) return;
    m.color.copy(color);
    m.metalness = params.metalness;
    m.roughness = params.roughness;
    m.needsUpdate = true;
  }
}

function takeScreenshot() {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "screenshot.png";
  a.click();
}

const DEFAULT_CAMERA = camera.clone();
function resetCamera() {
  camera.position.copy(DEFAULT_CAMERA.position);
  camera.quaternion.copy(DEFAULT_CAMERA.quaternion);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
}

function showFallbackCube() {
  const geo = new THREE.BoxGeometry(2, 1, 4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5588cc });
  const cube = new THREE.Mesh(geo, mat);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
  normalizeAndFrame(cube);
}

document.getElementById("btn-reset").addEventListener("click", resetCamera);
document.getElementById("btn-screenshot").addEventListener("click", takeScreenshot);

window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
  requestAnimationFrame(animate);
  if (params.autoRotate && model) {
    model.rotation.y += 0.003;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

document.querySelectorAll("#colorButtons button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    params.paintColor = e.target.dataset.color;
    applyPaintColor();
  });
});

const paintCategories = {
  STANDARD: [
    { name: "Rosso Corsa", color: "#ff0000", metalness: 0.15, roughness: 0.1 },
    { name: "Rosso Mugello", color: "#5a0000", metalness: 0.1, roughness: 0.1 },
    { name: "Giallo Modena", color: "#ffcc00", metalness: 0.15, roughness: 1.1 },
    { name: "Nero Daytona", color: "#000000", metalness: 0.5, roughness: 0.08 },
    { name: "Grigio Scuro 792", color: "#3d3d3d", metalness: 1.0, roughness: 1.0 },
    { name: "Bianco Cervino", color: "#ffffff", metalness: 0.2, roughness: 0.12 },
  ],
  ADDITIONAL: [
    { name: "Bianco Artico", color: "#ffffff", metalness: 0.25, roughness: 0.1 }, // hex corrigido (era #ffffffff, inválido)
  ],
  HISTORICAL: [
    { name: "Verde British", color: "#072414", metalness: 0.35, roughness: 0.12 },
    { name: "Blu Scozia", color: "#0d1636", metalness: 1.3, roughness: 0.12 },
    { name: "Canna Di Fucile", color: "#0d1637", metalness: 0.4, roughness: 0.1 },
    { name: "Rosso Dino", color: "#ff1100", metalness: 0.15, roughness: 1.0 },
    { name: "Celeste Trevi", color: "#07074e", metalness: 0.0, roughness: 2.0 },
  ],
  SPECIAL: [
    { name: "Giallo Montecarlo", color: "#ff8800", metalness: 0.3, roughness: 0.1 },
    { name: "Rosso Racing 2025", color: "#640c15", metalness: 0.3, roughness: 0.1 }, // era roughness 0.8 (fosco demais)
    { name: "Verde Toscana", color: "#495331", metalness: 0.25, roughness: 1.0 },
    {name: "Rosso Racing 2025 Opaco", color: "#470505", metalness:0.5, roughness: 2.0 }
  ]
};

const btnContainer = document.getElementById("colorButtons");
btnContainer.innerHTML = "";

Object.entries(paintCategories).forEach(([categoria, presets]) => {
  const title = document.createElement("h3");
  title.textContent = categoria;
  title.style.color = "white";
  btnContainer.appendChild(title);

  presets.forEach(preset => {
    const btn = document.createElement("button");
    btn.style.background = preset.color;
    btn.style.width = "20px";
    btn.style.height = "20px";
    btn.style.border = "none";
    btn.style.borderRadius = "50%";
    btn.style.cursor = "pointer";
    btn.title = preset.name;

    btn.addEventListener("click", () => {
      params.paintColor = preset.color;
      params.metalness = preset.metalness;
      params.roughness = preset.roughness;
      applyPaintColor();
    });

    btnContainer.appendChild(btn);
  });
});
