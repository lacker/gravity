import "./style.css";
import * as THREE from "three";

let width = window.innerWidth;
let height = window.innerHeight;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, width / height, 1, 19);
camera.position.z = 10;

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
let sun = 0xf9f2e7;
let foreground = [0x00a8c6, 0x40c0cb, 0xaee239, 0x8fbe00];

let renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

function uniform(low, high) {
  return low + Math.random() * (high - low);
}

let startRange = 2;
function randomizeBall(ball) {
  ball.position.x = uniform(-startRange, startRange);
  ball.position.y = uniform(-startRange, startRange);
  ball.position.z = uniform(-startRange, startRange);
  ball.dx = 2 * uniform(-startRange, startRange);
  ball.dy = 2 * uniform(-startRange, startRange);
  ball.dz = 2 * uniform(-startRange, startRange);
  ball.crashed = false;
  ball.crashPriority = Math.random();
}

let balls = [];
let ballRadius = 0.05;
let numBalls = 500;
for (let i = 0; i < numBalls; ++i) {
  let geometry = new THREE.SphereGeometry(ballRadius, 32, 16);
  let material = new THREE.MeshLambertMaterial({
    color: foreground[i % foreground.length]
  });
  let ball = new THREE.Mesh(geometry, material);
  randomizeBall(ball);
  scene.add(ball);
  balls.push(ball);
}

let sunRadius = 0.2;
let geometry = new THREE.SphereGeometry(sunRadius, 32, 16);
let material = new THREE.MeshLambertMaterial({ color: sun });
let sunBall = new THREE.Mesh(geometry, material);
scene.add(sunBall);

let speed = 0.01;
let ballToBallGravity = 0.00001;
let sunToBallGravity = 0.5;

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
  let newBalls = [];
  for (let ball of balls) {
    for (let other of balls) {
      let distance = Math.sqrt(
        sq(ball.position.x - other.position.x) +
          sq(ball.position.y - other.position.y) +
          sq(ball.position.z - other.position.z)
      );
      if (distance < ballRadius) {
        if (distance > 0.00001 && ball.crashPriority < other.crashPriority) {
          ball.crashed = true;
        }
        continue;
      }

      // Gravity is proportional to inverse squared distance, and the difference between
      // positions is exactly the distance, so to get gravity we need to divide by cube distance
      let multiplier = ballToBallGravity / (distance * distance * distance);
      ball.dx += multiplier * (other.position.x - ball.position.x);
      ball.dy += multiplier * (other.position.y - ball.position.y);
      ball.dz += multiplier * (other.position.z - ball.position.z);
    }

    // Gravity toward the origin
    let distance = Math.sqrt(
      sq(ball.position.x) + sq(ball.position.y) + sq(ball.position.z)
    );
    if (distance < sunRadius + ballRadius) {
      ball.crashed = true;
    }
    if (distance > 0.1) {
      let multiplier = sunToBallGravity / (distance * distance * distance);
      ball.dx -= multiplier * ball.position.x;
      ball.dy -= multiplier * ball.position.y;
      ball.dz -= multiplier * ball.position.z;
    }

    if (ball.crashed) {
      scene.remove(ball);
    } else {
      newBalls.push(ball);
    }
  }

  balls = newBalls;

  renderer.render(scene, camera);
}
animate();
