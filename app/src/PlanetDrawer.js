import { gl, hexToRgb } from './utils';
import Drawer from './Drawer';
import { NoiseHandler } from './NoiseGenerator';
import { Controls, SliderControl, GradientControl } from './Controls';
import tinygradient from 'tinygradient';

import IcosahedronGeometry from './IcosahedronGeometry';
import SphereGeometry from './SphereGeometry';


export default class PlanetDrawer extends Drawer {
  blendSharpness = 1;
  scale = 1;
  size = 0.7;
  detail = 3;
  shine = 1.0;
  noiseLayers = [];
  lightDir = [0, 0, 0];
  lightSize = 5.0;
  lightColor = [1, 1, 1];
  gradient = [{ color: '#000000', pos: 0 }, { color: '#ffffff', pos: 1 }];
  rendering = false;

  constructor() {
    const radius = localStorage.getItem('radius') || 0.7;
    const detail = localStorage.getItem('detail') || 3;
    super(new IcosahedronGeometry(radius, detail), planetVS, planetFS);

    this.scaleUniform = gl.getUniformLocation(this.prog, 'u_scale');
		this.lightDirUniform = gl.getUniformLocation(this.prog, 'u_lightDir');
    this.lightColorUniform = gl.getUniformLocation(this.prog, 'u_lightColor');
    this.lightSizeUniform = gl.getUniformLocation(this.prog, 'u_lightSize');
    this.shineUniform = gl.getUniformLocation(this.prog, 'u_shine');

    window.addEventListener('updateNoise', () => this.generateHeightMap());

    this.geom.addControls('Planet Geometry');

    this.noiseHandler = new NoiseHandler('Noise');
    this.noiseHandler.addControls('Noise');
    if (this.noiseHandler.layers.length === 0) {
      this.noiseHandler.addNoiseLayer();
    }

    this.lightningControls = new Controls('Lightning');
    this.lightningControls.addControl(new SliderControl('shine', { step: "0.001", min: "0.001", max: "1", value: "1.0" },
      (v) => {
        this.shine = Number(v);
      })
    );
    
    this.lightningControls.addControl(new SliderControl('size', { step: "0.001", min: "1", max: "5", value: "5.0" },
      (v) => {
        this.lightSize = Number(v);
      })
    );
    
    this.lightningControls.addControl(new SliderControl('color', { type: 'color', value: "#FFFFFF" },
      (v) => {
        this.lightColor = hexToRgb(v).map((c) => c / 255);
      })
    );
    
    this.coloringControls = new Controls('Coloring');
    this.coloringControls.addControl(new GradientControl('grad1', (gradient) => {
        gradient.sort((a, b) => a.pos - b.pos);
        if (gradient.length >= 2) {
          this.gradient = gradient;
          this.generateHeightMap();
        }
        })
    );

    this.generateHeightMap();
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
    this.generateHeightMap();
  }

  customDraw() {
    gl.uniform1f(this.scaleUniform, this.scale);
		gl.uniform3fv(this.lightDirUniform, this.lightDir);
		gl.uniform3fv(this.lightColorUniform, this.lightColor);
		gl.uniform1f(this.lightSizeUniform, this.lightSize);
		gl.uniform1f(this.shineUniform, this.shine);
  }

  generateHeightMap() {
    this.geom.generateGeometry();

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

    const gradient = tinygradient(this.gradient);
    this.colors = [];

    for (let i = 0, j = 0; i < this.geom.vertices.length; i += 3, j += 1) {
      const e = heights[j];
      this.geom.vertices[i + 0] *= 1 + e;
      this.geom.vertices[i + 1] *= 1 + e;
      this.geom.vertices[i + 2] *= 1 + e;

      const color = gradient.rgbAt((e - min) / (max - min));
      this.colors.push(Number(color.getOriginalInput().r) / 255.0, Number(color.getOriginalInput().g) / 255.0, Number(color.getOriginalInput().b) / 255.0);
    }
  };

  setTexture(img) {
		addGroupControl('Texture');

    addControl('Texture', 'scale', { step: "0.001", min: "0.001", max: "10.0", value: "1.0" },
      (v) => {
        this.scale = Number(v);
      });
    
    addControl('Texture', 'blend', { step: "0.001", min: "0.001", max: "2.0", value: "1.0" },
      (v) => {
        this.blendSharpness = Number(v);
      });
    document.getElementById("texture-container").classList.add("loading");
    super.setTexture('heightmap', img);
    document.getElementById("texture-container").classList.remove("loading");
  }

  setLightDir( x, y, z ) {
		this.lightDir = [x, y, z];
  }
};

const planetVS = `
  precision highp float;

  attribute vec3 a_pos;
  attribute vec3 a_norm;
  attribute vec3 a_color;
  attribute vec2 a_tex;

  uniform mat4 u_mvp;
  uniform mat4 u_mv;
  uniform mat3 u_norm;

  uniform sampler2D u_heightmap;
  uniform sampler2D u_colormap;
  uniform float u_scale;
  uniform float u_blendSharpness;
	uniform vec3 u_lightDir;
	uniform float u_lightSize;

  varying vec3 v_color;
  varying vec3 v_norm;
  varying vec3 v_pos;
  
  varying vec4 v_noise;
  varying vec2 v_tex;

	varying vec3 v_V;
	varying vec3 v_lightDir;

  void main() {
    v_color = a_color;
    v_norm = u_norm * a_norm;
    v_pos = a_pos;
    v_tex = a_tex;
		v_V = vec3(-u_mvp * vec4(a_pos, 1));
    v_lightDir = (u_lightDir * u_lightSize) - a_pos;

    gl_Position = u_mvp * vec4(a_pos, 1.0);
  }
`;

const planetFS = `
  precision highp float;

  uniform sampler2D u_colormap;
  uniform float u_scale;
	uniform vec3 u_lightColor;
	uniform float u_shine;

  varying vec3 v_pos;
  varying vec3 v_color;
  varying vec3 v_norm;
  varying vec2 v_tex;
  varying vec4 v_noise;
	
  varying vec3 v_V;
	varying vec3 v_lightDir;

  vec4 iluminate(vec3 color) {
    float Ks = 1.0;
    float Kd = 1.0;
    float Ka = 1.0;

		vec3 L = normalize(v_lightDir);
		vec3 N = normalize(v_norm);
		float cos_tita = dot(N, L);
		cos_tita = clamp(cos_tita, 0.0, 1.0);

		vec3 R = 2.0 * cos_tita * N - L;
		float cos_theta = dot(normalize(R), normalize(v_V));
		cos_theta = clamp(cos_theta, 0.0, 1.0);

		float I = u_shine;

		vec3 difusa = color * Kd * cos_tita;
		vec3 especular = u_lightColor * Ks * pow(cos_theta, u_shine);
  	return vec4(I * color * (Ka * u_lightColor + difusa + especular), 1.0);
  }

  void main() {
    gl_FragColor = iluminate(v_color);
  }
`;