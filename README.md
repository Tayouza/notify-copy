# NotifyCopy

> **Você copiou. Ou pelo menos, acreditou que copiou.**

Todo mundo já viveu essa cena: **Ctrl+C**, volta pro trabalho, minutos depois
**Ctrl+V**, e nada. O texto nunca chegou a sair de onde estava. Você jura que
apertou as teclas. Jura. Mas a área de transferência é a única parte do sistema
operacional que falha em silêncio. Ela não comemora quando deu certo, não grita
quando deu errado. Só te deixa descobrir na hora do colar, que é justamente a
hora em que você não pode perder tempo se perguntando *"isso aí realmente
copiou?"*.

É nesse intervalo que o NotifyCopy trabalha: você vê a cópia acontecer, não
descobre depois.

A cada cópia, um toast próprio, moderno, transparente e discreto, surge ao lado
do cursor com um preview do conteúdo, a contagem de caracteres e uma animação
suave de confirmação. A certeza de que o texto está na área de transferência
chega no momento em que você copia, não minutos depois, diante de um Ctrl+V que
não respondeu.

E quando você está no ritmo, o **mini toast** (duas folhas se duplicando,
estilo "copiar") confirma a cópia sem tirar você da concentração.

![Preview](docs/preview.png)
![Mini](docs/preview-mini.png)

**Em uma frase:** NotifyCopy é um app na bandeja do sistema (tray) que monitora
a área de transferência e mostra um toast personalizado a cada cópia, com
preview do texto, contagem de caracteres e animação suave.

## O que é

O NotifyCopy captura cópias de texto na área de transferência e mostra uma notificação visual personalizada (toast) perto do cursor, com design em glassmorphism, selo animado, barra de progresso e contagem discreta. O app roda na bandeja (tray) e pode iniciar com o sistema, respeitando tema claro/escuro e múltiplos monitores.

## Estado atual

As fases 2–4 da v0.1 estão **concluídas** de acordo com o progresso do projeto, e a **v0.2.0** (cor de destaque por presets + mini toast) já foi entregue e publicada na [GitHub Releases](https://github.com/Tayouza/notify-copy/releases), com instaladores para Linux, Windows e macOS gerados pelo CI.

- **Fase 2 (Core Electron)** — estrutura principal implementada (Bramble): watcher da área de transferência, janela do toast, bandeja, posicionamento, tema, IPC e gerenciamento de instância única.
- **Fase 3 (UI/Design do toast)** — interface e animações entregues (Sable), seguindo os contratos definidos na especificação.
- **Fase 4 (Empacotamento + Docs)** — configuração de build, ícones, LICENSE e documentação em português (Quill).

O projeto já possui: `src/main/**`, `src/preload/**`, `src/renderer/**`, `assets/icon.png`, `assets/icon@2x.png`, `build/icon.png`, `scripts/generate-icons.py`, `LICENSE` (MIT), `docs/preview.png`, `docs/preview-mini.png`, além de `electron-builder.yml` e `README.md`.

## Requisitos

- [Node.js](https://nodejs.org/) **18+** e npm
- Sistema operacional: **Linux**, **macOS** ou **Windows**

## Instalação

### Opção 1: baixar o instalador

Baixe o arquivo da sua plataforma na página de [Releases](https://github.com/Tayouza/notify-copy/releases):

| Sistema | Arquivos |
| --- | --- |
| **Linux** | `NotifyCopy-*.AppImage`, `NotifyCopy-*.deb` |
| **Windows** | `NotifyCopy-*-nsis.exe` (instalador) ou `*-portable.exe` |
| **macOS** | `NotifyCopy-*.dmg` (Intel e Apple Silicon) |

### Opção 2: compilar a partir do código

```bash
# Clonar o repositório
git clone https://github.com/tayouza/notifycopy
cd notifycopy

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm start
```

## Uso

- Após iniciar, o NotifyCopy fica na **bandeja do sistema** (tray) com seu ícone.
- Sempre que você copiar algum texto (Ctrl+C / ⌘+C), uma janela toast aparece **perto do cursor** (comportamento padrão) exibindo um preview do texto copiado, a contagem de caracteres/palavras/linhas e uma barra de progresso indicando o tempo restante até desaparecer.
- O menu da bandeja permite: Ativar/Desativar, Duração (Curta/Normal/Longa), **Cor**, **Estilo do toast** (Completo/Mini), Posição (cursor, cantos/centro), Tema (Auto/Claro/Escuro), **Iniciar com o sistema**, Sair.
- **Nunca** é exibida uma notificação nativa do SO. O toast é completamente personalizado.

## Personalização

### Cores

No menu da bandeja → **Cor**, você pode escolher entre 8 presets:

- **Índigo** `#6366f1`
- **Azul** `#3b82f6`
- **Verde** `#22c55e`
- **Rosa** `#ec4899`
- **Laranja** `#f97316`
- **Vermelho** `#ef4444`
- **Ciano** `#06b6d4`
- **Âmbar** `#f59e0b`

Ao alterar a cor, tanto o **toast** quanto o **ícone da bandeja** são atualizados imediatamente para refletir a escolha.

### Estilo do toast

No menu da bandeja → **Estilo do toast**, você pode alternar entre:

- **Completo** (padrão): mostra o preview do texto copiado, contador, barra de progresso e animação de entrada/saída. Ideal para visualizar rapidamente o conteúdo copiado.
- **Mini**: versão compacta (~100×100) que exibe apenas a animação de duas folhas se duplicando (estilo "copiar"). Sem texto, discreto e minimalista.

## Modo demo

O modo demo é útil para desenvolvimento, testes visuais e geração de preview.

```bash
# Inicia em modo demo (mostra um toast de exemplo)
npm run demo

# Modo demo com estilo mini
npm run demo -- --mini
```

Também é possível via variáveis de ambiente ou flags de linha de comando:

```bash
# Mostra toast de exemplo ao iniciar
NOTIFYCOPY_DEMO=1 npm start

# Captura: full -> docs/preview.png; mini -> docs/preview-mini.png
NOTIFYCOPY_CAPTURE=1 npm run demo
NOTIFYCOPY_CAPTURE=1 npm run demo -- --mini

# Força uma cor específica
npm start -- --accent=#22c55e
npm run demo -- --accent=#ec4899
```

**Flags de teste:**
- `--demo` — mostra o toast de exemplo
- `--demo --mini` — mostra o mini toast de exemplo
- `--accent=#RRGGBB` — força a cor na sessão (funciona com `--demo`)

Saída esperada (conforme spec): `DEMO_READY` no stdout quando o modo demo inicia; `CAPTURED <path>` quando a captura é realizada com sucesso.

## Build por SO

O empacotamento é feito com [electron-builder](https://www.electron.build/). Cada sistema operacional deve gerar sua própria build (**não há suporte garantido a cross-build para macOS** — builds para macOS devem ser feitas em um macOS).

```bash
# Linux: gera AppImage e .deb
npm run dist:linux

# macOS: gera .dmg e .zip (somente em macOS)
npm run dist:mac

# Windows: gera .nsis (instalador) e .portable
npm run dist:win
```

Artefatos são salvos em `dist/`.

## Dependências de sistema (Linux)

Em distribuições Debian/Ubuntu (e derivadas), algumas bibliotecas são necessárias para o ícone de bandeja, integração com desktop e renderização funcionar corretamente:

```bash
sudo apt install libayatana-appindicator3-1 libnotify4 libnss3 libxtst6 libxss1 libgtk-3-0
```

### Notas sobre Wayland

- Em sessões **Wayland**, o compositor **não permite** que o app posicione a janela livremente (o `setPosition` é ignorado). Por isso o NotifyCopy força o backend **X11/XWayland** (`--ozone-platform-hint=x11`), onde o toast fica exatamente no cursor e pode chegar perto das bordas.
- No Linux, a posição do cursor é lida **direto do servidor X** (pacote `x11`), porque a API `screen.getCursorScreenPoint()` do Electron pode retornar um valor **desatualizado** no XWayland (o toast ficaria preso na posição da primeira cópia).
- Isso requer o **XWayland** (presente por padrão na maioria das distros). Sem XWayland, o app ainda funciona, mas o toast aparecerá onde o compositor decidir.
- Em X11 nativo e no Windows/macOS o posicionamento é sempre preciso (o pacote `x11` só é usado no Linux).

## Licença

[MIT](LICENSE)

## Desenvolvimento

Este repositório segue uma divisão por **dono**. Arquivos sob `electron-builder.yml`, `README.md`, `.gitignore`, `scripts/**`, `assets/icon.*`, `build/icon.*`, `docs/preview.png`, `docs/preview-mini.png` (quando gerado) e `LICENSE` são de responsabilidade do **Quill** (Packaging/Docs). Não edite `src/**` nem `package.json` — estes pertencem a **Bramble/Sable**. Caso precise alterar campos em `package.json`, solicite ao **Bramble** via `maestri ask "Bramble" ...`.

## Ícones

Os ícones foram gerados via `scripts/generate-icons.py`. Estão disponíveis em: `assets/icon.png`, `assets/icon@2x.png` e `build/icon.png` (utilizado pelo electron-builder como `buildResources`).

É possível gerar ícones com cor personalizada usando o argumento `--color`:
```bash
python3 scripts/generate-icons.py --color #22c55e
```
