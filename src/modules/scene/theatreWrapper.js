import studio from '@theatre/studio';
import projectState from './../../media/OlosProject.theatre-project-state.json';
import { getProject, types } from '@theatre/core';
import { SHOWCONTROLS } from './../constants.js';

class TheatreWrapper {
  constructor({ state = null }) {
    // this.config = state ? { state } : {};
    //   this.project = getProject('OlosProject', this.config);
    this.project = getProject('OlosProject', { projectState });

    studio.initialize();

    if (SHOWCONTROLS) {
      studio.ui.restore();
    } else {
      studio.ui.hide();
    }

    const numScenes = 4;

    this.sheets = [];
    this.animatedObjects = [];

    for (let i = 0; i < numScenes; i++) {
      this.sheets.push(this.project.sheet(`Scene_${i}`));
      this.animatedObjects.push([]);
    }

    this.currentSheet = this.sheets[0];

    this.project.ready.then(() => {
      for (let i = 0; this.sheets.length; i++) {
        this.sheets[i].sequence.play({
          iterationCount: Infinity,
        });
      }
    });
  }

  setScene(sceneNumber) {
    this.currentScene = sceneNumber;
    this.currentSheet = this.sheets[sceneNumber];
    for (
      let i = 0;
      i < this.animatedObjects[sceneNumber].length;
      i++
    ) {
      this.animatedObjects[sceneNumber][i]();
    }
  }

  addObject(sceneNumber, onUpdate) {
    this.animatedObjects[sceneNumber].push(onUpdate);
  }
}

export { TheatreWrapper };
