/** GPU basemap; same orthographic projection as the tracer overlay. No simulation work on GPU. */
export function createEarthSurface(onReady: () => void, onError: () => void) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) {
    onError();
    return null;
  }
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw Error(gl.getShaderInfoLog(s) || 'Shader failed');
    return s;
  };
  const vertex = shader(
    gl.VERTEX_SHADER,
    `#version 300 es
    in vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`,
  );
  const fragment = shader(
    gl.FRAGMENT_SHADER,
    `#version 300 es
    precision highp float;
    uniform vec2 resolution; uniform vec3 camera; uniform float radius;
    uniform sampler2D earth; uniform sampler2D observation;
    uniform float observationOpacity;
    uniform bool cloudOnly;
    uniform float cloudRadius, cloudThreshold;
    out vec4 color;
    vec2 sphereUV(vec2 q){
      float z=sqrt(max(0.,1.-dot(q,q))), c=cos(camera.y), s=sin(camera.y);
      float latitude=asin(clamp(q.y*c+z*s,-1.,1.));
      float longitude=camera.x+atan(q.x,z*c-q.y*s);
      return vec2(fract(longitude/6.2831853+.5),.5-latitude/3.14159265);
    }
    void main(){
      vec2 q=(gl_FragCoord.xy-resolution*.5)/radius;
      float d=dot(q,q);
      vec3 bg=vec3(.0235);
      vec3 result=bg;
      if(d>1.) result+=exp(-(sqrt(d)-1.)*55.)*.07;
      if(d<=1.){
        float z=sqrt(1.-d);
        vec2 uv=sphereUV(q);
        vec3 tex=texture(earth,uv).rgb;
        if(!cloudOnly){
          vec4 observed=texture(observation,uv);
          tex=mix(tex,observed.rgb,observed.a*observationOpacity);
        }
        float gray=dot(tex,vec3(.2126,.7152,.0722));
        tex=mix(vec3(gray),tex,.025);
        float light=.38+.62*max(0.,dot(vec3(q,z),normalize(vec3(-.35,.45,1.))));
        result=tex*light*.9+vec3(.018,.022,.024)*pow(1.-z,3.);
      }
      if(cloudOnly && observationOpacity>0. && d<=cloudRadius*cloudRadius){
        vec2 cq=q/cloudRadius;
        vec4 sampleColor=texture(observation,sphereUV(cq));
        float bright=dot(sampleColor.rgb,vec3(.2126,.7152,.0722));
        float chroma=max(max(sampleColor.r,sampleColor.g),sampleColor.b)-min(min(sampleColor.r,sampleColor.g),sampleColor.b);
        // A display heuristic, not MOD35 cloud classification or measured height.
        float mask=smoothstep(cloudThreshold,cloudThreshold+.22,bright)*(1.-smoothstep(.10,.32,chroma))*sampleColor.a;
        float cz=sqrt(max(0.,1.-dot(cq,cq)));
        float light=.55+.45*max(0.,dot(vec3(cq,cz),normalize(vec3(-.35,.45,1.))));
        result=mix(result,vec3(bright*light),mask*observationOpacity);
      }
      color=vec4(result,1.);
    }`,
  );
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw Error('Earth program failed');
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const p = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const observationTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, observationTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(4),
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.uniform1i(gl.getUniformLocation(program, 'earth'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'observation'), 1);
  const observationUniform = gl.getUniformLocation(
    program,
    'observationOpacity',
  );
  const cloudUniforms = ['cloudOnly', 'cloudRadius', 'cloudThreshold'].map(
    (name) => gl.getUniformLocation(program, name),
  );
  let cloudMode = true,
    cloudRadius = 1,
    threshold = 0.5;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  let observationImage: HTMLImageElement | null = null;
  let observationOpacity = 0;
  const uniforms = ['resolution', 'camera', 'radius'].map((name) =>
    gl.getUniformLocation(program, name),
  );
  let ready = false,
    disposed = false;
  const image = new Image();
  image.onload = () => {
    if (disposed) return;
    // Smaller devices retain a valid texture within their GPU limit.
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    let input: TexImageSource = image;
    if (image.width > max) {
      const reduced = document.createElement('canvas');
      reduced.width = max;
      reduced.height = Math.round((image.height * max) / image.width);
      reduced
        .getContext('2d')!
        .drawImage(image, 0, 0, reduced.width, reduced.height);
      input = reduced;
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, input);
    gl.generateMipmap(gl.TEXTURE_2D);
    ready = true;
    onReady();
  };
  image.onerror = () => {
    if (!disposed) onError();
  };
  image.src = '/data/earth-january-2004.jpg';
  return {
    setCloudLayer(
      enabled: boolean,
      heightKm: number,
      scale: number,
      cutoff: number,
    ) {
      const nextRadius = 1 + (heightKm * scale) / 6371;
      if (
        enabled === cloudMode &&
        nextRadius === cloudRadius &&
        cutoff === threshold
      )
        return false;
      cloudMode = enabled;
      cloudRadius = nextRadius;
      threshold = cutoff;
      return true;
    },
    setObservation(input: HTMLImageElement | null, opacity: number) {
      const nextOpacity = input ? opacity : 0;
      if (input === observationImage && nextOpacity === observationOpacity)
        return false;
      if (input && input !== observationImage) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, observationTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          input,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.activeTexture(gl.TEXTURE0);
      }
      observationImage = input;
      observationOpacity = nextOpacity;
      return true;
    },
    draw(
      width: number,
      height: number,
      lon: number,
      lat: number,
      radius: number,
    ) {
      if (!ready || gl.isContextLost()) return null;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      gl.uniform2f(uniforms[0], width, height);
      gl.uniform3f(
        uniforms[1],
        (lon * Math.PI) / 180,
        (lat * Math.PI) / 180,
        0,
      );
      gl.uniform1f(uniforms[2], radius);
      gl.uniform1f(observationUniform, observationOpacity);
      gl.uniform1i(cloudUniforms[0], cloudMode ? 1 : 0);
      gl.uniform1f(cloudUniforms[1], cloudRadius);
      gl.uniform1f(cloudUniforms[2], threshold);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return canvas;
    },
    dispose() {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      gl.deleteTexture(texture);
      gl.deleteTexture(observationTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
