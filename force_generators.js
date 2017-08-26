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

module.exports = {
  Uplift : UpliftGenerator,
};
