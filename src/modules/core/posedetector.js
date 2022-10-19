import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as mpPose from '@mediapipe/pose';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`,
);
import * as posedetection from '@tensorflow-models/pose-detection';
import { ADDSEGMENTATION } from './../constants.js';

class PoseDetector {
  constructor() {
    this.detector = null;
  }

  // returns instance of blazepose detector
  async init() {
    const model = posedetection.SupportedModels.BlazePose;

    const detectorConfig = {
      runtime: 'mediapipe',
      enableSegmentation: ADDSEGMENTATION,
      modelType: 'full',
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`,
    };

    this.detector = await posedetection.createDetector(
      model,
      detectorConfig,
    );
  }

  // returns pose on video frame
  async getPose(video) {
    try {
      const estimationConfig = {
        maxPoses: 1,
        flipHorizontal: false,
      };
      return await this.detector.estimatePoses(
        video,
        estimationConfig,
      );
    } catch (error) {
      alert(error);
    }
  }
}

export { PoseDetector };
