// Vehicle roster. Speeds in m/s, accelerations in m/s^2.
// Handling in a slide (player only, see Vehicle.handling): driftAngle is the held slide angle (rad), driftGrip the
// side grip left while sliding, driftPower the drive left, powerSlide how readily throttle kicks the tail out,
// liftOff how readily lifting off at the limit (and, with powerSlide, a trail-brake) rotates the car, looseSlide
// the extra tail-happiness on dirt. traffic is the weight in the random street pool; bike marks a two-wheeler
// (one track of wheels, leans into turns, ridden astride).
import { PAL } from '../world/palette.js';

export const SURFACES = {
  asphalt: { grip: 1.0, speed: 1.0, roll: 0.25 },
  concrete: { grip: 0.96, speed: 1.0, roll: 0.3 },
  dirt: { grip: 0.72, speed: 0.86, roll: 0.6 },
  grass: { grip: 0.62, speed: 0.7, roll: 0.9 },
  sand: { grip: 0.5, speed: 0.55, roll: 1.4 },
  mud: { grip: 0.42, speed: 0.42, roll: 2.0 },
  water: { grip: 0.3, speed: 0.22, roll: 4.0 },
};

const civPaint = [0xf2f3f4, 0xe8e2d4, 0xc9ccd0, 0x8fb7c9, PAL.terracotta, 0x9aa3ab, 0x1f2a33, 0x5c7f6b, PAL.terracottaLight, 0xdfe6ea];

export const VEHICLES = {
  sport: {
    name: 'Haiku GT', cls: 'car', shape: 'sport', len: 4.5, wid: 1.95, hgt: 1.2, wheelR: 0.36, wheelbase: 2.7,
    mass: 1250, maxSpeed: 62, accel: 21, brake: 34, grip: 9.5, steer: 0.62, offroad: 0.18, health: 100,
    driftAngle: 0.62, driftGrip: 0.72, driftPower: 0.68, powerSlide: 0.6, liftOff: 0.6, looseSlide: 0.4,
    paints: [0xf2f3f4, 0xd97757, 0x1b1b1f, 0x8fb7c9, 0xc9ccd0, 0x2f5d73], traffic: 2, value: 900,
  },
  sedan: {
    name: 'Opus Cruiser', cls: 'car', shape: 'sedan', len: 4.7, wid: 1.9, hgt: 1.45, wheelR: 0.36, wheelbase: 2.8,
    mass: 1500, maxSpeed: 46, accel: 13, brake: 28, grip: 8.5, steer: 0.58, offroad: 0.3, health: 110,
    driftAngle: 0.45, driftGrip: 0.78, driftPower: 0.6, powerSlide: 0.12, liftOff: 0, looseSlide: 0.3,
    paints: civPaint, traffic: 6, value: 350,
  },
  taxi: {
    name: 'Prompt Cab', cls: 'car', shape: 'taxi', len: 4.8, wid: 1.9, hgt: 1.8, wheelR: 0.36, wheelbase: 2.85,
    mass: 1550, maxSpeed: 45, accel: 12.5, brake: 28, grip: 8.5, steer: 0.58, offroad: 0.3, health: 115,
    driftAngle: 0.45, driftGrip: 0.78, driftPower: 0.6, powerSlide: 0.12, liftOff: 0, looseSlide: 0.3,
    paints: [0xf0b43c, 0xe9a93a], traffic: 3, value: 300,
  },
  roadster: {
    name: 'Verse Roadster', cls: 'car', shape: 'roadster', len: 4.3, wid: 1.88, hgt: 1.15, wheelR: 0.34, wheelbase: 2.55,
    mass: 1080, maxSpeed: 56, accel: 18, brake: 32, grip: 9.4, steer: 0.63, offroad: 0.2, health: 95, open: true,
    driftAngle: 0.58, driftGrip: 0.74, driftPower: 0.66, powerSlide: 0.5, liftOff: 0.55, looseSlide: 0.35,
    paints: [0xd8634a, 0x2f8f8a, 0xe3b54f, 0x8fb7c9, 0xf2f3f4, 0x3f6b4f], traffic: 1, value: 700,
  },
  moto: {
    name: 'Tempo 250', cls: 'car', shape: 'moto', bike: true, len: 2.15, wid: 0.8, hgt: 1.25, wheelR: 0.32, wheelbase: 1.42,
    mass: 230, maxSpeed: 50, accel: 21, brake: 30, grip: 9.2, steer: 0.55, offroad: 0.35, health: 80, open: true,
    driftAngle: 0.5, driftGrip: 0.7, driftPower: 0.7, powerSlide: 0.3, liftOff: 0.3, looseSlide: 0.6,
    paints: [0xd97757, 0x1b1b1f, 0x2f7f86, 0xe3a93c, 0xf2f3f4, 0x8fb7c9, 0x5c7f6b], traffic: 2, value: 350,
  },
  compact: {
    name: 'Token Hatch', cls: 'car', shape: 'compact', len: 3.8, wid: 1.75, hgt: 1.5, wheelR: 0.33, wheelbase: 2.4,
    mass: 1100, maxSpeed: 42, accel: 14, brake: 28, grip: 9, steer: 0.64, offroad: 0.3, health: 90,
    driftAngle: 0.42, driftGrip: 0.8, driftPower: 0.6, powerSlide: 0.08, liftOff: 0.5, looseSlide: 0.3,
    paints: civPaint, traffic: 5, value: 250,
  },
  truck: {
    name: 'Bayou Crawler', cls: 'car', shape: 'truck', len: 5.3, wid: 2.15, hgt: 2.05, wheelR: 0.58, wheelbase: 3.3,
    mass: 2400, maxSpeed: 44, accel: 15, brake: 26, grip: 8, steer: 0.52, offroad: 0.95, health: 170,
    driftAngle: 0.42, driftGrip: 0.7, driftPower: 0.62, powerSlide: 0.05, liftOff: 0, looseSlide: 0.9,
    paints: [0x5c7f6b, PAL.clay, 0x2a2f33, 0xd9b26a, 0x7a5636], traffic: 2, value: 600,
  },
  buggy: {
    name: 'Ridge Runner', cls: 'car', shape: 'buggy', len: 3.4, wid: 1.9, hgt: 1.5, wheelR: 0.46, wheelbase: 2.3,
    mass: 800, maxSpeed: 47, accel: 20, brake: 28, grip: 8.5, steer: 0.66, offroad: 1.0, health: 90, open: true,
    driftAngle: 0.56, driftGrip: 0.68, driftPower: 0.7, powerSlide: 0.25, liftOff: 0.5, looseSlide: 1.0,
    paints: [PAL.neonAmber, PAL.terracotta, PAL.neonLime], traffic: 0, value: 500,
  },
  van: {
    name: 'Data Hauler', cls: 'car', shape: 'van', len: 6.2, wid: 2.3, hgt: 2.7, wheelR: 0.46, wheelbase: 3.8,
    mass: 4200, maxSpeed: 36, accel: 9, brake: 22, grip: 7.5, steer: 0.45, offroad: 0.4, health: 420,
    driftAngle: 0.3, driftGrip: 0.8, driftPower: 0.5, powerSlide: 0, liftOff: 0, looseSlide: 0.2,
    paints: [0xe8e2d4, PAL.slateLight], traffic: 1, value: 500,
  },
  boxtruck: {
    name: 'Batch Freight', cls: 'car', shape: 'boxtruck', len: 7.4, wid: 2.4, hgt: 3.3, wheelR: 0.5, wheelbase: 4.3,
    mass: 5200, maxSpeed: 34, accel: 8.5, brake: 21, grip: 7.5, steer: 0.5, offroad: 0.4, health: 450,
    driftAngle: 0.28, driftGrip: 0.82, driftPower: 0.5, powerSlide: 0, liftOff: 0, looseSlide: 0.2,
    paints: [0xf2f3f4, 0x2f5d73, 0xd97757, 0x5c7f6b, 0xd9b26a], traffic: 1, value: 450,
  },
  bus: {
    name: 'Context Bus', cls: 'car', shape: 'bus', len: 11.4, wid: 2.55, hgt: 3.2, wheelR: 0.52, wheelbase: 6.2,
    mass: 12000, maxSpeed: 30, accel: 6.5, brake: 18, grip: 7, steer: 0.6, offroad: 0.3, health: 600,
    driftAngle: 0.2, driftGrip: 0.88, driftPower: 0.45, powerSlide: 0, liftOff: 0, looseSlide: 0.15,
    paints: [0x2f7f86, 0xd97757, 0x4f7d5b, 0xe0a43a], traffic: 0, value: 400,
  },
  prototype: {
    name: 'Vanta X-1', cls: 'car', shape: 'prototype', len: 4.7, wid: 2.05, hgt: 1.1, wheelR: 0.37, wheelbase: 2.8,
    mass: 1150, maxSpeed: 72, accel: 27, brake: 38, grip: 10.5, steer: 0.64, offroad: 0.12, health: 120,
    driftAngle: 0.66, driftGrip: 0.74, driftPower: 0.7, powerSlide: 0.75, liftOff: 0.5, looseSlide: 0.3,
    paints: [0x0c0c10], glow: 0xdff2ff, traffic: 0, value: 6000,
  },
  hoverbike: {
    name: 'Glide-7', cls: 'hover', shape: 'hoverbike', len: 2.6, wid: 0.9, hgt: 1.2, wheelR: 0, wheelbase: 1.6,
    mass: 300, maxSpeed: 58, accel: 24, brake: 22, grip: 4.2, steer: 0.75, offroad: 1.0, health: 70, open: true, hover: 0.75,
    driftAngle: 0.55, driftGrip: 0.55, driftPower: 0.8, powerSlide: 0, liftOff: 0, looseSlide: 0,
    paints: [0xf2f3f4, 0xd97757, 0x1b1b1f], glow: 0xcfe9ff, traffic: 0, value: 1200,
  },
  boat: {
    name: 'Wave Sonnet', cls: 'boat', shape: 'boat', len: 6.4, wid: 2.3, hgt: 1.4, wheelR: 0, wheelbase: 3.2,
    mass: 1400, maxSpeed: 38, accel: 13, brake: 8, grip: 2.4, steer: 0.5, offroad: 1.0, health: 140, open: true,
    paints: [PAL.cream, PAL.terracottaLight, 0x2f5d73], traffic: 0, value: 800,
  },
  police: {
    name: 'Safety Interceptor', cls: 'car', shape: 'police', len: 4.9, wid: 2.0, hgt: 1.5, wheelR: 0.38, wheelbase: 2.9,
    mass: 1900, maxSpeed: 60, accel: 20, brake: 34, grip: 10, steer: 0.6, offroad: 0.45, health: 190,
    driftAngle: 0.48, driftGrip: 0.82, driftPower: 0.68, powerSlide: 0.3, liftOff: 0, looseSlide: 0.3,
    paints: [0x2b2d33], police: true, traffic: 0, value: 0,
  },
  policeOffroad: {
    name: 'Safety Ranger', cls: 'car', shape: 'policeTruck', len: 5.2, wid: 2.15, hgt: 2.0, wheelR: 0.56, wheelbase: 3.2,
    mass: 2500, maxSpeed: 50, accel: 18, brake: 28, grip: 9, steer: 0.55, offroad: 1.0, health: 220,
    driftAngle: 0.42, driftGrip: 0.78, driftPower: 0.62, powerSlide: 0.15, liftOff: 0, looseSlide: 0.6,
    paints: [0x2b2d33], police: true, traffic: 0, value: 0,
  },
  swat: {
    name: 'Containment Truck', cls: 'car', shape: 'swat', len: 6.6, wid: 2.5, hgt: 2.9, wheelR: 0.55, wheelbase: 4.0,
    mass: 6500, maxSpeed: 43, accel: 12, brake: 24, grip: 8.5, steer: 0.46, offroad: 0.7, health: 520,
    driftAngle: 0.25, driftGrip: 0.85, driftPower: 0.5, powerSlide: 0, liftOff: 0, looseSlide: 0.2,
    paints: [0x1c1d22], police: true, traffic: 0, value: 0,
  },
  policeBoat: {
    name: 'Safety Skiff', cls: 'boat', shape: 'policeBoat', len: 6.0, wid: 2.2, hgt: 1.4, wheelR: 0, wheelbase: 3.0,
    mass: 1500, maxSpeed: 39, accel: 14, brake: 8, grip: 2.6, steer: 0.5, offroad: 1.0, health: 160, open: true,
    paints: [0x2b2d33], police: true, traffic: 0, value: 0,
  },
};
for (const k of Object.keys(VEHICLES)) VEHICLES[k].id = k;

export const TRAFFIC_POOL = [];
for (const k of Object.keys(VEHICLES)) for (let i = 0; i < VEHICLES[k].traffic; i++) TRAFFIC_POOL.push(k);
