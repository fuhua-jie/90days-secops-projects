/* ============================================================
   bg3d.js — 全屏电影化背景引擎（WebGL 片元着色器）
   · 4 个程序化场景：0 星域 / 1 网格地平线 / 2 雷达信号 / 3 数据雨
   · 切屏：滚动至不同版块时，场景交叉溶解 + 缩放运镜（1.6s）
   · 颜色跟随主题变量 --pc1/2/3；鼠标视差；prefers-reduced-motion 降级
   ============================================================ */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cvs = document.createElement('canvas');
  cvs.id = 'gl';
  cvs.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cvs);

  var gl = cvs.getContext('webgl', { antialias: false, alpha: true, depth: false, stencil: false })
        || cvs.getContext('experimental-webgl', { alpha: true });
  if (!gl) { cvs.style.display = 'none'; return; }

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    'precision highp float;',
    'uniform vec2 u_res;uniform float u_time;uniform float u_s0;uniform float u_s1;uniform float u_mix;',
    'uniform vec2 u_m;uniform vec3 u_c1;uniform vec3 u_c2;uniform vec3 u_c3;uniform float u_amp;uniform float u_alpha;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}',
    'vec3 scene(vec2 uv,float s,float t){',
    '  vec3 col=vec3(.008,.012,.024);',
    '  if(s<.5){',
    '    float n=fbm(uv*2.2+vec2(t*.02,-t*.013));',
    '    col+=u_c1/255.*n*.30;',
    '    col+=u_c2/255.*pow(fbm(uv*3.1-t*.01),2.)*.20;',
    '    vec2 gp=uv*vec2(160.,90.);',
    '    float star=step(.9972,hash(floor(gp)))*smoothstep(.55,1.,noise(floor(gp)+7.));',
    '    col+=vec3(star)*.75;',
    '  }else if(s<1.5){',
    '    float hor=.42;vec2 p=uv-vec2(.5,hor);p.y=abs(p.y);',
    '    float per=1./(p.y*14.+.08);',
    '    vec2 g=vec2(p.x*per,per*1.4+t*.9);',
    '    vec2 gf=abs(fract(g)-.5);',
    '    float line=smoothstep(.5,.0,min(gf.x,gf.y)*2.)*smoothstep(.0,.35,p.y);',
    '    col+=u_c1/255.*line*.34;',
    '    col+=u_c2/255.*exp(-abs(uv.y-hor)*9.)*.18;',
    '    col+=u_c3/255.*fbm(uv*3.+t*.02)*.05;',
    '  }else if(s<2.5){',
    '    vec2 p=uv-vec2(.5,.55);p.x*=u_res.x/u_res.y;',
    '    float d=length(p);',
    '    float rings=smoothstep(.02,.0,abs(fract(d*3.-t*.25)-.5)-.32);',
    '    col+=u_c1/255.*rings*.20*smoothstep(.9,.1,d);',
    '    float ang=atan(p.y,p.x);',
    '    float sweep=smoothstep(.5,.0,abs(fract(ang/6.2832+t*.06)-.5)*2.);',
    '    col+=u_c2/255.*sweep*.10*smoothstep(.8,.0,d);',
    '    col+=u_c3/255.*fbm(uv*4.+t*.03)*.05;',
    '  }else{',
    '    vec2 p=uv*vec2(48.,27.);p.y+=t*5.5;',
    '    float cid=floor(p.x);float h=hash(vec2(cid,7.));',
    '    float drop=smoothstep(.965,1.,hash(vec2(cid,floor(p.y)+1.)));',
    '    float trail=fract(p.y)*(.35+.65*h);',
    '    col+=u_c1/255.*drop*.5;',
    '    col+=u_c1/255.*trail*.04*step(.3,h);',
    '    col+=u_c2/255.*fbm(uv*2.4-t*.015)*.05;',
    '  }',
    '  return col;',
    '}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/u_res;uv.y=1.-uv.y;',
    '  uv+=(u_m-.5)*.018;',
    '  float zm=mix(1.05,1.,smoothstep(0.,1.,u_mix));',
    '  uv=(uv-.5)*zm+.5;',
    '  vec3 cA=scene(uv,u_s0,u_time);',
    '  vec3 cB=scene(uv,u_s1,u_time);',
    '  float m=smoothstep(0.,1.,u_mix);',
    '  vec3 col=mix(cA,cB,m)*u_amp;',
    '  col*=1.-smoothstep(.55,1.2,length(uv-vec2(.5,.45)))*.45;',
    '  gl_FragColor=vec4(col,u_alpha);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { cvs.style.display = 'none'; return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ['u_res', 'u_time', 'u_s0', 'u_s1', 'u_mix', 'u_m', 'u_c1', 'u_c2', 'u_c3', 'u_amp', 'u_alpha']
    .forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

  /* ---------- 场景切换状态 ---------- */
  var sFrom = 0, sTo = 0, mixV = 1;
  var mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
  var amp = 1, alpha = 1;
  var started = performance.now();
  var last = started;

  function themeSync() {
    try {
      var cs = getComputedStyle(document.body);
      var c = ['--pc1', '--pc2', '--pc3'].map(function (k) {
        var v = cs.getPropertyValue(k).trim().split(',').map(Number);
        return [v[0] / 255, v[1] / 255, v[2] / 255];
      });
      gl.uniform3fv(U.u_c1, c[0]);
      gl.uniform3fv(U.u_c2, c[1]);
      gl.uniform3fv(U.u_c3, c[2]);
      var light = document.body.dataset.theme === 'light';
      amp = light ? 0.5 : 1;
      alpha = light ? 0.38 : 1;
      gl.uniform1f(U.u_amp, amp);
      gl.uniform1f(U.u_alpha, alpha);
    } catch (e) {}
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cvs.width = Math.round(window.innerWidth * dpr);
    cvs.height = Math.round(window.innerHeight * dpr);
    gl.viewport(0, 0, cvs.width, cvs.height);
    gl.uniform2f(U.u_res, cvs.width, cvs.height);
  }

  /* ---------- 场景侦测 ---------- */
  var io = null;
  function watchScenes() {
    var secs = document.querySelectorAll('body > section[data-scene]');
    if (secs.length) {
      io = new IntersectionObserver(function (ents) {
        var best = null;
        ents.forEach(function (en) { if (en.isIntersecting && (!best || en.intersectionRatio > best.r)) best = { s: +en.target.dataset.scene, r: en.intersectionRatio }; });
        if (best) setScene(best.s);
      }, { threshold: [0.15, 0.35, 0.55, 0.75] });
      secs.forEach(function (s) { io.observe(s); });
    } else {
      // 无标注页面：按滚动比例在 0~3 场景间漂移
      addEventListener('scroll', function () {
        var max = document.body.scrollHeight - innerHeight;
        var ratio = max > 0 ? window.scrollY / max : 0;
        setScene(Math.min(3, Math.floor(ratio * 4)));
      }, { passive: true });
    }
  }
  function setScene(s) {
    if (s === sTo) return;
    sFrom = sTo; sTo = s; mixV = 0;
  }

  /* ---------- 帧循环 ---------- */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now) {
    var t = (now - started) / 1000;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    mixV = Math.min(1, mixV + dt / 1.5);
    mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
    gl.uniform1f(U.u_time, t);
    gl.uniform1f(U.u_s0, sFrom);
    gl.uniform1f(U.u_s1, sTo);
    gl.uniform1f(U.u_mix, mixV);
    gl.uniform2f(U.u_m, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  addEventListener('mousemove', function (e) { tmx = e.clientX / innerWidth; tmy = e.clientY / innerHeight; }, { passive: true });
  addEventListener('themechange', themeSync);
  cvs.addEventListener('webglcontextlost', function () { cvs.style.display = 'none'; });

  resize(); themeSync();
  watchScenes();
  if (reduce) { mixV = 1; gl.uniform1f(U.u_mix, 1); gl.drawArrays(gl.TRIANGLES, 0, 3); return; }
  requestAnimationFrame(frame);
})();
