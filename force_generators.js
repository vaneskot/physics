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
