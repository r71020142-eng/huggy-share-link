# Açaí Lab Print Agent - Desktop (Electron)

## Descrição
Aplicativo desktop Windows para impressão automática de comandas via impressoras térmicas 58mm.

## Stack
- Electron
- Node.js
- node-escpos (USB/Bluetooth/Network)
- @supabase/supabase-js (Realtime)

## Instalação para desenvolvimento

```bash
cd electron-print-agent
npm install
npm start
```

## Build para distribuição

```bash
npm run build
```

Gera instalador Windows em `dist/`.

## Configuração

1. Abra o aplicativo
2. Informe o **Store ID** (disponível no painel admin > Impressão)
3. Informe o **Token** gerado no painel
4. Clique em "Conectar"

## Arquitetura

- `main.js` — Processo principal Electron (system tray, janela)
- `renderer/` — Interface HTML do agente
- `lib/printer.js` — Lógica ESC/POS para impressão térmica 58mm
- `lib/supabase.js` — Cliente Supabase com Realtime
- `lib/heartbeat.js` — Heartbeat a cada 30s
- `lib/store.js` — Persistência local segura de credenciais
