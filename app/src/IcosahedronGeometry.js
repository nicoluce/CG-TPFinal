// Basado en https://github.com/mrdoob/three.js/blob/master/src/geometries/IcosahedronGeometry.js

import { normalize } from "./utils";
import { Controls, SliderControl } from './Controls'
	
export default class IcosahedronGeometry {
	constructor(radius = 1, detail = 0) {
		this.radius = radius;
		this.detail = detail;
		this.generateGeometry();
	};

	addControls(name = 'Geometry') {
    this.geometryControls = new Controls(name);
		this.geometryControls.addControl(new SliderControl('radius', { step: "0.01", min: "0.01", max: "1.0", value: this.radius },
			(v) => {
				this.radius = Number(v);
				this.applyRadius(this.radius);
				window.dispatchEvent(new Event('updateNoise'));
			})
    );
    
		this.geometryControls.addControl(new SliderControl('detail', { step: "1", min: "0", max: "6", value: this.detail },
			(v) => {
				this.detail = Number(v);
        this.generateGeometry();
				window.dispatchEvent(new Event('updateNoise'));
			})
    );
	}

	generateGeometry() {
		const t = (1 + Math.sqrt(5)) / 2;

		this.vertices = [
			- 1, t, 0, 1, t, 0, - 1, - t, 0, 1, - t, 0,
			0, - 1, t, 0, 1, t, 0, - 1, - t, 0, 1, - t,
			t, 0, - 1, t, 0, 1, - t, 0, - 1, - t, 0, 1
		];


		this.indices = [
			0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
			1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
			3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
			4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
		];

		this.subdivide(this.detail);
		this.applyRadius(this.radius);
		this.calculateNormals();
	}
	
	subdivide(detail) {
		let subdivisionIterations = 0;
		while (subdivisionIterations < detail) {
			let i = 0;
			const newIndices = [];
			const midCache = {};
			while (i < this.indices.length) {
				const i0 = this.indices[i + 0];
				const i1 = this.indices[i + 1];
				const i2 = this.indices[i + 2];

				const v0 = this.getVertexByIndex(i0);
				const v1 = this.getVertexByIndex(i1);
				const v2 = this.getVertexByIndex(i2);


				let i01;
				if (midCache[`${i0}-${i1}`] === undefined && midCache[`${i1}-${i0}`] === undefined) {
					const v01 = [0.5 * (v0[0] + v1[0]), 0.5 * (v0[1] + v1[1]), 0.5 * (v0[2] + v1[2])];
					i01 = this.vertices.length / 3;
					this.vertices.push(...v01);
					midCache[`${i0}-${i1}`] = i01;
				} else {
					i01 = midCache[`${i0}-${i1}`] || midCache[`${i1}-${i0}`];
				}
				

				let i12;
				if (midCache[`${i1}-${i2}`] === undefined && midCache[`${i2}-${i1}`] === undefined) {
					const v12 = [0.5 * (v1[0] + v2[0]), 0.5 * (v1[1] + v2[1]), 0.5 * (v1[2] + v2[2])];
					i12 = this.vertices.length / 3;
					this.vertices.push(...v12);
					midCache[`${i1}-${i2}`] = i12;
				} else {
					i12 = midCache[`${i1}-${i2}`] || midCache[`${i2}-${i1}`];
				}


				let i20;
				if (midCache[`${i2}-${i0}`] === undefined && midCache[`${i0}-${i2}`] === undefined) {
					const v20 = [0.5 * (v2[0] + v0[0]), 0.5 * (v2[1] + v0[1]), 0.5 * (v2[2] + v0[2])];
					i20 = this.vertices.length / 3;
					this.vertices.push(...v20);
					midCache[`${i2}-${i0}`] = i20;
				} else {
					i20 = midCache[`${i2}-${i0}`] || midCache[`${i0}-${i2}`];
				}


				newIndices.push(i0, i01, i20);
				newIndices.push(i1, i12, i01);
				newIndices.push(i2, i20, i12);
				newIndices.push(i01, i12, i20);

				i += 3;
			}

			this.indices = newIndices
			subdivisionIterations += 1;
		}
	};

	applyRadius(radius) {
		let i = 0;
		while (i < this.vertices.length) {
			const v0 = this.vertices[i + 0];
			const v1 = this.vertices[i + 1];
			const v2 = this.vertices[i + 2];

			const mag = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);

			this.vertices[i + 0] = Number(mag.toFixed(5)) === 0 ? v0 : (v0 / mag) * radius;
			this.vertices[i + 1] = Number(mag.toFixed(5)) === 0 ? v1 : (v1 / mag) * radius;
			this.vertices[i + 2] = Number(mag.toFixed(5)) === 0 ? v2 : (v2 / mag) * radius;

			i += 3;
		}
	};

	calculateNormals() {
		this.normals = [];
		for (let i = 0; i < this.indices.length; i++) {
			const v = normalize(this.getVertexByIndex(i));
			this.normals.push(...v);
		}
	}

	getVertexByIndex(i) {
		const stride = i * 3;
		return [this.vertices[stride + 0], this.vertices[stride + 1], this.vertices[stride + 2]]
	}

	getNormalByIndex(i) {
		const stride = i * 3;
		return [this.normals[stride + 0], this.normals[stride + 1], this.normals[stride + 2]]
	};

	onDestroy() {
		this.geometryControls.remove();
	}
}