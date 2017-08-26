'use strict'

class Vector3d {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
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

module.exports = {
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
  }
};
