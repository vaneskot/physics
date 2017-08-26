'use strict'

var vectorModule = require('../../vector3d.js');
var Vector3d = vectorModule.Vector3d;
var PhysicsSystem = require('../../physics_system.js');
var Particle = require('../../particle.js');
var ForceGenerators = require('../../force_generators.js');

var physics;
var canvas;
var ctx;
var cwidth;
var cheight;

var lastUpdateTime;
var gravity = new Vector3d(0, 10, 0);
var flyingRect = [100, 100, 400, 300];
var upliftGenerator = ForceGenerators.Uplift(
    new Vector3d(flyingRect[0], flyingRect[1]),
    new Vector3d(flyingRect[2], flyingRect[3]), 500);
var frameCounter = 0;
var maxParticles = 1000;

class FlyingParticle extends Particle {
  constructor(position, speed, mass, damping, color, radius) {
    super(position, speed, gravity, mass, damping);
    this.color = color;
    this.radius = radius;
  }

  draw() {
    ctx.save();

    ctx.beginPath();
    ctx.arc(
        this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();
  }

  integrate(dt) {
    super.integrate(dt);

    var x = this.position.x;
    var y = this.position.y;
    function isInScreen(rect) {
      return 0 <= x && x <= cwidth && 0 <= y && y <= cheight;
    }
    if (!isInScreen(flyingRect)) {
      console.log("Removing particle", this.position);
      physics.removeParticle(this);
    }
  }
}

function loadGame() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  cwidth = canvas.width;
  cheight = canvas.height;

  physics = new PhysicsSystem();
  physics.particles.forEach(
      particle => particle.addForceGenerator(upliftGenerator));

  lastUpdateTime = Date.now() / 1000;
  setInterval(update, 17);
}

function update() {
  var currentTime = Date.now() / 1000;

  physics.integrate(currentTime - lastUpdateTime);

  if (!(frameCounter % 10))
    spawnParticles();

  draw();

  lastUpdateTime = currentTime;
  frameCounter++;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(0, 20, 200, 0.3)';
  ctx.fillRect.apply(ctx, flyingRect);

  physics.particles.forEach(particle => particle.draw());
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  // The maximum is inclusive and the minimum is inclusive.
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spawnParticles() {
  if (physics.particles.length >= maxParticles)
    return;
  var particlesCount = getRandomIntInclusive(1, 5);
  for (let i = 0; i < particlesCount; ++i) {
    let particlePosition = new Vector3d(
        getRandomIntInclusive(flyingRect[0], flyingRect[0] + flyingRect[2]),
        flyingRect[1] + flyingRect[3] / 2);
    let r = getRandomIntInclusive(-1, 1);
    let particleSpeed = new Vector3d(0, 0, 0);
    let color =
        `rgba(${
                getRandomIntInclusive(0, 255)
              }, ${
                   getRandomIntInclusive(0, 255)
                 }, ${getRandomIntInclusive(0, 255)}, ${Math.random()})`;
    let particle = new FlyingParticle(
        particlePosition, particleSpeed, getRandomIntInclusive(10, 80), 0.99,
        color, getRandomIntInclusive(2, 5));
    particle.addForceGenerator(upliftGenerator);
    physics.addParticle(particle);
  }
}

window.addEventListener('load', loadGame);
