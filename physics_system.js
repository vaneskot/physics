'use strict'

class PhysicsSystem {
  constructor() {
    this.particles = [];
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  integrate(dt) {
    this.particles.forEach(particle => { particle.integrate(dt); });
  }
}

module.exports = PhysicsSystem;
