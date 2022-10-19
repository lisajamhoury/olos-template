import * as Tone from 'tone';
import { ToneBaseInstrument } from './tonebaseinstrument.js';
import { hihatGain, hihatChance } from './toneparams.js';

class ToneHihat extends ToneBaseInstrument {
  constructor() {
    super();

    // then we create the hihat base sound
    // and connect to filter
    this.baseSound = new Tone.NoiseSynth({
      envelope: {
        // duration of the hihat
        attack: 0.1 * Tone.Time('4n').toSeconds(),
        decay: 0.1 * Tone.Time('4n').toSeconds(),
        sustain: 0,
        release: 0.1 * Tone.Time('4n').toSeconds(),
      },
    }).connect(this.filter);

    // update delay
    this.updateDelayTime(2.0 * Tone.Time('4n').toSeconds());
    this.updateDelayFeedback(0.2);

    // update filter
    this.filter.type = 'bandpass';
    this.filter.Q.value = 5.0;

    // update frequency cutoff
    this.updateFilterFrequency(8000);

    this.gain = hihatGain;

    this.chance = hihatChance;

    this.currentEvent = null;

    this.baseChord = null;
  }

  goToScene(newScene) {
    this.updateGain(this.gain);

    // cancel all next scheduled repeats
    if (this.currentEvent != null) {
      this.currentEvent.cancel(Tone.now());
    }

    this.currentEvent = new Tone.ToneEvent((time, chord) => {
      if (Tone.Transport.position.split(':')[0] >= 48) {
        this.updateFilterFrequency(10000 + Math.random() * 3000);
        this.baseSound.triggerAttackRelease(
          // first parameter is commented out because no note for noise
          // chord
          1.0 * Tone.Time('4n').toSeconds(),
          time,
        );
      }
    }, this.baseChord);

    this.currentEvent.probability = this.chances;
    this.currentEvent.playbackRate = 1.0;
    this.currentEvent.loop = true;
    // loopEnd is the length of the loop, as in, how often it loops
    this.currentEvent.loopEnd = 0.25 * Tone.Time('1m').toSeconds();
    this.currentEvent.start(Tone.now());
  }
}

export { ToneHihat };
