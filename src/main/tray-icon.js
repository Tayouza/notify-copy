const { nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function hexToRgb(hex) {
  let c = (hex || '#6366f1').replace(/^#/, '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  if (!/^[0-9a-fA-F]{6}$/.test(c)) c = '6366f1';
  const n = parseInt(c, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mix(a, b, t) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

// Distância de um ponto ao segmento AB
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

/**
 * Gera o ícone do tray (quadrado arredondado com gradiente da cor + check branco)
 * como nativeImage. Renderiza em alta resolução e reduz para suavizar (antialias).
 * Buffer em BGRA (formato esperado por nativeImage.createFromBitmap).
 */
function createTrayIcon(hex) {
  try {
    const base = hexToRgb(hex);
    const end = mix(base, { r: 255, g: 255, b: 255 }, 0.24); // gradiente para um tom claro
    const white = { r: 255, g: 255, b: 255 };

    const logical = 32; // tamanho lógico
    const ss = 8; // supersampling
    const W = logical * ss; // buffer de render

    const radius = 0.235 * W;
    const inRounded = (x, y) => {
      const cx = Math.min(Math.max(x, radius), W - radius);
      const cy = Math.min(Math.max(y, radius), W - radius);
      return Math.hypot(x - cx, y - cy) <= radius + 0.5;
    };

    // geometria do check
    const lw = 0.118 * W; // espessura
    const p0 = [0.285 * W, 0.525 * W];
    const p1 = [0.44 * W, 0.685 * W];
    const p2 = [0.735 * W, 0.345 * W];
    const checkDist = (x, y) =>
      Math.min(
        distToSeg(x, y, p0[0], p0[1], p1[0], p1[1]),
        distToSeg(x, y, p1[0], p1[1], p2[0], p2[1])
      );

    // render RGBA
    const src = Buffer.alloc(W * W * 4);
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const i = (y * W + x) * 4;
        if (!inRounded(px, py)) continue; // transparente

        const t = y / (W - 1);
        let col = mix(base, end, t);

        // check branco (com cobertura suave nas bordas)
        const cover = Math.max(0, Math.min(1, lw / 2 - checkDist(px, py) + 0.5));
        if (cover > 0) col = mix(col, white, cover);

        src[i] = clamp(col.r);
        src[i + 1] = clamp(col.g);
        src[i + 2] = clamp(col.b);
        src[i + 3] = 255;
      }
    }

    // redução W -> target (média com alpha pré-multiplicado)
    function downsample(target) {
      const block = W / target;
      const dst = Buffer.alloc(target * target * 4); // BGRA
      for (let oy = 0; oy < target; oy++) {
        for (let ox = 0; ox < target; ox++) {
          let sr = 0, sg = 0, sb = 0, sa = 0, n = 0;
          for (let yy = 0; yy < block; yy++) {
            for (let xx = 0; xx < block; xx++) {
              const sx = Math.floor(ox * block + xx);
              const sy = Math.floor(oy * block + yy);
              const si = (sy * W + sx) * 4;
              const a = src[si + 3];
              sr += src[si] * a;
              sg += src[si + 1] * a;
              sb += src[si + 2] * a;
              sa += a;
              n++;
            }
          }
          const di = (oy * target + ox) * 4;
          if (sa > 0) {
            // nativeImage.createFromBitmap espera BGRA pré-multiplicado
            const a = sa / n;        // alpha médio 0..255
            const f = a / 255;       // fator de pré-multiplicação
            dst[di] = clamp((sb / sa) * f);     // B
            dst[di + 1] = clamp((sg / sa) * f); // G
            dst[di + 2] = clamp((sr / sa) * f); // R
            dst[di + 3] = clamp(a);             // A
          }
        }
      }
      return dst;
    }

    // Representações 1x e 2x para ficar nítido em telas normais e retina
    const b32 = downsample(32);
    const b64 = downsample(64);
    const img = nativeImage.createFromBitmap(b32, {
      width: 32,
      height: 32,
      scaleFactor: 1,
    });
    try {
      img.addRepresentation({ scaleFactor: 2, width: 64, height: 64, buffer: b64 });
    } catch (e) {
      // algumas versões podem não aceitar buffer; segue só com a 1x
    }
    if (!img || img.isEmpty()) throw new Error('empty image');
    return img;
  } catch (e) {
    const pngPath = path.join(__dirname, '../../assets/icon.png');
    if (fs.existsSync(pngPath)) {
      return nativeImage.createFromPath(pngPath);
    }
    return null;
  }
}

module.exports = { createTrayIcon };
