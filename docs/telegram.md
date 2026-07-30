# Telegram multi-tenant

Una **misma chica** (Character) puede hablar con **N personas** a la vez a través de **N bots**.

```
Character (Olga)
   ├── TelegramBot A  →  Peer1, Peer2, Peer3  (cada uno User + memoria + relación)
   └── TelegramBot B  →  Peer4, Peer5
```

## Modelo

| Pieza | Rol |
|---|---|
| `Character` | Persona compartida (soul/style/fotos) |
| `TelegramBot` | Token BotFather + webhook secret → apunta a un Character |
| `TelegramPeer` | `(botId, telegramUserId)` → User sombra aislado |
| `RelationshipState` | `@@unique([userId, characterId])` — una relación por persona |

Cualquiera que escriba al bot se auto-provisiona (no hace falta link del Panel).

## Añadir un bot

1. BotFather → `/newbot` → copiar token
2. Admin → **Panel → Bots multi-tenant**
3. Elige la chica, pega token + username → **Añadir bot + webhook**
4. La gente abre `t.me/TuBot` y escribe — cada una tiene su hilo

Webhook único: `POST /api/telegram`  
El bot se distingue por `x-telegram-bot-api-secret-token` (uno por bot en DB).

## Legacy env

Si existen `TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET`, se registran automáticamente como un bot ligado al Character activo.

## Aislamiento

- Historial Redis / mensajes / summaries / memories: por `userId` (peer)
- Fotos / soul / style: compartidos (misma chica)
- Límites diarios: por peer
