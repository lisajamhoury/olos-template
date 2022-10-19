import * as THREE from 'three';
import { Vector3 } from 'three';

class PoseRepresentation {
  constructor(scene, basePosition) {
    this.showSplines = true;
    this.scene = scene;
    this.basePosition = basePosition;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.points = {};
    this.splines = {};
    this.debugMeshes = {};

    this.maxPoints = 50;
    this.ARC_SEGMENTS = 10;

    this.activeKeyPointNames = new Set([
      'left_eye',
      'right_eye',
      'left_wrist',
      'right_wrist',
      'left_ankle',
      'right_ankle',
    ]);

    this.init();
  }

  init() {
    // initialize points arrays and splines
    const debugGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const debugMat = new THREE.MeshBasicMaterial({
      color: 0xe8e527,
    });

    let debugMesh;

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

    for (const id in this.splines) {
      const spline = this.splines[id];
      spline.visible = this.showSplines;
    }

    this.setVisibility(this.debugMeshes, true);
    this.setVisibility(this.splines, true);
  }

  addVideo(canvasEl, position) {
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
    this.group.add(mesh);
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

    keypoints.forEach((keypoint) => {
      if (!this.activeKeyPointNames.has(keypoint.name)) return;

      // here we shift the points so that the last 5 points are always indexed at 0 - 4 (so that the splines work nicely)
      let temp = this.points[keypoint.name].shift();
      temp.set(keypoint.x, keypoint.y * -1, keypoint.z);
      temp.add(this.basePosition);
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

  setVisibility(objects, isVisible) {
    for (const name in objects) {
      objects[name].visible = isVisible;
    }
  }

  update() {
    if (this.canvasTexture) this.canvasTexture.needsUpdate = true;
  }

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
}

export { PoseRepresentation };
