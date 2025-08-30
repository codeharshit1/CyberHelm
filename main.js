import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  40, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  100
);
camera.position.set(0, 1, 3.5);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;

// Postprocessing composer
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Bloom pass
// const bloomPass = new UnrealBloomPass(
//   new THREE.Vector2(window.innerWidth, window.innerHeight),
//   0.5,   // strength
//   0.6,   // radius
//   1.5   // threshold
// );
// composer.addPass(bloomPass);

// RGB shift pass
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.00015; 
composer.addPass(rgbShiftPass);

let model;
// Load HDRI
new RGBELoader()
  .load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr',
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;

      // Load GLTF model
      const loader = new GLTFLoader();
      loader.load('/DamagedHelmet.gltf',
        (gltf) => {
          model = gltf.scene;
          model.position.set(0, 1, 0);
          //model.rotation.y = Math.PI / 6;
          model.scale.set(1.1, 1.1, 1.1);

          // Make it emit light so bloom reacts
          model.traverse((o) => {
            if (o.isMesh && o.material && 'emissive' in o.material) {
              o.material.emissive = new THREE.Color('#3aa8ff'); 
              o.material.emissiveIntensity = 2.0;
            }
          });

          scene.add(model);
        },
        undefined,
        (error) => {
          console.error('Error loading GLTF:', error);
        }
      );
    }
  );

// Mouse rotation animation
window.addEventListener('mousemove', (e) => {
  if (model) {
    const rotationx = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.3;
    const rotationy = (e.clientY / window.innerHeight - 0.5) * Math.PI * 0.3;
    gsap.to(model.rotation, {
      x: rotationy,
      y: rotationx,
      duration: 0.9,
      ease: "power2.out"
    });
  }
});

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  model.rotation.y += Math.PI / 180;
  composer.render();
}
animate();
