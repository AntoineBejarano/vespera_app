/**
 * Telegram bot sync (post-MVP web).
 * Reutiliza la misma API/datos: enlaza telegramId al User y reenvía mensajes al motor de chat.
 *
 * Uso:
 *   TELEGRAM_BOT_TOKEN=... DATABASE_URL=... OPENROUTER_API_KEY=... npm run telegram
 *
 * Comandos:
 *   /start — vincular o instrucciones
 *   /new — crear personaje (redirige a web por ahora)
 *   /reset — resetear historial del personaje activo
 */
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;

async function main() {
  if (!token) {
    console.log(
      "[telegram] TELEGRAM_BOT_TOKEN no configurado. El bot queda desactivado hasta la fase post-MVP.",
    );
    console.log(
      "[telegram] Cuando esté listo: BotFather → token → polling o webhook a /api/telegram.",
    );
    return;
  }

  console.log("[telegram] Token detectado. Stub listo — conectar aiogram/grammY o webhook Next.");
  console.log("[telegram] Sync previsto: User.telegramId ↔ misma memoria/identidad Postgres.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
