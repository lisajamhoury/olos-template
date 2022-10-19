import * as THREE from 'three';
import { Vector3 } from 'three';
import { types } from '@theatre/core';

class Dancer {
  constructor(
    scene,
    basePosition,
    marchingCubesObject,
    marchingCubesParams,
    theatreWrapper,
    dancerIndex,
  ) {
    this.showSplines = false;
    this.scene = scene;
    this.marchingCubesParams = marchingCubesParams;

    this.textureLoader = new THREE.TextureLoader();

    this.currentScene = 0; // debug scene

    this.marchingCubesObject = marchingCubesObject;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // this.basePosition = basePosition;

    this.addBubbleInterval = false;

    this.points = {};
    this.splines = {};
    this.debugMeshes = {};

    this.currentPointIndex = 0;
    this.maxPoints = 50;

    this.ARC_SEGMENTS = 10;

    const debugGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const debugMat = new THREE.MeshBasicMaterial({
      color: 'hotpink',
    });

    // const keypointNames = [
    //   'nose',
    //   'left_eye_inner',
    //   'left_eye',
    //   'left_eye_outer',
    //   'right_eye_inner',
    //   'right_eye',
    //   'right_eye_outer',
    //   'left_ear',
    //   'right_ear',
    //   'mouth_left',
    //   'mouth_right',
    //   'left_shoulder',
    //   'right_shoulder',
    //   'left_elbow',
    //   'right_elbow',
    //   'left_wrist',
    //   'right_wrist',
    //   'left_pinky',
    //   'right_pinky',
    //   'left_index',
    //   'right_index',
    //   'left_thumb',
    //   'right_thumb',
    //   'left_hip',
    //   'right_hip',
    //   'left_knee',
    //   'right_knee',
    //   'left_ankle',
    //   'right_ankle',
    //   'left_heel',
    //   'right_heel',
    //   'left_foot_index',
    //   'right_foot_index',
    // ];

    this.activeKeyPointNames = new Set([
      'left_eye',
      'right_eye',
      'left_wrist',
      'right_wrist',
      'left_ankle',
      'right_ankle',
    ]);

    let debugMesh;
    // initialize points arrays and splines
    for (const name of this.activeKeyPointNames) {
      this.points[name] = [];
      for (let i = 0; i < this.maxPoints; i++) {
        this.points[name].push(new Vector3(0, 0, 0));
      }
      this.splines[name] = this.addSpline(this.points[name]);
      debugMesh = new THREE.Mesh(debugGeo, debugMat);
      this.debugMeshes[name] = debugMesh;
      this.group.add(debugMesh);
    }

    this.initializeBubbles();

    this.defaultParams = {
      basePosition: basePosition,
    };
    this.params = structuredClone(this.defaultParams);

    const whichDancersAreInWhichScenes = {
      DancerOne: {
        0: true,
        1: true,
        2: true,
        3: false,
      },
      DancerTwo: {
        0: true,
        1: true,
        2: true,
        3: false,
      },
      CombinedDancer: {
        0: false,
        1: false,
        2: false,
        3: true,
      },
    };

    const sheets = theatreWrapper.sheets;
    for (
      let sceneIndex = 0;
      sceneIndex < sheets.length;
      sceneIndex++
    ) {
      if (!whichDancersAreInWhichScenes[dancerIndex][sceneIndex])
        continue;
      const sheet = sheets[sceneIndex];
      let params = structuredClone(this.defaultParams);
      const animatedObj = sheet.object(dancerIndex, {
        basePosition: types.compound({
          x: types.number(params.basePosition.x, {
            range: [-10, 10],
          }),
          y: types.number(params.basePosition.y, {
            range: [-10, 10],
          }),
          z: types.number(params.basePosition.z, {
            range: [-10, 10],
          }),
        }),
      });
      const onUpdate = (values) => {
        params = {
          ...params,
          ...values,
        };
        this.params = params;
      };
      animatedObj.onValuesChange(onUpdate);
      theatreWrapper.addObject(sceneIndex, onUpdate);
    }
  }

  /*
   * setup initial bubble instance system
   */
  initializeBubbles() {
    // geometry and materials we can reuse
    this.bubbles = [];
    this.placeholderObject = new THREE.Object3D();
    // this.bubbleGeometry = new THREE.SphereGeometry(0.05, 12, 12);
    this.bubbleGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    this.bubbleTex = new THREE.TextureLoader().load(
      new URL('../../media/perlin.jpg', import.meta.url),
    );
    // this.bubbleMaterial = new THREE.MeshNormalMaterial();
    // this.bubbleMaterial = new THREE.MeshPhysicalMaterial({
    //   color: 0xeeeeff,
    //   metalness: 0,
    //   roughness: 0.1, // bugs at 0
    //   ior: 1.6,
    //   // alphaMap: this.bubbleTex,
    //   envMap: this.scene.background,
    //   envMapIntensity: 0.95,
    //   thickness: 2,
    //   transmission: 0.75, // use material.transmission for glass materials
    //   specularIntensity: 1,
    //   specularColor: 0x0000ff,
    //   opacity: 0.05,
    //   side: THREE.DoubleSide,
    //   transparent: true,
    // });
    const alphaMap = this.textureLoader.load(
      new URL('../../media/alphaMap.png', import.meta.url),
    );
    this.bubbleMaterial = new THREE.MeshBasicMaterial({
      alphaMap: alphaMap,
      transparent: true,
    });
    // console.log(this.bubbleMaterial);
    this.bubbleMaterial.blending = THREE.AdditiveBlending;

    // for instancing
    this.bubbleIndex = 0;
    const bubbleInstanceCount = 10000;
    this.bubbleInstancedMesh = new THREE.InstancedMesh(
      this.bubbleGeometry,
      this.bubbleMaterial,
      bubbleInstanceCount,
    );
    this.bubbleInstancedMesh.instanceMatrix.setUsage(
      THREE.DynamicDrawUsage,
    ); // will be updated every frame
    this.group.add(this.bubbleInstancedMesh);

    for (let i = 0; i < bubbleInstanceCount; i++) {
      this.bubbles.push(new Bubble());
    }
  }

  addVideo(canvasEl, position) {
    // console.log(canvasEl);
    this.canvasTexture = new THREE.CanvasTexture(canvasEl);
    const canvasMat = new THREE.MeshPhongMaterial({
      map: this.canvasTexture,
    });
    const offsideMat = new THREE.MeshPhongMaterial({
      color: 0x232323,
    });

    const materials = [
      offsideMat,
      offsideMat,
      offsideMat,
      offsideMat,
      canvasMat,
      offsideMat,
    ];

    const aspect = canvasEl.width / canvasEl.height;
    const geo = new THREE.BoxGeometry(1 * aspect, 1, 0.1);
    const mesh = new THREE.Mesh(geo, materials);

    mesh.position.copy(position);
    mesh.lookAt(0, position.y, 0);
    // mesh.position.add(this.basePosition);
    this.group.add(mesh);
  }

  addBubbles() {
    for (const name in this.points) {
      let points = this.points[name];
      this.addBubble(points);
    }
  }

  addBubble(points) {
    const point = points[points.length - 1];
    const pPoint = points[points.length - 2];
    const s = randomRange(0.25, 3);

    // console.log(point);
    this.bubbles[this.bubbleIndex].position.copy(point);
    this.bubbles[this.bubbleIndex].scale = s;
    this.bubbles[this.bubbleIndex].life = randomRange(100, 2500);
    this.bubbles[this.bubbleIndex].velocity.subVectors(point, pPoint);

    this.bubbleIndex++;
    if (this.bubbleIndex >= this.bubbleInstancedMesh.count) {
      this.bubbleIndex = 0;
    }
  }

  updateBubbleInstances() {
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      b.update();
      this.placeholderObject.scale.set(b.scale, b.scale, b.scale);
      this.placeholderObject.position.copy(b.position);
      this.placeholderObject.updateMatrix();
      this.bubbleInstancedMesh.setMatrixAt(
        i,
        this.placeholderObject.matrix,
      );
    }
    this.bubbleInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  /*
   * Takes incoming pose data and reorganizes it into the following structure,
   * only saving data from the currently active keypoints
   * this.points = { keypointName: [Vector3, Vector3, Vector3, Vector3, Vector3]}
   * where the length of the array of Vectors is determined by this.maxPoints
   * and they are arranged from oldest to most recent
   */
  addPose(data) {
    const keypoints = data[0].keypoints3D;
    this.latestPoseData = keypoints;

    keypoints.forEach((keypoint) => {
      if (!this.activeKeyPointNames.has(keypoint.name)) return;

      // here we shift the points so that the last 5 points are always indexed at 0 - 4 (so that the splines work nicely)
      let temp = this.points[keypoint.name].shift();
      temp.set(keypoint.x, keypoint.y * -1, keypoint.z);
      temp.add(this.params.basePosition);
      // temp.add(this.basePosition);
      this.points[keypoint.name].push(temp);
    });

    if (this.showSplines) this.updateSplines();
    this.updateDebugMeshes();
  }

  /*
   * updates the dancer's spline movement representation
   */
  updateSplines() {
    const point = new Vector3();
    for (const id in this.splines) {
      const spline = this.splines[id];

      const splineMesh = spline.mesh;
      const position = splineMesh.geometry.attributes.position;

      for (let i = 0; i < this.ARC_SEGMENTS; i++) {
        const t = i / (this.ARC_SEGMENTS - 1);
        spline.getPoint(t, point);
        position.setXYZ(i, point.x, point.y, point.z);
      }

      position.needsUpdate = true;
    }
  }

  /*
   * Creates a new spline from an array of points
   * As these points are updates, so too will the spline
   * (once updateSpline has been called)
   */
  addSpline(points) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array(this.ARC_SEGMENTS * 3),
        3,
      ),
    );

    let curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = 'catmullrom';
    curve.mesh = new THREE.Line(
      geometry.clone(),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
      }),
    );
    curve.mesh.castShadow = true;

    this.group.add(curve.mesh);
    return curve;
  }

  setScene(sceneNumber) {
    // console.log('Dancer switching to scene', sceneNumber);
    this.currentScene = sceneNumber;

    // turn off all representations
    for (const id in this.splines) {
      const spline = this.splines[id];
      spline.visible = false;
    }
    this.bubbleInstancedMesh.visible = false;

    switch (this.currentScene) {
      case 0:
        this.setVisibility(this.debugMeshes, true);
        this.setVisibility(this.splines, true);
        this.bubbleInstancedMesh.visible = false;
        clearInterval(this.addBubbleInterval);
        break;

      case 1:
        this.setVisibility(this.debugMeshes, false);
        this.setVisibility(this.splines, true);
        this.bubbleInstancedMesh.visible = false;
        clearInterval(this.addBubbleInterval);
        break;

      case 2:
        this.setVisibility(this.debugMeshes, false);
        this.setVisibility(this.splines, true);
        this.bubbleInstancedMesh.visible = true;
        clearInterval(this.addBubbleInterval);
        this.addBubbleInterval = setInterval(() => {
          this.addBubbles();
        }, 10);
        break;

      case 3:
        this.setVisibility(this.debugMeshes, false);
        this.setVisibility(this.splines, true);
        this.bubbleInstancedMesh.visible = false;
        clearInterval(this.addBubbleInterval);
        break;
    }
  }

  setVisibility(objects, isVisible) {
    for (const name in objects) {
      objects[name].visible = isVisible;
    }
  }

  update() {
    if (this.canvasTexture) this.canvasTexture.needsUpdate = true;
    switch (this.currentScene) {
      case 0:
        // debug
        break;

      case 1:
        this.updateMarchingCubes();
        break;

      case 2:
        // this.updateBubbleInstances();
        break;

      case 3:
        this.updateMarchingCubes();
        break;
    }
  }

  updateCanvas() {
    if (this.canvasTexture) this.canvasTexture.needsUpdate = true;
  }

  /*
   * updates some debug meshes
   */
  updateDebugMeshes() {
    for (const keypointName in this.debugMeshes) {
      const mesh = this.debugMeshes[keypointName];
      mesh.position.copy(
        this.points[keypointName][
          this.points[keypointName].length - 1
        ],
      );
    }
  }

  updateMarchingCubes() {
    // 3D keypoints are `Real-world 3D coordinates in meters with the origin at the center between hips.`
    //https://google.github.io/mediapipe/solutions/pose.html#output
    const totalDancerBoxSizeInMeters =
      this.marchingCubesParams.boxSize;
    const scale = 0.5 / totalDancerBoxSizeInMeters;

    // marching cubes expects a value between [0,0,0] and [1,1,1]
    const originOffset = new Vector3(0.5, 0.5, 0.5);
    // originOffset.multiplyScalar(scale);

    // strength and subtract values:

    for (const name in this.points) {
      let pts = this.points[name];
      let pointsToAdd = pts.slice(
        -this.marchingCubesParams.interpolation,
      );
      pointsToAdd.forEach((pointToAdd) => {
        let pt = pointToAdd.clone();

        pt.multiplyScalar(scale);
        pt.add(originOffset);

        this.marchingCubesObject.addBall(
          pt.x,
          pt.y,
          pt.z,
          this.marchingCubesParams.cube_strength,
          this.marchingCubesParams.cube_subtract,
        );
      });
    }
  }
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

class Bubble {
  constructor() {
    this.life = 0;
    this.scale = 1;
    this.position = new Vector3(0, -10000000, 0);
    this.velocity = new Vector3(
      randomRange(-0.0025, 0.0025),
      randomRange(-0.0025, 0.0025),
      randomRange(-0.0025, 0.0025),
    );
  }

  update() {
    if (this.life <= 0) return;

    this.scale *= 0.99;

    this.position.add(this.velocity);

    this.life--;
    if (this.life <= 0) {
      this.position.set(0, -10000000, 0);
    }
  }
}

export { Dancer };
