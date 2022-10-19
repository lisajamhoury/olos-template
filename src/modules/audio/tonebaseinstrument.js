import * as Tone from 'tone';

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

    this.gain = null;

    this.sequence = null;

    // approach with ToneEvent
    this.events = null;

    this.transitionTime = '4n';

    this.chance = null;
  }

  updateGain(newVolume) {
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
}

export { ToneBaseInstrument };
