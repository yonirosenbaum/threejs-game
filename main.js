import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createMine, minesPositions } from "./game";

//setup
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000);
export const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const hemisphereLight = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 4);
scene.add(hemisphereLight);

//ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

camera.position.set(0, 0, 25);

//create plane/aircraft
const airplane = () => {
  //cockpit
  const container = new THREE.Object3D();
  const geoCockpit = new THREE.BoxGeometry(5, 3, 3, 1, 1, 1);
  const matCockpit = new THREE.MeshPhongMaterial({
    color: 0xff0000,
  });
  container.name = "airplane";
  const cockpit = new THREE.Mesh(geoCockpit, matCockpit);
  container.add(cockpit);
  //engine
  const geoEngine = new THREE.BoxGeometry(2, 3, 3, 1, 1, 1);
  const matEngine = new THREE.MeshPhongMaterial({
    color: 0xffffff,
  });
  const engine = new THREE.Mesh(geoEngine, matEngine);
  engine.position.x = 3.5;
  container.add(engine);
  //wings
  const geoWing = new THREE.BoxGeometry(2, 4, 0.5, 1, 1, 1);
  const matWing = new THREE.MeshPhongMaterial({
    color: 0x000000,
  });
  const wing = new THREE.Mesh(geoWing, matWing);
  wing.position.set(0, 0, 2);
  wing.rotateX(Math.PI / 2);
  wing.rotateZ(Math.PI / 10);
  container.add(wing);
  const backWing = wing.clone();
  backWing.position.set(0, 0, -2);
  backWing.rotateZ(-Math.PI / 5);

  container.add(backWing);
  container.scale.set(0.25, 0.25, 0.25);
  //propellor
  const geomPropeller = new THREE.BoxGeometry(0.2, 0.3, 0.2, 1, 1, 1);
  const matPropeller = new THREE.MeshPhongMaterial({
    color: 0x46b51d,
  });
  const propeller = new THREE.Mesh(geomPropeller, matPropeller);
  propeller.position.set(4.6, 0, 0);
  container.add(propeller);
  //blades
  var geomBlade = new THREE.BoxGeometry(0.5, 3, 0.2, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({
    color: 0x46b51d,
  });
  const blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.x = 0.5;
  propeller.add(blade);
  propeller.name = "propeller";
  //windshield
  const geoWindshield = new THREE.BoxGeometry(0.2, 1, 2, 1, 1, 1);
  const matWindshield = new THREE.MeshPhongMaterial({
    color: 0x46b51d,
  });
  const windshield = new THREE.Mesh(geoWindshield, matWindshield);
  windshield.position.set(2, 2, 0);
  windshield.rotation.z = Math.PI / 10;
  container.add(windshield);
  return container;
};
scene.add(airplane());

//create ground
const fragmentShader = `
uniform sampler2D globeTexture;
varying vec2 vertexUV;
varying vec3 vertexNormal;

void main() {
  float intensity = 1.05 - dot(vertexNormal, vec3(0.0, 0.4, 0.4));
  vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);
  gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz, 1.0);
}
`;
const vertexShader = `
varying vec2 vertexUV;
varying vec3 vertexNormal;

void main() {
  vertexUV = uv;
  vertexNormal = normalize(normalMatrix * normal);
  vec3 newposition = position + position*sin(position.x)*position.z * 0.005*cos(position.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newposition, 1.0 );
}
`;
//create atmosphere
const fragmentShaderAtmosphere = `
varying vec3 vertexNormal;

void main() {
  float intensity = pow(0.4 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
  gl_FragColor = vec4(0.3, 0.6, 1.0, 0.4) * intensity;
}
`;

const vertexShaderAtmosphere = `
varying vec3 vertexNormal;

void main() {
  vertexNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const sea = () => {
  const container = new THREE.Object3D();
  const geom = new THREE.CylinderBufferGeometry(24, 24, 32, 50, 1);
  // rotate the geometry on the x axis
  geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // create the material
  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load(
          "./textures/water/Water_002_NORM.jpg"
        ),
      },
    },
  });

  let seaMesh = new THREE.Mesh(geom, mat);
  seaMesh.name = "sea";
  container.add(seaMesh);
  container.position.set(1, -30, 0);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(30, 50, 50),
    new THREE.ShaderMaterial({
      vertexShader: vertexShaderAtmosphere,
      fragmentShader: fragmentShaderAtmosphere,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
  );
  atmosphere.scale.set(1.3, 1.3);
  container.add(atmosphere);
  return container;
};
scene.add(sea());

// create moon
const createMoon = () => {
  const sphereGeometry = new THREE.SphereGeometry(20, 64, 32);
  const texture = new THREE.TextureLoader().load(
    "./textures/water/Water_002_NORM.jpg"
  );
  const sphereMaterial = new THREE.MeshPhongMaterial({
    map: texture,
    color: "brown",
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.name = "moon";
  const torusGeometry = new THREE.TorusGeometry(24, 2, 16, 100);
  const torusMaterial = new THREE.MeshPhongMaterial({
    color: "green",
    shading: THREE.FlatShading,
  });
  const torusMaterialBasic = new THREE.MeshBasicMaterial({
    color: "green",
    shading: THREE.FlatShading,
  });
  const torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
  const torusMeshBasic = new THREE.Mesh(torusGeometry, torusMaterialBasic);
  torusMeshBasic.position.x = 0;
  torusMeshBasic.position.z = -5;
  sphere.add(torusMesh, torusMeshBasic);
  scene.add(sphere);
  sphere.rotation.x = (3 * Math.PI) / 2;
  sphere.position.set(150, 260, -500);
};
createMoon();

const airspace = () => {
  const mines = createMine();
  let geom = new THREE.CylinderGeometry(36, 36, 32, 40, 10);
  geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  var mat = new THREE.MeshPhongMaterial({
    transparent: true,
    opacity: 0.01,
    shading: THREE.FlatShading,
  });
  let mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(1, -30, 0);
  mesh.add(mines);
  mesh.name = "airspace";
  return mesh;
};
scene.add(airspace());

//orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = 180;
controls.update();

//allow plane to follow mouse
let airplanePos = { x: 0, y: 0 };
const handleMouseMove = (event) => {
  const x = -1 + (2 * event.clientX) / window.innerWidth;
  const y = -1 + 2 * (1 - event.clientY / window.innerHeight);

  //normalise plane movements
  const normalise = (number, isXValue) => {
    let clampedNumber = THREE.MathUtils.clamp(number, -0.4, 0.4);
    if (isXValue && window.matchMedia("(min-width: 1440px)").matches) {
      zoomOut(clampedNumber);
    }
    return clampedNumber * 8;
  };
  // if user moves mouse to left half of screen zoom camera out
  const zoomOut = (number) => {
    if (number < 0) {
      camera.zoom = parseFloat(-number * 2 + 1, 2);
      camera.updateProjectionMatrix();
    } else {
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    }
  };

  airplanePos = { x: normalise(x, true), y: normalise(y) };
};
const loop = () => {
  const sea = scene.getObjectByName("sea");
  scene.getObjectByName("propeller").rotation.x += 0.3;
  scene.getObjectByName("airspace").rotation.z += Math.PI * 0.0015;
  scene.getObjectByName("moon").rotation.z += 0.003;
  scene.getObjectByName("sea").rotation.z += 0.003;

  updatePlane();
};

function animate() {
  loop();
  document.addEventListener("mousemove", handleMouseMove, false);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

const hideMines = async (mine) => {
  mine.material.size = 0;
};

const detectCollision = (airplane) => {
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
      hideMines(mine);
    }
  });
};

function updatePlane() {
  // update the airplane's position
  const airplane = scene.getObjectByName("airplane");
  const propeller = scene.getObjectByName("propeller");

  airplane.position.y = airplanePos.y;
  airplane.position.x = airplanePos.x;
  propeller.rotation.x += 0.3;
  detectCollision(airplane);
}

const handleResize = () => {
  // update height and width of the renderer and the camera
  const HEIGHT = window.innerHeight;
  const WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT, true);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", handleResize);

const vertices = [];

for (let i = 0; i < 10000; i++) {
  const x = THREE.MathUtils.randFloatSpread(2000);
  const y = THREE.MathUtils.randFloatSpread(2000);
  const z = THREE.MathUtils.randFloatSpread(2000);

  vertices.push(x, y, z);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices, 3)
);

const material = new THREE.PointsMaterial({ color: 0x888888 });

const points = new THREE.Points(geometry, material);

scene.add(points);

animate();
