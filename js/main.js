// main.js — visualizador completo
import { RGBELoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
// lil-gui (UI) - CDN via skypack
import GUI from "https://cdn.skypack.dev/lil-gui@0.18.0";

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
renderer.outputEncoding = THREE.sRGBEncoding; // importante para cores corretas
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;

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
dir.shadow.bias = -0.0005; // reduz acne de sombra

const fillLight = new THREE.PointLight(0xffffff, 0.5, 50);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// Ground (recebe sombras)
const texLoader = new THREE.TextureLoader();
const blackTex = texLoader.load("https://res.cloudinary.com/dmxgurkfj/image/upload/v1760130854/textura_viiztg.png");

// Configurações da textura
blackTex.wrapS = blackTex.wrapT = THREE.RepeatWrapping;
blackTex.repeat.set(24, 24); // ajuste de repetição
blackTex.encoding = THREE.sRGBEncoding;
blackTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

// Material + geometria
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({
  map: blackTex,
  roughness: 0.9, // fosco
  metalness: 0.0
});

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;   // mais para baixo
ground.receiveShadow = true;
scene.add(ground);


// Helpers (opcionais)


// GLTF Loader
const loader = new GLTFLoader();
let model = null;
let originalMaterials = new Map(); // guardar materiais originais
let paintCandidates = []; // meshes que parecem pintar a carroceria

loader.load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;
      model.scale.set(30, 30, 30); // 👈 aumenta o tamanho do modelo
    model.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        // Corrige encodings das texturas se necessário
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
    buildGUI();
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


// Ajustes nos materiais (encodings e flags)
function adjustMaterial(mat) {
  if (!mat) return;
  // guarda material original
  originalMaterials.set(mat.uuid, mat);

  // Encoding de textura (albedo)
  if (mat.map) mat.map.encoding = THREE.sRGBEncoding;
  if (mat.emissiveMap) mat.emissiveMap.encoding = THREE.sRGBEncoding;

  // habilita física
  mat.needsUpdate = true;
}


// Tenta identificar quais meshes são a "pintura" do carro
function identifyPaintMeshes(root) {
  paintCandidates = [];
  root.traverse((c) => {
    if (c.isMesh) {
      const name = (c.name || "").toLowerCase();
      // heurísticas: nomes comuns usados em exports
      if (name.includes("body") || name.includes("paint") || name.includes("car_paint") || name.includes("carrosserie") || name.includes("chassis") || name.includes("metallic")) {
        paintCandidates.push(c);
      }
    }
  });
  // se não encontrou, tenta usar mesh maior que X
  if (paintCandidates.length === 0) {
    // pega os 4 maiores meshes por bounding box volume
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
  console.log("🎨 Paint candidates:", paintCandidates.map(m => m.name || m.uuid));
}

// centraliza, normaliza escala e posiciona câmera automaticamente
function normalizeAndFrame(object3D) {
  // desabilita frustum culling nos meshes (evita desaparecer)
  object3D.traverse((c) => {
    if (c.isMesh) c.frustumCulled = false;
  });

  // calcula bounding box
  const box = new THREE.Box3().setFromObject(object3D);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // recentra o objeto na origem
  object3D.position.sub(center);

  // recomputa
  const newBox = new THREE.Box3().setFromObject(object3D);
  const newSize = newBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(newSize.x, newSize.y, newSize.z);
camera.position.set(3.2, 0.0, 4.5); 
controls.target.set(0, 0.0, 0); 
camera.lookAt(0, 0.5, 0); 
  controls.update();
}

// GUI
let params = {
  paintColor: "#ff0000",
  metalness: 0.6,
  roughness: 0.35,
  exposure: 1.0,
  showGrid: true,
  autoRotate: false,
  visibleParts: {}, // será preenchido
  resetCamera: () => resetCamera(),
  screenshot: () => takeScreenshot()
};

function buildGUI() {
  // pintura — aplica em todos os candidates
// lista de cores pré-definidas

params.paintColor = colorOptions.Vermelho; // cor inicial
  paintFolder.addColor(params, "paintColor").name("Cor").onChange(applyPaintColor);
  paintFolder.add(params, "metalness", 0, 1, 0.01).onChange(applyPBR);
  paintFolder.add(params, "roughness", 0, 1, 0.01).onChange(applyPBR);

  const viewFolder = gui.addFolder("Visão");
  viewFolder.add(params, "exposure", 0.1, 2, 0.01).onChange((v) => {
    renderer.toneMappingExposure = v;
  });
  viewFolder.add(params, "showGrid").name("Grade").onChange((v) => grid.visible = v);
  viewFolder.add(params, "autoRotate").name("Auto rotate");

  // lista de partes detectadas (visibilidade)


  gui.add(params, "resetCamera").name("RESET");
  gui.add(params, "screenshot").name("SCREENSHOT");

  gui.domElement.style.zIndex = 20;
}

// aplica cor na pintura (substitui/altera material)
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
    m.color = color;
    m.metalness = params.metalness;
    m.roughness = params.roughness;
    m.needsUpdate = true;
  }
}

function applyPBR() {
  paintCandidates.forEach(mesh => {
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach(m => { m.metalness = params.metalness; m.roughness = params.roughness; m.needsUpdate = true; });
    else { mat.metalness = params.metalness; mat.roughness = params.roughness; mat.needsUpdate = true; }
  });
}

// screenshot
function takeScreenshot() {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "screenshot.png";
  a.click();
}

// reset camera
const DEFAULT_CAMERA = camera.clone();
function resetCamera() {
  camera.position.copy(DEFAULT_CAMERA.position);
  camera.quaternion.copy(DEFAULT_CAMERA.quaternion);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
}

// fallback cube if model fails
function showFallbackCube() {
  const geo = new THREE.BoxGeometry(2, 1, 4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5588cc });
  const cube = new THREE.Mesh(geo, mat);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
  normalizeAndFrame(cube);
}

// UI top buttons
document.getElementById("btn-reset").addEventListener("click", resetCamera);
document.getElementById("btn-screenshot").addEventListener("click", takeScreenshot);

// Resize
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Loop
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
{ name: "Rosso Corsa",  color: "#ff0000", metalness: 0.1, roughness: 0.35 },
{ name: "Rosso Mugello",  color: "#5a0000", metalness: 0.7, roughness: 0.35 },
{ name: "Giallo Modena",   color: "#e1ca00", metalness: 0.1, roughness: 0.3 },
{ name: "Nero Daytona",   color: "#000000", metalness: 0.65, roughness: 0.3 },
{ name: "Bianco Cervino", color: "#ffffff", metalness: 0.5, roughness: 0.35 },
  ],
  ADDITIONAL: [
{ name: "Bianco Artico", color: "#ffffffff", metalness: 0.75, roughness: 0.25 },
  ],
  HISTORICAL: [
{ name: "Verde British",   color: "#072414", metalness: 0.87, roughness: 0.3 },
{ name: "Blu Scozia",   color: "#0d1636", metalness: 0.6, roughness: 0.3 },
{ name: "Canna Di Fucile",   color: "#0d1637", metalness: 0.87, roughness: 0.3 },
{ name: "Rosso Dino",   color: "#d13101", metalness: 0.25, roughness: 0.3 },
{ name: "Celeste Trevi",   color: "#50929d", metalness: 0.85, roughness: 0.3 },

  ],
  SPECIAL: [
{ name: "Giallo Montecarlo",   color: "#c0a104", metalness: 0.75, roughness: 0.3 },
{ name: "Rosso Racing 2025",   color:"#640c15", metalness: 0.65, roughness: 0.8 },
{ name: "Verde Toscana",   color:"#748649", metalness: 0.65, roughness: 0.3 }
  ]
};
const btnContainer = document.getElementById("colorButtons");
btnContainer.innerHTML = ""; // limpa antes

Object.entries(paintCategories).forEach(([categoria, presets]) => {
  // título da categoria
  const title = document.createElement("h3");
  title.textContent = categoria;
  title.style.color = "white";
  btnContainer.appendChild(title);

  // botões da categoria
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

