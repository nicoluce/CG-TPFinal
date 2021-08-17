// Basado en https://github.com/mrdoob/three.js/blob/master/src/geometries/SphereGeometry.js

import { normalize } from "./utils";
import { Controls, SliderControl } from './Controls'

export default class SphereGeometry {
	constructor(radius = 1, widthSegments = 8, heightSegments = 6, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
		this.radius = radius;
		this.widthSegments = widthSegments;
		this.heightSegments = heightSegments;
		this.phiStart = phiStart;
		this.phiLength = phiLength;
		this.thetaStart = thetaStart;
		this.thetaLength = thetaLength;

		this.generateGeometry();
	}
	addControls(name = 'Geometry') {
    this.geometryControls = new Controls(name);
		this.geometryControls.addControl(new SliderControl('radius', { step: "0.01", min: "0.01", max: "1.0", value: this.radius },
			(v) => {
				this.radius = Number(v);
        this.generateGeometry();
				window.dispatchEvent(new Event('updateNoise'));
			})
    );
    
		this.geometryControls.addControl(new SliderControl('segments', { step: "1", min: "3", max: "256", value: this.widthSegments },
			(v) => {
				this.widthSegments = Number(v);
				this.heightSegments = Number(v);
        this.generateGeometry();
				window.dispatchEvent(new Event('updateNoise'));
			})
		);
    
		this.geometryControls.addControl(new SliderControl('phiStart', { step: "0.01", min: "0", max: "6", value: this.phiStart },
			(v) => {
				this.phiStart = Number(v);
        this.generateGeometry();
				window.dispatchEvent(new Event('updateNoise'));
			})
		);
		
		this.geometryControls.addControl(new SliderControl('phiLength', { step: "0.01", min: "0.0", max: "6.3", value: this.phiLength },
			(v) => {
				this.phiLength = Number(v);
        this.generateGeometry();
				window.dispatchEvent(new Event('updateNoise'));
			})
    );
    
		this.geometryControls.addControl(new SliderControl('thetaStart', { step: "0.011", min: "0", max: "6", value: this.thetaStart },
			(v) => {
				this.thetaStart = Number(v);
        this.generateGeometry();
				window.dispatchEvent(new Event('updateNoise'));
			})
    );
    
		this.geometryControls.addControl(new SliderControl('thetaLength', { step: "0.01", min: "0", max: "6.3", value: this.thetaLength },
			(v) => {
				this.thetaLength = Number(v);
        this.generateGeometry();
				window.dispatchEvent(new Event('updateNoise'));
			})
    );
	}
	
	generateGeometry() {
		this.widthSegments = Math.max( 3, Math.floor( this.widthSegments ) );
		this.heightSegments = Math.max( 2, Math.floor( this.heightSegments ) );

		const thetaEnd = Math.min( this.thetaStart + this.thetaLength, Math.PI );

		let index = 0;
		const grid = [];

		let vertex = [0, 0, 0];
		let normal = [0, 0, 0];

		// buffers
		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		// generate vertices, normals and uvs
		for ( let iy = 0; iy <= this.heightSegments; iy ++ ) {
			const verticesRow = [];
			const v = iy / this.heightSegments;

			// special case for the poles
			let uOffset = 0;
			if ( iy == 0 && this.thetaStart == 0 ) {
				uOffset = 0.5 / this.widthSegments;
			} else if ( iy == this.heightSegments && thetaEnd == Math.PI ) {
				uOffset = - 0.5 / this.widthSegments;
			}

			for ( let ix = 0; ix <= this.widthSegments; ix ++ ) {
				const u = ix / this.widthSegments;

				// vertex
				vertex[0] = - this.radius * Math.cos( this.phiStart + u * this.phiLength ) * Math.sin( this.thetaStart + v * this.thetaLength );
				vertex[1] = this.radius * Math.cos( this.thetaStart + v * this.thetaLength );
				vertex[2] = this.radius * Math.sin( this.phiStart + u * this.phiLength ) * Math.sin( this.thetaStart + v * this.thetaLength );

				vertices.push( vertex[0], vertex[1], vertex[2] );

				// normal
				normal = normalize([...vertex]);
				normals.push( normal[0], normal[1], normal[2] );

				// uv
				uvs.push( u + uOffset, 1 - v );
				verticesRow.push( index ++ );
			}
			grid.push( verticesRow );
		}

		// indices

		for ( let iy = 0; iy < this.heightSegments; iy ++ ) {
			for ( let ix = 0; ix < this.widthSegments; ix ++ ) {
				const a = grid[ iy ][ ix + 1 ];
				const b = grid[ iy ][ ix ];
				const c = grid[ iy + 1 ][ ix ];
				const d = grid[ iy + 1 ][ ix + 1 ];

				if ( iy !== 0 || this.thetaStart > 0 ) indices.push( a, b, d );
				if ( iy !== this.heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );
			}
		}

		// build geometry
    this.indices = indices;
    this.vertices = vertices;
    this.normals = normals;
    this.uv = uvs;
	}

	onDestroy() {
		this.geometryControls.remove();
	}
}