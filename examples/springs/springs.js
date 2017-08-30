'use strict'

var vectorModule = require('../../vector3d.js');
var Vector3d = vectorModule.Vector3d;
var vectorDiff = vectorModule.vectorDiff;
var scalarVectorMultiply = vectorModule.scalarVectorMultiply;
var vectorSum = vectorModule.vectorSum;
var PhysicsSystem = require('../../physics_system.js');
var Particle = require('../../particle.js');
var ForceGenerators = require('../../force_generators.js');

var physics;
var canvas;
var ctx;
var cwidth;
var cheight;

var lastUpdateTime;
var gravity = new Vector3d(0, 40, 0);
var springs = [];

class SpringedParticle extends Particle {
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
    ctx.strokeStyle = this.color;
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }
}

class AnchoredSpring {
  constructor(anchor, particle, springConstant, restLength, width, color) {
    if (anchor)
      this.anchor = anchor;
    this.particle = particle;
    this.springConstant = springConstant;
    this.restLength = restLength;
    this.width = width;
    this.color = color;

    if (anchor)
      this.addForceGenerators()
  }

  addForceGenerators() {
    this.particle.addForceGenerator(ForceGenerators.AnchoredSpring(
        this.anchor, this.springConstant, this.restLength));
  }

  getAnchor() {
    return this.anchor;
  }

  getAnchorRadius() {
    return 0;
  }

  draw() {
    ctx.save();

    var toParticleUnit =
        vectorDiff(this.particle.position, this.getAnchor()).normalized();
    var normal = new Vector3d(toParticleUnit.y, -toParticleUnit.x);
    var start = vectorSum(
        this.getAnchor(),
        scalarVectorMultiply(this.getAnchorRadius(), toParticleUnit));
    var end = vectorDiff(
        this.particle.position,
        scalarVectorMultiply(this.particle.radius, toParticleUnit));
    var springLength = vectorModule.distance(start, end);
    var springElements = this.restLength / 5;
    var distBetweenElements = springLength / springElements;

    var point = vectorSum(start, scalarVectorMultiply(this.width / 2, normal));
    var offsetToParticle =
        scalarVectorMultiply(distBetweenElements, toParticleUnit);
    var offsetNormal = scalarVectorMultiply(this.width, normal);

    ctx.beginPath();
    ctx.moveTo.apply(ctx, point.toArray());
    for (let i = 1; i <= springElements; ++i) {
      point.addVector(offsetToParticle);
      if (i % 2) {
        point.subtractVector(offsetNormal);
      } else {
        point.addVector(offsetNormal);
      }
      ctx.lineTo.apply(ctx, point.toArray());
    }

    ctx.strokeStyle = this.color;
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }
}

class ParticleSpring extends AnchoredSpring {
  constructor(
      anchorParticle, particle, springConstant, restLength, width, color) {
    super(null, particle, springConstant, restLength, width, color);
    this.anchorParticle = anchorParticle;
    this.addForceGenerators();
  }

  addForceGenerators() {
    this.anchorParticle.addForceGenerator(ForceGenerators.ParticleSpring(
        this.particle, this.springConstant, this.restLength));
    this.particle.addForceGenerator(ForceGenerators.ParticleSpring(
        this.anchorParticle, this.springConstant, this.restLength));
  }

  getAnchor() {
    return this.anchorParticle.position;
  }

  getAnchorRadius() {
    return this.anchorParticle.radius;
  }
}

function loadGame() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  cwidth = canvas.width;
  cheight = canvas.height;

  physics = new PhysicsSystem();

  var leftParticle = new SpringedParticle(
      new Vector3d(200, 300), new Vector3d(0, 0), 100, 0.95, 'rgb(100, 0, 0)',
      30);
  physics.addParticle(leftParticle);

  var centerParticle = new SpringedParticle(
      new Vector3d(300, 300), new Vector3d(0, 0), 80, 0.95, 'rgb(100, 0, 100)',
      20);
  physics.addParticle(centerParticle);

  var rightParticle = new SpringedParticle(
      new Vector3d(400, 300), new Vector3d(0, 0), 80, 0.95, 'rgb(100, 100, 100)',
      30);
  physics.addParticle(rightParticle);

  springs.push(new ParticleSpring(
      leftParticle, centerParticle, 40, 100, 10, 'rgb(0, 100, 0)'));
  springs.push(new ParticleSpring(
      rightParticle, centerParticle, 40, 100, 10, 'rgb(0, 100, 0)'));
  springs.push(new AnchoredSpring(
      new Vector3d(100, 0), leftParticle, 80, 200, 20, 'rgb(0, 200, 0)'));
  springs.push(new AnchoredSpring(
      new Vector3d(500, 0), rightParticle, 80, 200, 20, 'rgb(0, 200, 0)'));
  springs.push(new AnchoredSpring(
      new Vector3d(700, 400), rightParticle, 80, 200, 20, 'rgb(0, 200, 0)'));

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
  springs.forEach(spring => spring.draw());
  physics.particles.forEach(particle => particle.draw());
}

window.addEventListener('load', loadGame);
