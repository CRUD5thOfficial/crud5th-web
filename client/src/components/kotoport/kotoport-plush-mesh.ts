export interface PlushRenderer {
  draw: (seconds: number, mode: number, level: number) => void;
  dispose: () => void;
}

const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
uniform float u_time;
uniform float u_mode;
uniform float u_level;

float softArea(vec2 p, vec2 center, vec2 radius) {
  vec2 distance = (p - center) / radius;
  return exp(-dot(distance, distance) * 2.0);
}

vec2 plushMotion(vec2 p, float center, float halfWidth, float top, float leftFoot, float rightFoot, float offset, float isSpeaker) {
  float mode = u_mode > 0.5 && isSpeaker < 0.5 ? 1.0 : u_mode;
  float phase = u_time * 4.7 + offset;
  float side = sin(phase);
  float horizontal = 1.0 - smoothstep(halfWidth * 0.82, halfWidth, abs(p.x - center));
  float vertical = smoothstep(top - 35.0, top, p.y) * (1.0 - smoothstep(675.0, 725.0, p.y));
  float weight = horizontal * vertical;
  float angle = sin(phase) * 0.0035;
  vec2 shift = vec2(sin(u_time * 0.32 + offset) * 5.0, -abs(cos(phase)) * 1.0);
  vec2 feet = vec2(0.0);

  if (mode < 0.5) {
    float left = softArea(p, vec2(leftFoot, 646.0), vec2(64.0, 48.0));
    float right = softArea(p, vec2(rightFoot, 646.0), vec2(64.0, 48.0));
    feet.x = (left - right) * side * 2.2;
    feet.y = -(left * pow(max(side, 0.0), 2.0) + right * pow(max(-side, 0.0), 2.0)) * 4.0;
  } else {
    // The photo's face and accessories move with the body; no replacement mouth or detached joints.
    angle = sin(u_time * 1.65 + offset) * 0.002;
    shift = vec2(0.0, sin(u_time * 1.65 + offset) * 0.8);
    if (mode < 1.5) {
      angle += (0.002 + u_level * 0.004) * sin(u_time * 2.0);
      shift.y -= u_level * 2.0;
    } else if (mode < 2.5) {
      angle += 0.003;
    } else {
      shift.y -= pow(max(sin(u_time * 3.0), 0.0), 2.0) * 1.7;
    }
  }

  vec2 local = p - vec2(center, 650.0);
  vec2 rotation = vec2(-local.y, local.x) * angle;
  return (rotation + shift) * weight + feet;
}

void main() {
  vec2 p = a_position;
  vec2 delta = plushMotion(p, 300.0, 310.0, 100.0, 210.0, 390.0, 0.0, 0.0);
  delta += plushMotion(p, 842.0, 265.0, 110.0, 710.0, 975.0, 1.8, 0.0);
  delta += plushMotion(p, 1304.0, 240.0, 157.0, 1210.0, 1375.0, 3.7, 0.0);
  delta += plushMotion(p, 1760.0, 290.0, 48.0, 1660.0, 1830.0, 5.3, 1.0);
  // Pin the photo border so the continuous background never opens a gap at the frame.
  float edge = smoothstep(0.0, 20.0, p.x) * smoothstep(0.0, 20.0, 2048.0 - p.x);
  edge *= smoothstep(0.0, 20.0, p.y) * smoothstep(0.0, 30.0, 759.0 - p.y);
  vec2 position = (p + delta * edge) / vec2(2048.0, 759.0);
  gl_Position = vec4(position.x * 2.0 - 1.0, 1.0 - position.y * 2.0, 0.0, 1.0);
  v_uv = p / vec2(2048.0, 759.0);
}`;

const fragmentSource = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_texture;
float coverage(vec3 color) {
  float chroma = max(max(color.r - color.b, color.g - color.r), color.b - color.g);
  float colorful = clamp((chroma - 0.06) * 18.0, 0.0, 1.0);
  float dark = clamp((0.75 - dot(color, vec3(0.2126, 0.7152, 0.0722))) * 12.0, 0.0, 1.0);
  float mint = clamp((color.g - color.b - 0.002) * 60.0, 0.0, 1.0);
  return max(max(colorful, dark), mint);
}
void main() {
  vec4 color = texture2D(u_texture, v_uv);
  float alpha = coverage(color.rgb);
  // Keep tiny white eye/headset highlights enclosed by the opaque plush, without a pale photo border.
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x) * 2.0 / 2048.0, float(y) * 2.0 / 759.0);
      alpha = max(alpha, coverage(texture2D(u_texture, v_uv + offset).rgb));
    }
  }
  gl_FragColor = vec4(color.rgb, alpha);
}`;

export function createPlushRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement): PlushRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return null;
  const shaders: WebGLShader[] = [];
  const buffers: WebGLBuffer[] = [];
  const program = gl.createProgram();
  const texture = gl.createTexture();
  const release = () => {
    buffers.forEach(buffer => gl.deleteBuffer(buffer));
    shaders.forEach(shader => gl.deleteShader(shader));
    if (texture) gl.deleteTexture(texture);
    if (program) gl.deleteProgram(program);
  };
  if (!program || !texture) {
    release();
    return null;
  }

  for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
    const shader = gl.createShader(type);
    if (!shader) {
      release();
      return null;
    }
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Kotoport plush animation is unavailable:", gl.getShaderInfoLog(shader));
      release();
      return null;
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Kotoport plush animation is unavailable:", gl.getProgramInfoLog(program));
    release();
    return null;
  }

  const columns = 96;
  const rows = 36;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) positions.push(column / columns * 2048, row / rows * 759);
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const start = row * (columns + 1) + column;
      indices.push(start, start + 1, start + columns + 1, start + 1, start + columns + 2, start + columns + 1);
    }
  }
  const positionBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  if (!positionBuffer || !indexBuffer) {
    if (positionBuffer) gl.deleteBuffer(positionBuffer);
    if (indexBuffer) gl.deleteBuffer(indexBuffer);
    release();
    return null;
  }
  buffers.push(positionBuffer, indexBuffer);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const positionAttribute = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttribute);
  gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
  const timeUniform = gl.getUniformLocation(program, "u_time");
  const modeUniform = gl.getUniformLocation(program, "u_mode");
  const levelUniform = gl.getUniformLocation(program, "u_level");

  return {
    draw(seconds, mode, level) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(timeUniform, seconds);
      gl.uniform1f(modeUniform, mode);
      gl.uniform1f(levelUniform, level);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    },
    dispose: release,
  };
}
