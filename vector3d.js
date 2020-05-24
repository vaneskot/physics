'use strict'

function floatEq(a, b) {
  const eps = 1e-10;
  return Math.abs(a - b) < eps;
}

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
    return this;
  }

  subtractVector(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this;
  }

  addScaledVector(d, vector) {
    this.x += d * vector.x;
    this.y += d * vector.y;
    this.z += d * vector.z;
    return this;
  }

  multiplyScalar(d) {
    this.x *= d;
    this.y *= d;
    this.z *= d;
    return this;
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

  getNormal2d() {
    if (floatEq(this.x, 0)) {
      if (floatEq(this.y, 0)) {
        return this.copy();
      }
      return new Vector3d(1., 0.);
    }
    let n = new Vector3d(-this.y / this.x, 1.);
    return n.normalized();
  }
}

var publicAPI = {
  Vector3d: Vector3d,
  Vec3d: function(x, y, z) {
    return new Vector3d(x, y, z);
  },

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
  },

  reflectWithNormal2d(a, n) {
    const an = publicAPI.dotProduct(a, n);
    const lensq = a.lengthSquared();
    if (floatEq(lensq, 0)) {
      return a.copy();
    }
    const len = Math.sqrt(lensq);
    const cosa = - an / len / n.length();
    const cosasq = cosa * cosa;
    const sinasq = 1 - cosa * cosa;
    const sina = Math.sqrt(sinasq);

    const cosb = sinasq - cosasq;
    const sinb = 2 * sina * cosa;

    const res = new Vector3d(a.x * cosb - a.y * sinb, a.x * sinb + a.y * cosb);
    return res;
  }
};

module.exports = publicAPI;
