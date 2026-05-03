/**
 * Convierte el stream SSE de OpenAI (chat/completions?stream=true) en texto plano UTF-8.
 */
export function openAiSseResponseToPlainTextStream(sseBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = sseBody.getReader();
  const dec = new TextDecoder();
  let buf = "";

  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (value) buf += dec.decode(value, { stream: true });

          let newline: number;
          while ((newline = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, newline).trim();
            buf = buf.slice(newline + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const t = j.choices?.[0]?.delta?.content;
              if (t) controller.enqueue(enc.encode(t));
            } catch {
              /* ignorar líneas mal formadas */
            }
          }

          if (done) break;
        }
      } catch (e) {
        controller.error(e);
        return;
      }
      controller.close();
    },
    cancel() {
      reader.releaseLock();
    },
  });
}
