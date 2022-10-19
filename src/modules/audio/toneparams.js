// this number goes from 1 to Infinity
// 0 is the loudest, Infinity is the quietest
const volumeMultiplier = 1;

// values of volume for beginning, scene1, scene2, scene3
// values in dB, minimum is -Infinity, maximum is 0
const bassVolumes = [
  -volumeMultiplier * 4,
  -volumeMultiplier * 4,
  -volumeMultiplier * 4,
  -volumeMultiplier * 4,
  -volumeMultiplier * 4,
];

const hihatVolumes = [
  -volumeMultiplier * 4,
  -volumeMultiplier * 4,
  -volumeMultiplier * 4,
  -volumeMultiplier * 4,
  -Infinity,
];

const kickVolumes = [
  -volumeMultiplier * 6,
  -volumeMultiplier * 6,
  -volumeMultiplier * 6,
  -volumeMultiplier * 6,
  -Infinity,
];

const rideVolumes = [
  -Infinity,
  -Infinity,
  -Infinity,
  -Infinity,
  -Infinity,
];

const padVolumes = [
  -volumeMultiplier * 9,
  -volumeMultiplier * 9,
  -volumeMultiplier * 9,
  -volumeMultiplier * 9,
  -Infinity,
];

const melodyVolumes = [
  -volumeMultiplier * 5,
  -volumeMultiplier * 5,
  -volumeMultiplier * 5,
  -volumeMultiplier * 5,
  -Infinity,
];

// beats per minute
const globalBPM = 60;

// scene 1 starts at bar 0
// scene 2 starts at bar 48
// scene 3 starts at bar 96
// scene 3 ends at bar 150
const scenesBars = [-1, 0, 48, 96, 150];

const bassChances = [0.0, 0.0, 0.5, 0.3, 0.0];
const hihatChances = [0.0, 0.0, 0.5, 0.3, 0.0];
const kickChances = [0.0, 1.0, 0.5, 0.3, 0];
const melodyChances = [0.0, 0.5, 1.0, 1.0, 0];
const padChances = [0.0, 1.0, 1.0, 1.0, 0];
const rideChances = [0.0, 1.0, 1.0, 1.0, 0];

export {
  globalBPM,
  scenesBars,
  bassVolumes,
  hihatVolumes,
  kickVolumes,
  melodyVolumes,
  padVolumes,
  rideVolumes,
  bassChances,
  hihatChances,
  kickChances,
  melodyChances,
  padChances,
  rideChances,
};
