// Debugging
const DEBUGPOSE = false;
const DEBUGVIDEO = true;
const ADDSEGMENTATION = false;
const LIVE = true;
const SENDDATA = LIVE;

// Constants
const CONFTHRESHOLD = 0.8;
const PEERSERVERURL = 'https://simplepeerserver.net/';

const VIDEOH = 480;
const VIDEOW = 640;

const DIVISOR = 1;

const CANVASH = VIDEOH / DIVISOR;
const CANVASW = VIDEOW / DIVISOR;

// 2D array
const VIDEOURLS = [
  [
    new URL('../media/s1_hanna.mp4', import.meta.url),
    new URL('../media/s1_soledad.mp4', import.meta.url),
  ],
];

// import from JSON files
import * as POSES1DANCER0 from '../media/s1_hanna.json';
import * as POSES1DANCER1 from '../media/s1_soledad.json';

const VIDEOPOSEURLS = [[POSES1DANCER0, POSES1DANCER1]];

export {
  CONFTHRESHOLD,
  CANVASH,
  CANVASW,
  DEBUGPOSE,
  DEBUGVIDEO,
  DIVISOR,
  LIVE,
  PEERSERVERURL,
  ADDSEGMENTATION,
  SENDDATA,
  VIDEOH,
  VIDEOW,
  VIDEOURLS,
  VIDEOPOSEURLS,
};
