# olos-template

## About

This is a project by [Lisa Jamhoury](https://lisajamhoury.com/) and [Aarón Montoya-Moraga](https://montoyamoraga.io/), funded in 2022 by the Next Web grant from NEW INC and Meta Open Arts.

## Installation

Clone this repository and then install the dependencies with this command.

```bash
npm install
```

if it doesn't work, try this alternative command.

```bash
npm install --legacy-peer-deps
```

## Running

For building and deploying the base project, on the console run this command.

```bash
npm start
```

## Explanation

This base project is creating a website, establishing a peer-to-peer connection, and opening your webcam.

It is detecting the pose in your webcam feedand the other peer's webcam feed, and with that information, is drawing on the screen a pose representation, and affecting audio parameters.

## Technical details

- Pose detection is done with [TensorFlow.js Blazepose](https://blog.tensorflow.org/2021/05/high-fidelity-pose-tracking-with-mediapipe-blazepose-and-tfjs.html).
- Peer to peer connection is done with [simple-peer-wrapper](https://github.com/lisajamhoury/simple-peer-wrapper) and [simple-peer-server](https://github.com/lisajamhoury/simple-peer-server).
- Sound is done with [Tone.js](https://tonejs.github.io/).
- 3D environment is done with [three.js](https://threejs.org/).

## Credits

- Created by Lisa Jamhoury and Aarón Montoya-Moraga
- Choreography and performance by Hanna Satterlee and Soledad Rojas
