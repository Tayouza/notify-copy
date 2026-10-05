# NotifyCopy

NotifyCopy é um app na bandeja do sistema (tray) que monitora a área de transferência. Quando você copia um texto, ele exibe um **toast próprio** — uma janelinha moderna, transparente e discreta — com um preview do conteúdo, contador de caracteres e animação suave. **Nunca** utiliza as notificações nativas do sistema operacional.

![Preview](docs/preview.png)

## O que é

O NotifyCopy captura cópias de texto na área de transferência e mostra uma notificação visual personalizada (toast) perto do cursor, com design em glassmorphism, selo animado, barra de progresso e contagem discreta. O app roda na bandeja (tray) e pode iniciar com o sistema, respeitando tema claro/escuro e múltiplos monitores.

## Estado atual

As fases 2–4 estão **concluídas** de acordo com o progresso do projeto:

- **Fase 2 (Core Electron)** — estrutura principal implementada (Bramble): watcher da área de transferência, janela do toast, bandeja, posicionamento, tema, IPC e gerenciamento de instância única.
- **Fase 3 (UI/Design do toast)** — interface e animações entregues (Sable), seguindo os contratos definidos na especificação.
- **Fase 4 (Empacotamento + Docs)** — configuração de build, ícones, LICENSE e documentação em português (Quill).

O projeto já possui: `src/main/**`, `src/preload/**`, `src/renderer/**`, `assets/icon.png`, `assets/icon@2x.png`, `build/icon.png`, `scripts/generate-icons.py`, `LICENSE` (MIT), `docs/preview.png`, além de `electron-builder.yml` e `README.md`.

## Requisitos

- [Node.js](https://nodejs.org/) **18+** e npm
- Sistema operacional: **Linux**, **macOS** ou **Windows**

## Instalação

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
- O menu da bandeja permite: Ativar/Desativar, Duração (Curta/Normal/Longa), Posição (cursor, cantos/centro), Tema (Auto/Claro/Escuro), **Iniciar com o sistema**, Sair.
- **Nunca** é exibida uma notificação nativa do SO. O toast é completamente personalizado.

## Modo demo

O modo demo é útil para desenvolvimento, testes visuais e geração de preview.

```bash
# Inicia em modo demo (mostra um toast de exemplo)
npm run demo
```

Também é possível via variáveis de ambiente:

```bash
# Mostra toast de exemplo ao iniciar
NOTIFYCOPY_DEMO=1 npm start

# Mostra toast de exemplo E captura a janela para docs/preview.png
NOTIFYCOPY_CAPTURE=1 npm run demo
```

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

- Em sessões **Wayland** (`XDG_SESSION_TYPE=wayland`), o Electron pode exigir flags adicionais (ex.: `--ozone-platform=wayland`). A aplicação deve detectar o tipo de sessão e aplicar as flags necessárias (conforme requisito 14 da especificação).
- Algumas configurações de posicionamento/visibilidade podem variar conforme compositor Wayland. Isso será tratado na implementação.

## Licença

[MIT](LICENSE)

## Desenvolvimento

Este repositório segue uma divisão por **dono**. Arquivos sob `electron-builder.yml`, `README.md`, `.gitignore`, `scripts/**`, `assets/icon.*`, `build/icon.*`, `docs/preview.png` (quando gerado) e `LICENSE` são de responsabilidade do **Quill** (Packaging/Docs). Não edite `src/**` nem `package.json` — estes pertencem a **Bramble/Sable**. Caso precise alterar campos em `package.json`, solicite ao **Bramble** via `maestri ask "Bramble" ...`.

## Ícones

Os ícones foram gerados via `scripts/generate-icons.py`. Estão disponíveis em: `assets/icon.png`, `assets/icon@2x.png` e `build/icon.png` (utilizado pelo electron-builder como `buildResources`).
