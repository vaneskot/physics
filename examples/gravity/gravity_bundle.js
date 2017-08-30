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

  let planet = new ExampleParticle(
      new Vector3d(250, 250), new Vector3d(0, 0), 150000, 1., 'rgb(200, 0, 0)',
      30);
  physics.addParticle(planet);

  let particle1 = new ExampleParticle(
      new Vector3d(100, 250), new Vector3d(0, -80), 20, 1., 'rgb(0, 100, 200)',
      12);
  let particle2 = new ExampleParticle(
      new Vector3d(150, 250), new Vector3d(0, -100), 10, 1., 'rgb(0, 0, 200)',
      12);
  physics.addParticle(particle1);
  physics.addParticle(particle2);

  let G = 6.67408;
  let planetGravityGenerator = ForceGenerators.ParticleGravity(G, planet);
  let particle1GravityGenerator = ForceGenerators.ParticleGravity(G, particle1);
  let particle2GravityGenerator = ForceGenerators.ParticleGravity(G, particle2);

  particle1.addForceGenerator(planetGravityGenerator);
  particle1.addForceGenerator(particle2GravityGenerator);

  particle2.addForceGenerator(planetGravityGenerator);
  particle2.addForceGenerator(particle1GravityGenerator);

  planet.addForceGenerator(particle1GravityGenerator);
  planet.addForceGenerator(particle2GravityGenerator);

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

},{"../../force_generators.js":2,"../../particle.js":3,"../../physics_system.js":4,"../../vector3d.js":5}],2:[function(require,module,exports){
var vectorModule = require('./vector3d.js');
var Vector3d = vectorModule.Vector3d;
var vectorDiff = vectorModule.vectorDiff;

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
      particle.addForce(upliftForce);
    }
  };
}

// f = G * m1 * m2 / r^2
function ParticleGravityGenerator(G, originalParticle) {
  return function(particle, dt) {
    var force =
        vectorDiff(originalParticle.position, particle.position);
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

    var acceleration = this.acceleration.copy();
    acceleration.addScaledVector(this.inverseMass, this.forceAccumulator);

    this.velocity.addScaledVector(dt, acceleration);

    if (this.damping !== 1.)
      this.velocity.multiplyScalar(Math.pow(this.damping, dt));

    this.position.addScaledVector(dt, this.velocity);

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
    this.particles.forEach(particle => { particle.updateForces(dt); });
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
