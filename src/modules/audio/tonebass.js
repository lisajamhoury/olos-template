import * as Tone from 'tone';
import { ToneBaseInstrument } from './tonebaseinstrument.js';
import { bassVolumes, bassChances } from './toneparams.js';

class ToneBass extends ToneBaseInstrument {
  constructor() {
    super();
    // then we create the bass and connect to filter
    this.baseSound = new Tone.MonoSynth({
      oscillator: {
        type: 'amsine',
      },
      envelope: {
        attack: 0.1,
        release: 0.1,
      },
    }).connect(this.filter);

    this.volumes = bassVolumes;
  }

  goToScene(newScene) {
    this.updateVolume(this.volumes[newScene]);

    // cancel all next scheduled repeats
    if (this.currentEvent != null) {
      this.currentEvent.cancel(Tone.now());
    }
  }
}

export { ToneBass };
