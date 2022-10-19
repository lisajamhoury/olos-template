import * as Tone from 'tone';
import { SENDDATA } from './../constants.js';
import { ToneHihat } from './tonehihat.js';
import { ToneKick } from './tonekick.js';
import { TonePad } from './tonepad.js';
import { ToneMelody } from './tonemelody.js';
import { globalBPM } from './toneparams.js';

class ToneMixer {
  constructor(peerConnection) {
    this.peerConnection = peerConnection;
    // boolean for user action for turning on
    this.isAudioOn = false;

    // instances of the instruments
    this.hihat = new ToneHihat();
    this.kick = new ToneKick();
    this.pad = new TonePad();
    this.melody = new ToneMelody();

    // declare reverb for all instruments
    this.reverb = new Tone.Reverb(2).toDestination();

    // array of all the instruments
    this.instruments = [this.hihat, this.kick, this.pad, this.melody];

    // go through all the instruments and connect them to reverb
    this.instruments.forEach((instrument) => {
      if (instrument != null) {
        instrument.delay.connect(this.reverb);
      }
    });

    // x for audio start/stop
    document.addEventListener('keydown', (event) => {
      // x for audio start/stop
      this.handleOpenAudio(event.key);
      // number 1-3 for scene 1-3, 0 for beginning, 4 for end
      // this.handleSceneAudio(event.key);
      this.sendAudioControl(event.key);
    });

    this.distancesNoseLeftElbow = [0, 0];
    this.distancesElbows = [0, 0];
  }

  sendAudioControl(key) {
    if (
      SENDDATA &&
      this.peerConnection.connection.isConnectionStarted()
    ) {
      const dataToSend = {
        type: 'audio',
        key: key,
      };
      this.peerConnection.connection.send(dataToSend);
    }
  }

  handleAudioControl(key) {
    if (key === 'x') {
      this.handleOpenAudio(key);
    }
    // if (['0', '1', '2', '3', '4'].includes(key)) {
    //   this.handleSceneAudio(key);
    // }
  }

  async handleOpenAudio(key) {
    // toggle on and off with x
    if (key === 'x') {
      await Tone.start();
      Tone.Transport.bpm.rampTo(globalBPM, '1m');
      if (
        Tone.Transport.state === 'paused' ||
        Tone.Transport.state === 'stopped'
      ) {
        this.init();
      } else if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
      }
    }
  }

  updateReverbDecayTime(newReverbTime, rampTime) {
    this.reverb.decay.rampTo(newReverbTime, rampTime);
  }

  init() {
    Tone.Transport.position = 0;
    Tone.Transport.start();

    this.instruments.forEach((instrument) => {
      if (instrument != null) {
        instrument.init();
      }
    });
  }

  animate(player1, player2) {
    if (player1.pose[0].hasOwnProperty('keypoints3D')) {
      const keypoints = player1.pose[0].keypoints3D;
      if (keypoints[0].score > 0.8) {
        // retrieve distance between nose and left elbow
        // nose is keypoints[0], left elbow is keypoints[13]
        this.distancesNoseLeftElbow[0] = Math.abs(
          keypoints[0].x - keypoints[13].x,
        );
        this.distancesElbows[0] = Math.abs(
          keypoints[13].x - keypoints[14].x,
        );
      }
    }

    if (player2.pose[0].hasOwnProperty('keypoints3D')) {
      const keypoints = player2.pose[0].keypoints3D;
      // console.log(keypoints);
      if (keypoints[0].score > 0.8) {
        // retrieve distance between nose and left elbow
        // nose is keypoints[0], left elbow is keypoints[13]
        this.distancesNoseLeftElbow[1] = Math.abs(
          keypoints[0].x - keypoints[13].x,
        );
        this.distancesNoseLeftElbow[1] = Math.abs(
          keypoints[13].x - keypoints[14].x,
        );
      }
    }

    if (Tone.Transport.position.split(':')[0] > 4) {
      let nextDelayTime =
        0.5 * this.distancesNoseLeftElbow[0] +
        this.distancesNoseLeftElbow[1];
      this.pad.updateDelayFeedback(nextDelayTime);
    }

    if (Tone.Transport.position.split(':')[0] > 8) {
      let nextDelayTime =
        1.0 * this.distancesElbows[0] + this.distancesElbows[1];
      this.melody.updateDelayTime(nextDelayTime);
      this.melody.updateDelayFeedback(nextDelayTime);
    }

    if (Tone.Transport.position.split(':')[0] > 16) {
      let nextDelayTime =
        0.5 * this.distancesElbows[0] + this.distancesElbows[1];
      this.kick.updateDelayTime(nextDelayTime);
      this.kick.updateDelayFeedback(nextDelayTime);
    }
  }
}

export { ToneMixer };
