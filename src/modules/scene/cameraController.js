import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const ARC_SEGMENTS = 200;

export class CameraController {
  constructor(scene, camera, renderer, orbitControls) {
    this.scene = scene;
    this.camera = camera;

    this.startTime = Date.now();

    this.isAnimated = false;

    this.transformControl = new TransformControls(
      camera,
      renderer.domElement,
    );
    this.transformControl.addEventListener(
      'dragging-changed',
      function (event) {
        orbitControls.enabled = !event.value;
      },
    );

    this.scene.add(this.transformControl);

    this.splineHelperObjects = [];
    this.splinePointsLength = 4;
    this.positions = [];
    this.point = new THREE.Vector3();

    this.cameraPosition = new THREE.Vector3();
    // this.cameraTarget = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.onUpPosition = new THREE.Vector2();
    this.onDownPosition = new THREE.Vector2();

    this.boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

    this.cameraTargetHelperObject = new THREE.Mesh(
      this.boxGeometry,
      new THREE.MeshBasicMaterial({ color: 'blue' }),
    );
    this.scene.add(this.cameraTargetHelperObject);

    this.splines = {};
    // Controls

    const obj = {
      addPoint: () => this.addPoint(),
      removePoint: () => this.removePoint(),
      export: () => this.exportSpline(),
      import: () => this.importSpline(),
    };

    this.transformControl.addEventListener('objectChange', () => {
      this.updateSplineOutline();
    });

    document.addEventListener('pointerdown', (ev) =>
      this.onPointerDown(ev),
    );
    document.addEventListener('pointerup', (ev) =>
      this.onPointerUp(ev),
    );
    document.addEventListener('pointermove', (ev) =>
      this.onPointerMove(ev),
    );
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'c') {
        this.startTime = Date.now();
        this.isAnimated = !this.isAnimated;
        this.splineHelperObjects.forEach((obj) => {
          obj.visible = !this.isAnimated;
        });
        this.cameraTargetHelperObject.visible = !this.isAnimated;
        for (let id in this.splines) {
          this.splines[id].mesh.visible = !this.isAnimated;
        }
      }
    });
    document.addEventListener('keyup', (ev) => {
      if (ev.key === '=') {
        this.addPoint();
      }
      if (ev.key === '-') {
        this.removePoint();
      }
    });

    /*******
     * Curves
     *********/

    for (let i = 0; i < this.splinePointsLength; i++) {
      this.addSplineObject(this.positions[i]);
    }

    this.positions.length = 0;

    for (let i = 0; i < this.splinePointsLength; i++) {
      this.positions.push(this.splineHelperObjects[i].position);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array(ARC_SEGMENTS * 3),
        3,
      ),
    );

    let curve = new THREE.CatmullRomCurve3(this.positions);
    curve.curveType = 'catmullrom';
    curve.mesh = new THREE.Line(
      this.geometry.clone(),
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        opacity: 0.35,
      }),
    );
    curve.mesh.castShadow = true;
    this.splines.uniform = curve;

    for (const k in this.splines) {
      const spline = this.splines[k];
      this.scene.add(spline.mesh);
    }

    this.load([
      new THREE.Vector3(-10, 10, 5),
      new THREE.Vector3(-5, 5, 5),
      new THREE.Vector3(0, 0, 5),
      new THREE.Vector3(5, 5, 5),
    ]);
  }
  update() {
    if (this.isAnimated) {
      const time = Date.now() - this.startTime;
      const looptime = 20 * 1000;
      const t = (time % looptime) / looptime;

      this.splines.uniform.getPointAt(t, this.cameraPosition);

      this.camera.position.copy(this.cameraPosition);
      this.camera.lookAt(this.cameraTargetHelperObject.position);
    }
  }

  addSplineObject(position) {
    const material = new THREE.MeshLambertMaterial({
      color: Math.random() * 0xffffff,
    });
    const object = new THREE.Mesh(this.boxGeometry, material);

    if (position) {
      object.position.copy(position);
    } else {
      object.position.x = Math.random() * 10 - 5;
      object.position.y = Math.random() * 20;
      object.position.z = Math.random() * 10 - 5;
    }

    object.castShadow = true;
    object.receiveShadow = true;
    this.scene.add(object);
    this.splineHelperObjects.push(object);
    return object;
  }

  addPoint() {
    this.splinePointsLength++;

    this.positions.push(this.addSplineObject().position);

    this.updateSplineOutline();
  }

  removePoint() {
    if (this.splinePointsLength <= 4) {
      return;
    }

    const point = this.splineHelperObjects.pop();
    this.splinePointsLength--;
    this.positions.pop();

    if (this.transformControl.object === point)
      this.transformControl.detach();
    this.scene.remove(point);

    this.updateSplineOutline();
  }

  updateSplineOutline() {
    for (const k in this.splines) {
      const spline = this.splines[k];

      const splineMesh = spline.mesh;
      const position = splineMesh.geometry.attributes.position;

      for (let i = 0; i < ARC_SEGMENTS; i++) {
        const t = i / (ARC_SEGMENTS - 1);
        spline.getPoint(t, this.point);
        position.setXYZ(i, this.point.x, this.point.y, this.point.z);
      }

      position.needsUpdate = true;
    }
  }

  exportSpline() {
    const positions = [];

    for (let i = 0; i < this.splinePointsLength; i++) {
      const p = this.splineHelperObjects[i].position;
      positions.push({
        x: p.x,
        y: p.y,
        z: p.z,
      });
    }

    const tp = this.cameraTargetHelperObject.position;
    positions.push({
      x: tp.x,
      y: tp.y,
      z: tp.z,
    });

    prompt('copy and paste code', JSON.stringify(positions));
  }
  importSpline() {
    const response = prompt('Paste your spline points', '');
    const newPositions = JSON.parse(response);

    const splinePositiosn = newPositions.slice(0, -1);
    const tp = newPositions.slice(-1)[0];
    this.load(splinePositiosn);
    console.log(tp);
    this.cameraTargetHelperObject.position.set(tp.x, tp.y, tp.z);
  }

  load(new_positions) {
    while (new_positions.length > this.positions.length) {
      this.addPoint();
    }

    while (new_positions.length < this.positions.length) {
      this.removePoint();
    }

    for (let i = 0; i < this.positions.length; i++) {
      console.log(
        new_positions[i].x,
        new_positions[i].y,
        new_positions[i].z,
      );
      this.positions[i].set(
        new_positions[i].x,
        new_positions[i].y,
        new_positions[i].z,
      );
    }

    this.updateSplineOutline();
  }

  onPointerDown(event) {
    this.onDownPosition.x = event.clientX;
    this.onDownPosition.y = event.clientY;
  }

  onPointerUp(event) {
    this.onUpPosition.x = event.clientX;
    this.onUpPosition.y = event.clientY;

    if (this.onDownPosition.distanceTo(this.onUpPosition) === 0)
      this.transformControl.detach();
  }

  onPointerMove(event) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersects = this.raycaster.intersectObjects(
      [...this.splineHelperObjects, this.cameraTargetHelperObject],
      false,
    );

    if (intersects.length > 0) {
      const object = intersects[0].object;

      if (object !== this.transformControl.object) {
        this.transformControl.attach(object);
      }
    }
  }
}
