import { PoseDetector } from './modules/core/posedetector.js';
import { PeerConnection } from './modules/core/peerconnection.js';
import { Player } from './modules/player/player.js';
import { Scene } from './modules/scene/scene.js';
import * as THREE from 'three';

// audio
import { ToneMixer } from './modules/audio/tonemixer.js';

import {
  VIDEOURLS,
  VIDEOPOSEURLS,
  LIVE,
} from './modules/constants.js';

let poseDetector;
let peerConnection;
let myPlayer;
let remotePlayer;
let scene;

// audio
let toneMixer;

function init() {
  poseDetector = new PoseDetector();
  peerConnection = new PeerConnection();
  myPlayer = new Player(true);
  remotePlayer = new Player(false);
  scene = new Scene();
  toneMixer = new ToneMixer(peerConnection);

  if (LIVE) {
    poseDetector
      .init()
      .then((results) => {
        myPlayer.video.getVideoStream().then((results) => {
          peerConnection.init(true, myPlayer.canvasStream);
          peerConnection.connection.on('data', gotDataFromPeer);
          peerConnection.connection.on('stream', gotPartnerStream);
          scene.addPlayerVideo(
            0,
            myPlayer.canvas,
            new THREE.Vector3(-5, 1, 0),
          );
          scene.addPlayerVideo(
            1,
            remotePlayer.canvas,
            new THREE.Vector3(5, 1, 0),
          );
          runPoseDetection();
          animate();
        });
      })
      .catch((err) => console.error(err));
  }

  if (!LIVE) {
    poseDetector
      .init()
      .then((results) => {
        myPlayer.video.getDemoVideo(VIDEOURLS[0][0]);
        myPlayer.setDemoPose(VIDEOPOSEURLS[0][0]);
        remotePlayer.video.getDemoVideo(VIDEOURLS[0][1]);
        remotePlayer.setDemoPose(VIDEOPOSEURLS[0][1]);

        scene.addPlayerVideo(
          0,
          myPlayer.canvas,
          new THREE.Vector3(-5, 1, 0),
        );
        scene.addPlayerVideo(
          1,
          remotePlayer.canvas,
          new THREE.Vector3(5, 1, 0),
        );
        runPoseDetection();
        animate();
      })
      .catch((err) => console.error(err));
  }
}

async function runPoseDetection() {
  if (LIVE) {
    if (myPlayer.video.videoLoaded) {
      await myPlayer.getPose(poseDetector, peerConnection);
    }
  }

  if (!LIVE) {
    if (myPlayer.video.videoLoaded) {
      myPlayer.runDemoPose();
    }
    if (remotePlayer.video.videoLoaded) {
      remotePlayer.runDemoPose();
    }
  }

  if (myPlayer.pose !== null && remotePlayer.pose !== null) {
    myPlayer.drawCanvas();
    remotePlayer.drawCanvas();
    scene.updatePoses(myPlayer, remotePlayer);
  } else {
    // console.log('not drawing pose');
  }
  requestAnimationFrame(runPoseDetection);
}

function animate() {
  if (myPlayer.pose !== null && remotePlayer.pose !== null) {
    scene.animate();
    toneMixer.animate(myPlayer, remotePlayer);
  } else {
    // console.log('not drawing pose');
  }

  requestAnimationFrame(animate);
}

function gotDataFromPeer(data) {
  if (data.data.type === 'audio') {
    toneMixer.handleAudioControl(data.data.key);
  }

  if (data.data.type === 'pose') {
    if (LIVE) {
      remotePlayer.pose = data.data.poseData;
      remotePlayer.drawCanvas();
    }
  }
}

function gotPartnerStream(stream) {
  remotePlayer.video.setVideoStream(stream);
}

init();
