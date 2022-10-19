import * as Tone from 'tone';
import { ToneBaseInstrument } from './tonebaseinstrument.js';
import { melodyGain, melodyChance } from './toneparams.js';
import { ToneNotesGenerator } from './tonenotesgenerator.js';

class ToneMelody extends ToneBaseInstrument {
  constructor() {
    super();

    this.baseSound = new Tone.MetalSynth().connect(this.filter);

    this.baseSound.set({
      harmonicity: 12,
      resonance: 800,
      modulationIndex: 20,
      envelope: {
        decay: 0.2,
      },
    });

    this.gain = melodyGain;
    this.chance = melodyChance;
    this.generator = new ToneNotesGenerator();

    // update filter frequency cutoff
    this.updateFilterFrequency(1000);

    // update filter rolloff
    this.updateFilterRolloff(-12);

    // update delay
    this.updateDelayTime(1.0 * Tone.Time('4n').toSeconds());
    this.updateDelayFeedback(0.5);

    this.currentEvent = null;

    this.baseNote1 = 'B4';
    this.baseChord1 = [...this.generator.getChord('chord4Min7th')];
    for (let i = 0; i < this.baseChord1.length; i++) {
      this.baseChord1[i] = Tone.Frequency(this.baseNote1).transpose(
        this.baseChord1[i],
      );
    }

    this.baseNote2 = 'B5';
    this.baseChord2 = [...this.generator.getChord('chord4Min7th')];
    for (let i = 0; i < this.baseChord2.length; i++) {
      this.baseChord2[i] = Tone.Frequency(this.baseNote2).transpose(
        this.baseChord2[i],
      );
    }

    this.baseChord = [...this.baseChord1, ...this.baseChord2];
  }

  init() {
    this.updateGain(this.gain);

    // cancel all next scheduled repeats
    if (this.currentEvent != null) {
      this.currentEvent.dispose();
    }

    this.currentEvent = new Tone.ToneEvent((time, chord) => {
      // this.playbackRate =
      //   1 + Tone.Transport.position.split(':')[0] / 4;
      if (Tone.Transport.position.split(':')[0] >= 4) {
        this.baseSound.triggerAttackRelease(
          chord[
            Math.floor(
              (Tone.Transport.position.split(':')[0] / 4) *
                Math.random(),
            )
          ],
          0.5 * Tone.Time('4n').toSeconds(),
          0.5 * Tone.Time('4n').toSeconds() + time,
        );
      } else if (Tone.Transport.position.split(':')[0] >= 20) {
        // this.currentEvent.playbackRate = 2;
        this.currentEvent.loopEnd = 1.0 * Tone.Time('1m').toSeconds();
        this.baseSound.triggerAttackRelease(
          chord[
            Math.floor(
              (Tone.Transport.position.split(':')[0] / 4) *
                Math.random(),
            )
          ],
          0.5 * Tone.Time('4n').toSeconds(),
          time,
        );
      } else if (Tone.Transport.position.split(':')[0] >= 36) {
        // this.currentEvent.playbackRate = 4;
        this.currentEvent.loopEnd = 0.5 * Tone.Time('1m').toSeconds();
        this.baseSound.triggerAttackRelease(
          chord[
            Math.floor(
              (Tone.Transport.position.split(':')[0] / 4) *
                Math.random(),
            )
          ],
          0.5 * Tone.Time('4n').toSeconds(),
          time,
        );
      }
    }, this.baseChord);

    this.currentEvent.probability = this.chance;
    this.currentEvent.playbackRate = 1;
    this.currentEvent.loop = true;
    this.currentEvent.loopEnd = 0.5 * Tone.Time('1m').toSeconds();
    this.currentEvent.start(Tone.now());
  }
}

export { ToneMelody };
