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
