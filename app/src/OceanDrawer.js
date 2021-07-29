import Drawer from './Drawer';
import { NoiseHandler } from './NoiseGenerator';
import IcosahedronGeometry from './IcosahedronGeometry';

export default class OceanDrawer extends Drawer {
  constructor() {
    const radius = localStorage.getItem('radius') || 0.4;
    const detail = localStorage.getItem('detail') || 3;
    super(new IcosahedronGeometry(radius, detail), oceanVS, oceanFS);
    this.geom.addControls('Ocean');

    this.noiseHandler = new NoiseHandler();
    const layer = this.noiseHandler.addNoiseLayer();

    layer.scale = 2.5;
    layer.minValue = 0;
    layer.strength = 1;

    this.generateNoise();

    // window.dispatchEvent(new Event('updateNoise'));
    // window.dispatchEvent(new Event('draw'));
  }

  generateNoise() {
    let heights = [];
    let max = 0, min = 999;
    for (let i = 0; i < this.geom.vertices.length; i += 3) {
      const x = this.geom.vertices[i + 0] * 20;
      const y = this.geom.vertices[i + 1] * 20;
      const z = this.geom.vertices[i + 2] * 20;
      
      const n = this.noiseHandler.getNoise(x, y, z);

      max = Math.max(max, n);
      min = Math.min(min, n);
      heights.push(n);
    }

    this.colors = [];

    for (let i = 0, j = 0; i < this.geom.vertices.length; i += 3, j += 1) {
      const e = heights[j];
      const color = (e - min) / (max - min);
      this.colors.push(color, color, color);
    }
  }

  updateGeometry(geometry) {
    this.geom.onDestroy && this.geom.onDestroy();
    switch (geometry) {
      case 'Esfera':
        this.geom = new SphereGeometry(this.size, this.detail);
        break;
      case 'Icosahedro':
      default:
        this.geom = new IcosahedronGeometry(this.size, this.detail);
        break;
    }
  }

  setLightDir( x, y, z ) {
		this.lightDir = [x, y, z];
  }
};

const oceanVS = `
  precision highp float;

  attribute vec3 a_pos;
  attribute vec3 a_norm;
  attribute vec3 a_color;

  uniform mat4 u_mvp;
  uniform mat4 u_mv;
  uniform mat3 u_norm;

  varying vec3 v_color;
  varying vec3 v_norm;
  varying vec3 v_pos;

  void main() {
    gl_Position = u_mvp * vec4(a_pos, 1.0);
    v_color = a_color;
  }
`;

const oceanFS = `
  precision highp float;

  varying vec3 v_pos;
  varying vec3 v_color;
  varying vec3 v_norm;

  void main() {
    gl_FragColor = vec4(vec3(1), v_color.r);
  }
`;