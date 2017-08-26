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
var acceleration = new Vector3d(0, 0, 0);

class ExampleParticle extends Particle {
  constructor(position, velocity, mass, damping, color, radius) {
    super(position, velocity, acceleration, mass, damping);
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

  var planet = new ExampleParticle(
      new Vector3d(300, 300), new Vector3d(0, 0), 150000, 1., 'rgb(200, 0, 0)',
      30);
  var planetGravityGenerator = ForceGenerators.ParticleGravity(6.67408, planet);
  physics.addParticle(planet);

  var particle1 = new ExampleParticle(
      new Vector3d(100, 300), new Vector3d(0, -70), 10, 0.998, 'rgb(0, 0, 150)',
      12);
  particle1.addForceGenerator(planetGravityGenerator);

  physics.addParticle(particle1);

  var particle2 = new ExampleParticle(
      new Vector3d(200, 300), new Vector3d(0, -100), 10, 0.985, 'rgb(0, 0, 200)',
      12);
  particle2.addForceGenerator(planetGravityGenerator);
  physics.addParticle(particle2);

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
