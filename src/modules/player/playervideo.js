import { LIVE, VIDEOH, VIDEOW } from './../constants.js';

class PlayerVideo {
  constructor() {
    this.width = VIDEOW;
    this.height = VIDEOH;
    this.showVideoElement = false;
    if (!LIVE) this.showVideoElement = true;
    this.video = this.createVideoElement();
    this.stream = null;
    this.videoLoaded = false;
  }

  async getVideoStream() {
    const options = {
      audio: false,
      video: true,
    };

    let stream = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia(options);
      this.setVideoStream(stream);
    } catch (err) {
      console.log(
        'navigator.mediaDevices.getUserMedia error: ',
        err.message,
        err.name,
      );
    }

    return stream;
  }

  getDemoVideo(demoVid) {
    this.video.src = demoVid;
    this.video.type = 'video/mp4';
    this.video.playsInline = true;
    this.video.autoplay = true;
    this.video.loop = true;
    this.video.muted = true;
    this.video.style =
      'position: fixed; bottom: 0; visibility:hidden;';
  }

  setVideoStream(stream) {
    this.stream = stream;
    this.video.srcObject = this.stream;
  }

  createVideoElement() {
    const video = document.createElement('video');
    if (this.showVideoElement) document.body.appendChild(video);
    video.width = VIDEOW; // this is important
    video.height = VIDEOH;
    video.playsInline = true;
    video.autoplay = true;

    video.addEventListener('loadeddata', () => {
      this.videoLoaded = true;
    });

    return video;
  }
}

export { PlayerVideo };
