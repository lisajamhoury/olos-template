import {
  ADDSEGMENTATION,
  CANVASH,
  CANVASW,
  DEBUGPOSE,
  DEBUGVIDEO,
  DIVISOR,
  SENDDATA,
  VIDEOH,
  VIDEOW,
} from './../constants.js';

import { PlayerVideo } from './playervideo.js';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

class Player {
  constructor(local) {
    this.video = new PlayerVideo();
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.canvasStream = this.canvas.captureStream(); //pass fps?
    this.pose = null;
    this.normalizedPose = null;
    this.local = local;

    // for playing back data
    this.liveData = false;
    this.recordedPositions;
    this.currentPosition = null;
    this.posIndex = 0;
    this.posTime = 0;
  }

  setDemoPose(demoPoseData) {
    this.recordedPositions = demoPoseData;
  }

  runDemoPose() {
    if (this.pose === null) {
      this.pose = this.recordedPositions[this.posIndex].pose;
      this.posIndex++;
      this.posTime = Date.now();
    } else {
      const timeBtwRecords =
        this.recordedPositions[this.posIndex].timeStamp -
        this.recordedPositions[this.posIndex - 1].timeStamp;
      const timeElapsed = Date.now() - this.posTime;

      if (timeElapsed > timeBtwRecords) {
        this.pose = this.recordedPositions[this.posIndex].pose;
        this.posTime = Date.now();

        if (
          this.posIndex <
          Object.keys(this.recordedPositions).length - 1
        ) {
          this.posIndex++;
        } else {
          this.posIndex = 1;
        }
      }
    }
    this.normalizedPose = this.normalizePose(this.pose);
  }

  getPose(poseDetector, peerConnection) {
    poseDetector.getPose(this.video.video).then((results) => {
      const poses = results;
      if (poses.length > 0) {
        this.pose = poses;
        this.normalizedPose = this.normalizePose(this.pose);
        if (
          SENDDATA &&
          peerConnection.connection.isConnectionStarted()
        ) {
          const dataToSend = {
            type: 'pose',
            poseData: this.pose,
          };
          peerConnection.connection.send(dataToSend);
        }
      }
    });
  }

  async drawSegmentationMask(segmentation) {
    const gl = window.exposedContext;
    if (gl)
      gl.readPixels(
        0,
        0,
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array(4),
      );

    const data = await bodySegmentation.toBinaryMask(
      segmentation,
      { r: 0, g: 0, b: 0, a: 0 },
      { r: 180, g: 160, b: 130, a: 255 },
      false,
      0.5,
    );

    await bodySegmentation.drawMask(
      this.canvas,
      this.video.video,
      data,
      1.0,
      0.0,
    );
  }

  normalizePose(pose) {
    const imageSize = {
      height: VIDEOH,
      width: VIDEOW,
    };

    return posedetection.calculators.keypointsToNormalizedKeypoints(
      pose[0].keypoints,
      imageSize,
    );
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.width = CANVASW;
    canvas.height = CANVASH;
    canvas.style = 'top: 0;';

    return canvas;
  }

  drawCanvas() {
    if (DEBUGVIDEO) {
      this.ctx.drawImage(this.video.video, 0, 0, CANVASW, CANVASH);
    } else {
      this.ctx.fillStyle = 'Black';
      this.ctx.fillRect(0, 0, CANVASW, CANVASH);
    }

    if (ADDSEGMENTATION && this.local) {
      console.log('im working');
      this.drawSegmentationMask(this.pose[0].segmentation);
    }

    if (DEBUGPOSE) this.drawResults(this.pose);
  }

  drawResults(poses) {
    for (const pose of poses) {
      this.drawResult(pose);
    }
  }

  drawResult(pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints, pose.id);
    }
  }

  drawKeypoints(keypoints) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      posedetection.SupportedModels.BlazePose,
    );
    this.ctx.fillStyle = 'Red';
    this.ctx.strokeStyle = 'White';
    this.ctx.lineWidth = 2;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = 'Green';
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = 'Orange';
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = 0.65 || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(
        keypoint.x / DIVISOR,
        keypoint.y / DIVISOR,
        4,
        0,
        2 * Math.PI,
      );
      this.ctx.fill(circle);
      this.ctx.stroke(circle);
    }
  }
  drawSkeleton(keypoints, poseId) {
    const color = 'White';
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    posedetection.util
      .getAdjacentPairs(posedetection.SupportedModels.BlazePose)
      .forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;
        const scoreThreshold = 0.65 || 0;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
          this.ctx.beginPath();
          this.ctx.moveTo(kp1.x / DIVISOR, kp1.y / DIVISOR);
          this.ctx.lineTo(kp2.x / DIVISOR, kp2.y / DIVISOR);
          this.ctx.stroke();
        }
      });
  }
}

export { Player };
