import { PoseDetector } from './modules/core/posedetector.js';
import { PeerConnection } from './modules/core/peerconnection.js';
import { Player } from './modules/player/player.js';
import { Scene } from './modules/scene/scene.js';
import * as THREE from 'three';
import projectState from './media/OlosProject.theatre-project-state.json';

// audio
import { ToneMixer } from './modules/audio/tonemixer.js';

import {
  SCENENO,
  VIDEOURLS,
  VIDEOPOSEURLS,
  LIVE,
  NUMPLAYERS,
} from './modules/constants.js';

let poseDetector;
let peerConnection;
let myPlayer;
let remotePlayer;
let scene;

// let demoPose1;
// let demoPose2;

// audio
let toneMixer;

function init() {
  poseDetector = new PoseDetector();
  peerConnection = new PeerConnection();
  myPlayer = new Player(true);
  remotePlayer = new Player(false);
  scene = new Scene();

  // audio
  toneMixer = new ToneMixer(peerConnection);
  // toneMixer.setBPM(60, 1);

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
        myPlayer.video.getDemoVideo(VIDEOURLS[SCENENO][0]);
        myPlayer.setDemoPose(VIDEOPOSEURLS[SCENENO][0]);
        remotePlayer.video.getDemoVideo(VIDEOURLS[SCENENO][1]);
        remotePlayer.setDemoPose(VIDEOPOSEURLS[SCENENO][1]);

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
  requestAnimationFrame(runPoseDetection);
}

function animate() {
  if (myPlayer.pose !== null && remotePlayer.pose !== null) {
    myPlayer.drawCanvas();
    remotePlayer.drawCanvas();
    scene.updatePoses(myPlayer, remotePlayer);
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
