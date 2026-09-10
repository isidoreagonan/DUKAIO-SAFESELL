import { createFileRoute } from "@tanstack/react-router";
import {
  processTelegramIncomingMessage,
  processTelegramCallbackQuery,
  isTelegramEventProcessed,
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

    if (update.update_id && isTelegramEventProcessed(`upd_${update.update_id}`)) {
      return Response.json({ ok: true, skipped: "duplicate_update" });
    }

    if (update.callback_query) {
      const cbKey = `cb_${update.callback_query.id}`;
      if (isTelegramEventProcessed(cbKey)) {
        return Response.json({ ok: true, skipped: "duplicate_callback" });
      }

      // 1. Acknowledgment instantané pour que Telegram coupe le spinner et les retries
      void processTelegramCallbackQuery(update.callback_query).catch((err) => {
        console.error("[Telegram Webhook Callback Error]", err);
      });

      return Response.json({ ok: true, handled: "callback_query" });
    }

    if (update.message) {
      const msgKey = `msg_${update.message.chat.id}_${update.message.message_id}`;
      if (isTelegramEventProcessed(msgKey)) {
        return Response.json({ ok: true, skipped: "duplicate_message" });
      }

      void processTelegramIncomingMessage(update.message).catch((err) => {
        console.error("[Telegram Webhook Message Error]", err);
      });

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
      GET: () => Response.json({ ok: true, bot: "DukaioOfficialBot", status: "active" }),
    },
  },
});

