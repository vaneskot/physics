'use strict'

class Particle {
  constructor(position, velocity, acceleration, mass, damping) {
    this.position = position;
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.inverseMass = mass ? 1. / mass : 0;
    this.damping = damping ? damping : 1.;
  }

  integrate(dt) {
    if (this.inverseMass <= 0.)
      return;

    this.position.addScaledVector(dt, this.velocity);

    var acceleration = this.acceleration;
    this.velocity.addScaledVector(dt, acceleration);

    if (this.damping !== 1.)
      this.velocity.multiplyScalar(Math.pow(this.damping, dt));
  }
}

module.exports = Particle;
