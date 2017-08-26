'use strict'

var vectorModule = require('../../vector3d.js');
var Vector3d = vectorModule.Vector3d;
var PhysicsSystem = require('../../physics_system.js');
var Particle = require('../../particle.js');

var physics;
var canvas;
var ctx;
var cwidth;
var cheight;

var lastUpdateTime;
var gravity = new Vector3d(0, 100, 0);

class ExampleParticle extends Particle {
  constructor(position, velocity, mass, damping, color, radius) {
    super(position, velocity, gravity, mass, damping);
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
}

function loadGame() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  cwidth = canvas.width;
  cheight = canvas.height;

  physics = new PhysicsSystem();
  physics.addParticle(new ExampleParticle(
      new Vector3d(50, 300), new Vector3d(100, -200), 10, 1., 'rgb(0, 0, 150)',
      12));
  physics.addParticle(new ExampleParticle(
      new Vector3d(50, 300), new Vector3d(100, -200), 10, 0.95, 'rgb(0, 0, 200)',
      12));

  physics.addParticle(new ExampleParticle(
      new Vector3d(300, 300), new Vector3d(0, -150), 20, 1., 'rgb(0, 100, 200)',
      12));
  physics.addParticle(new ExampleParticle(
      new Vector3d(300, 300), new Vector3d(0, -150), 20, 0.90,
      'rgb(0, 150, 200)', 12));

  physics.addParticle(new ExampleParticle(
      new Vector3d(400, 300), new Vector3d(0, -150), null, 0.90,
      'rgb(0, 150, 200)', 12));

  lastUpdateTime = Date.now() / 1000;
  setInterval(update, 17);
}

function update() {
  var currentTime = Date.now() / 1000;

  physics.integrate(currentTime - lastUpdateTime);
  draw();

  lastUpdateTime = currentTime;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  physics.particles.forEach(particle => particle.draw());
}

window.addEventListener('load', loadGame);
