import type { ChannelResult, Env, NotifyPayload } from "../types";
import { withRetry } from "../rate-limit";
import { telegramText } from "./format";

export async function sendTelegram(env: Env, payload: NotifyPayload): Promise<ChannelResult> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return {
      status: "sent",
      messageId: `mock_tg_${crypto.randomUUID()}`,
      mock: true,
    };
  }

  return withRetry(async () => {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: telegramText(payload),
        disable_web_page_preview: true,
      }),
    });
    const body = (await res.json()) as { ok?: boolean; result?: { message_id?: number }; description?: string };
    if (!res.ok || !body.ok) {
      throw new Error(body.description || `Telegram HTTP ${res.status}`);
    }
    return { status: "sent" as const, messageId: String(body.result?.message_id ?? "") };
  }).catch((err: unknown) => ({
    status: "failed" as const,
    error: err instanceof Error ? err.message : String(err),
  }));
}
