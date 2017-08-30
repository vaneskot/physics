(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../../force_generators.js":2,"../../particle.js":3,"../../physics_system.js":4,"../../vector3d.js":5}],2:[function(require,module,exports){
var vectorModule = require('./vector3d.js');
var Vector3d = vectorModule.Vector3d;
var vectorDiff = vectorModule.vetorDiff;

function isPointInCube(point, origin, size) {
  function isInBounds(a, start, length) {
    return start <= a && a <= start + length;
  }
  return isInBounds(point.x, origin.x, size.x) &&
      isInBounds(point.y, origin.y, size.y) &&
      isInBounds(point.z, origin.z, size.z);
}

// Uplift force in a cube.
function UpliftGenerator(origin, size, uplift) {
  var upliftForce = new Vector3d(0, -uplift, 0);
  return function(particle, dt) {
    if (isPointInCube(particle.position, origin, size)) {
      console.log("Adding uplift", particle);
      particle.addForce(upliftForce);
    }
  };
}

// f = G * m1 * m2 / r^2
function ParticleGravityGenerator(G, originalParticle) {
  return function(particle, dt) {
    var force =
        vectorDiff(particle.position, originalParticle.position);
    var lengthSquared = force.lengthSquared();
    var forceCoefficient =
        G * particle.mass * originalParticle.mass / lengthSquared;
    force.multiplyScalar(forceCoefficient / Math.sqrt(lengthSquared));
    particle.addForce(force);
  }
}

module.exports = {
  Uplift : UpliftGenerator,
  ParticleGravity : ParticleGravityGenerator
};

},{"./vector3d.js":5}],3:[function(require,module,exports){
'use strict'

var vectorModule = require('./vector3d.js');
var Vector3d = vectorModule.Vector3d;

class Particle {
  constructor(position, velocity, acceleration, mass, damping) {
    this.position = position;
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.inverseMass = mass ? 1. / mass : 0;
    this.damping = damping ? damping : 1.;
    this.forceAccumulator = new Vector3d(0, 0, 0);

    this.forceGenerators = [];
  }

  integrate(dt) {
    if (this.inverseMass <= 0.)
      return;

    this.updateForces(dt);

    this.position.addScaledVector(dt, this.velocity);

    var acceleration = this.acceleration.copy();
    acceleration.addScaledVector(this.inverseMass, this.forceAccumulator);

    this.velocity.addScaledVector(dt, acceleration);

    if (this.damping !== 1.)
      this.velocity.multiplyScalar(Math.pow(this.damping, dt));

    this.clearForces();
  }

  addForceGenerator(generator) {
    this.forceGenerators.push(generator);
  }

  updateForces(dt) {
    this.forceGenerators.forEach(generator => generator(this, dt));
  }

  addForce(force) {
    this.forceAccumulator.addVector(force);
  }

  clearForces() {
    this.forceAccumulator.clear();
  }

  get mass() {
    return 1. / this.inverseMass;
  }
}

module.exports = Particle;

},{"./vector3d.js":5}],4:[function(require,module,exports){
'use strict'

class PhysicsSystem {
  constructor() {
    this.particles = [];
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  removeParticle(particle) {
    var index = this.particles.indexOf(particle);
    console.assert(index != -1);
    this.particles.splice(index, 1);
  }

  integrate(dt) {
    this.particles.forEach(particle => { particle.integrate(dt); });
  }
}

module.exports = PhysicsSystem;

},{}],5:[function(require,module,exports){
'use strict'

class Vector3d {
  constructor(x, y, z) {
    this.x = x ? x : 0;
    this.y = y ? y : 0;
    this.z = z ? z : 0;
  }

  clear() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

  copy() {
    return new Vector3d(this.x, this.y, this.z);
  }

  equals(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  addVector(vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
  }

  addScaledVector(d, vector) {
    this.x += d * vector.x;
    this.y += d * vector.y;
    this.z += d * vector.z;
  }

  multiplyScalar(d) {
    this.x *= d;
    this.y *= d;
    this.z *= d;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalized() {
    var d = 1 / this.length();
    return scalarVectorMultiply(d, this);
  }
}

var publicAPI = {
  Vector3d: Vector3d,
  vectorProductLength: function(a, b) {
    return a.x * b.y - a.y * b.x;
  },

  dotProduct: function(a, b) {
    return a.x * b.x + a.y * b.y;
  },

  vectorSum: function(a, b) {
    return new Vector3d(a.x + b.x, a.y + b.y);
  },

  vectorDiff: function(a, b) {
    return new Vector3d(a.x - b.x, a.y - b.y);
  },

  scalarVectorMultiply: function(scalar, vector) {
    return new Vector3d(scalar * vector.x, scalar * vector.y);
  },

  distance: function(left, right) {
    return publicAPI.vectorDiff(left, right).length();
  },

  distanceSquared: function(left, right) {
    return publicAPI.vectorDiff(left, right).lengthSquared();
  }
};

module.exports = publicAPI;

},{}]},{},[1]);
