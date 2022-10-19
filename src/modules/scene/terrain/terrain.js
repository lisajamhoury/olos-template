import * as THREE from 'three';

import { Terrain } from './THREE.Terrain';

const TERRAIN_SIZE = 256;
const TERRAIN_HEIGHTMAP_URL = new URL(
  '../../../media/heightmap.png',
  import.meta.url,
);

export class Terrain {
  constructor(scene) {
    this.scene = scene;

    // make material
    const textureLoader = new THREE.TextureLoader();
    const scale = 100;

    const map = textureLoader.load(
      new URL(
        '../../../media/ground-textures/Ground033_1K_Color.jpg',
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
        '../../../media/ground-textures/Ground033_1K_NormalGL.jpg',
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
    // const mesh = new THREE.Mesh(geo, mat);
    // mesh.rotateX(-Math.PI / 2);
    // mesh.position.y = -1.5;
    // mesh.receiveShadow = true;
    // this.scene.add(mesh);

    const img = document.createElement('img');
    img.src = TERRAIN_HEIGHTMAP_URL;
    const canvas = document.createElement('canvas');
    canvas.height = canvas.width = TERRAIN_SIZE;

    const ctx = canvas.getContext('2d');

    img.addEventListener('load', (e) => {
      ctx.drawImage(img, 0, 0, TERRAIN_SIZE, TERRAIN_SIZE);

      let terrainScene = THREE.Terrain({
        easing: THREE.Terrain.Linear,
        frequency: 2.5,
        heightmap: canvas,
        material: mat,
        maxHeight: 100,
        minHeight: -100,
        steps: 1,
        xSegments: 256,
        xSize: 2048,
        ySegments: 256,
        ySize: 2048,
      });

      terrainScene.children.forEach((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      terrainScene.position.y = 30;
      this.scene.add(terrainScene);
    });
  }
}
