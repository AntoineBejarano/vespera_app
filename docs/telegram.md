# Telegram — producto principal

La web es **admin/test**. Telegram es donde vive la relación.
El bot habla como persona real: inglés por defecto, multi-mensaje, delays, typos ligeros, fotos.
Nunca admite ser IA / ficción.

## Idioma

- Default: inglés casual
- Español solo si el usuario escribe o pide español

## Comportamiento humano

- Delay aleatorio antes de contestar
- Respuesta partida en varios mensajes (bubbles)
- Typos / acentos caídos / emoji ocasional
- Si pide `photo` / `pic` / `selfie` / `foto` → envía una foto del personaje (URLs en Panel)

## Conectar

1. BotFather → token
2. Railway env:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME` (sin @)
   - `TELEGRAM_WEBHOOK_SECRET`
3. Webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://vesperaapp-production.up.railway.app/api/telegram" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

4. Admin → Panel → Vincular Telegram → abrir deep link
5. Añadir fotos del personaje (URLs públicas) en el mismo panel

## Admin vs bot

| Superficie | Rol |
|---|---|
| Web `/chat` | Test del motor (mismas bubbles/delays) |
| Web `/settings` | Modelo, nombre, fotos, link TG |
| Telegram | Producto — nadie debe notar que es ficticia |
