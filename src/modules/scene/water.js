import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { types } from '@theatre/core';

export class WaterWrapper {
  constructor(scene, theatreWrapper) {
    this.scene = scene;

    const waterGeometry = new THREE.PlaneGeometry(100, 100);

    this.defaultParams = {
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: {
        r: 0.5294117647058824,
        g: 0.5372549019607843,
        b: 0.9450980392156862,
      },
      distortionScale: 5,
      waterLevel: -1.4,
      speed: 1,
      size: 50,
      visible: false,
    };

    this.speed = this.defaultParams.speed;

    this.water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        new URL('../../media/waternormals.jpg', import.meta.url),
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
      ),
      fog: scene.fog !== undefined,
      ...this.defaultParams,
    });

    this.water.rotation.x = -Math.PI / 2;
    this.scene.add(this.water);

    const sheets = theatreWrapper.sheets;
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      let params = structuredClone(this.defaultParams);
      const animatedObj = sheet.object('Water', {
        distortionScale: types.number(params.speed, {
          range: [0, 10],
        }),
        // sunDirection: new THREE.Vector3(),
        // sunColor: 0xffffff,
        waterColor: types.rgba({ r: 255, g: 0, b: 0, a: 1 }),
        waterLevel: types.number(params.waterLevel, {
          range: [-10, 10],
        }),
        speed: types.number(params.speed, { range: [0, 10] }),
        size: types.number(params.size, { range: [0, 500] }),
        visible: types.boolean(params.visible),
      });
      const onUpdate = (values) => {
        params = {
          ...params,
          ...values,
        };
        this.onParameterUpdate(params);
      };
      animatedObj.onValuesChange(onUpdate);
      theatreWrapper.addObject(i, onUpdate);
    }
  }

  onParameterUpdate(params) {
    this.water.visible = params.visible;

    const uniforms = this.water.material.uniforms;
    uniforms['size'].value = params.size;
    uniforms['distortionScale'].value = params.distortionScale;
    uniforms['waterColor'].value.setRGB(
      params.waterColor.r,
      params.waterColor.g,
      params.waterColor.b,
    );

    this.speed = params.speed;
    this.water.position.y = params.waterLevel;
  }

  update(deltaTime) {
    this.water.material.uniforms['time'].value +=
      (deltaTime / 10000) * this.speed;
  }
}
