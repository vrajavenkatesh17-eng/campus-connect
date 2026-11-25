import { useEffect, useRef, useState } from 'react';
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from 'ogl';
import './FlexCarousel.css';

const VERTEX_SHADER = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uBend;
  uniform float uVelocity;
  uniform float uSqueeze;
  uniform float uIntro;

  varying vec2 vUv;
  varying float vBendFactor;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Subtle squeeze/stretch on drag momentum
    float sq = clamp(abs(uVelocity) * uSqueeze * 0.04, 0.0, 0.14);
    pos.x *= (1.0 + sq);
    pos.y *= (1.0 - sq * 0.45);

    // Intro rise
    pos.y -= (1.0 - uIntro) * 0.35;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    // Gentle liquid arc curve along X in view space
    float distFromCenter = mvPos.x;
    mvPos.z -= (distFromCenter * distFromCenter) * uBend * 0.14;
    mvPos.y += sin(distFromCenter * 1.15) * uBend * 0.04;

    vBendFactor = clamp(abs(distFromCenter) * 0.25, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uHasTexture;
  uniform float uDispersion;
  uniform float uVelocity;
  uniform float uRadius;
  uniform vec2 uPlaneSize;
  uniform vec2 uImageSize;
  uniform float uAlpha;

  varying vec2 vUv;
  varying float vBendFactor;

  float roundedBoxSDF(vec2 centerPos, vec2 size, float radius) {
    return length(max(abs(centerPos) - size + radius, 0.0)) - radius;
  }

  vec2 coverUv(vec2 uv, vec2 planeSize, vec2 imageSize) {
    vec2 s = planeSize;
    vec2 i = max(imageSize, vec2(1.0));
    float rs = s.x / max(s.y, 0.001);
    float ri = i.x / max(i.y, 0.001);
    vec2 newUv = uv;
    if (rs > ri) {
      float scale = ri / rs;
      newUv.y = (uv.y - 0.5) * scale + 0.5;
    } else {
      float scale = rs / ri;
      newUv.x = (uv.x - 0.5) * scale + 0.5;
    }
    return newUv;
  }

  void main() {
    vec2 halfSize = uPlaneSize * 0.5;
    vec2 p = (vUv - 0.5) * uPlaneSize;
    float r = min(uRadius, min(halfSize.x, halfSize.y));
    float d = roundedBoxSDF(p, halfSize, r);
    float edgeMask = 1.0 - smoothstep(-0.005, 0.005, d);
    if (edgeMask <= 0.001) discard;

    if (uHasTexture < 0.5) {
      gl_FragColor = vec4(0.18, 0.14, 0.16, edgeMask * uAlpha * 0.35);
      return;
    }

    vec2 uv = coverUv(vUv, uPlaneSize, uImageSize);
    float shift = (abs(uVelocity) * 0.002 + vBendFactor * 0.004) * uDispersion;

    float cr = texture2D(tMap, uv + vec2(shift, 0.0)).r;
    float cg = texture2D(tMap, uv).g;
    float cb = texture2D(tMap, uv - vec2(shift, 0.0)).b;

    vec3 col = vec3(cr, cg, cb);
    gl_FragColor = vec4(col, edgeMask * uAlpha);
  }
`;

export default function FlexCarousel({
  items = [],
  preset = 'liquid',
  intro = 'rise',
  fit = 'natural',
  cardHeight = 0.52,
  gap = 16,
  radius = 12,
  bend = 0.3,
  dispersion = 0.3,
  squeeze = 0.15,
  focusOnClick = true,
  captions = true,
  autoplay = true,
  interval = 4.5,
  captureWheel = false,
  className = '',
  onItemClick,
}) {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollTargetRef = useRef(0);
  const scrollCurrentRef = useRef(0);
  const strideRef = useRef(1);
  const countRef = useRef(items.length || 1);

  useEffect(() => {
    countRef.current = items.length || 1;
  }, [items.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !items || items.length === 0) return;

    let renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        webgl: 2,
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    if (!gl) return;
    gl.canvas.className = 'flex-carousel__canvas';
    viewport.innerHTML = '';
    viewport.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.z = 5;

    const scene = new Transform();
    const geometry = new Plane(gl, { widthSegments: 20, heightSegments: 12 });

    let viewWidth = 1;
    let viewHeight = 1;
    let cardW = 1;
    let cardH = 1;
    let gapWorld = 0.2;
    let stride = 1.2;

    const cards = items.map((item, idx) => {
      const texture = new Texture(gl, { generateMipmaps: true });
      const program = new Program(gl, {
        vertex: VERTEX_SHADER,
        fragment: FRAGMENT_SHADER,
        transparent: true,
        uniforms: {
          tMap: { value: texture },
          uHasTexture: { value: 0 },
          uBend: { value: preset === 'liquid' ? bend : bend * 0.5 },
          uDispersion: { value: dispersion },
          uVelocity: { value: 0 },
          uSqueeze: { value: squeeze },
          uIntro: { value: intro === 'rise' ? 0 : 1 },
          uRadius: { value: 0.08 },
          uPlaneSize: { value: [1, 1] },
          uImageSize: { value: [1, 1] },
          uAlpha: { value: intro === 'rise' ? 0 : 1 },
        },
      });

      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        texture.image = img;
        program.uniforms.uHasTexture.value = 1;
        program.uniforms.uImageSize.value = [img.naturalWidth || 1, img.naturalHeight || 1];
      };
      img.src = item.src;

      return { mesh, program, item, idx, aspect: 4 / 3 };
    });

    const resize = () => {
      const w = viewport.clientWidth || 300;
      const h = viewport.clientHeight || 300;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });

      const fovRad = (camera.fov * Math.PI) / 180;
      viewHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
      viewWidth = viewHeight * (w / h);

      cardH = viewHeight * Math.min(Math.max(cardHeight, 0.3), 0.92);
      cardW = fit === 'natural' ? cardH * 1.35 : cardH * 1.25;
      if (cardW > viewWidth * 0.78) {
        cardW = viewWidth * 0.78;
      }
      gapWorld = (gap / Math.max(h, 1)) * viewHeight;
      stride = cardW + gapWorld;
      strideRef.current = stride;

      const worldRadius = (radius / Math.max(h, 1)) * viewHeight;

      cards.forEach((c) => {
        c.mesh.scale.set(cardW, cardH, 1);
        c.program.uniforms.uPlaneSize.value = [cardW, cardH];
        c.program.uniforms.uRadius.value = worldRadius;
      });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(viewport);

    // Pointer / touch drag
    let isDragging = false;
    let startX = 0;
    let dragStartScroll = 0;
    let dragDistance = 0;
    let lastUserInteraction = performance.now();

    const onPointerDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      dragStartScroll = scrollTargetRef.current;
      dragDistance = 0;
      lastUserInteraction = performance.now();
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      dragDistance = Math.abs(dx);
      const pxToWorld = viewWidth / Math.max(viewport.clientWidth, 1);
      scrollTargetRef.current = dragStartScroll - dx * pxToWorld * 1.15;
      lastUserInteraction = performance.now();
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;

      // Click detection when drag movement is tiny
      if (dragDistance < 8 && focusOnClick) {
        const rect = viewport.getBoundingClientRect();
        const clickNormX = ((e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * viewWidth;
        const totalWidth = stride * cards.length;
        let closestCard = null;
        let closestDist = Infinity;

        cards.forEach((c) => {
          const rawX = c.idx * stride - scrollCurrentRef.current;
          const wrappedX = ((((rawX + totalWidth / 2) % totalWidth) + totalWidth) % totalWidth) - totalWidth / 2;
          const d = Math.abs(wrappedX - clickNormX);
          if (d < closestDist && d < cardW * 0.6) {
            closestDist = d;
            closestCard = c;
          }
        });

        if (closestCard) {
          const currentMod = Math.round(scrollTargetRef.current / stride);
          const baseIdx = ((currentMod % cards.length) + cards.length) % cards.length;
          let delta = closestCard.idx - baseIdx;
          if (delta > cards.length / 2) delta -= cards.length;
          if (delta < -cards.length / 2) delta += cards.length;
          if (delta === 0 && onItemClick) {
            onItemClick(closestCard.item, closestCard.idx);
          } else {
            scrollTargetRef.current = (currentMod + delta) * stride;
          }
        }
      }
      lastUserInteraction = performance.now();
    };

    const onWheel = (e) => {
      if (!captureWheel) return;
      e.preventDefault();
      const pxToWorld = viewWidth / Math.max(viewport.clientWidth, 1);
      scrollTargetRef.current += (e.deltaY + e.deltaX) * pxToWorld * 0.7;
      lastUserInteraction = performance.now();
    };

    viewport.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('wheel', onWheel, { passive: !captureWheel });

    let rafId = 0;
    const startTime = performance.now();
    let lastAutoplayStep = startTime;

    const animate = (now) => {
      rafId = requestAnimationFrame(animate);
      const elapsed = (now - startTime) / 1000;
      const introProgress = intro === 'rise' ? Math.min(elapsed / 0.65, 1) : 1;
      const easedIntro = 1 - Math.pow(1 - introProgress, 3);

      // Gentle autoplay when user hasn't dragged recently
      if (autoplay && !isDragging && cards.length > 1) {
        if (now - lastUserInteraction > 2500 && now - lastAutoplayStep > interval * 1000) {
          lastAutoplayStep = now;
          scrollTargetRef.current += stride;
        }
      }

      const prev = scrollCurrentRef.current;
      scrollCurrentRef.current += (scrollTargetRef.current - prev) * 0.085;
      const velocity = (scrollCurrentRef.current - prev) * 60;

      const totalWidth = stride * cards.length;
      cards.forEach((c) => {
        const rawX = c.idx * stride - scrollCurrentRef.current;
        const wrappedX = ((((rawX + totalWidth / 2) % totalWidth) + totalWidth) % totalWidth) - totalWidth / 2;
        c.mesh.position.x = wrappedX;
        c.program.uniforms.uVelocity.value = velocity;
        c.program.uniforms.uIntro.value = easedIntro;
        c.program.uniforms.uAlpha.value = easedIntro;
      });

      const nearest = Math.round(scrollCurrentRef.current / Math.max(stride, 0.001));
      const normIdx = ((nearest % cards.length) + cards.length) % cards.length;
      setActiveIndex((prevIdx) => (prevIdx === normIdx ? prevIdx : normIdx));

      renderer.render({ scene, camera });
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      viewport.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('wheel', onWheel);
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        // ignore
      }
    };
  }, [items, preset, intro, fit, cardHeight, gap, radius, bend, dispersion, squeeze, focusOnClick, autoplay, interval, captureWheel, onItemClick]);

  const activeItem = items[activeIndex] || items[0];

  const handleDotClick = (targetIdx) => {
    const stride = strideRef.current || 1;
    const len = countRef.current || 1;
    const currentStep = Math.round(scrollTargetRef.current / stride);
    const currentMod = ((currentStep % len) + len) % len;
    let delta = targetIdx - currentMod;
    if (delta > len / 2) delta -= len;
    if (delta < -len / 2) delta += len;
    scrollTargetRef.current = (currentStep + delta) * stride;
  };

  return (
    <div ref={containerRef} className={`flex-carousel ${className}`}>
      <div ref={viewportRef} className="flex-carousel__viewport" role="region" aria-label="Event moments carousel" />
      {captions && activeItem && (
        <div className="flex-carousel__caption-bar">
          <div className="flex-carousel__caption-text">
            <p className="flex-carousel__title">{activeItem.title}</p>
            {activeItem.subtitle && <p className="flex-carousel__subtitle">{activeItem.subtitle}</p>}
          </div>
          {items.length > 1 && (
            <div className="flex-carousel__dots" role="tablist" aria-label="Carousel slides">
              {items.slice(0, 12).map((item, i) => (
                <button
                  key={item.id || i}
                  type="button"
                  className="flex-carousel__dot"
                  data-active={i === activeIndex ? 'true' : 'false'}
                  onClick={() => handleDotClick(i)}
                  aria-label={`View slide ${i + 1}: ${item.title || 'Moment'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
