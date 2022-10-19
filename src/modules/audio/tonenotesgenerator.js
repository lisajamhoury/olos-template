class ToneNotesGenerator {
  constructor() {
    this.scaleMajor = [0, 2, 4, 5, 7, 9, 11];
    this.scaleMinor = [0, 2, 3, 5, 7, 8, 10];

    this.scaleChromatic = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    this.chord3Maj = [0, 4, 7];
    this.chord3Min = [0, 3, 7];
    this.chord3Aug = [0, 4, 8];
    this.chord3Dim = [0, 3, 6];

    this.chord4Maj7th = [0, 4, 7, 10];
    this.chord4Maj7thMaj = [0, 4, 7, 11];
    this.chord4Min7th = [0, 3, 7, 10];
    this.chord4Min7thb5 = [0, 3, 6, 10];
  }

  getScale(scaleName, baseNote) {
    if (scaleName === 'major') {
      return this.scaleMajor.map((num) => num + baseNote);
    } else if (scaleName === 'minor') {
      return this.scaleMinor.map((num) => num + baseNote);
    } else if (scaleName === 'chromatic') {
      return this.scaleChromatic.map((num) => num + baseNote);
    }
  }

  getChord(chordType) {
    if (chordType === '3Maj') {
      return this.chord3Maj;
    } else if (chordType === 'chord3Min') {
      return this.chord3Min;
    } else if (chordType === 'chord3Aug') {
      return this.chord3Aug;
    } else if (chordType === 'chord3Dim') {
      return this.chord3Dim;
    } else if (chordType === 'chord4Maj7th') {
      return this.chord4Maj7th;
    } else if (chordType === 'chord4Maj7thMaj') {
      return this.chord4Maj7thMaj;
    } else if (chordType === 'chord4Min7th') {
      return this.chord4Min7th;
    }
  }

  getChordsFromScale(scale, notes) {
    if (scale === 'major' || notes === 3) {
      return [
        this.chord3Major.map((base) => base + this.scaleMajor[0]),
        this.chord3Minor.map((base) => base + this.scaleMajor[1]),
        this.chord3Minor.map((base) => base + this.scaleMajor[2]),
        this.chord3Major.map((base) => base + this.scaleMajor[3]),
        this.chord3Major.map((base) => base + this.scaleMajor[4]),
        this.chord3Minor.map((base) => base + this.scaleMajor[5]),
        this.chord3Dim.map((base) => base + this.scaleMajor[6]),
      ];
    }
    if (scale === 'major' || notes === 4) {
      return [
        this.chord4Maj7th.map((base) => base + this.scaleMajor[0]),
        this.chord4Min7th.map((base) => base + this.scaleMajor[1]),
        this.chord4Min7th.map((base) => base + this.scaleMajor[2]),
        this.chord4Maj7th.map((base) => base + this.scaleMajor[3]),
        this.chord4MajMin7th.map((base) => base + this.scaleMajor[4]),
        this.chord4Min7th.map((base) => base + this.scaleMajor[5]),
        this.chord4Min7thb5.map((base) => base + this.scaleMajor[6]),
      ];
    } else if (scale === 'minor' || notes === 3) {
      return [
        this.chord3Minor.map((base) => base + this.scaleMinor[0]),
        this.chord3Dim.map((base) => base + this.scaleMinor[1]),
        this.chord3Major.map((base) => base + this.scaleMinor[2]),
        this.chord3Minor.map((base) => base + this.scaleMinor[3]),
        this.chord3Minor.map((base) => base + this.scaleMinor[4]),
        this.chord3Major.map((base) => base + this.scaleMinor[5]),
        this.chord3major.map((base) => base + this.scaleMinor[6]),
      ];
    } else if (scale === 'minor' || notes === 4) {
      return [
        this.chord4Min7th.map((base) => base + this.scaleMinor[0]),
        this.chord4Min7thb5.map((base) => base + this.scaleMinor[1]),
        this.chord4Maj7th.map((base) => base + this.scaleMinor[2]),
        this.chord4Min7th.map((base) => base + this.scaleMinor[3]),
        this.chord4Min7th.map((base) => base + this.scaleMinor[4]),
        this.chord4Maj7th.map((base) => base + this.scaleMinor[5]),
        this.chord4MajMin7th.map((base) => base + this.scaleMinor[6]),
      ];
    }
  }
}

export { ToneNotesGenerator };
