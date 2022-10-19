import SimplePeerWrapper from 'simple-peer-wrapper';
import { PEERSERVERURL } from './../constants.js';

class PeerConnection {
  constructor() {
    this.connection = null;
  }

  init(debug, stream) {
    const options = {
      debug: debug,
      stream: stream,
      serverUrl: PEERSERVERURL,
    };

    this.connection = new SimplePeerWrapper(options);
    this.connection.connect();
  }
}

export { PeerConnection };
