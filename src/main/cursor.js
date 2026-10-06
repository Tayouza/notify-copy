const { screen } = require('electron');

// No Linux/X11 (inclui XWayland) o `screen.getCursorScreenPoint()` do Electron
// costuma ficar "congelado" (só atualiza se o ponteiro estiver sobre uma
// superfície do app). Lemos o ponteiro direto do servidor X via o pacote `x11`,
// que é ao vivo, e mantemos um cache síncrono para o cálculo de posição.
//
// Fora do Linux (ou se o X11 não estiver disponível), usamos a API do Electron.

let cached = null;
let x11Ready = false;
let started = false;

function startTracking(interval = 150) {
  if (started) return;
  started = true;
  if (process.platform !== 'linux') return;

  try {
    const x11 = require('x11');
    x11.createClient((err, display) => {
      if (err || !display) return;
      try {
        const X = display.client;
        const root = display.screen[0].root;
        const read = () =>
          X.QueryPointer(root, (e, r) => {
            if (!e && r && typeof r.rootX === 'number') {
              cached = { x: r.rootX, y: r.rootY };
              x11Ready = true;
            }
          });
        read();
        setInterval(read, interval);
      } catch (e) {
        // mantém o fallback
      }
    });
  } catch (e) {
    // pacote indisponível: fallback
  }
}

function getPoint() {
  if (x11Ready && cached) return cached;
  try {
    return screen.getCursorScreenPoint();
  } catch (e) {
    return { x: 0, y: 0 };
  }
}

module.exports = { startTracking, getPoint };
