import { pollTelegramUpdates } from "../src/lib/telegram.server";

// Ne s'exécute QUE si explicitement activé via la variable d'environnement ENABLE_TELEGRAM_WORKER=true
if (process.env["ENABLE_TELEGRAM_WORKER"] !== "true") {
  console.log("ℹ️ telegram-worker inactif (le Webhook officiel Vercel traite les messages).");
  process.exit(0);
}

console.log("==========================================");
console.log("🤖 DUKAIO TELEGRAM BOT POLLER DAEMON ACTIF");
console.log("==========================================");

let isRunning = false;

async function loop() {
  if (isRunning) return;
  isRunning = true;
  try {
    const count = await pollTelegramUpdates();
    if (count > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ ${count} mise(s) à jour Telegram traitée(s) avec succès.`);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Erreur de polling :`, err);
  } finally {
    isRunning = false;
  }
}

// Polling toutes les 3 secondes si activé
setInterval(loop, 3000);
loop();
