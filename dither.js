const waveVertexShader = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const waveFragmentShader = `
precision highp float;
varying vec2 vUv;

uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec2 mousePos;
uniform int enableMouseInteraction;
uniform float mouseRadius;

uniform float colorNum;
uniform float pixelSize;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = waveFrequency;
  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= waveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - time * waveSpeed;
  return fbm(p + fbm(p2)); 
}

float getBayer4x4(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    if (x==0) {
        if (y==0) return 0.0/16.0; if (y==1) return 8.0/16.0; if (y==2) return 2.0/16.0; return 10.0/16.0;
    } else if (x==1) {
        if (y==0) return 12.0/16.0; if (y==1) return 4.0/16.0; if (y==2) return 14.0/16.0; return 6.0/16.0;
    } else if (x==2) {
        if (y==0) return 3.0/16.0; if (y==1) return 11.0/16.0; if (y==2) return 1.0/16.0; return 9.0/16.0;
    } else {
        if (y==0) return 15.0/16.0; if (y==1) return 7.0/16.0; if (y==2) return 13.0/16.0; return 5.0/16.0;
    }
}

vec3 applyDither(vec2 uv, vec3 color) {
  vec2 scaledCoord = floor(uv * resolution / pixelSize);
  float threshold = getBayer4x4(scaledCoord) - 0.25;
  float step_size = 1.0 / (colorNum - 1.0);
  color += threshold * step_size;
  float bias = 0.2;
  color = clamp(color - bias, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // Pixelate coordinates
  vec2 pixelatedUv = floor(uv * resolution / pixelSize) * pixelSize / resolution;
  
  vec2 uvCentered = pixelatedUv - 0.5;
  uvCentered.x *= resolution.x / resolution.y;
  
  float f = pattern(uvCentered);
  if (enableMouseInteraction == 1) {
    vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
    mouseNDC.x *= resolution.x / resolution.y;
    float dist = length(uvCentered - mouseNDC);
    float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
    f -= 0.5 * effect;
  }
  
  vec3 col = mix(vec3(0.0), waveColor, f);
  col = applyDither(uv, col);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

window.initDither = function(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cfg = {
    waveSpeed: 0.05,
    waveFrequency: 3,
    waveAmplitude: 0.3,
    waveColor: [0.5, 0.5, 0.5],
    colorNum: 4,
    pixelSize: 2,
    disableAnimation: false,
    enableMouseInteraction: true,
    mouseRadius: 0.3,
    ...options
  };

  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // Turn off antialias for sharp dither pixels
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance"
  });
  
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.setPixelRatio(1);
  container.appendChild(renderer.domElement);
  
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const waveUniforms = {
    time: new THREE.Uniform(0),
    resolution: new THREE.Uniform(new THREE.Vector2(0, 0)),
    waveSpeed: new THREE.Uniform(cfg.waveSpeed),
    waveFrequency: new THREE.Uniform(cfg.waveFrequency),
    waveAmplitude: new THREE.Uniform(cfg.waveAmplitude),
    waveColor: new THREE.Uniform(new THREE.Color(...cfg.waveColor)),
    mousePos: new THREE.Uniform(new THREE.Vector2(0, 0)),
    enableMouseInteraction: new THREE.Uniform(cfg.enableMouseInteraction ? 1 : 0),
    mouseRadius: new THREE.Uniform(cfg.mouseRadius),
    colorNum: new THREE.Uniform(cfg.colorNum),
    pixelSize: new THREE.Uniform(cfg.pixelSize)
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: waveVertexShader,
    fragmentShader: waveFragmentShader,
    uniforms: waveUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false
  });
  
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const clock = new THREE.Clock();
  
  const setSize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    waveUniforms.resolution.value.set(w, h);
  };
  
  setSize();
  const ro = new ResizeObserver(setSize);
  ro.observe(container);

  const mouse = new THREE.Vector2(0,0);
  const handlePointerMove = (e) => {
    if (!cfg.enableMouseInteraction) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouse.set(x, y);
    waveUniforms.mousePos.value.copy(mouse);
  };
  
  window.addEventListener('pointermove', handlePointerMove, { passive: true });

  let raf = 0;
  const animate = () => {
    if (!cfg.disableAnimation) {
      waveUniforms.time.value = clock.getElapsedTime();
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  };
  
  raf = requestAnimationFrame(animate);

  return {
    destroy: () => {
      ro.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if(container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    }
  };
};
