import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Vector3 } from 'three';
import { PoseRepresentation } from './poserepresentation.js';

class Scene {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.poseRepresentations = [];

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 2, 3);
    this.camera.lookAt(0, 0, 0);

    this.addPoses();

    this.renderer = new THREE.WebGLRenderer({
      // antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      alpha: true,
    });

    this.renderer.autoClear = false;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xc86e8c, 1);

    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.classList.add('mainCanvas');

    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    );
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.05;

    this.controls.screenSpacePanning = true;

    this.controls.minDistance = 1;
    this.controls.maxDistance = 250;

    this.addEnvironment();

    window.addEventListener('resize', () => this.onWindowResize());
    this.onWindowResize();
  }

  addEnvironment() {
    this.addLights();
    this.addGround();
  }

  addGround() {
    const geo = new THREE.PlaneGeometry(50, 50, 1, 1);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x148246,
      metalness: 0.001,
      roughness: 0.9, // bugs at 0
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotateX(-Math.PI / 2);
    mesh.position.y = -1.5;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  addLights() {
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    let light = new THREE.DirectionalLight(0xffffff, 0.15);
    light.position.set(50, 50, 0);
    light.castShadow = true;

    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;

    let shadowSize = 5;
    light.shadow.camera.left = -shadowSize / 2;
    light.shadow.camera.right = shadowSize / 2;
    light.shadow.camera.bottom = -shadowSize / 2;
    light.shadow.camera.top = shadowSize / 2;

    this.scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.25);
    light.position.set(4, 5, 1);

    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 1000;

    shadowSize = 10;
    light.shadow.camera.left = -shadowSize / 2;
    light.shadow.camera.right = shadowSize / 2;
    light.shadow.camera.bottom = -shadowSize / 2;
    light.shadow.camera.top = shadowSize / 2;

    this.scene.add(light);
  }

  addPlayerVideo(index, canvasEl, position) {
    this.poseRepresentations[index].addVideo(canvasEl, position);
  }

  addPoses() {
    this.poseRepresentations.push(
      new PoseRepresentation(this.scene, new Vector3(-1, 0, 0)),
    );
    this.poseRepresentations.push(
      new PoseRepresentation(this.scene, new Vector3(1, 0, 0)),
    );
  }

  updatePoses(player1, player2) {
    this.poseRepresentations[0].addPose(player1.pose);
    this.poseRepresentations[1].addPose(player2.pose);
  }

  onWindowResize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  animate() {
    this.stats.update();
    for (const pose of this.poseRepresentations) {
      pose.update();
    }

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }
}

export { Scene };
