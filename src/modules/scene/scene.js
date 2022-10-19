import * as THREE from 'three';
import { DirectionalLight, Vector3 } from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { Dancer } from './dancer.js';
import { GUI } from 'lil-gui';
import { CameraController } from './cameraController.js';
import { SkyWrapper } from './sky.js';
import { WaterWrapper } from './water.js';
import {
  addDistanceBtwJoints,
  combinePoseLeftAndRight,
  getDistanceBetweenJoints,
} from './../core/utils.js';

import Simulator from './particles/simulator';
import Particles from './particles/particles';

import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  VignetteEffect,
  BlendFunction,
  SMAAEffect,
} from 'postprocessing';

import { TheatreWrapper } from './theatreWrapper.js';
import { types } from '@theatre/core';
import { Terrain } from './terrain/terrain';
import { SHOWCONTROLS } from './../../modules/constants.js';

class Scene {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.dancers = [];
    this.combinedDancer = null;
    this.gui = new GUI();

    if (SHOWCONTROLS) {
      this.gui.show();
    } else {
      this.gui.hide();
    }

    this.currentScene = 0;

    this.globalParams = {
      0: () => {
        this.setScene(0);
      },
      1: () => {
        this.setScene(1);
      },
      2: () => {
        this.setScene(2);
      },
      3: () => {
        this.setScene(3);
      },
      toggleMouse: () => {
        const classList = this.renderer.domElement.classList;
        classList.toggle('hideCursor');
      },
    };
    this.globalRendererParams = {
      toneMapping: THREE.NoToneMapping,
      toneMappingExposure: 1,
      // THREE.LinearToneMapping
      // THREE.ReinhardToneMapping
      // THREE.CineonToneMapping
      // THREE.ACESFilmicToneMapping
      // THREE.CustomToneMapping
    };
    this.sceneOneParams = {
      boxSize: 4,
      resolution: 36,
      isolation: 180,
      cube_strength: 0.15,
      cube_subtract: 10,
      interpolation: 5,
    };

    this.sceneThreeParams = {
      boxSize: 4,
      resolution: 36,
      isolation: 180,
      cube_strength: 3,
      cube_subtract: 34.9,
      interpolation: 10,
    };

    this.init();
  }

  setScene(sceneNumber) {
    // console.log('Switching to scene', sceneNumber);
    this.currentScene = sceneNumber;

    this.dancers.forEach((dancer) => dancer.setScene(sceneNumber));
    this.combinedDancer.setScene(sceneNumber);

    this.theatreWrapper.setScene(sceneNumber);

    switch (this.currentScene) {
      case 0:
        this.clearMarchingCubes();
        break;

      case 1:
        this.updateMarchingCubesMaterial();
        break;

      case 2:
        this.clearMarchingCubes();
        break;

      case 3:
        this.updateMarchingCubesMaterial();
        break;
    }
  }

  init() {
    this.theatreWrapper = new TheatreWrapper({});

    this.frameCount = 0;
    this.scene = new THREE.Scene();

    this.ray = new THREE.Ray();

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

    this.addMarchingCubesObject();
    this.addDancers();

    this.renderer = new THREE.WebGLRenderer({
      // antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      alpha: true,
    });
    this.renderer.autoClear = false;
    // console.log(this.renderer);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xffffff, 1);

    // postprocessing
    this.addPostProcessing();

    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.classList.add('mainCanvas');
    this.renderer.toneMapping = this.globalRendererParams.toneMapping;
    // add controls
    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    );
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.controls.dampingFactor = 0.05;

    this.controls.screenSpacePanning = true;

    this.controls.minDistance = 1;
    this.controls.maxDistance = 250;

    // this.controls.maxPolarAngle = Math.PI / 2;
    // this.controls.minPolarAngle = 0;

    // GUI
    this.gui.add(this.globalParams, 0);
    this.gui.add(this.globalParams, 1);
    this.gui.add(this.globalParams, 2);
    this.gui.add(this.globalParams, 3);

    this.gui.add(this.globalParams, 'toggleMouse');

    const renderingFolder = this.gui.addFolder('Rendering');
    renderingFolder
      .add(this.globalRendererParams, 'toneMapping', {
        None: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        ACESFilmic: THREE.ACESFilmicToneMapping,
      })
      .onChange(() => {
        this.renderer.toneMapping =
          this.globalRendererParams.toneMapping;
      });
    renderingFolder
      .add(this.globalRendererParams, 'toneMappingExposure', 0, 5)
      .onChange(() => {
        this.renderer.toneMappingExposure =
          this.globalRendererParams.toneMappingExposure;
      });

    const sheets = this.theatreWrapper.sheets;

    const sceneOneMarchingCubesObj = sheets[1].object(
      'Marching Cubes',
      {
        boxSize: types.number(this.sceneOneParams.boxSize, {
          range: [2, 10],
        }),
        resolution: types.number(this.sceneOneParams.resolution, {
          range: [24, 36],
        }),
        isolation: types.number(this.sceneOneParams.isolation, {
          range: [10, 300],
        }),
        cube_strength: types.number(
          this.sceneOneParams.cube_strength,
          { range: [0.01, 5.0] },
        ),
        cube_subtract: types.number(
          this.sceneOneParams.cube_subtract,
          { range: [0, 100] },
        ),
        interpolation: types.number(
          this.sceneOneParams.interpolation,
          { range: [1, 20] },
        ),
      },
    );
    sceneOneMarchingCubesObj.onValuesChange((values) => {
      this.sceneOneParams = {
        ...this.sceneOneParams,
        ...values,
      };
    });

    const sceneThreeMarchingCubesObj = sheets[3].object(
      'Marching Cubes',
      {
        boxSize: types.number(this.sceneOneParams.boxSize, {
          range: [2, 10],
        }),
        resolution: types.number(this.sceneThreeParams.resolution, {
          range: [24, 36],
        }),
        isolation: types.number(this.sceneThreeParams.isolation, {
          range: [10, 300],
        }),
        cube_strength: types.number(
          this.sceneThreeParams.cube_strength,
          { range: [0.01, 5.0] },
        ),
        cube_subtract: types.number(
          this.sceneThreeParams.cube_subtract,
          { range: [0, 100] },
        ),
        interpolation: types.number(
          this.sceneThreeParams.interpolation,
          { range: [1, 20] },
        ),
      },
    );
    sceneThreeMarchingCubesObj.onValuesChange((values) => {
      this.sceneThreeParams = {
        ...this.sceneThreeParams,
        ...values,
      };
    });

    this.sky = new SkyWrapper(
      this.scene,
      this.renderer,
      this.theatreWrapper,
    );

    this.addEnvironment();

    // particles from Edwin Kwan
    this.addParticleSystem();

    window.addEventListener('resize', () => this.onWindowResize());
    this.onWindowResize();

    this.cameraController = new CameraController(
      this.scene,
      this.camera,
      this.renderer,
      this.controls,
      this.gui,
    );

    this.setScene(this.currentScene);
    // start the loop
    this.loop();

    this.debug = true;
    window.addEventListener('keyup', (ev) => {
      if (ev.key === 'h') {
        this.debug = !this.debug;
        if (this.debug) {
          this.stats.dom.style.display = 'block';
          this.gui.show();
        } else {
          this.stats.dom.style.display = 'none';
          this.gui.hide();
        }
      }
    });
  }

  addPostProcessing() {
    // create composer
    this.composer = new EffectComposer(this.renderer, {
      multisampling: false,
    });

    // add render pass
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // add bloom effect and menu options
    const bloomEffect = new BloomEffect();
    const bloomEffectPass = new EffectPass(this.camera, bloomEffect);
    this.composer.addPass(bloomEffectPass);

    let pass = bloomEffectPass;
    let effect = bloomEffect;
    let blendMode = effect.blendMode;
    let menu = this.gui.addFolder('Bloom');

    let params = {
      intensity: effect.intensity,
      radius: effect.mipmapBlurPass.radius,
      luminance: {
        filter: effect.luminancePass.enabled,
        threshold: effect.luminanceMaterial.threshold,
        smoothing: effect.luminanceMaterial.smoothing,
      },
      selection: {
        inverted: effect.inverted,
        'ignore bg': effect.ignoreBackground,
      },
      opacity: blendMode.opacity.value,
      'blend mode': blendMode.blendFunction,
    };

    menu
      .add(params, 'intensity', 0.0, 10.0, 0.01)
      .onChange((value) => {
        effect.intensity = Number(value);
      });

    menu.add(params, 'radius', 0.0, 1.0, 0.001).onChange((value) => {
      effect.mipmapBlurPass.radius = Number(value);
    });

    let folder = menu.addFolder('Luminance');

    folder.add(params.luminance, 'filter').onChange((value) => {
      effect.luminancePass.enabled = value;
    });

    folder
      .add(params.luminance, 'threshold', 0.0, 1.0, 0.001)
      .onChange((value) => {
        effect.luminanceMaterial.threshold = Number(value);
      });

    folder
      .add(params.luminance, 'smoothing', 0.0, 1.0, 0.001)
      .onChange((value) => {
        effect.luminanceMaterial.smoothing = Number(value);
      });

    const vignetteEffect = new VignetteEffect({
      eskil: false,
      offset: 0.15,
      darkness: 0.25,
    });
    const effectPass = new EffectPass(this.camera, vignetteEffect);
    this.composer.addPass(effectPass);

    const RenderMode = {
      DEFAULT: 0,
      DEPTH: 1,
      COC: 2,
    };

    params = {
      vignette: {
        enabled: true,
        offset: vignetteEffect.uniforms.get('offset').value,
        darkness: vignetteEffect.uniforms.get('darkness').value,
      },
    };

    folder = this.gui.addFolder('Vignette');

    folder.add(params.vignette, 'enabled').onChange((value) => {
      vignetteEffect.blendMode.setBlendFunction(
        value ? BlendFunction.NORMAL : BlendFunction.SKIP,
      );
    });

    folder.add(vignetteEffect, 'eskil');

    folder
      .add(params.vignette, 'offset', 0.0, 1.0, 0.001)
      .onChange((value) => {
        vignetteEffect.uniforms.get('offset').value = value;
      });

    folder
      .add(params.vignette, 'darkness', 0.0, 1.0, 0.001)
      .onChange((value) => {
        vignetteEffect.uniforms.get('darkness').value = value;
      });

    const antialiasEffect = new SMAAEffect();
    const antialiasEffectPass = new EffectPass(
      this.camera,
      antialiasEffect,
    );
    this.composer.addPass(antialiasEffectPass);
  }

  addParticleSystem() {
    this.attractorPos1 = new THREE.Vector3();
    this.attractorPos2 = new THREE.Vector3();
    this.attractorPos3 = new THREE.Vector3();
    this.attractorPos4 = new THREE.Vector3();

    this.simulationSettings = {
      speed: 0.025,
      curlSize: 2.25,
      dieSpeed: 0.015,
      radius: 0.5,
      attraction: 0.0,
    };

    this.simulationRenderingSettings = {
      baseInset: 0.5,
      particleSize: 0.25,
      inset: 0.5,
      insetExtra: 0,
      blur: 1,
      washout: 0.7,
    };

    this.time = Date.now();
    this.screenSpacePreviousPointer = new THREE.Vector2();
    this.screenSpacePointer = new THREE.Vector2();
    this.previousPointer = new THREE.Vector2();
    this.pointer = new THREE.Vector2();
    window.addEventListener('pointermove', (ev) => {
      this.previousPointer.copy(this.pointer);
      this.pointer.x = (ev.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(ev.clientY / window.innerHeight) * 2 + 1;

      this.screenSpacePreviousPointer.copy(this.screenSpacePointer);
      this.screenSpacePointer.set(ev.clientX, ev.clientY);
    });
    this.raycaster = new THREE.Raycaster();

    this.initAnimation = 1;
    this.simulator = new Simulator(this.renderer);
    this.particles = new Particles(
      this.renderer,
      this.camera,
      this.simulator,
    );

    const sheets = this.theatreWrapper.sheets;

    const sheet = sheets[2];
    const particleSimObj = sheet.object('ParticleSimulation', {
      speed: types.number(this.simulationSettings.speed, {
        range: [0, 0.1],
      }),
      curlSize: types.number(this.simulationSettings.curlSize, {
        range: [0, 10],
      }),
      dieSpeed: types.number(this.simulationSettings.dieSpeed, {
        range: [0, 0.1],
      }),
      radius: types.number(this.simulationSettings.radius, {
        range: [0, 2],
      }),
      attraction: types.number(this.simulationSettings.attraction, {
        range: [-1, 1],
      }),
    });
    particleSimObj.onValuesChange((values) => {
      this.simulationSettings = {
        ...this.simulationSettings,
        ...values,
      };
      this.updateParticleSystemSettings();
    });
    const particleRenderingObj = sheet.object('ParticleRendering', {
      baseInset: types.number(
        this.simulationRenderingSettings.baseInset,
        { range: [0, 0.5] },
      ),
      particleSize: types.number(
        this.simulationRenderingSettings.particleSize,
        { range: [0, 2] },
      ),
      inset: types.number(this.simulationRenderingSettings.inset, {
        range: [0, 1],
      }),
      insetExtra: types.number(
        this.simulationRenderingSettings.insetExtra,
        { range: [0, 1] },
      ),
      blur: types.number(this.simulationRenderingSettings.blur, {
        range: [0, 1],
      }),
      washout: types.number(
        this.simulationRenderingSettings.washout,
        { range: [0, 1] },
      ),
    });
    particleRenderingObj.onValuesChange((values) => {
      this.simulationRenderingSettings = {
        ...this.simulationRenderingSettings,
        ...values,
      };
      this.updateParticleSystemSettings();
    });
  }

  updateParticleSystemSettings() {
    this.simulator.speed = this.simulationSettings.speed;
    this.simulator.curlSize = this.simulationSettings.curlSize;
    this.simulator.dieSpeed = this.simulationSettings.dieSpeed;
    this.simulator.radius = this.simulationSettings.radius;
    this.simulator.attraction = this.simulationSettings.attraction;

    this.particles.baseInset =
      this.simulationRenderingSettings.baseInset;
    this.particles.particleSize =
      this.simulationRenderingSettings.particleSize;
    this.particles.inset = this.simulationRenderingSettings.inset;
    this.particles.insetExtra =
      this.simulationRenderingSettings.insetExtra;
    this.particles.blur = this.simulationRenderingSettings.blur;
    this.particles.washout = this.simulationRenderingSettings.washout;
  }

  addEnvironment() {
    this.addLights();
    // this.addGround();
    this.terrain = new Terrain(this.scene);
    this.water = new WaterWrapper(this.scene, this.theatreWrapper);

    this.scene.fog = new THREE.FogExp2(0xffffff, 0.00025);
  }

  addGround() {
    const geo = new THREE.PlaneGeometry(50, 50, 1, 1);
    const textureLoader = new THREE.TextureLoader();
    const scale = 10;

    const map = textureLoader.load(
      new URL(
        '../../media/ground-textures/Ground033_1K_Color.jpg',
        import.meta.url,
      ),
    );
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(scale, scale);

    // const displacementMap = textureLoader.load(new URL("../media/ground-textures/Ground033_1K_Displacement.jpg", import.meta.url));
    // displacementMap.wrapS = THREE.RepeatWrapping;
    // displacementMap.wrapT = THREE.RepeatWrapping;
    // displacementMap.repeat.set(scale, scale);

    const normalMap = textureLoader.load(
      new URL(
        '../../media/ground-textures/Ground033_1K_NormalGL.jpg',
        import.meta.url,
      ),
    );
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(scale, scale);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.001,
      roughness: 0.9, // bugs at 0
      // ior: 1.6,
      // alphaMap: texture,
      envMap: this.scene.environment,
      envMapIntensity: 0.05,
      // transmission: 0, // use material.transmission for glass materials
      // specularIntensity: 1,
      side: THREE.DoubleSide,
      map,
      // displacementMap,
      // displacementScale: 0.05,
      normalMap,
      normalScale: new THREE.Vector2(1, 1),
    });
    // const mat = new THREE.MeshBasicMaterial({
    //   map: groundTexture
    // });
    // console.log(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotateX(-Math.PI / 2);
    mesh.position.y = -1.5;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  addLights() {
    //ambient light
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

    // let dirLightHelper = new THREE.DirectionalLightHelper(
    //   light,
    //   10,
    // );
    // this.scene.add(dirLightHelper);

    //
    light = new THREE.DirectionalLight(0xffffff, 0.25);
    light.position.set(4, 5, 1);
    // light.castShadow = true;

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

    // dirLightHelper = new THREE.DirectionalLightHelper(
    //   light,
    //   10,
    // );
    // this.scene.add(dirLightHelper);
  }

  addDancerVideo(index, canvasEl, position) {
    this.dancers[index].addVideo(canvasEl, position);
  }

  addMarchingCubesObject() {
    this.sceneOneMarchingCubesMat = new THREE.MeshPhysicalMaterial({
      color: 0x9999ff,
      metalness: 0,
      roughness: 0.1, // bugs at 0
      ior: 1.6,
      // alphaMap: this.bubbleTex,
      envMap: this.scene.environment,
      envMapIntensity: 0.95,
      thickness: 2,
      transmission: 0.75, // use material.transmission for glass materials
      specularIntensity: 1,
      specularColor: 0x0000ff,
      opacity: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this.sceneThreeMarchingCubesMat = new THREE.MeshPhysicalMaterial({
      color: 0xeeeeff,
      metalness: 0,
      roughness: 0.1, // bugs at 0
      ior: 1.6,
      // alphaMap: this.bubbleTex,
      envMap: this.scene.environment,
      envMapIntensity: 0.95,
      thickness: 2,
      transmission: 0.75, // use material.transmission for glass materials
      specularIntensity: 1,
      specularColor: 0x0000ff,
      opacity: 1,
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.marchingCubesObject = new MarchingCubes(
      this.sceneOneParams.resolution,
      this.sceneOneMarchingCubesMat,
      true,
      false,
      100000,
    );

    // NOTE this is somewhat performance intensive
    this.marchingCubesObject.castShadow = true;

    this.marchingCubesObject.isolation =
      this.sceneOneParams.isolation; // set to value between 10 and 200
    this.marchingCubesObject.position.set(0, 0, 0);
    this.marchingCubesObject.scale.set(2, 2, 2);
    this.marchingCubesObject.init(12);
    this.scene.add(this.marchingCubesObject);
  }

  updateMarchingCubesMaterial() {
    if (this.currentScene == 1) {
      this.marchingCubesObject.material =
        this.sceneOneMarchingCubesMat;
    } else {
      this.marchingCubesObject.material =
        this.sceneThreeMarchingCubesMat;
    }
  }

  addDancers() {
    this.dancers.push(
      new Dancer(
        this.scene,
        new Vector3(-1, 0, 0),
        this.marchingCubesObject,
        this.sceneOneParams,
        this.theatreWrapper,
        'DancerOne',
      ),
    );
    this.dancers.push(
      new Dancer(
        this.scene,
        new Vector3(1, 0, 0),
        this.marchingCubesObject,
        this.sceneOneParams,
        this.theatreWrapper,
        'DancerTwo',
      ),
    );

    this.combinedDancer = new Dancer(
      this.scene,
      new Vector3(0, 0, 0),
      this.marchingCubesObject,
      this.sceneThreeParams,
      this.theatreWrapper,
      'CombinedDancer',
    );
  }

  animate(player1, player2) {
    this.dancers[0].addPose(player1.pose);
    this.dancers[1].addPose(player2.pose);

    if (this.currentScene === 3) {
      const combinedPose = combinePoseLeftAndRight(
        player1.pose,
        player2.pose,
        this.dancers[0].activeKeyPointNames,
      );

      // const distanceBtwHands = getDistanceBetweenJoints(
      //   'left_wrist',
      //   player1,
      //   player2,
      // );

      // const combinedPoseWithDistance = addDistanceBtwJoints(
      //   combinedPose,
      //   distanceBtwHands,
      //   'left_wrist',
      // );

      this.combinedDancer.addPose(combinedPose);
    }
  }

  onWindowResize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    this.particles.resize(width, height);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  loop() {
    const newTime = Date.now();
    const deltaTime = newTime - this.time;
    this.water.update(deltaTime);

    this.time = Date.now();

    this.frameCount++;
    this.stats.update();

    this.cameraController.update();

    switch (this.currentScene) {
      case 0:
        this.renderSceneZero();
        break;

      case 1:
        this.renderSceneOne();
        break;

      case 2:
        // this.renderSceneTwo();
        this.runParticles(deltaTime);
        break;

      case 3:
        this.renderSceneThree();
        break;
    }

    requestAnimationFrame(() => this.loop());
  }

  runParticles(deltaTime) {
    for (const dancer of this.dancers) {
      dancer.update();
    }
    this.attractorPos1.copy(this.dancers[0].points['left_wrist'][0]);
    this.attractorPos2.copy(this.dancers[0].points['left_ankle'][0]);
    this.attractorPos3.copy(this.dancers[1].points['left_wrist'][0]);
    this.attractorPos4.copy(this.dancers[1].points['left_ankle'][0]);
    this.simulator.update(
      deltaTime,
      this.attractorPos1,
      this.attractorPos2,
      this.attractorPos3,
      this.attractorPos4,
    );
    this.particles.preRender(deltaTime);

    this.renderer.autoClear = false;
    this.renderer.clear(false, true, false);
    this.renderer.render(this.scene, this.camera);

    this.particles.update();
  }

  clearMarchingCubes() {
    this.marchingCubesObject.init(12);
    this.marchingCubesObject.update();
  }

  renderSceneZero() {
    for (const dancer of this.dancers) {
      dancer.update();
    }

    this.renderer.clear();

    this.composer.render(this.scene, this.camera);
    // this.renderer.render(this.scene, this.camera);
  }

  renderSceneOne() {
    // TRY commenting this to see change over time
    this.marchingCubesObject.init(
      Math.floor(this.sceneOneParams.resolution),
    );
    this.marchingCubesObject.scale.set(
      this.sceneOneParams.boxSize / 2,
      this.sceneOneParams.boxSize / 2,
      this.sceneOneParams.boxSize / 2,
    );

    // strange effect
    // if (this.frameCount % 10 === 0) {
    //   this.marchingCubesObject.init(this.params.resolution);
    // }

    for (const dancer of this.dancers) {
      dancer.marchingCubesParams = this.sceneOneParams;
      dancer.update();
    }

    // uncommment to debug bounds of the marching cubes region
    // let strength = 0.15;
    // let subtract = 2;
    // this.marchingCubesObject.addBall(0.1, 0.1, 0.1, strength, subtract);
    // this.marchingCubesObject.addBall(0.9, 0.1, 0.1, strength, subtract);
    // this.marchingCubesObject.addBall(0.1, 0.1, 0.9, strength, subtract);
    // this.marchingCubesObject.addBall(0.9, 0.1, 0.9, strength, subtract);
    // this.marchingCubesObject.addBall(0.1, 0.9, 0.1, strength, subtract);
    // this.marchingCubesObject.addBall(0.9, 0.9, 0.1, strength, subtract);
    // this.marchingCubesObject.addBall(0.1, 0.9, 0.9, strength, subtract);
    // this.marchingCubesObject.addBall(0.9, 0.9, 0.9, strength, subtract);

    this.marchingCubesObject.isolation = Math.floor(
      this.sceneOneParams.isolation,
    );
    this.marchingCubesObject.update();

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }

  renderSceneThree() {
    for (const dancer of this.dancers) {
      dancer.updateCanvas();
    }
    // TRY commenting this to see change over time
    this.marchingCubesObject.init(
      Math.floor(this.sceneThreeParams.resolution),
    );
    this.marchingCubesObject.scale.set(
      this.sceneThreeParams.boxSize / 2,
      this.sceneThreeParams.boxSize / 2,
      this.sceneThreeParams.boxSize / 2,
    );

    // strange effect
    // if (this.frameCount % 100 === 0) {
    //   this.marchingCubesObject.init(this.sceneThreeParams.resolution);
    // }

    // for (const dancer of this.dancers) {
    //   dancer.marchingCubesParams = this.sceneThreeParams;
    //   dancer.update();
    // }

    this.combinedDancer.marchingCubesParams = this.sceneThreeParams;
    this.combinedDancer.update();

    this.marchingCubesObject.isolation = Math.floor(
      this.sceneThreeParams.isolation,
    );
    this.marchingCubesObject.update();

    this.renderer.clear();
    // this.renderer.render(this.scene, this.camera);
    this.composer.render(this.scene, this.camera);
  }
}

export { Scene };
