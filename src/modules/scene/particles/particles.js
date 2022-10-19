import * as THREE from 'three';
// var settings = require('./settings');
var shaderParse = require('./shaderParse');

import particlesVert from './glsl/particles.vert';
import particlesFrag from './glsl/particles.frag';

import particlesDepthVert from './glsl/particlesDepth.vert';
import particlesDepthFrag from './glsl/particlesDepth.frag';

import particlesAdditiveVert from './glsl/particlesAdditive.vert';
import particlesAdditiveFrag from './glsl/particlesAdditive.frag';

import blurHFrag from './glsl/blurH.frag';
import blurVFrag from './glsl/blurV.frag';

export default class Particles {
  constructor(renderer, camera, simulator) {
    this.simulator = simulator;
    // console.log('simulator in particles object:', simulator);

    this.mesh = undefined;

    this.depthRenderTarget;

    this.camera = camera;
    this.renderer = renderer;
    this.particleGeometry;

    this.quadCamera = new THREE.Camera();
    this.quadCamera.position.z = 1;
    this.quadScene = new THREE.Scene();

    this.particles;
    this.particlesMaterial;
    this.particlesScene = new THREE.Scene();

    this.additiveRenderTarget;

    this.blurHMaterial;
    this.blurVMaterial;
    this.blurRenderTarget;

    this.resolution = new THREE.Vector2();
    this.width;
    this.height;
    this.baseInset = 0.5;
    this.particleSize = 21;
    this.inset = 0.5;
    this.insetExtra = 0;
    this.blur = 1;
    this.washout = 0.7;
    this.blurZ = 0.8;

    this.sphereTextures = {};

    this.TEXTURE_WIDTH = 128;
    this.TEXTURE_HEIGHT = 128;
    this.AMOUNT = this.TEXTURE_WIDTH * this.TEXTURE_HEIGHT;

    this.init();
  }

  init() {
    this.textureLoader = new THREE.TextureLoader();

    this.initGeometry();
    this.initDepthRenderTarget();
    this.initAdditiveRenderTarget();
    this.initBlurRenderTarget();

    this.particles = new THREE.Points(
      this.particleGeometry,
      this.additiveRenderTarget.material,
    );
    this.particles.frustumCulled = false;
    this.particlesScene.add(this.particles);
    // console.log('Created particles:', this.particles);

    this.addSphereTexture(
      'default',
      new URL('./images/matcap-water.jpg', import.meta.url),
    );
    this.addSphereTexture(
      'metal',
      new URL('./images/matcap.jpg', import.meta.url),
    );
    this.addSphereTexture(
      'plastic',
      new URL('./images/matcap_plastic.jpg', import.meta.url),
    );

    // _addSphereTexture('default', quickLoader.add('images/matcap.jpg', {onLoad: _onSphereMapLoad.bind('default')}).content);
    // _addSphereTexture('metal', settings.sphereMap);
    // _addSphereTexture('plastic', quickLoader.add('images/matcap_plastic.jpg', {onLoad: _onSphereMapLoad.bind('plastic')}).content);
    // const texture = new THREE.TextureLoader().load(
    //     new URL('../../media/alphaMap.png', import.meta.url),
    // );
    // console.log(texture);
    // var texture = (sphereTextures['default'] = new THREE.Texture());
    // texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    // texture.flipY = false;
    // this.sphereTextures['default'] = texture;
    // return texture;
    // sphereTextures.metal.needsUpdate = true;

    // quickLoader.start();

    var geomtry = new THREE.PlaneBufferGeometry(2, 2);
    this.particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDepth: { type: 't', value: this.depthRenderTarget.texture },
        uInset: { type: 'f', value: 0 },
        uWashout: { type: 'f', value: 0 },
        uAdditive: {
          type: 't',
          value: this.additiveRenderTarget.texture,
        },
        uSphereMap: { type: 't', value: this.sphereTextures.default },
        uResolution: { type: 'v2', value: this.resolution },
        uFogColor: { type: 'c', value: new THREE.Color() },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: shaderParse(particlesVert),
      fragmentShader: shaderParse(particlesFrag),
      glslVersion: THREE.GLSL1,
    });
    this.mesh = new THREE.Mesh(geomtry, this.particlesMaterial);
    this.quadScene.add(this.mesh);
  }

  addSphereTexture(id, url) {
    var texture = this.textureLoader.load(url);
    texture.anisotropy =
      this.renderer.capabilities.getMaxAnisotropy();
    texture.flipY = false;
    texture.needsUpdate = true;
    this.sphereTextures[id] = texture;
  }

  initGeometry() {
    var position = new Float32Array(this.AMOUNT * 3);
    var i3;
    for (var i = 0; i < this.AMOUNT; i++) {
      i3 = i * 3;
      position[i3 + 0] =
        ((i % this.TEXTURE_WIDTH) + 0.5) / this.TEXTURE_WIDTH;
      position[i3 + 1] =
        (~~(i / this.TEXTURE_WIDTH) + 0.5) / this.TEXTURE_HEIGHT;
      position[i3 + 2] = 400 + Math.pow(Math.random(), 5) * 750; // size
    }
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(position, 3),
    );
  }

  initDepthRenderTarget() {
    var material = new THREE.ShaderMaterial({
      uniforms: {
        uParticleSize: { type: 'f', value: this.particleSize },
        uTexturePosition: { type: 't', value: undefined },
        uTexturePrevPosition: { type: 't', value: undefined },
        uCameraPosition: { type: 'v3', value: this.camera.position },
        uPrevModelViewMatrix: {
          type: 'm4',
          value: new THREE.Matrix4(),
        },
        uMotionMultiplier: { type: 'f', value: 0.1 },
      },
      vertexShader: shaderParse(particlesDepthVert),
      fragmentShader: shaderParse(particlesDepthFrag),
      blending: THREE.NoBlending,
      glslVersion: THREE.GLSL1,
    });

    this.depthRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
    });
    this.depthRenderTarget.material = material;
  }

  initAdditiveRenderTarget() {
    var material = new THREE.ShaderMaterial({
      uniforms: {
        uParticleSize: { type: 'f', value: this.particleSize },
        uTexturePosition: { type: 't', value: undefined },
        uDepth: { type: 't', value: this.depthRenderTarget.texture },
        uInset: { type: 'f', value: 0 },
        uResolution: { type: 'v2', value: this.resolution },
        uCameraPosition: { type: 'v3', value: this.camera.position },
      },
      vertexShader: shaderParse(particlesAdditiveVert),
      fragmentShader: shaderParse(particlesAdditiveFrag),

      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      glslVersion: THREE.GLSL1,
    });

    this.additiveRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthWrite: false,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.additiveRenderTarget.material = material;
  }

  initBlurRenderTarget() {
    this.blurHMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: {
          type: 't',
          value: this.additiveRenderTarget.texture,
        },
        uResolution: { type: 'v2', value: this.resolution },
        uOffset: { type: 'f', value: 0 },
        uBlurZ: { type: 'f', value: 0 },
      },
      vertexShader: shaderParse(particlesVert),
      fragmentShader: shaderParse(blurHFrag),
      transparent: true,
      blending: THREE.NoBlending,
      glslVersion: THREE.GLSL1,
    });

    this.blurRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
    });

    this.blurVMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: 't', value: this.blurRenderTarget.texture },
        uResolution: { type: 'v2', value: this.resolution },
        uOffset: { type: 'f', value: 0 },
        uBlurZ: { type: 'f', value: 0 },
      },
      vertexShader: shaderParse(particlesVert),
      fragmentShader: shaderParse(blurVFrag),
      transparent: true,
      blending: THREE.NoBlending,
      glslVersion: THREE.GLSL1,
    });
  }

  resize(width, height) {
    // console.log(`Resizing to ${width} x ${height}`);
    this.width = width;
    this.height = height;
    this.resolution.set(width, height);

    this.depthRenderTarget.setSize(width, height);
    this.additiveRenderTarget.setSize(width, height);
    this.blurRenderTarget.setSize(width, height);
  }

  preRender() {
    // store renderer settings so we can restore later
    const autoClearColor = this.renderer.autoClearColor;
    const currentRenderTarget = this.renderer.getRenderTarget();
    let clearColor = new THREE.Color();
    this.renderer.getClearColor(clearColor);
    clearColor = clearColor.getHex();
    const clearAlpha = this.renderer.getClearAlpha();

    // console.log(this.simulator.prevPositionRenderTarget)
    // console.log(this.simulator);

    this.renderer.setClearColor(0, 1);
    this.renderer.setRenderTarget(this.depthRenderTarget);
    // this.renderer.setRenderTarget(null)
    this.renderer.clear(true, true, true);
    // this.renderer.clearTarget(this.depthRenderTarget, true, true, true);
    // console.log(this.depthRenderTarget.material.uniforms);
    this.particles.material = this.depthRenderTarget.material;
    this.depthRenderTarget.material.uniforms.uTexturePrevPosition.value =
      this.simulator.prevPositionRenderTarget.texture;
    this.depthRenderTarget.material.uniforms.uTexturePosition.value =
      this.simulator.positionRenderTarget.texture;
    this.depthRenderTarget.material.uniforms.uParticleSize.value =
      this.particleSize;
    this.renderer.render(this.particlesScene, this.camera);
    // this.renderer.render( this.particlesScene, this.camera );

    // if(!motionBlur.skipMatrixUpdate) {
    //     this.depthRenderTarget.material.uniforms.uPrevModelViewMatrix.value.copy(this.particles.modelViewMatrix);
    // }

    this.baseInset += (this.inset - this.baseInset) * 0.05;

    this.renderer.setClearColor(0, 0);
    this.renderer.setRenderTarget(this.additiveRenderTarget);
    this.renderer.clear();
    // this.renderer.clearTarget(this.additiveRenderTarget, true, true, true);
    this.particles.material = this.additiveRenderTarget.material;
    this.additiveRenderTarget.material.uniforms.uInset.value =
      this.baseInset + this.insetExtra;
    this.additiveRenderTarget.material.uniforms.uParticleSize.value =
      this.particleSize;
    this.additiveRenderTarget.material.uniforms.uTexturePosition.value =
      this.simulator.positionRenderTarget.texture;
    this.renderer.render(this.particlesScene, this.camera);

    var blurRadius = this.blur;

    if (blurRadius) {
      var uniforms = this.blurHMaterial.uniforms;
      uniforms.uOffset.value +=
        (blurRadius / this.width - uniforms.uOffset.value) * 0.05;
      uniforms.uBlurZ.value +=
        (this.blurZ - uniforms.uBlurZ.value) * 0.05;

      uniforms = this.blurVMaterial.uniforms;
      uniforms.uOffset.value +=
        (blurRadius / this.height - uniforms.uOffset.value) * 0.05;
      uniforms.uBlurZ.value +=
        (this.blurZ - uniforms.uBlurZ.value) * 0.05;

      this.renderer.setRenderTarget(this.blurRenderTarget);
      this.renderer.clear();
      this.mesh.material = this.blurHMaterial;
      this.renderer.render(this.quadScene, this.quadCamera);

      this.renderer.setRenderTarget(this.additiveRenderTarget);
      this.renderer.clear();
      this.mesh.material = this.blurVMaterial;
      this.renderer.render(this.quadScene, this.quadCamera);
      this.mesh.material = this.particlesMaterial;
    }

    this.renderer.setRenderTarget(currentRenderTarget);

    this.renderer.setClearColor(clearColor, clearAlpha);
    this.renderer.autoClearColor = autoClearColor;
    this.renderer.setViewport(0, 0, this.width, this.height);
  }

  update() {
    var autoClearColor = this.renderer.autoClearColor;

    let clearColor = new THREE.Color();
    this.renderer.getClearColor(clearColor);
    clearColor = clearColor.getHex();
    var clearAlpha = this.renderer.getClearAlpha();

    this.renderer.autoClearColor = false;
    this.renderer.setRenderTarget(null);
    // this.renderer.clear(true,true,true);

    var uniforms = this.particlesMaterial.uniforms;
    uniforms.uSphereMap.value = this.sphereTextures['default'];
    uniforms.uInset.value =
      this.additiveRenderTarget.material.uniforms.uInset.value;
    uniforms.uWashout.value +=
      (this.washout - uniforms.uWashout.value) * 0.05;

    this.renderer.render(this.quadScene, this.quadCamera);

    this.renderer.setClearColor(clearColor, clearAlpha);
    this.renderer.autoClearColor = autoClearColor;
  }
}
