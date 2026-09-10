import { pollTelegramUpdates } from "../src/lib/telegram.server";

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

// Polling toutes les 1.2 secondes
setInterval(loop, 1200);
loop();
