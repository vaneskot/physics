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
