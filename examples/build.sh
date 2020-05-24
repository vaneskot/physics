#!/bin/bash
build_binary=$1
$1 -o examples/$2/$2_bundle.js examples/$2/$2.js force_generators.js particle.js physics_system.js vector3d.js
