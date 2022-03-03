import "./style.css";
import * as THREE from "three";

let width = window.innerWidth;
let height = window.innerHeight;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, width / height, 1, 9);
camera.position.z = 5;

// Lighting
let color = 0xffffff;
let intensity = 1;
let light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 20, 20);
light.target.position.set(-5, 0, 0);
scene.add(light);
scene.add(light.target);
let ambient = new THREE.AmbientLight(0x808080);
scene.add(ambient);

// Fresh Cut Day palette
let background = 0xf9f2e7;
let foreground = [0x00a8c6, 0x40c0cb, 0xaee239, 0x8fbe00];

let renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
// renderer.setClearColor(background);
document.body.appendChild(renderer.domElement);

function uniform(low, high) {
  return low + Math.random() * (high - low);
}

let startRange = 2;
function randomizeBall(ball) {
  ball.position.x = uniform(-startRange, startRange);
  ball.position.y = uniform(-startRange, startRange);
  ball.position.z = uniform(-startRange, startRange);
  ball.dx = uniform(-startRange, startRange);
  ball.dy = uniform(-startRange, startRange);
  ball.dz = uniform(-startRange, startRange);
  ball.mass = 1;
  ball.crash = false;
}

let balls = [];
let numBalls = 12;
for (let i = 0; i < numBalls; ++i) {
  let geometry = new THREE.SphereGeometry(0.1, 32, 16);
  let material = new THREE.MeshLambertMaterial({
    color: foreground[i % foreground.length]
  });
  let ball = new THREE.Mesh(geometry, material);
  randomizeBall(ball);
  scene.add(ball);
  balls.push(ball);
}

let speed = 0.003;
let gravity = 0.01;
let crashDistance = 0.1;

function sq(x) {
  return x * x;
}

function animate() {
  requestAnimationFrame(animate);

  // Keep the balls centered at the origin
  // We do this every time step for numerical stability
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (let ball of balls) {
    sumX += ball.position.x;
    sumY += ball.position.y;
    sumZ += ball.position.z;
  }

  // Use inertia to update positions
  for (let ball of balls) {
    ball.position.x += speed * ball.dx - sumX / balls.length;
    ball.position.y += speed * ball.dy - sumY / balls.length;
    ball.position.z += speed * ball.dz - sumZ / balls.length;
  }

  // Use gravity to update velocities
  for (let ball of balls) {
    for (let other of balls) {
      let distance = Math.sqrt(
        sq(ball.position.x - other.position.x) +
          sq(ball.position.y - other.position.y) +
          sq(ball.position.z - other.position.z)
      );
      if (distance < crashDistance && distance > 0.001) {
        randomizeBall(ball);
        continue;
      }

      // Gravity is proportional to inverse squared distance, and the difference between
      // positions is exactly the distance, so to get gravity we need to divide by cube distance
      let multiplier =
        (gravity * distance * distance * distance * other.mass) / ball.mass;
      ball.dx += multiplier * (other.position.x - ball.position.x);
      ball.dy += multiplier * (other.position.y - ball.position.y);
      ball.dz += multiplier * (other.position.z - ball.position.z);
    }
  }

  renderer.render(scene, camera);
}
animate();
