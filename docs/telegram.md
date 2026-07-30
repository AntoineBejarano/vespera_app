# Telegram + identidad del partner

## Cómo sabe que siempre habla contigo

Cada cuenta Vespera (`User`) es el interlocutor fijo:

- Web y Telegram comparten el mismo `userId`
- Personaje, memoria, historial y `RelationshipState` van por `userId` + `characterId`
- En el prompt se inyecta **quién eres** (`howToAddress` / nombre) y la **fase** de relación

Fases (`strangers` → `warming_up` → `comfortable` → `intimate` → `bonded`) salen de trust + affection.

## Cómo conectar Telegram

1. BotFather → crear bot → copiar token
2. Variables en Railway:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME` (sin @)
   - `TELEGRAM_WEBHOOK_SECRET` (string aleatorio)
3. Registrar webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://vesperaapp-production.up.railway.app/api/telegram" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

4. En la web → **Ajustes** → poner cómo te llama → **Vincular Telegram** → abrir el deep link `/start <token>`

A partir de ahí, mensajes en Telegram usan el mismo motor que la web.
