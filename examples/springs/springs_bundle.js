(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

function ParticleSpring(originalParticle, springConstant, restLength) {
  return function(particle, dt) {
    var force =
        vectorDiff(originalParticle.position, particle.position);
    var magnitude = force.length();
    force.multiplyScalar(1. / magnitude);
    magnitude = springConstant * Math.abs(magnitude - restLength);
    force.multiplyScalar(magnitude);
    particle.addForce(force);
  }
}

function AnchoredSpring(position, springConstant, restLength) {
  return function(particle, dt) {
    var force = vectorDiff(position, particle.position);
    var magnitude = force.length();
    force.multiplyScalar(1. / magnitude);
    magnitude = springConstant * Math.abs(magnitude - restLength);
    force.multiplyScalar(magnitude);
    particle.addForce(force);
  }
}

module.exports = {
  Uplift : UpliftGenerator,
  ParticleGravity : ParticleGravityGenerator,
  ParticleSpring : ParticleSpring,
  AnchoredSpring : AnchoredSpring
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

  toArray() {
    return [this.x, this.y, this.z];
  }

  equals(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  addVector(vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
  }

  subtractVector(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
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
    return publicAPI.scalarVectorMultiply(d, this);
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
