# Açaí Lab Print Agent — Desktop (Electron)

Aplicativo desktop Windows para impressão automática de comandas térmicas 58mm via ESC/POS.

## Stack

- **Electron** 28 + **electron-builder** (instalador Windows .exe)
- **node-escpos** (USB / Rede TCP)
- **@supabase/supabase-js** (Realtime para novos pedidos)
- **electron-store** (armazenamento criptografado de credenciais)

## Estrutura

```
electron-print-agent/
├── main.js              # Processo principal (janela, tray, IPC)
├── preload.js           # Context bridge seguro
├── lib/
│   ├── supabase.js      # Configuração do Supabase
│   └── printer-commands.js  # Gerador de comandos ESC/POS 58mm
├── renderer/
│   ├── index.html       # Interface do agente
│   └── app.js           # Lógica do renderer (conexão, realtime, impressão)
├── assets/
│   └── icon.png         # Ícone do app (coloque aqui)
└── package.json
```

## Instalação

```bash
cd electron-print-agent
npm install
```

## Desenvolvimento

```bash
npm start
```

## Build (Instalador Windows)

```bash
npm run build
```

Gera instalador `.exe` em `dist/`.

## Como Usar

1. Acesse o painel admin → **Impressão**
2. Copie o **Store ID** e gere um **Token**
3. Abra o Print Agent
4. Cole Store ID e Token → **Conectar**
5. Configure impressoras (USB ou Rede)
6. Pedidos novos serão impressos automaticamente!

## Funcionalidades

| Feature | Descrição |
|---------|-----------|
| 🔗 Conexão segura | Token SHA-256 validado via Edge Function |
| 💓 Heartbeat | A cada 30s atualiza `last_seen_at` |
| 📡 Realtime | Escuta apenas pedidos da loja conectada |
| 🖨️ ESC/POS 58mm | Layout profissional de comanda |
| 🔄 Deduplicação | Controle por `order_id` — nunca imprime duplicado |
| 📋 1 ou 2 vias | Cozinha / Balcão / Ambas |
| 🔒 Multi-tenant | Isolamento total por `store_id` |
| 🖥️ System Tray | Minimiza para bandeja do Windows |
| 💾 Criptografia | Credenciais salvas com `electron-store` |

## Segurança

- Nunca usa `service_role` no client
- Token validado contra hash no banco
- Revogação imediata pelo painel admin
- Filtro por `store_id` no Realtime — isolamento absoluto
- `contextIsolation: true` + `preload.js` (sem `nodeIntegration`)
