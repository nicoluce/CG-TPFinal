import SimplexNoise from 'simplex-noise';
import { CheckboxControl, SliderControl, TabControls } from './Controls';

const s = new SimplexNoise(Math.random);
function noise3D(x, y, z) {
  return s.noise3D(x, y, z);
}

export class NoiseHandler {
  layerIdx = 0;
  constructor() {
    this.layers = [];
  }

  addControls(name) {
    this.name = name;
    const oldLayers = JSON.parse(localStorage.getItem(this.name));
    if (oldLayers.length) {
      oldLayers.forEach((id) => this.addNoiseLayer(id));
    }

    this.controls = new TabControls(this.name,
      () => {
        this.addNoiseLayer();
      },
      (i) => {
        localStorage.removeItem(`noise-layer-${this.layers[i]}`);
        this.layers.splice(i, 1);
      });
    this.layers.forEach((layer) => layer.addControls(this.controls, this.layerIdx++));
  }

  addNoiseLayer(id) {
    const layer = new NoiseLayer(id || this.layerIdx++);
    this.layers.push(layer);
    if (this.controls) {
      layer.addControls(this.controls);
    }
    window.dispatchEvent(new Event('updateNoise'));
    window.dispatchEvent(new Event('draw'));

    localStorage.setItem(this.name, JSON.stringify(this.layers.map((l => l.id))));
    return layer;
  }

  getNoise(x, y, z) {
    let firstNoise = 1;
    let n = 0;

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      if (!layer.view) continue;
      if (i === 0) {
        firstNoise = layer.get(x, y, z);
        n = firstNoise;
      } else if (layer.useFirstAsMask) {
        n += firstNoise * layer.get(x, y, z);
      } else {
        n += layer.get(x, y, z);
      }
    }

    return n;
  }
}

class NoiseLayer {
  constructor(id) {
    this.id = id;
    const {
      scale,
      octaves,
      persistance,
      roughness,
      minValue,
      strength,
      view,
      useFirstAsMask
    } = JSON.parse(localStorage.getItem(`noise-layer-${this.id}`) || '{}');

    this.scale =  scale || 15.0;
    this.octaves =  octaves || 4.0;
    this.persistance =  persistance || 0.5;
    this.roughness =  roughness || 2.0;
    this.minValue =  minValue || 1.0;
    this.strength =  strength || 1.0;
    this.view =  view || true;
    this.useFirstAsMask = useFirstAsMask || false;

    this.updateLocalStorage();
  }

  updateLocalStorage() {
    localStorage.setItem(`noise-layer-${this.id}`, JSON.stringify({
      scale: this.scale,
      octaves: this.octaves,
      persistance: this.persistance,
      roughness: this.roughness,
      minValue: this.minValue,
      strength: this.strength,
      view: this.view,
      useFirstAsMask: this.useFirstAsMask
    }));
  }

  addControls(tabGroup) {
    this.tabName = `Layer ${this.id}`;

    tabGroup.pushTabGroup(this.tabName);

    tabGroup.addControl(this.tabName, new CheckboxControl('View', { checked: this.view},
      (v) => {
        this.view = v;
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, false));
    
    tabGroup.addControl(this.tabName, new CheckboxControl('mask', { innerText: 'Use 1st layer as mask', checked: this.useFirstAsMask },
      (v) => {
        this.useFirstAsMask = v;
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, false));

    tabGroup.addControl(this.tabName, new SliderControl('scale', { step: "0.001", min: "0.001", max: "20.0", value: this.scale},
      (v) => {
        this.scale = Number(v);
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, true, false));
    
    tabGroup.addControl(this.tabName, new SliderControl('octaves', { step: "1", min: "1", max: "8", value: this.octaves},
      (v) => {
        this.octaves = Number(v);
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, true, false));
    
    tabGroup.addControl(this.tabName, new SliderControl('persistance', { step: "0.001", min: "0.001", max: "1", value: this.persistance},
      (v) => {
        this.persistance = Number(v);
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, true, false));
    
    tabGroup.addControl(this.tabName, new SliderControl('roughness', { step: "0.001", min: "0.001", max: "5", value: this.roughness},
      (v) => {
        this.roughness = Number(v);
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, true, false));

    tabGroup.addControl(this.tabName, new SliderControl('minValue', { step: "0.01", min: "0", max: "2.0", value: this.minValue},
      (v) => {
        this.minValue = Number(v);
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, true, false));

    tabGroup.addControl(this.tabName, new SliderControl('strength', { step: "0.001", min: "0.001", max: "10", value: this.strength},
      (v) => {
        this.strength = Number(v);
        this.updateLocalStorage();
        window.dispatchEvent(new Event('updateNoise'));
      }, true, false));
  }

  get(x, y, z) {
    let amplitud = 1;
    let frequency = 0.71
    let noiseHeight = 0;
    let weight = 1;
    for (let i = 0; i < this.octaves; i++) {
      let noiseValue = noise3D(x * frequency/ this.scale, y * frequency/ this.scale, z * frequency/ this.scale);
      noiseValue *= weight;
      weight = noiseValue;

      noiseHeight += (noiseValue + 1) * 0.5 * amplitud;

      amplitud *= this.persistance;
      frequency *= this.roughness;
    }
    noiseHeight = Math.max(0, noiseHeight - this.minValue);

    return noiseHeight * this.strength;
  }
}

