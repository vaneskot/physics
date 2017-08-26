'use strict'

class Particle {
  constructor(position, speed, acceleration) {
    this.position = position;
    this.speed = speed;
    this.acceleration = acceleration;
  }

  integrate(dt) {
    this.position.addScaledVector(dt, this.speed);
    this.speed.addScaledVector(dt, this.acceleration);
  }
}

module.exports = Particle;
