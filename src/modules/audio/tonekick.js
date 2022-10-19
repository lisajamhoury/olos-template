import * as Tone from 'tone';
import { ToneBaseInstrument } from './tonebaseinstrument.js';
import { kickVolumes, kickChances } from './toneparams.js';

class ToneKick extends ToneBaseInstrument {
  constructor() {
    super();

    // create the kick and connect to volume
    this.baseSound = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 12,
      envelope: {
        attack: 0.02 * Tone.Time('4n').toSeconds(),
        decay: 0.08 * Tone.Time('4n').toSeconds(),
        sustain: 0,
        release: 0.1 * Tone.Time('4n').toSeconds(),
      },
    }).connect(this.filter);

    // update delay
    this.updateDelayTime(2.0 * Tone.Time('4n').toSeconds());
    this.updateDelayFeedback(0.5);

    // update filter
    this.filter.type = 'lowpass';
    this.filter.Q.value = 5.0;
    // update frequency cutoff
    this.updateFilterFrequency(700);

    this.volumes = kickVolumes;

    this.chances = kickChances;

    this.currentEvent = null;
  }

  goToScene(newScene) {
    this.updateVolume(this.volumes[newScene]);

    // cancel all next scheduled repeats
    if (this.currentEvent != null) {
      this.currentEvent.dispose();
    }

    this.currentEvent = new Tone.ToneEvent((time, chord) => {
      this.updateFilterFrequency(500 + Math.random() * 200);
      if (Tone.Transport.position.split(':')[0] > 32) {
        this.baseSound.triggerAttackRelease(
          'B3',
          1.0 * Tone.Time('4n').toSeconds(),
          time,
        );
      }
    }, this.baseChord);

    this.currentEvent.probability = this.chances[newScene];
    this.currentEvent.playbackRate = 1.0;
    this.currentEvent.loop = true;
    // loopEnd is the length of the loop, as in, how often it loops
    this.currentEvent.loopEnd = 0.5 * Tone.Time('1m').toSeconds();
    this.currentEvent.start();
  }
}

export { ToneKick };
