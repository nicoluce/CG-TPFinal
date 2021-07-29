let canvas = document.getElementById("canvas"),
		gl = canvas.getContext("webgl", {antialias: false, depth: true, premultipliedAlpha: false});

export {
	canvas,
	gl
};

export function normalize(v) {
	const [x, y, z] = v;
	const mag = Math.sqrt(x * x + y * y + z * z);
	return Number(mag.toFixed(5)) === 0 ? v : [x / mag, y / mag, z / mag];
};
	
// Calcula la matriz de perspectiva (column-major)
export function ProjectionMatrix(c, z, fov_angle=60) {
	var r = c.width / c.height;
	var n = (z - 1.74);
	const min_n = 0.001;
	if (n < min_n) n = min_n;
	var f = (z + 1.74);;
	var fov = 3.145 * fov_angle / 180;
	var s = 1 / Math.tan(fov/2);
	return [
		s/r, 0, 0, 0,
		0, s, 0, 0,
		0, 0, (n+f)/(f-n), 1,
		0, 0, -2*n*f/(f-n), 0
	];
}
	
export function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
	// Matriz de traslación
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	const rot_x = [
			1, 0, 0, 0,
			0, Math.cos(rotationX), Math.sin(rotationX), 0,
			0, -Math.sin(rotationX), Math.cos(rotationX), 0,
			0, 0, 0, 1,
	];
	const rot_y = [
			Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
			0, 1, 0, 0,
			Math.sin(rotationY), 0, Math.cos(rotationY), 0,
			0, 0, 0, 1,
	];
	const rot = MatrixMult(rot_x, rot_y);

	return MatrixMult(trans, rot);
}

function CompileShader(type, source, wgl = gl) {
	// Creamos el shader
	const shader = wgl.createShader(type);

	// Lo compilamos
	wgl.shaderSource(shader, source);
	wgl.compileShader(shader);

	// Verificamos si la compilación fue exitosa
	if (!wgl.getShaderParameter(shader, wgl.COMPILE_STATUS)) 
	{
		alert('Ocurrió un error durante la compilación del shader:' + wgl.getShaderInfoLog(shader));
		wgl.deleteShader(shader);
		return null;
	}

	return shader;
}

export function InitShaderProgram(vsSource, fsSource, wgl = gl) {
	// Función que compila cada shader individualmente
	const vs = CompileShader(wgl.VERTEX_SHADER,   vsSource, wgl);
	const fs = CompileShader(wgl.FRAGMENT_SHADER, fsSource, wgl);

	// Crea y linkea el programa 
	const prog = wgl.createProgram();
	wgl.attachShader(prog, vs);
	wgl.attachShader(prog, fs);
	wgl.linkProgram(prog);

	if (!wgl.getProgramParameter(prog, wgl.LINK_STATUS)) 
	{
		alert('No se pudo inicializar el programa: ' + wgl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}

export function MatrixMult(A, B)
{
	var C = [];
	for (var i=0; i<4; ++i) 
	{
		for (var j=0; j<4; ++j) 
		{
			var v = 0;
			for (var k=0; k<4; ++k) 
			{
				v += A[j+4*k] * B[k+4*i];
			}

			C.push(v);
		}
	}
	return C;
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
	] : null;
}