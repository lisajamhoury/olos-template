import * as THREE from 'three';
import { Sky } from './sky/Sky.js';

import { types } from '@theatre/core'



export class SkyWrapper {
    constructor(scene, renderer, theatreWrapper) {
        this.scene = scene;

        // Add Sky
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);

        this.sunPosition = new THREE.Vector3();

        this.pmremGenerator = new THREE.PMREMGenerator(renderer);

        this.renderTarget = this.pmremGenerator.fromScene(this.sky);
        this.scene.environment = this.renderTarget.texture;

        this.defaultParams = {
            phi: 2,
            theta: 160,
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7
        };

        const sheets = theatreWrapper.sheets;
        for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i];
            let params = structuredClone(this.defaultParams);
            const animatedObj = sheet.object('Sky', {
                phi: types.number(params.phi, { range: [-10, 90.0], label: "elevation" }),
                theta: types.number(params.theta, { range: [-180, 180], label: "azimuth" }),
                turbidity: types.number(params.turbidity, { range: [0.0, 20.0] }),
                rayleigh: types.number(params.rayleigh, { range: [0.0, 4.0] }),
                mieCoefficient: types.number(params.mieCoefficient, { range: [0.0, 0.1] }),
                mieDirectionalG: types.number(params.mieDirectionalG, { range: [0.0, 1.0] }),
            })
            const onUpdate = (values) => {
                params = {
                    ...params,
                    ...values
                };
                this.onParameterUpdate(params);
            };
            animatedObj.onValuesChange(onUpdate)
            theatreWrapper.addObject(i, onUpdate)
        }




    }
    onParameterUpdate(params) {
        const uniforms = this.sky.material.uniforms;
        uniforms['turbidity'].value = params.turbidity;
        uniforms['rayleigh'].value = params.rayleigh;
        uniforms['mieCoefficient'].value = params.mieCoefficient;
        uniforms['mieDirectionalG'].value = params.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - params.phi);
        const theta = THREE.MathUtils.degToRad(params.theta);

        this.sunPosition.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(this.sunPosition);

        if (this.renderTarget !== undefined) this.renderTarget.dispose();

        this.renderTarget = this.pmremGenerator.fromScene(this.sky);

        this.scene.environment = this.renderTarget.texture;

    }





}
