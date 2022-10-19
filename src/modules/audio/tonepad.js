import * as Tone from 'tone';
import { ToneBaseInstrument } from './tonebaseinstrument.js';
import { padVolumes, padChances } from './toneparams.js';
import { ToneNotesGenerator } from './tonenotesgenerator.js';

class TonePad extends ToneBaseInstrument {
  constructor() {
    super();

    this.baseSound = new Tone.PolySynth(Tone.FMSynth, {
      oscillator: {
        partialCount: [0],
      },
    }).connect(this.filter);

    this.baseSound.set({
      envelope: {
        attack: 1.0 * Tone.Time('1m').toSeconds(),
        decay: 0.5 * Tone.Time('1m').toSeconds(),
        sustain: 0.3,
        release: 2.0 * Tone.Time('1m').toSeconds(),
      },
    });

    // update filter frequency cutoff
    this.updateFilterFrequency(700);

    // update filter rolloff
    this.updateFilterRolloff(-24);

    // update delay
    this.updateDelayTime(2.0 * Tone.Time('4n').toSeconds());
    this.updateDelayFeedback(0.4);

    this.volumes = padVolumes;
    this.chances = padChances;

    this.generator = new ToneNotesGenerator();

    this.currentEvent = null;

    this.baseNote = 'B2';

    this.baseChord = this.generator.getChord('chord4Min7th');

    for (let i = 0; i < this.baseChord.length; i++) {
      this.baseChord[i] = Tone.Frequency(this.baseNote).transpose(
        this.baseChord[i],
      );
    }
  }

  goToScene(newScene) {
    this.updateVolume(this.volumes[newScene]);

    if (this.currentEvent != null) {
      this.currentEvent.dispose();
    }

    this.currentEvent = new Tone.ToneEvent((time, chord) => {
      this.baseSound.triggerAttackRelease(
        chord.slice(
          0,
          1 +
            Math.min(
              Tone.Transport.position.split(':')[0] / 16,
              chord.length - 1,
            ),
        ),
        12.0 * Tone.Time('1m').toSeconds(),
        time,
      );
    }, this.baseChord);

    this.currentEvent.probability = this.chances[newScene];
    this.currentEvent.playbackRate = 1;
    this.currentEvent.loop = true;
    // loopEnd is the length of the loop, as in, how often it loops
    this.currentEvent.loopEnd = 16.0 * Tone.Time('1m').toSeconds();
    this.currentEvent.start(Tone.now());
  }
}

export { TonePad };
