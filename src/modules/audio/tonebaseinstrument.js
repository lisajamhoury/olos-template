import { getInternalFormatForUnsignedBytesMatrixTexture } from '@tensorflow/tfjs-backend-webgl/dist/gpgpu_util';
import * as Tone from 'tone';
import { ToneWithContext } from 'tone/build/esm/core/context/ToneWithContext';

class ToneBaseInstrument {
  constructor() {
    // signal path is baseSound to filter to volume to delay
    // first we create the delay
    this.delay = new Tone.FeedbackDelay();
    // then the volume
    this.volume = new Tone.Volume(-Infinity).connect(this.delay);
    // then the lowpass filter
    this.filter = new Tone.Filter({
      frequency: 10000,
    }).connect(this.volume);

    this.baseSound = null;

    this.volumes = [];

    this.sequence = null;

    // approach with ToneEvent
    this.events = null;

    this.transitionTime = '4n';

    this.chances = null;
  }

  updateVolume(newVolume) {
    if (typeof newVolume === 'number') {
      // ramp to the value in 1 measure
      this.volume.volume.rampTo(newVolume, this.transitionTime);
    }
  }

  updateFilterFrequency(newFreq) {
    this.filter.frequency.rampTo(
      newFreq,
      Tone.Time(this.transitionTime).toSeconds(),
    );
  }

  updateFilterRolloff(newRolloff) {
    this.filter.set({
      rolloff: newRolloff,
    });
  }

  mute() {
    this.volume.volume.rampTo(
      -Infinity,
      Tone.Time(this.transitionTime).toSeconds(),
    );
  }

  updateDelayTime(newDelayTime) {
    this.delay.delayTime.rampTo(
      newDelayTime,
      Tone.Time(this.transitionTime).toSeconds(),
    );
  }

  updateDelayFeedback(newDelayFeedback) {
    this.delay.feedback.rampTo(
      newDelayFeedback,
      Tone.Time(this.transitionTime).toSeconds(),
    );
  }

  durationToSeconds(timeNote) {
    return Tone.Time(timeNote).toSeconds();
  }
}

export { ToneBaseInstrument };
