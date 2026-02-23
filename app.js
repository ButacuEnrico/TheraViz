import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { RGBShiftShader } from "three/addons/shaders/RGBShiftShader.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";

const PRESET_KEY = "theraviz-presets";

const palettes = {
  "neon-cyan": {
    primaryColor: "#8ec4ff",
    secondaryColor: "#4f89d9",
    accentColor: "#c6dcff",
    backgroundColor: "#090b10",
  },
  "solar-flare": {
    primaryColor: "#f6be86",
    secondaryColor: "#c6784d",
    accentColor: "#ffd4b6",
    backgroundColor: "#120d0b",
  },
  "toxic-wave": {
    primaryColor: "#95d9bf",
    secondaryColor: "#3c8d79",
    accentColor: "#d4f5e7",
    backgroundColor: "#08110f",
  },
  "nordic-ice": {
    primaryColor: "#d6e8ff",
    secondaryColor: "#7594b8",
    accentColor: "#f2f8ff",
    backgroundColor: "#090d17",
  },
  infrared: {
    primaryColor: "#de8891",
    secondaryColor: "#9b4f59",
    accentColor: "#f2bec4",
    backgroundColor: "#11090c",
  },
};

const dom = {
  scene: document.getElementById("scene"),
  spectrum: document.getElementById("spectrum"),
  audioElement: document.getElementById("audioElement"),
  toast: document.getElementById("toast"),
  trackInfo: document.getElementById("trackInfo"),
  bpmReadout: document.getElementById("bpmReadout"),
  energyReadout: document.getElementById("energyReadout"),
  focusReadout: document.getElementById("focusReadout"),
  timeReadout: document.getElementById("timeReadout"),
  exportStatus: document.getElementById("exportStatus"),
  playPause: document.getElementById("playPause"),
  stopBtn: document.getElementById("stopBtn"),
  randomizeBtn: document.getElementById("randomizeBtn"),
  audioFile: document.getElementById("audioFile"),
  seekBar: document.getElementById("seekBar"),
  tabs: document.querySelectorAll(".tab"),
  panels: document.querySelectorAll(".panel"),
  controls: {
    volume: document.getElementById("volume"),
    sensitivity: document.getElementById("sensitivity"),
    smoothness: document.getElementById("smoothness"),
    rotationSpeed: document.getElementById("rotationSpeed"),
    pulseStrength: document.getElementById("pulseStrength"),
    visualScene: document.getElementById("visualScene"),
    shapeType: document.getElementById("shapeType"),
    visualMode: document.getElementById("visualMode"),
    complexity: document.getElementById("complexity"),
    deformAmount: document.getElementById("deformAmount"),
    particleAmount: document.getElementById("particleAmount"),
    wireframe: document.getElementById("wireframe"),
    bloomStrength: document.getElementById("bloomStrength"),
    trailDamp: document.getElementById("trailDamp"),
    glitchAmount: document.getElementById("glitchAmount"),
    filmNoise: document.getElementById("filmNoise"),
    cameraMotion: document.getElementById("cameraMotion"),
    autoRotate: document.getElementById("autoRotate"),
    palettePreset: document.getElementById("palettePreset"),
    primaryColor: document.getElementById("primaryColor"),
    secondaryColor: document.getElementById("secondaryColor"),
    accentColor: document.getElementById("accentColor"),
    backgroundColor: document.getElementById("backgroundColor"),
    hueShiftSpeed: document.getElementById("hueShiftSpeed"),
    palettePulse: document.getElementById("palettePulse"),
    projectName: document.getElementById("projectName"),
    exportFps: document.getElementById("exportFps"),
    exportResolution: document.getElementById("exportResolution"),
    exportBitrate: document.getElementById("exportBitrate"),
    presetSelect: document.getElementById("presetSelect"),
    savePresetBtn: document.getElementById("savePresetBtn"),
    loadPresetBtn: document.getElementById("loadPresetBtn"),
    deletePresetBtn: document.getElementById("deletePresetBtn"),
    downloadProjectBtn: document.getElementById("downloadProjectBtn"),
    loadProjectFile: document.getElementById("loadProjectFile"),
    exportVideoBtn: document.getElementById("exportVideoBtn"),
  },
};

const rangeValueDom = [
  "volume",
  "sensitivity",
  "smoothness",
  "rotationSpeed",
  "pulseStrength",
  "complexity",
  "deformAmount",
  "particleAmount",
  "bloomStrength",
  "trailDamp",
  "glitchAmount",
  "filmNoise",
  "cameraMotion",
  "hueShiftSpeed",
].reduce((acc, key) => {
  acc[key] = document.getElementById(`${key}Value`);
  return acc;
}, {});

const state = {
  projectName: "TheraViz Session",
  volume: 0.9,
  sensitivity: 1.35,
  smoothness: 0.65,
  rotationSpeed: 0.9,
  pulseStrength: 0.72,
  visualScene: "hybrid",
  shapeType: "icosahedron",
  visualMode: "aura",
  complexity: 3,
  deformAmount: 0.32,
  particleAmount: 1200,
  wireframe: false,
  bloomStrength: 0.55,
  trailDamp: 0.93,
  glitchAmount: 0.0004,
  filmNoise: 0.08,
  cameraMotion: 0.22,
  autoRotate: true,
  palettePreset: "neon-cyan",
  primaryColor: "#8ec4ff",
  secondaryColor: "#4f89d9",
  accentColor: "#c6dcff",
  backgroundColor: "#090b10",
  hueShiftSpeed: 0.15,
  palettePulse: true,
  exportFps: 30,
  exportResolution: "1920x1080",
  exportBitrate: 28,
};

const audioState = {
  context: null,
  analyser: null,
  sourceNode: null,
  gainNode: null,
  exportDestination: null,
  freqData: null,
  waveData: null,
  bpm: null,
  energy: 0,
  bass: 0,
  mid: 0,
  high: 0,
  smoothedEnergy: 0,
  beatPulse: 0,
  lastBeatAt: 0,
  rafMeterTick: 0,
  decodingContext: null,
  exporting: false,
  recorder: null,
  mediaUrl: null,
  loadedFileName: "",
};

const threeState = {
  renderer: null,
  scene: null,
  camera: null,
  composer: null,
  bloomPass: null,
  afterimagePass: null,
  rgbPass: null,
  filmPass: null,
  mainGroup: null,
  mesh: null,
  wireMesh: null,
  waveLine: null,
  waveLineSecondary: null,
  lightningGroup: null,
  barMesh: null,
  barLayout: null,
  scratchObject: new THREE.Object3D(),
  particles: null,
  basePositions: null,
  clock: new THREE.Clock(),
  frameCount: 0,
};

const spectrumCtx = dom.spectrum.getContext("2d");
let toastTimer = null;

init();

function init() {
  initTabs();
  initThree();
  bindControls();
  bindAudioEvents();
  refreshPresetOptions();
  syncUIFromState();
  animate();
}

function initTabs() {
  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      dom.tabs.forEach((t) => t.classList.remove("active"));
      dom.panels.forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.querySelector(`[data-panel=\"${tab.dataset.tab}\"]`);
      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

function initThree() {
  const renderer = new THREE.WebGLRenderer({
    canvas: dom.scene,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(state.backgroundColor);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 0, 8);

  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(new THREE.Color("#b7f2ff"), 1.35);
  key.position.set(4, 8, 8);
  scene.add(key);

  const fill = new THREE.DirectionalLight(new THREE.Color("#ffae89"), 0.9);
  fill.position.set(-6, -4, -8);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  threeState.renderer = renderer;
  threeState.scene = scene;
  threeState.camera = camera;
  threeState.mainGroup = group;

  rebuildCoreMesh();
  rebuildParticles();
  rebuildVisualSystems();
  setupComposer();

  updateSpectrumCanvasSize();
  window.addEventListener("resize", onResize);
}

function setupComposer() {
  const composer = new EffectComposer(threeState.renderer);
  composer.addPass(new RenderPass(threeState.scene, threeState.camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    state.bloomStrength,
    0.6,
    0.22,
  );
  composer.addPass(bloomPass);

  const afterimagePass = new AfterimagePass();
  afterimagePass.uniforms.damp.value = state.trailDamp;
  composer.addPass(afterimagePass);

  const rgbPass = new ShaderPass(RGBShiftShader);
  rgbPass.uniforms.amount.value = state.glitchAmount;
  composer.addPass(rgbPass);

  const filmPass = new FilmPass(state.filmNoise, 0.045, 648, false);
  composer.addPass(filmPass);

  threeState.composer = composer;
  threeState.bloomPass = bloomPass;
  threeState.afterimagePass = afterimagePass;
  threeState.rgbPass = rgbPass;
  threeState.filmPass = filmPass;
}

function onResize() {
  const { renderer, camera, composer, bloomPass } = threeState;
  if (!renderer || !camera || !composer) {
    return;
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);

  updateSpectrumCanvasSize();
}

function updateSpectrumCanvasSize() {
  dom.spectrum.width = Math.floor(window.innerWidth * Math.min(window.devicePixelRatio, 2));
  dom.spectrum.height = Math.floor(Math.max(130, window.innerHeight * 0.2) * Math.min(window.devicePixelRatio, 2));
  dom.spectrum.style.height = `${Math.max(130, window.innerHeight * 0.2)}px`;
}

function rebuildCoreMesh() {
  const group = threeState.mainGroup;
  if (!group) {
    return;
  }

  cleanupMesh(threeState.mesh);
  cleanupMesh(threeState.wireMesh);

  const geometry = createGeometry(state.shapeType, state.complexity);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(state.primaryColor),
    emissive: new THREE.Color(state.secondaryColor),
    emissiveIntensity: 0.45,
    roughness: state.visualMode === "solid" ? 0.36 : 0.28,
    metalness: state.visualMode === "solid" ? 0.2 : 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    iridescence: state.visualMode === "aura" ? 0.18 : 0.04,
    wireframe: state.wireframe,
    flatShading: state.visualMode === "fractal",
  });

  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  const basePositions = geometry.attributes.position.array.slice();

  let wireMesh = null;
  if (state.visualMode === "dual") {
    wireMesh = new THREE.Mesh(
      geometry.clone(),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(state.accentColor),
        wireframe: true,
        transparent: true,
        opacity: 0.38,
      }),
    );
    wireMesh.scale.setScalar(1.025);
    group.add(wireMesh);
  }

  threeState.mesh = mesh;
  threeState.wireMesh = wireMesh;
  threeState.basePositions = basePositions;

  applyVisualSceneVisibility();
  applyColorState();
}

function rebuildParticles() {
  const group = threeState.mainGroup;
  if (!group) {
    return;
  }

  cleanupMesh(threeState.particles);

  const count = Math.floor(state.particleAmount);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const radius = 3.2 + Math.random() * 8.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(state.accentColor),
    size: 0.04,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  group.add(points);
  threeState.particles = points;

  applyVisualSceneVisibility();
}

function rebuildVisualSystems() {
  const group = threeState.mainGroup;
  if (!group) {
    return;
  }

  cleanupObject3D(threeState.waveLine);
  cleanupObject3D(threeState.waveLineSecondary);
  cleanupObject3D(threeState.lightningGroup);
  cleanupObject3D(threeState.barMesh);

  threeState.waveLine = null;
  threeState.waveLineSecondary = null;
  threeState.lightningGroup = null;
  threeState.barMesh = null;
  threeState.barLayout = null;

  if (state.visualScene === "wavefield" || state.visualScene === "hybrid") {
    const count = 320;
    const positions = new Float32Array(count * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: new THREE.Color(state.primaryColor),
        transparent: true,
        opacity: 0.92,
      }),
    );
    line.position.z = -0.2;
    group.add(line);
    threeState.waveLine = line;

    const secondary = line.clone();
    secondary.geometry = geometry.clone();
    secondary.material = new THREE.LineBasicMaterial({
      color: new THREE.Color(state.accentColor),
      transparent: true,
      opacity: 0.38,
    });
    secondary.position.z = -1.15;
    secondary.scale.setScalar(1.02);
    group.add(secondary);
    threeState.waveLineSecondary = secondary;
  }

  if (state.visualScene === "lightning" || state.visualScene === "hybrid") {
    const lightningGroup = new THREE.Group();
    const boltCount = state.visualScene === "hybrid" ? 14 : 28;
    const pointsPerBolt = 16;

    for (let i = 0; i < boltCount; i += 1) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pointsPerBolt * 3), 3));
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(state.secondaryColor),
        transparent: true,
        opacity: state.visualScene === "hybrid" ? 0.35 : 0.8,
      });
      const line = new THREE.Line(geometry, material);
      line.userData.seed = i * 0.37 + Math.random() * 10;
      lightningGroup.add(line);
    }

    group.add(lightningGroup);
    threeState.lightningGroup = lightningGroup;
  }

  if (state.visualScene === "spectrum-grid" || state.visualScene === "hybrid") {
    const barCount = state.visualScene === "hybrid" ? 64 : 120;
    const barGeometry = new THREE.BoxGeometry(0.075, 1, 0.075);
    const barMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(state.accentColor),
      transparent: true,
      opacity: state.visualScene === "hybrid" ? 0.48 : 0.88,
    });
    const barMesh = new THREE.InstancedMesh(barGeometry, barMaterial, barCount);
    barMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const layout = [];
    const spread = state.visualScene === "hybrid" ? 7 : 11.5;
    const zDepth = state.visualScene === "hybrid" ? 2 : 4.5;

    for (let i = 0; i < barCount; i += 1) {
      const ratio = barCount <= 1 ? 0.5 : i / (barCount - 1);
      const x = -spread / 2 + ratio * spread;
      const z = state.visualScene === "hybrid" ? -0.8 : -2.1 - Math.sin(ratio * Math.PI) * zDepth;
      layout.push({ x, z, ratio });
    }

    barMesh.userData.baseY = state.visualScene === "hybrid" ? -2.4 : -2.55;
    barMesh.userData.baseHeight = state.visualScene === "hybrid" ? 0.12 : 0.08;
    group.add(barMesh);
    threeState.barMesh = barMesh;
    threeState.barLayout = layout;
  }

  applyVisualSceneVisibility();
}

function applyVisualSceneVisibility() {
  const sceneMode = state.visualScene;

  if (threeState.mesh) {
    threeState.mesh.visible = sceneMode !== "wavefield" && sceneMode !== "spectrum-grid";
    threeState.mesh.material.transparent = sceneMode === "lightning" || sceneMode === "hybrid";
    threeState.mesh.material.opacity = sceneMode === "lightning" ? 0.62 : sceneMode === "hybrid" ? 0.82 : 1;
  }

  if (threeState.wireMesh) {
    threeState.wireMesh.visible = sceneMode === "hybrid" || sceneMode === "lightning";
  }

  if (threeState.particles) {
    threeState.particles.visible = sceneMode !== "spectrum-grid";
  }
}

function cleanupMesh(object3D) {
  if (!object3D) {
    return;
  }

  if (object3D.parent) {
    object3D.parent.remove(object3D);
  }

  if (object3D.geometry) {
    object3D.geometry.dispose();
  }

  if (Array.isArray(object3D.material)) {
    object3D.material.forEach((material) => material.dispose());
  } else if (object3D.material) {
    object3D.material.dispose();
  }
}

function cleanupObject3D(object3D) {
  if (!object3D) {
    return;
  }

  if (object3D.children?.length) {
    object3D.children.slice().forEach((child) => cleanupObject3D(child));
  }

  cleanupMesh(object3D);
}

function createGeometry(shapeType, complexity) {
  const c = Math.max(1, Math.min(5, Math.round(complexity)));

  switch (shapeType) {
    case "torus":
      return new THREE.TorusGeometry(1.35, 0.42, 24 + c * 10, 90 + c * 18);
    case "torusKnot":
      return new THREE.TorusKnotGeometry(0.9, 0.26, 150 + c * 70, 14 + c * 6, 2 + c, 3 + c);
    case "sphere":
      return new THREE.SphereGeometry(1.35, 20 + c * 14, 18 + c * 12);
    case "capsule":
      return new THREE.CapsuleGeometry(0.92, 2.2, 8 + c * 4, 16 + c * 8);
    case "octahedron":
      return new THREE.OctahedronGeometry(1.65, c + 2);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(1.55, c + 1);
    case "box":
      return new THREE.BoxGeometry(2.2, 2.2, 2.2, 6 + c * 4, 6 + c * 4, 6 + c * 4);
    case "plane":
      return new THREE.PlaneGeometry(3.4, 3.4, 28 + c * 20, 28 + c * 20);
    case "helix":
      return createHelixGeometry(c);
    case "cone":
      return new THREE.ConeGeometry(1.3, 2.75, 10 + c * 14, 3 + c * 5);
    case "cylinder":
      return new THREE.CylinderGeometry(1.15, 1.15, 2.6, 10 + c * 12, 4 + c * 5, true);
    case "icosahedron":
    default:
      return new THREE.IcosahedronGeometry(1.55, c + 2);
  }
}

function createHelixGeometry(complexity) {
  const turns = 2.5 + complexity * 0.7;
  const height = 3.2 + complexity * 0.35;
  const radius = 0.7 + complexity * 0.1;

  class HelixCurve extends THREE.Curve {
    getPoint(t) {
      const angle = t * Math.PI * 2 * turns;
      const x = Math.cos(angle) * radius;
      const y = (t - 0.5) * height;
      const z = Math.sin(angle) * radius;
      return new THREE.Vector3(x, y, z);
    }
  }

  return new THREE.TubeGeometry(new HelixCurve(), 140 + complexity * 60, 0.24, 16 + complexity * 4, false);
}

function bindControls() {
  bindRangeControl("volume", (value) => `${Math.round(value * 100)}%`, (value) => {
    state.volume = value;
    if (audioState.gainNode) {
      audioState.gainNode.gain.value = value;
    }
  });

  bindRangeControl("sensitivity", (value) => value.toFixed(2), (value) => {
    state.sensitivity = value;
  });

  bindRangeControl("smoothness", (value) => value.toFixed(2), (value) => {
    state.smoothness = value;
    if (audioState.analyser) {
      audioState.analyser.smoothingTimeConstant = value;
    }
  });

  bindRangeControl("rotationSpeed", (value) => value.toFixed(2), (value) => {
    state.rotationSpeed = value;
  });

  bindRangeControl("pulseStrength", (value) => value.toFixed(2), (value) => {
    state.pulseStrength = value;
  });

  bindRangeControl("complexity", (value) => `${Math.round(value)}`, (value) => {
    state.complexity = Math.round(value);
    rebuildCoreMesh();
  });

  bindRangeControl("deformAmount", (value) => value.toFixed(2), (value) => {
    state.deformAmount = value;
  });

  bindRangeControl("particleAmount", (value) => `${Math.round(value)}`, (value) => {
    state.particleAmount = Math.round(value);
    rebuildParticles();
  });

  bindRangeControl("bloomStrength", (value) => value.toFixed(2), (value) => {
    state.bloomStrength = value;
    if (threeState.bloomPass) {
      threeState.bloomPass.strength = value;
    }
  });

  bindRangeControl("trailDamp", (value) => value.toFixed(3), (value) => {
    state.trailDamp = value;
    if (threeState.afterimagePass) {
      threeState.afterimagePass.uniforms.damp.value = value;
    }
  });

  bindRangeControl("glitchAmount", (value) => value.toFixed(4), (value) => {
    state.glitchAmount = value;
    if (threeState.rgbPass) {
      threeState.rgbPass.uniforms.amount.value = value;
    }
  });

  bindRangeControl("filmNoise", (value) => value.toFixed(2), (value) => {
    state.filmNoise = value;
    if (threeState.filmPass?.uniforms?.nIntensity) {
      threeState.filmPass.uniforms.nIntensity.value = value;
    }
  });

  bindRangeControl("cameraMotion", (value) => value.toFixed(2), (value) => {
    state.cameraMotion = value;
  });

  bindRangeControl("hueShiftSpeed", (value) => value.toFixed(2), (value) => {
    state.hueShiftSpeed = value;
  });

  bindSelectControl("visualScene", (value) => {
    state.visualScene = value;
    rebuildVisualSystems();
    applyVisualSceneVisibility();
  });

  bindSelectControl("shapeType", (value) => {
    state.shapeType = value;
    rebuildCoreMesh();
  });

  bindSelectControl("visualMode", (value) => {
    state.visualMode = value;
    rebuildCoreMesh();
  });

  bindCheckboxControl("wireframe", (checked) => {
    state.wireframe = checked;
    if (threeState.mesh?.material) {
      threeState.mesh.material.wireframe = checked;
    }
  });

  bindCheckboxControl("autoRotate", (checked) => {
    state.autoRotate = checked;
  });

  bindSelectControl("palettePreset", (value) => {
    state.palettePreset = value;
    const preset = palettes[value];
    if (!preset) {
      return;
    }

    state.primaryColor = preset.primaryColor;
    state.secondaryColor = preset.secondaryColor;
    state.accentColor = preset.accentColor;
    state.backgroundColor = preset.backgroundColor;
    syncUIFromState();
    applyColorState();
  });

  bindCheckboxControl("palettePulse", (checked) => {
    state.palettePulse = checked;
  });

  ["primaryColor", "secondaryColor", "accentColor", "backgroundColor"].forEach((key) => {
    dom.controls[key].addEventListener("input", (event) => {
      state[key] = event.target.value;
      applyColorState();
    });
  });

  dom.controls.projectName.addEventListener("input", (event) => {
    state.projectName = event.target.value.trim().slice(0, 48) || "TheraViz Session";
  });

  bindSelectControl("exportFps", (value) => {
    state.exportFps = Number(value);
  });

  bindSelectControl("exportResolution", (value) => {
    state.exportResolution = value;
  });

  bindSelectControl("exportBitrate", (value) => {
    state.exportBitrate = Number(value);
  });

  dom.randomizeBtn.addEventListener("click", randomizeScene);

  dom.playPause.addEventListener("click", async () => {
    if (!dom.audioElement.src) {
      showToast("Carica prima una traccia audio.");
      return;
    }

    await ensureAudioContext();

    if (dom.audioElement.paused) {
      await dom.audioElement.play();
      setPlaybackUI(true);
    } else {
      dom.audioElement.pause();
      setPlaybackUI(false);
    }
  });

  dom.stopBtn.addEventListener("click", () => {
    stopPlayback();
  });

  dom.seekBar.addEventListener("input", (event) => {
    if (!dom.audioElement.duration) {
      return;
    }

    const ratio = Number(event.target.value) / 1000;
    dom.audioElement.currentTime = ratio * dom.audioElement.duration;
    updateTimeReadout();
  });

  dom.audioFile.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    await loadAudioFile(file);
  });

  dom.controls.savePresetBtn.addEventListener("click", saveCurrentPreset);
  dom.controls.loadPresetBtn.addEventListener("click", loadSelectedPreset);
  dom.controls.deletePresetBtn.addEventListener("click", deleteSelectedPreset);
  dom.controls.downloadProjectBtn.addEventListener("click", downloadProjectJson);
  dom.controls.loadProjectFile.addEventListener("change", importProjectJson);
  dom.controls.exportVideoBtn.addEventListener("click", exportVideo);
}

function bindRangeControl(key, formatter, onChange) {
  const input = dom.controls[key];
  const valueDom = rangeValueDom[key];
  if (!input) {
    return;
  }

  const update = () => {
    const value = Number(input.value);
    if (valueDom) {
      valueDom.textContent = formatter(value);
    }
    onChange(value);
  };

  input.addEventListener("input", update);
  update();
}

function bindSelectControl(key, onChange) {
  const input = dom.controls[key];
  if (!input) {
    return;
  }

  input.addEventListener("change", () => {
    onChange(input.value);
  });
}

function bindCheckboxControl(key, onChange) {
  const input = dom.controls[key];
  if (!input) {
    return;
  }

  input.addEventListener("change", () => {
    onChange(input.checked);
  });
}

function bindAudioEvents() {
  dom.audioElement.addEventListener("timeupdate", () => {
    if (!dom.audioElement.duration || !Number.isFinite(dom.audioElement.duration)) {
      return;
    }

    const ratio = dom.audioElement.currentTime / dom.audioElement.duration;
    dom.seekBar.value = `${Math.round(ratio * 1000)}`;
    updateTimeReadout();
  });

  dom.audioElement.addEventListener("ended", () => {
    if (!audioState.exporting) {
      setPlaybackUI(false);
      dom.seekBar.value = "0";
      updateTimeReadout();
    }
  });

  dom.audioElement.addEventListener("loadedmetadata", () => {
    dom.seekBar.disabled = false;
    updateTimeReadout();
  });
}

async function ensureAudioContext() {
  if (!audioState.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioState.context = new AudioContextClass();
    audioState.sourceNode = audioState.context.createMediaElementSource(dom.audioElement);
    audioState.analyser = audioState.context.createAnalyser();
    audioState.gainNode = audioState.context.createGain();
    audioState.exportDestination = audioState.context.createMediaStreamDestination();

    audioState.analyser.fftSize = 2048;
    audioState.analyser.smoothingTimeConstant = state.smoothness;

    audioState.sourceNode.connect(audioState.analyser);
    audioState.analyser.connect(audioState.gainNode);
    audioState.gainNode.connect(audioState.context.destination);
    audioState.gainNode.connect(audioState.exportDestination);
    audioState.gainNode.gain.value = state.volume;

    audioState.freqData = new Uint8Array(audioState.analyser.frequencyBinCount);
    audioState.waveData = new Uint8Array(audioState.analyser.fftSize);
  }

  if (audioState.context.state === "suspended") {
    await audioState.context.resume();
  }
}

async function loadAudioFile(file) {
  try {
    stopPlayback();

    if (audioState.mediaUrl) {
      URL.revokeObjectURL(audioState.mediaUrl);
    }

    audioState.mediaUrl = URL.createObjectURL(file);
    audioState.loadedFileName = file.name;

    dom.audioElement.src = audioState.mediaUrl;
    dom.audioElement.load();

    dom.trackInfo.textContent = file.name;
    dom.playPause.disabled = false;
    dom.stopBtn.disabled = false;

    await estimateBpmFromFile(file);
    showToast("Traccia caricata. Visual pronte in sync.");
  } catch (error) {
    console.error(error);
    showToast("Errore durante il caricamento audio.");
  }
}

async function estimateBpmFromFile(file) {
  if (!audioState.decodingContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioState.decodingContext = new AudioContextClass();
  }

  const arrayBuffer = await file.arrayBuffer();
  const decoded = await audioState.decodingContext.decodeAudioData(arrayBuffer.slice(0));

  const bpm = detectBpm(decoded);
  audioState.bpm = bpm;

  dom.bpmReadout.textContent = bpm ? `${bpm}` : "--";
}

function detectBpm(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const blockSize = 1024;
  const energies = [];

  for (let i = 0; i < channelData.length; i += blockSize) {
    let sum = 0;
    const stop = Math.min(i + blockSize, channelData.length);

    for (let j = i; j < stop; j += 1) {
      sum += Math.abs(channelData[j]);
    }

    energies.push(sum / (stop - i));
  }

  const avgEnergy = energies.reduce((acc, value) => acc + value, 0) / energies.length;
  const threshold = avgEnergy * 1.45;
  const peakSamples = [];

  for (let i = 1; i < energies.length - 1; i += 1) {
    if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] >= energies[i + 1]) {
      peakSamples.push(i * blockSize);
    }
  }

  if (peakSamples.length < 4) {
    return null;
  }

  const buckets = new Map();

  for (let i = 0; i < peakSamples.length; i += 1) {
    for (let j = 1; j <= 8; j += 1) {
      if (!peakSamples[i + j]) {
        break;
      }

      const interval = peakSamples[i + j] - peakSamples[i];
      if (interval <= 0) {
        continue;
      }

      let bpm = (60 * sampleRate) / interval;
      while (bpm < 80) {
        bpm *= 2;
      }
      while (bpm > 180) {
        bpm /= 2;
      }

      const rounded = Math.round(bpm);
      buckets.set(rounded, (buckets.get(rounded) || 0) + 1);
    }
  }

  let best = null;
  let bestWeight = -1;
  for (const [bpm, weight] of buckets.entries()) {
    if (weight > bestWeight) {
      bestWeight = weight;
      best = bpm;
    }
  }

  return best;
}

function stopPlayback() {
  dom.audioElement.pause();
  dom.audioElement.currentTime = 0;
  dom.seekBar.value = "0";
  setPlaybackUI(false);
  updateTimeReadout();
}

function setPlaybackUI(playing) {
  dom.playPause.textContent = playing ? "PAUSE" : "PLAY";
}

function updateTimeReadout() {
  const current = Number.isFinite(dom.audioElement.currentTime) ? dom.audioElement.currentTime : 0;
  const duration = Number.isFinite(dom.audioElement.duration) ? dom.audioElement.duration : 0;
  dom.timeReadout.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

function formatTime(seconds) {
  const sec = Math.max(0, Math.floor(seconds || 0));
  const min = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const rem = (sec % 60).toString().padStart(2, "0");
  return `${min}:${rem}`;
}

function animate() {
  requestAnimationFrame(animate);

  if (!threeState.mesh || !threeState.composer) {
    return;
  }

  const t = threeState.clock.getElapsedTime();
  updateAudioAnalysis();

  const reactiveEnergy = getReactiveEnergy(t);

  updateGeometry(t, reactiveEnergy);
  updateCamera(t, reactiveEnergy);
  updateParticles(t, reactiveEnergy);
  updateVisualSystems(t, reactiveEnergy);
  updateMaterialColor(t, reactiveEnergy);
  drawSpectrum();

  threeState.composer.render();
}

function updateAudioAnalysis() {
  if (!audioState.analyser || !audioState.freqData || !audioState.waveData) {
    audioState.energy = 0;
    audioState.bass = 0;
    audioState.mid = 0;
    audioState.high = 0;
    return;
  }

  audioState.analyser.getByteFrequencyData(audioState.freqData);
  audioState.analyser.getByteTimeDomainData(audioState.waveData);

  const bass = averageRange(audioState.freqData, 0, 24) / 255;
  const mid = averageRange(audioState.freqData, 24, 140) / 255;
  const high = averageRange(audioState.freqData, 140, audioState.freqData.length) / 255;

  const weightedEnergy = bass * 0.52 + mid * 0.33 + high * 0.15;

  audioState.bass = bass;
  audioState.mid = mid;
  audioState.high = high;
  audioState.energy = weightedEnergy;
  audioState.smoothedEnergy = THREE.MathUtils.lerp(audioState.smoothedEnergy, weightedEnergy, 1 - state.smoothness * 0.85);

  const now = performance.now();
  const beatThreshold = 0.2 + audioState.smoothedEnergy * 0.32;
  if (weightedEnergy > beatThreshold && now - audioState.lastBeatAt > 220) {
    audioState.lastBeatAt = now;
    audioState.beatPulse = 1;
  }
  audioState.beatPulse *= 0.9;

  audioState.rafMeterTick += 1;
  if (audioState.rafMeterTick % 6 === 0) {
    dom.energyReadout.textContent = `${Math.round(audioState.smoothedEnergy * 100)}%`;
    dom.focusReadout.textContent = audioState.bass > audioState.mid ? "Bass" : audioState.high > audioState.mid ? "High" : "Mid";
  }
}

function averageRange(array, start, end) {
  const safeStart = Math.max(0, start);
  const safeEnd = Math.max(safeStart + 1, Math.min(array.length, end));
  let sum = 0;

  for (let i = safeStart; i < safeEnd; i += 1) {
    sum += array[i];
  }

  return sum / (safeEnd - safeStart);
}

function getReactiveEnergy(time) {
  if (!dom.audioElement.src || dom.audioElement.paused) {
    return 0.06 + Math.sin(time * 1.3) * 0.02;
  }

  return THREE.MathUtils.clamp(
    audioState.smoothedEnergy * state.sensitivity + audioState.beatPulse * state.pulseStrength,
    0,
    2.2,
  );
}

function updateGeometry(time, reactiveEnergy) {
  const { mesh, wireMesh, basePositions } = threeState;
  if (!mesh || !basePositions) {
    return;
  }

  const spin = 0.003 + state.rotationSpeed * 0.01 + reactiveEnergy * 0.014;

  if (state.autoRotate) {
    threeState.mainGroup.rotation.y += spin;
    threeState.mainGroup.rotation.x += spin * 0.45;
  }

  if (!mesh.visible) {
    return;
  }

  const scale = 1 + reactiveEnergy * 0.34;
  mesh.scale.setScalar(scale);

  if (wireMesh) {
    wireMesh.rotation.x -= spin * 0.64;
    wireMesh.rotation.z += spin * 0.38;
    wireMesh.scale.setScalar(scale * 1.04);
  }

  const position = mesh.geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    const idx = i * 3;
    const x = basePositions[idx];
    const y = basePositions[idx + 1];
    const z = basePositions[idx + 2];

    const waveA = Math.sin((x + time * 0.65) * 3.2) * Math.cos((y - time * 0.42) * 2.8);
    const waveB = Math.cos((z - time * 0.48) * 3.4) * Math.sin((x + time * 0.27) * 2.9);

    const warp = 1 + (waveA + waveB) * 0.5 * state.deformAmount * (0.25 + reactiveEnergy * 0.8);

    position.array[idx] = x * warp;
    position.array[idx + 1] = y * warp;
    position.array[idx + 2] = z * warp;
  }

  position.needsUpdate = true;

  threeState.frameCount += 1;
  if (threeState.frameCount % 4 === 0) {
    mesh.geometry.computeVertexNormals();
  }
}

function updateCamera(time, reactiveEnergy) {
  const radius = 7.1 + reactiveEnergy * (2.3 * state.cameraMotion);
  const orbitX = Math.sin(time * (0.18 + state.cameraMotion * 0.23)) * 0.9;
  const orbitY = Math.cos(time * (0.14 + state.cameraMotion * 0.19)) * 0.7;

  threeState.camera.position.x = orbitX;
  threeState.camera.position.y = orbitY;
  threeState.camera.position.z = radius;
  threeState.camera.lookAt(0, 0, 0);
}

function updateParticles(time, reactiveEnergy) {
  if (!threeState.particles) {
    return;
  }

  const speedFactor = state.visualScene === "spectrum-grid" ? 0.03 : 1;
  threeState.particles.rotation.y = time * (0.06 + state.rotationSpeed * 0.07) * speedFactor;
  threeState.particles.rotation.x = time * 0.03 * speedFactor;

  const scale = 1 + reactiveEnergy * (state.visualScene === "hybrid" ? 0.14 : 0.2);
  threeState.particles.scale.setScalar(scale);

  if (threeState.particles.material) {
    const baseOpacity = state.visualScene === "hybrid" ? 0.2 : 0.42;
    const maxOpacity = state.visualScene === "hybrid" ? 0.62 : 1;
    threeState.particles.material.opacity = THREE.MathUtils.clamp(baseOpacity + reactiveEnergy * 0.32, 0.15, maxOpacity);
    threeState.particles.material.size = 0.02 + reactiveEnergy * 0.03;
  }
}

function updateVisualSystems(time, reactiveEnergy) {
  updateWaveField(time, reactiveEnergy);
  updateLightning(time, reactiveEnergy);
  updateSpectrumColumns(time, reactiveEnergy);
}

function updateWaveField(time, reactiveEnergy) {
  if (!threeState.waveLine) {
    return;
  }

  const applyWave = (line, secondary = false) => {
    const positions = line.geometry.attributes.position.array;
    const count = line.geometry.attributes.position.count;
    const waveScale = (secondary ? 1.6 : 2.2) * (0.45 + reactiveEnergy * 0.65);
    const zBase = secondary ? -0.95 : -0.1;
    const drift = secondary ? 0.68 : 0.94;

    for (let i = 0; i < count; i += 1) {
      const ratio = count <= 1 ? 0.5 : i / (count - 1);
      const x = (ratio - 0.5) * 11.8;
      const waveIndex = Math.floor(ratio * (audioState.waveData ? audioState.waveData.length - 1 : 0));
      const sample = audioState.waveData ? audioState.waveData[waveIndex] / 255 - 0.5 : Math.sin(time * 0.9 + ratio * 15) * 0.15;
      const y = sample * waveScale + Math.sin(ratio * 20 + time * drift) * 0.04;
      const z = zBase + Math.sin(ratio * 8 + time * 0.75) * (secondary ? 0.24 : 0.12);

      const idx = i * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
    }

    line.geometry.attributes.position.needsUpdate = true;
  };

  applyWave(threeState.waveLine, false);
  if (threeState.waveLineSecondary) {
    applyWave(threeState.waveLineSecondary, true);
  }

  threeState.waveLine.rotation.y = Math.sin(time * 0.18) * 0.05;
  threeState.waveLine.rotation.x = Math.sin(time * 0.14) * 0.02;
  if (threeState.waveLineSecondary) {
    threeState.waveLineSecondary.rotation.y = -Math.sin(time * 0.16) * 0.08;
  }
}

function updateLightning(time, reactiveEnergy) {
  if (!threeState.lightningGroup) {
    return;
  }

  const intensity = 0.25 + reactiveEnergy * 1.25;
  const radius = state.visualScene === "hybrid" ? 3.2 : 4.6;

  threeState.lightningGroup.children.forEach((line, i) => {
    const positions = line.geometry.attributes.position.array;
    const count = line.geometry.attributes.position.count;
    const seed = line.userData.seed || 0;
    const baseAngle = (i / Math.max(1, threeState.lightningGroup.children.length)) * Math.PI * 2 + time * 0.11;

    for (let j = 0; j < count; j += 1) {
      const t = count <= 1 ? 0 : j / (count - 1);
      const jitter = Math.sin(seed + t * 18 + time * (5.4 + reactiveEnergy * 2.1));
      const jitter2 = Math.cos(seed * 1.2 + t * 14 - time * (4.2 + reactiveEnergy));
      const branch = radius * t;
      const angle = baseAngle + jitter * 0.2 * intensity;

      const x = Math.cos(angle) * branch + jitter2 * 0.2 * (1 - t) * intensity;
      const y = (t - 0.5) * (1.6 + intensity * 1.8) + jitter * 0.14 * intensity;
      const z = Math.sin(angle) * branch + jitter * 0.22 * (1 - t) * intensity;
      const idx = j * 3;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
    }

    line.geometry.attributes.position.needsUpdate = true;
    line.material.opacity = state.visualScene === "hybrid" ? 0.14 + reactiveEnergy * 0.22 : 0.35 + reactiveEnergy * 0.5;
  });
}

function updateSpectrumColumns(time, reactiveEnergy) {
  if (!threeState.barMesh || !threeState.barLayout) {
    return;
  }

  const bars = threeState.barMesh;
  const dummy = threeState.scratchObject;
  const count = bars.count;
  const baseY = bars.userData.baseY || -2.3;
  const baseHeight = bars.userData.baseHeight || 0.1;
  const fft = audioState.freqData;

  for (let i = 0; i < count; i += 1) {
    const layout = threeState.barLayout[i];
    const ratio = layout.ratio;
    const sampleIndex = fft ? Math.floor(ratio * (fft.length - 1)) : 0;
    const amplitude = fft ? fft[sampleIndex] / 255 : 0.15 + 0.15 * Math.sin(time * 2 + ratio * 25);
    const height = baseHeight + amplitude * (state.visualScene === "hybrid" ? 1.8 : 3.6) * (0.7 + reactiveEnergy * 0.55);

    dummy.position.set(layout.x, baseY + height / 2, layout.z);
    dummy.scale.set(1, height, 1);
    dummy.rotation.y = ratio * 0.4;
    dummy.updateMatrix();
    bars.setMatrixAt(i, dummy.matrix);
  }

  bars.instanceMatrix.needsUpdate = true;
  bars.rotation.y = Math.sin(time * 0.12) * 0.12;
  bars.material.opacity = state.visualScene === "hybrid" ? 0.24 + reactiveEnergy * 0.24 : 0.35 + reactiveEnergy * 0.36;
}

function updateMaterialColor(time, reactiveEnergy) {
  const mesh = threeState.mesh;
  if (!mesh) {
    return;
  }

  const primary = new THREE.Color(state.primaryColor);
  const secondary = new THREE.Color(state.secondaryColor);
  const accent = new THREE.Color(state.accentColor);

  if (state.palettePulse) {
    const drift = Math.sin(time * (0.3 + state.hueShiftSpeed * 2.1)) * 0.05;
    primary.offsetHSL(drift, 0, 0);
    secondary.offsetHSL(-drift * 0.7, 0, 0);
    accent.offsetHSL(drift * 0.45, 0, 0);
  }

  mesh.material.color.copy(primary);
  mesh.material.emissive.copy(secondary);
  mesh.material.emissiveIntensity = 0.45 + reactiveEnergy * 0.65;

  if (threeState.wireMesh) {
    threeState.wireMesh.material.color.copy(accent);
    threeState.wireMesh.material.opacity = 0.18 + reactiveEnergy * 0.26;
  }

  if (threeState.particles) {
    threeState.particles.material.color.copy(accent);
  }

  if (threeState.waveLine?.material) {
    threeState.waveLine.material.color.copy(primary);
    threeState.waveLine.material.opacity = 0.35 + reactiveEnergy * 0.48;
  }

  if (threeState.waveLineSecondary?.material) {
    threeState.waveLineSecondary.material.color.copy(accent);
  }

  if (threeState.lightningGroup) {
    threeState.lightningGroup.children.forEach((line) => {
      line.material.color.copy(secondary);
    });
  }

  if (threeState.barMesh?.material) {
    threeState.barMesh.material.color.copy(accent);
  }

  if (threeState.scene) {
    const bg = new THREE.Color(state.backgroundColor);
    if (state.palettePulse) {
      bg.offsetHSL(Math.sin(time * 0.18 + reactiveEnergy) * 0.008, 0, 0);
    }
    threeState.scene.background = bg;
  }
}

function drawSpectrum() {
  if (!spectrumCtx) {
    return;
  }

  const width = dom.spectrum.width;
  const height = dom.spectrum.height;

  spectrumCtx.clearRect(0, 0, width, height);

  if (!audioState.freqData) {
    return;
  }

  const mode = state.visualScene;
  const bars = mode === "spectrum-grid" ? 180 : mode === "wavefield" ? 80 : 120;
  const step = Math.max(1, Math.floor(audioState.freqData.length / bars));
  const barWidth = width / bars;
  const maxHeight = mode === "spectrum-grid" ? height : height * 0.72;
  const opacity = mode === "sculpt" ? 0.18 : mode === "hybrid" ? 0.3 : 0.4;

  spectrumCtx.fillStyle = "rgba(8, 12, 20, 0.02)";
  spectrumCtx.fillRect(0, 0, width, height);

  spectrumCtx.strokeStyle = `rgba(203, 220, 250, ${opacity * 0.5})`;
  spectrumCtx.lineWidth = 1;
  spectrumCtx.beginPath();
  spectrumCtx.moveTo(0, height - 1);
  spectrumCtx.lineTo(width, height - 1);
  spectrumCtx.stroke();

  for (let i = 0; i < bars; i += 1) {
    const value = audioState.freqData[i * step] / 255;
    const barHeight = value * maxHeight;
    const glow = value * 0.35 + opacity;

    spectrumCtx.fillStyle = `rgba(168, 198, 244, ${glow})`;
    spectrumCtx.fillRect(i * barWidth, height - barHeight, Math.max(1, barWidth - 1.5), barHeight);
  }
}

function applyColorState() {
  if (!threeState.mesh) {
    return;
  }

  if (threeState.scene) {
    threeState.scene.background = new THREE.Color(state.backgroundColor);
  }

  threeState.mesh.material.color = new THREE.Color(state.primaryColor);
  threeState.mesh.material.emissive = new THREE.Color(state.secondaryColor);

  if (threeState.particles?.material) {
    threeState.particles.material.color = new THREE.Color(state.accentColor);
  }

  if (threeState.wireMesh?.material) {
    threeState.wireMesh.material.color = new THREE.Color(state.accentColor);
  }

  if (threeState.waveLine?.material) {
    threeState.waveLine.material.color = new THREE.Color(state.primaryColor);
  }

  if (threeState.waveLineSecondary?.material) {
    threeState.waveLineSecondary.material.color = new THREE.Color(state.accentColor);
  }

  if (threeState.lightningGroup) {
    threeState.lightningGroup.children.forEach((line) => {
      line.material.color = new THREE.Color(state.secondaryColor);
    });
  }

  if (threeState.barMesh?.material) {
    threeState.barMesh.material.color = new THREE.Color(state.accentColor);
  }
}

function randomizeScene() {
  const shapeOptions = [
    "icosahedron",
    "torus",
    "torusKnot",
    "sphere",
    "capsule",
    "octahedron",
    "dodecahedron",
    "box",
    "plane",
    "helix",
    "cone",
    "cylinder",
  ];
  const modeOptions = ["aura", "solid", "dual", "fractal"];
  const sceneOptions = ["sculpt", "wavefield", "lightning", "spectrum-grid", "hybrid"];
  const paletteKeys = Object.keys(palettes);

  state.shapeType = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
  state.visualMode = modeOptions[Math.floor(Math.random() * modeOptions.length)];
  state.visualScene = sceneOptions[Math.floor(Math.random() * sceneOptions.length)];
  state.complexity = randomInt(1, 5);
  state.deformAmount = randomFloat(0.15, 1.2);
  state.rotationSpeed = randomFloat(0.4, 2.1);
  state.pulseStrength = randomFloat(0.5, 1.8);
  state.sensitivity = randomFloat(0.75, 2.3);
  state.bloomStrength = randomFloat(0.15, 1.8);
  state.glitchAmount = randomFloat(0, 0.006);
  state.trailDamp = randomFloat(0.74, 0.96);
  state.filmNoise = randomFloat(0.03, 0.34);
  state.cameraMotion = randomFloat(0.05, 0.95);
  state.particleAmount = randomInt(600, 3000);
  state.hueShiftSpeed = randomFloat(0, 0.9);
  state.wireframe = Math.random() > 0.62;
  state.palettePulse = Math.random() > 0.4;

  state.palettePreset = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
  Object.assign(state, palettes[state.palettePreset]);

  rebuildCoreMesh();
  rebuildParticles();
  rebuildVisualSystems();
  syncUIFromState();

  if (threeState.bloomPass) {
    threeState.bloomPass.strength = state.bloomStrength;
  }
  if (threeState.afterimagePass) {
    threeState.afterimagePass.uniforms.damp.value = state.trailDamp;
  }
  if (threeState.rgbPass) {
    threeState.rgbPass.uniforms.amount.value = state.glitchAmount;
  }
  if (threeState.filmPass?.uniforms?.nIntensity) {
    threeState.filmPass.uniforms.nIntensity.value = state.filmNoise;
  }

  showToast("Preset random generato.");
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomFloat(min, max + 1));
}

function syncUIFromState() {
  Object.entries(dom.controls).forEach(([key, element]) => {
    if (!(key in state) || !element) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      if (element.type === "checkbox") {
        element.checked = Boolean(state[key]);
      } else {
        element.value = `${state[key]}`;
      }
    } else if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      element.value = `${state[key]}`;
    }
  });

  updateRangeDisplays();
}

function updateRangeDisplays() {
  for (const [key, valueDom] of Object.entries(rangeValueDom)) {
    const input = dom.controls[key];
    if (!input || !valueDom) {
      continue;
    }

    const value = Number(input.value);
    switch (key) {
      case "volume":
        valueDom.textContent = `${Math.round(value * 100)}%`;
        break;
      case "complexity":
      case "particleAmount":
        valueDom.textContent = `${Math.round(value)}`;
        break;
      case "trailDamp":
        valueDom.textContent = value.toFixed(3);
        break;
      case "glitchAmount":
        valueDom.textContent = value.toFixed(4);
        break;
      default:
        valueDom.textContent = value.toFixed(2);
        break;
    }
  }
}

function saveCurrentPreset() {
  const name = (state.projectName || "Preset").trim();
  const presets = getPresets();
  const normalized = sanitizeName(name);

  const existingIndex = presets.findIndex((entry) => sanitizeName(entry.name) === normalized);
  const entry = {
    name,
    state: createProjectSnapshot().state,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    presets[existingIndex] = entry;
  } else {
    presets.push(entry);
  }

  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  refreshPresetOptions(name);
  showToast(`Preset \"${name}\" salvato.`);
}

function loadSelectedPreset() {
  const selectedName = dom.controls.presetSelect.value;
  if (!selectedName) {
    showToast("Nessun preset selezionato.");
    return;
  }

  const preset = getPresets().find((item) => item.name === selectedName);
  if (!preset) {
    showToast("Preset non trovato.");
    return;
  }

  applyProjectState(preset.state);
  showToast(`Preset \"${selectedName}\" caricato.`);
}

function deleteSelectedPreset() {
  const selectedName = dom.controls.presetSelect.value;
  if (!selectedName) {
    return;
  }

  const presets = getPresets().filter((item) => item.name !== selectedName);
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  refreshPresetOptions();
  showToast(`Preset \"${selectedName}\" eliminato.`);
}

function getPresets() {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function refreshPresetOptions(selectedName = "") {
  const presets = getPresets();
  const select = dom.controls.presetSelect;

  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = presets.length ? "Select a preset" : "No presets yet";
  select.appendChild(placeholder);

  presets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.name;
    option.textContent = preset.name;
    select.appendChild(option);
  });

  if (selectedName) {
    select.value = selectedName;
  }
}

function createProjectSnapshot() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    state: { ...state },
    metadata: {
      bpm: audioState.bpm,
      sourceTrack: audioState.loadedFileName || null,
    },
  };
}

function applyProjectState(incomingState) {
  if (!incomingState || typeof incomingState !== "object") {
    return;
  }

  const previous = {
    visualScene: state.visualScene,
    shapeType: state.shapeType,
    complexity: state.complexity,
    visualMode: state.visualMode,
    particleAmount: state.particleAmount,
  };

  Object.keys(state).forEach((key) => {
    if (key in incomingState) {
      state[key] = incomingState[key];
    }
  });

  syncUIFromState();

  const needsCoreRebuild =
    previous.shapeType !== state.shapeType ||
    previous.complexity !== state.complexity ||
    previous.visualMode !== state.visualMode;

  if (needsCoreRebuild) {
    rebuildCoreMesh();
  }

  if (previous.particleAmount !== state.particleAmount) {
    rebuildParticles();
  }

  if (previous.visualScene !== state.visualScene) {
    rebuildVisualSystems();
  }

  if (threeState.bloomPass) {
    threeState.bloomPass.strength = state.bloomStrength;
  }
  if (threeState.afterimagePass) {
    threeState.afterimagePass.uniforms.damp.value = state.trailDamp;
  }
  if (threeState.rgbPass) {
    threeState.rgbPass.uniforms.amount.value = state.glitchAmount;
  }
  if (threeState.filmPass?.uniforms?.nIntensity) {
    threeState.filmPass.uniforms.nIntensity.value = state.filmNoise;
  }

  if (audioState.gainNode) {
    audioState.gainNode.gain.value = state.volume;
  }
  if (audioState.analyser) {
    audioState.analyser.smoothingTimeConstant = state.smoothness;
  }
  if (threeState.mesh?.material) {
    threeState.mesh.material.wireframe = Boolean(state.wireframe);
  }

  applyColorState();
}

function downloadProjectJson() {
  const snapshot = createProjectSnapshot();
  const filename = `${sanitizeFilename(state.projectName)}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
  showToast("Project JSON esportato.");
}

async function importProjectJson(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const candidateState = parsed?.state || parsed;

    applyProjectState(candidateState);
    showToast("Project JSON importato.");
  } catch {
    showToast("JSON non valido.");
  } finally {
    dom.controls.loadProjectFile.value = "";
  }
}

async function exportVideo() {
  if (audioState.exporting) {
    return;
  }

  if (!dom.audioElement.src) {
    showToast("Carica una traccia audio prima dell'export.");
    return;
  }

  const { width: exportWidth, height: exportHeight } = parseResolution(state.exportResolution);
  let viewportSnapshot = null;
  let tracks = [];
  let endedHandler = null;

  try {
    await ensureAudioContext();

    audioState.exporting = true;
    dom.controls.exportVideoBtn.disabled = true;
    dom.controls.exportVideoBtn.textContent = "Exporting...";
    dom.exportStatus.textContent = `Export in corso: ${exportWidth}x${exportHeight} @ ${state.exportFps}fps`;

    dom.audioElement.pause();
    dom.audioElement.currentTime = 0;

    viewportSnapshot = setExportViewport(exportWidth, exportHeight);
    await waitForAnimationFrame();

    const canvasStream = dom.scene.captureStream(state.exportFps);
    const audioTracks = audioState.exportDestination?.stream?.getAudioTracks?.() || [];
    tracks = [...canvasStream.getVideoTracks(), ...audioTracks];

    if (!audioTracks.length) {
      throw new Error("Traccia audio non disponibile per export");
    }

    if (!tracks.length) {
      throw new Error("Nessuna traccia disponibile per export");
    }

    const mixedStream = new MediaStream(tracks);
    const mimeType = pickMimeType();

    const recorderConfig = {
      videoBitsPerSecond: state.exportBitrate * 1_000_000,
      audioBitsPerSecond: 192_000,
    };

    if (mimeType) {
      recorderConfig.mimeType = mimeType;
    }

    const recorder = new MediaRecorder(mixedStream, recorderConfig);
    const chunks = [];
    const fallbackMime = mimeType || "video/webm";

    audioState.recorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data?.size) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error(event.error);
      showToast("Errore durante la registrazione video.");
    };

    recorder.onstop = () => {
      const resolvedMimeType = recorder.mimeType || fallbackMime;
      const extension = resolvedMimeType.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: resolvedMimeType });
      const filename = `${sanitizeFilename(state.projectName)}-${Date.now()}.${extension}`;
      downloadBlob(blob, filename);

      tracks.forEach((track) => track.stop());
      tracks = [];
      restoreViewport(viewportSnapshot);

      dom.exportStatus.textContent = `Export completato: ${exportWidth}x${exportHeight} (${extension.toUpperCase()})`;
      dom.controls.exportVideoBtn.disabled = false;
      dom.controls.exportVideoBtn.textContent = "Export Video";
      audioState.exporting = false;
      audioState.recorder = null;
      setPlaybackUI(false);

      showToast("Video renderizzato e scaricato.");
    };

    recorder.start(350);

    endedHandler = () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      dom.audioElement.removeEventListener("ended", endedHandler);
      endedHandler = null;
    };

    dom.audioElement.addEventListener("ended", endedHandler);

    await dom.audioElement.play();
    setPlaybackUI(true);
  } catch (error) {
    console.error(error);
    if (endedHandler) {
      dom.audioElement.removeEventListener("ended", endedHandler);
    }
    tracks.forEach((track) => track.stop());
    restoreViewport(viewportSnapshot);
    dom.exportStatus.textContent = "Export fallito.";
    dom.controls.exportVideoBtn.disabled = false;
    dom.controls.exportVideoBtn.textContent = "Export Video";
    audioState.exporting = false;
    audioState.recorder = null;
    showToast("Impossibile esportare il video.");
  }
}

function pickMimeType() {
  const options = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return options.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function parseResolution(value) {
  const match = /^(\d+)x(\d+)$/i.exec(value || "");
  if (!match) {
    return { width: 1920, height: 1080 };
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

function setExportViewport(width, height) {
  const { renderer, camera, composer, bloomPass } = threeState;
  if (!renderer || !camera || !composer || !bloomPass) {
    return null;
  }

  const size = renderer.getSize(new THREE.Vector2());
  const snapshot = {
    width: size.x,
    height: size.y,
    pixelRatio: renderer.getPixelRatio(),
    cameraAspect: camera.aspect,
  };

  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  return snapshot;
}

function restoreViewport(snapshot) {
  if (!snapshot) {
    return;
  }

  const { renderer, camera, composer, bloomPass } = threeState;
  if (!renderer || !camera || !composer || !bloomPass) {
    return;
  }

  renderer.setPixelRatio(snapshot.pixelRatio);
  renderer.setSize(snapshot.width, snapshot.height, false);
  composer.setSize(snapshot.width, snapshot.height);
  bloomPass.setSize(snapshot.width, snapshot.height);
  camera.aspect = snapshot.cameraAspect;
  camera.updateProjectionMatrix();
  updateSpectrumCanvasSize();
}

function waitForAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
}

function sanitizeFilename(value) {
  return sanitizeName(value).replace(/[^a-z0-9_-]+/gi, "-") || "visual-project";
}

function sanitizeName(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("show");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    dom.toast.classList.remove("show");
  }, 2600);
}
