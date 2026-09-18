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
let lastScheduledHour = -1;

async function checkDailyReportSchedule() {
  const now = new Date();
  const currentHour = Number(
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Africa/Porto-Novo",
      hour: "numeric",
      hour12: false,
    }).format(now),
  );

  if (currentHour === 23 && lastScheduledHour !== 23) {
    lastScheduledHour = 23;
    const todayKey = new Intl.DateTimeFormat("fr-CA", {
      timeZone: "Africa/Porto-Novo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const { tryClaimTelegramEvent, sendAdminTelegramDailyReport } = await import("../src/lib/telegram.server");
    const claimed = await tryClaimTelegramEvent(`scheduled_daily_report_${todayKey}`);
    if (claimed) {
      console.log(`[${new Date().toLocaleTimeString()}] 📈 Déclenchement automatique du rapport quotidien 23h (${todayKey})...`);
      await sendAdminTelegramDailyReport({ force: true });
    }
  } else if (currentHour !== 23) {
    lastScheduledHour = currentHour;
  }
}

async function loop() {
  if (isRunning) return;
  isRunning = true;
  try {
    const count = await pollTelegramUpdates();
    if (count > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ ${count} mise(s) à jour Telegram traitée(s) avec succès.`);
    }
    await checkDailyReportSchedule();
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Erreur de polling :`, err);
  } finally {
    isRunning = false;
  }
}

// Polling toutes les 3 secondes si activé
setInterval(loop, 3000);
loop();

