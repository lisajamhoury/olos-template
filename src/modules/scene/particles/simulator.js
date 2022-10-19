import * as THREE from 'three';

var shaderParse = require('./shaderParse');

import quadVert from './glsl/quad.vert';
import copyFrag from './glsl/through.frag';
import positionFrag from './glsl/position.frag';

export default class Simulator {
  constructor(renderer) {
    this.renderer = renderer;

    // shaders = materials = programs
    this.copyShader;
    this.positionShader;

    // textures
    this.textureDefaultPosition;
    this.positionRenderTarget;
    this.positionRenderTarget2;

    //
    this.mesh;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.camera.position.z = 1;

    //
    this.speed = 1;
    this.curlSize = 0.02;
    this.dieSpeed = 0.015;
    this.radius = 0.5;
    this.attraction = -0.5;

    //
    this.TEXTURE_WIDTH = 128;
    this.TEXTURE_HEIGHT = 128;
    this.AMOUNT = this.TEXTURE_WIDTH * this.TEXTURE_HEIGHT;
    // console.log(this.AMOUNT);

    //
    this.initAnimation = 1;
    this.init();
  }

  init() {
    var rawShaderPrefix =
      'precision ' +
      this.renderer.capabilities.precision +
      ' float;\n';

    var gl = this.renderer.getContext();
    if (!gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) {
      alert('No support for vertex shader textures!');
      return;
    }

    this.copyShader = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: {
          type: 'v2',
          value: new THREE.Vector2(
            this.TEXTURE_WIDTH,
            this.TEXTURE_HEIGHT,
          ),
        },
        texture: { type: 't', value: undefined },
      },
      vertexShader: rawShaderPrefix + shaderParse(quadVert),
      fragmentShader: rawShaderPrefix + shaderParse(copyFrag),
      glslVersion: THREE.GLSL1,
    });

    // console.log(rawShaderPrefix + shaderParse(quadVert));
    this.positionShader = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: {
          type: 'v2',
          value: new THREE.Vector2(
            this.TEXTURE_WIDTH,
            this.TEXTURE_HEIGHT,
          ),
        },
        texturePosition: { type: 't', value: undefined },
        textureDefaultPosition: { type: 't', value: undefined },
        mouse3d: { type: 'v3', value: new THREE.Vector3() },
        attractorPos1: { type: 'v3', value: new THREE.Vector3() },
        attractorPos2: { type: 'v3', value: new THREE.Vector3() },
        attractorPos3: { type: 'v3', value: new THREE.Vector3() },
        attractorPos4: { type: 'v3', value: new THREE.Vector3() },
        speed: { type: 'f', value: 0 },
        dieSpeed: { type: 'f', value: 0 },
        deltaDistance: { type: 'f', value: 0 },
        radius: { type: 'f', value: 0 },
        attraction: { type: 'f', value: 0 },
        time: { type: 'f', value: 0 },
        initAnimation: { type: 'f', value: 1 },
        curlSize: { type: 'f', value: 0.015 },
      },
      vertexShader: rawShaderPrefix + shaderParse(quadVert),
      fragmentShader: rawShaderPrefix + shaderParse(positionFrag),
      blending: THREE.NoBlending,
      transparent: false,
      depthWrite: false,
      depthTest: false,
      glslVersion: THREE.GLSL1,
    });

    this.mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 2),
      this.copyShader,
    );
    this.scene.add(this.mesh);

    this.positionRenderTarget = new THREE.WebGLRenderTarget(
      this.TEXTURE_WIDTH,
      this.TEXTURE_HEIGHT,
      {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthWrite: false,
        depthBuffer: false,
        stencilBuffer: false,
      },
    );
    this.positionRenderTarget2 = this.positionRenderTarget.clone();
    this.copyTexture(
      this.createPositionTexture(),
      this.positionRenderTarget,
    );
    this.copyTexture(
      this.positionRenderTarget,
      this.positionRenderTarget2,
    );
  }

  copyTexture(input, output) {
    // set up the copy
    this.mesh.material = this.copyShader;
    this.copyShader.uniforms.texture.value = input;

    // do the copy
    const currentRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(output);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(currentRenderTarget);
  }

  updatePosition(dt) {
    // console.log('Updating particle positions!');
    // swap
    var tmp = this.positionRenderTarget;
    this.positionRenderTarget = this.positionRenderTarget2;
    this.positionRenderTarget2 = tmp;

    // do the position update in the positionshader material
    this.mesh.material = this.positionShader;
    this.positionShader.uniforms.textureDefaultPosition.value =
      this.textureDefaultPosition.texture;
    this.positionShader.uniforms.texturePosition.value =
      this.positionRenderTarget2.texture;
    // this.positionShader.uniforms.deltaDistance.value =
    //   deltaDistance;
    this.positionShader.uniforms.time.value += dt * 0.0001;

    // render to the position texture
    this.renderer.setRenderTarget(this.positionRenderTarget);
    this.renderer.render(this.scene, this.camera);

    // restore original render target (null == canvas)
    this.renderer.setRenderTarget(null);
  }

  createPositionTexture() {
    var positions = new Float32Array(this.AMOUNT * 4);
    var i4;
    var r, phi, theta;
    for (var i = 0; i < this.AMOUNT; i++) {
      i4 = i * 4;
      r = (0.5 + Math.random() * 0.5) * 75;
      phi = (Math.random() - 0.5) * Math.PI;
      theta = Math.random() * Math.PI * 2;
      positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi);
      positions[i4 + 1] = r * Math.sin(phi);
      positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi);
      positions[i4 + 3] = Math.random();
    }
    var texture = new THREE.DataTexture(
      positions,
      this.TEXTURE_WIDTH,
      this.TEXTURE_HEIGHT,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    this.textureDefaultPosition = texture;
    return texture;
  }

  update(
    dt,
    attractorPos1,
    attractorPos2,
    attractorPos3,
    attractorPos4,
  ) {
    var deltaRatio = dt / 16.6667;
    // console.log(dt);

    dt = dt * this.speed;

    if (this.speed || this.dieSpeed) {
      var autoClearColor = this.renderer.autoClearColor;

      var clearColor = new THREE.Color();
      this.renderer.getClearColor(clearColor);
      clearColor = clearColor.getHex();
      var clearAlpha = this.renderer.getClearAlpha();

      this.renderer.autoClearColor = false;

      this.positionShader.uniforms.curlSize.value = this.curlSize;
      this.positionShader.uniforms.dieSpeed.value =
        this.dieSpeed * deltaRatio;
      this.positionShader.uniforms.radius.value = this.radius;
      this.positionShader.uniforms.attraction.value =
        this.attraction * this.speed * deltaRatio;
      this.positionShader.uniforms.speed.value =
        this.speed * deltaRatio;
      this.positionShader.uniforms.initAnimation.value =
        this.initAnimation;

      // this.positionShader.uniforms.mouse3d.value.copy(position);
      this.positionShader.uniforms.attractorPos1.value.copy(
        attractorPos1,
      );
      this.positionShader.uniforms.attractorPos2.value.copy(
        attractorPos2,
      );
      this.positionShader.uniforms.attractorPos3.value.copy(
        attractorPos3,
      );
      this.positionShader.uniforms.attractorPos4.value.copy(
        attractorPos4,
      );
      this.updatePosition(dt);

      this.renderer.setClearColor(clearColor, clearAlpha);
      this.renderer.autoClearColor = autoClearColor;

      this.positionRenderTarget = this.positionRenderTarget;
      this.prevPositionRenderTarget = this.positionRenderTarget2;
    }
  }
}
