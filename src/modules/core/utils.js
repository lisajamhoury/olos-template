function addDistanceBtwJoints(pose, distance, joint) {
  const offsetX = distance.x / 2;
  const offsetY = distance.y / 2;
  const keyPoints = pose[0].keypoints3D;

  for (const i in keyPoints) {
    const keyPoint = keyPoints[i];
    if (keyPoint.name.includes('left')) {
      keyPoint.x += offsetX;
      keyPoint.Y += offsetY;
    }

    if (keyPoint.name.includes('right')) {
      keyPoint.x -= offsetX;
      keyPoint.y -= offsetY;
    }
  }

  return pose;
}

function combinePoseLeftAndRight(pose1, pose2, activeKeyPointNames) {
  const combinedPose = [{ keypoints3D: [] }];

  for (const keyPointName of activeKeyPointNames) {
    let pose;

    if (keyPointName.includes('left')) {
      pose = pose1;
    } else if (keyPointName.includes('right')) {
      pose = pose2;
    } else {
      console.log('oh no that side doesnt exist');
    }

    const keyPoint3D = pose[0].keypoints3D.find(
      (point3D) => point3D.name === keyPointName,
    );

    combinedPose[0].keypoints3D.push(keyPoint3D);
  }

  return combinedPose;
}

function getDistanceBetweenJoints(jointName, player1, player2) {
  const joint1 = getJointVector(jointName, player1);
  const joint2 = getJointVector(jointName, player2);

  return getVectorDistance(joint1, joint2);
}

function getJointVector(jointName, player) {
  let jointVector = { x: null, y: null };

  jointVector.x = player.normalizedPose.find(
    (joint) => joint.name === jointName,
  ).x;
  jointVector.y = player.normalizedPose.find(
    (joint) => joint.name === jointName,
  ).y;

  return jointVector;
}

function getVectorDistance(joint1, joint2) {
  let distance = {};

  distance.x = Math.abs(joint1.x - joint2.x);
  distance.y = Math.abs(joint1.y - joint2.y);
  distance.vector = Math.sqrt(
    distance.x * distance.x + distance.y * distance.y,
  );

  return distance;
}

export {
  addDistanceBtwJoints,
  combinePoseLeftAndRight,
  getDistanceBetweenJoints,
};
