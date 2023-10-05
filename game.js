import * as THREE from "three";

const minesAndPowerUps = new THREE.Object3D();
let interactiveObjectsPositions = [];
let level = 6;

const meshAngles = [
  (1 * Math.PI) / 4,
  (1 * Math.PI) / 2,
  (3 * Math.PI) / 4,
  Math.PI,
  (5 * Math.PI) / 4,
  (3 * Math.PI) / 2,
  (7 * Math.PI) / 4,
  2 * Math.PI,
];

export let minesPositions = [];
export let minesIdList = [];

const addMinesForHarderDifficulties = () => {
  let minesList = [];
  meshAngles.forEach((angle) => {
    for (
      let extraMinesToAdd = level - 1;
      extraMinesToAdd > 0;
      extraMinesToAdd--
    ) {
      minesList.push(angle + (extraMinesToAdd * Math.PI) / 32);
    }
  });
  return minesList;
};

let meshAnglesAdjustedByDifficulty = [
  ...meshAngles,
  ...addMinesForHarderDifficulties(),
];

//add mines for harder difficulties
//create bounding box to allow us to detect collisions
export const createBoundingBox = (mesh) => {
  const boundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
  boundingBox.setFromObject(mesh);
  minesPositions.push(mesh);
};

//add mines and objects, need filtering here to check positions are available
const addMinesAndPowerUps = (object) => {
  const color = new THREE.Color("skyblue");

  const radius = 36;
  const getPositionInAirSpace = 36 - 11 * Math.random();
  const angle = object.angle;
  const xPosition = getPositionInAirSpace * -Math.cos(angle);
  const yPosition = getPositionInAirSpace * Math.sin(angle);

  interactiveObjectsPositions.push({
    x: radius * -Math.cos(angle),
    y: radius * Math.sin(angle),
  });

  object.position.set(xPosition, yPosition, 0);
  createBoundingBox(object);
  minesIdList.push(object.id);
  minesAndPowerUps.add(object);
  minesAndPowerUps.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
};

export const createMine = () => {
  meshAnglesAdjustedByDifficulty.forEach((angle) => {
    const geom = new THREE.TetrahedronGeometry(0.5, 8);
    var mat = new THREE.PointsMaterial({
      size: 0.5,
      color: "yellow",
      sizeAttenuation: true,
    });

    const mesh = new THREE.Points(geom, mat);
    mesh.castShadow = true;
    mesh.angle = angle;
    addMinesAndPowerUps(mesh);
  });
  return minesAndPowerUps;
};

export const hideMines = async (mine) => {
  mine.material.size = 0;
};

export const detectCollision = (airplane) => {
  scene.updateMatrixWorld();
  const boundingBoxAirplane = new THREE.Box3(
    new THREE.Vector3(),
    new THREE.Vector3()
  );
  boundingBoxAirplane.setFromObject(airplane);
  minesPositions.forEach((mine) => {
    const boundingBoxMine = new THREE.Box3(
      new THREE.Vector3(),
      new THREE.Vector3()
    );
    boundingBoxMine.setFromObject(mine);
    if (boundingBoxMine.intersectsBox(boundingBoxAirplane)) {
      console.log(
        "intersects",
        boundingBoxMine.intersectsBox(boundingBoxAirplane),
        mine.uuid,
        mine.material.size
      );
      hideMines(mine);
    }
  });
};

export const updatePlane = (scene) => {
  // update the airplane's position
  const airplane = scene.getObjectByName("airplane");
  const propeller = scene.getObjectByName("propeller");

  airplane.position.y = airplanePos.y;
  airplane.position.x = airplanePos.x;
  propeller.rotation.x += 0.3;
  detectCollision(airplane);
};
