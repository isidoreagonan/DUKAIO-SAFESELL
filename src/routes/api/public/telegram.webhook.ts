import { createFileRoute } from "@tanstack/react-router";
import {
  processTelegramIncomingMessage,
  processTelegramCallbackQuery,
  tryClaimTelegramEvent,
} from "@/lib/telegram.server";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot?: boolean;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    caption?: string;
    photo?: Array<{ file_id: string; width: number; height: number; file_size?: number }>;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name?: string };
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
};

async function handleTelegramUpdate(request: Request): Promise<Response> {
  try {
    const update = (await request.json()) as TelegramUpdate;
    if (!update) {
      return Response.json({ ok: true, skipped: true });
    }

    if (update.update_id) {
      const claimed = await tryClaimTelegramEvent(`upd_${update.update_id}`);
      if (!claimed) {
        return Response.json({ ok: true, skipped: "duplicate_update" });
      }
    }

    if (update.callback_query) {
      const cbKey = `cb_${update.callback_query.id}`;
      const claimed = await tryClaimTelegramEvent(cbKey);
      if (!claimed) {
        return Response.json({ ok: true, skipped: "duplicate_callback" });
      }

      await processTelegramCallbackQuery(update.callback_query);
      return Response.json({ ok: true, handled: "callback_query" });
    }

    if (update.message) {
      const msgKey = `msg_${update.message.chat.id}_${update.message.message_id}`;
      const claimed = await tryClaimTelegramEvent(msgKey);
      if (!claimed) {
        return Response.json({ ok: true, skipped: "duplicate_message" });
      }

      await processTelegramIncomingMessage(update.message);
      return Response.json({ ok: true, handled: "message" });
    }

    return Response.json({ ok: true, skipped: true });
  } catch (error) {
    console.error("[Telegram Webhook] Erreur:", error);
    // Toujours renvoyer un statut 200 à Telegram pour empêcher les tempêtes de réessais (retries)
    return Response.json({ ok: true, error: (error as Error).message });
  }
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleTelegramUpdate(request),
      GET: async () => {
        try {
          const token = process.env["TELEGRAM_BOT_TOKEN"];
          if (!token) return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN non configuré sur ce serveur." });
          const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
          const info = await res.json();
          return Response.json({ ok: true, bot: "DukaioOfficialBot", status: "active", webhookInfo: info });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message });
        }
      },
    },
  },
});

