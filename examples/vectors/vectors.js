'use strict'

var vec = require('../../vector3d.js');
var Vec3d = vec.Vec3d;
var Vector3d = vec.Vector3d;
var Particle = require('../../particle.js');
var ForceGenerators = require('../../force_generators.js');

var canvas;
var ctx;
var cwidth;
var cheight;

var lastUpdateTime;
var draw_list = [];

class Segment {
  constructor(a, b, color) {
    this.a = a;
    this.b = b;
    this.color = color ? color : 'rgb(0, 0, 0)';
  }

  draw() {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(this.a.x, cheight - this.a.y);
    ctx.lineTo(this.b.x, cheight - this.b.y);
    ctx.strokeStyle = this.color;
    ctx.stroke();

    ctx.restore();
  }
}

function loadGame() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  cwidth = canvas.width;
  cheight = canvas.height;

  const a = Vec3d(0, 300);
  const b = Vec3d(cwidth, cheight - 100);

  // A diagonal line across the screen.
  draw_list.push(new Segment(a, b));

  const middle = vec.vectorSum(a, vec.scalarVectorMultiply(0.5, vec.vectorDiff(b, a)));
  const normal = vec.vectorDiff(b, a).getNormal2d();
  const c = vec.scalarVectorMultiply(100, normal).addVector(middle);

  // A normal in the middle of the line.
  draw_list.push(new Segment(middle, c, 'rgb(0, 0, 200)'));

  const p = Vec3d(middle.x - 150, middle.y + 30);
  // A line pointing to the original line at an angle.
  draw_list.push(new Segment(p, middle, 'rgb(200, 0, 0)'));

  const reflected = vec.reflectWithNormal2d(vec.vectorDiff(middle, p), normal);
  // The previous line reflected with respect to the normal.
  draw_list.push(new Segment(middle, vec.vectorSum(middle, reflected), 'rgb(200, 0, 0)'));

  lastUpdateTime = Date.now() / 1000;
  setInterval(update, 17);
}

function update() {
  var currentTime = Date.now() / 1000;

  draw();

  lastUpdateTime = currentTime;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw_list.forEach(obj => obj.draw());
}

window.addEventListener('load', loadGame);
