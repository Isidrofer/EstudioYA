import { FlagIcon, SendIcon, ShieldAlertIcon } from "lucide-react";
import { CONVERSATIONS, MESSAGES } from "../_data";
import { Avatar, DesignNote, PageTitle, formatTime } from "../_components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Chat" };

export default function ChatMockupPage() {
  const active = CONVERSATIONS[0]!;

  return (
    <>
      <PageTitle title="Mensajes" />

      <div className="grid overflow-hidden rounded-xl border border-border bg-white shadow-sm md:grid-cols-[280px_1fr]">
        {/* Lista de conversaciones (en celular es una pantalla aparte) */}
        <ul className="hidden border-r border-border md:block" aria-label="Conversaciones">
          {CONVERSATIONS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                aria-current={c.id === active.id ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border p-3 text-left hover:bg-muted",
                  c.id === active.id && "bg-accent/50",
                )}
              >
                <Avatar name={c.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(c.updatedAt)}</span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{c.subject}</span>
                  <span className="block truncate text-sm">{c.lastMessage}</span>
                </span>
                {c.unread > 0 && (
                  <span className="rounded-full bg-brand-orange-strong px-1.5 text-xs font-bold text-white">
                    {c.unread}
                    <span className="sr-only"> sin leer</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Conversación activa */}
        <section className="flex min-h-[480px] flex-col" aria-label={`Conversación con ${active.name}`}>
          <header className="flex items-center gap-3 border-b border-border p-3">
            <Avatar name={active.name} size="sm" />
            <div>
              <p className="text-sm font-semibold">{active.name}</p>
              <p className="text-xs text-muted-foreground">{active.subject} · clase el viernes 12:00</p>
            </div>
          </header>

          <ol className="flex-1 space-y-3 overflow-y-auto bg-background p-4">
            {MESSAGES.map((m) => (
              <li key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                <div className="group max-w-[80%]">
                  {"blocked" in m && m.blocked ? (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                      <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>
                        Este mensaje no se envió porque tiene datos de contacto. Para cuidarte, toda la comunicación queda
                        dentro de EstudioYA.
                      </span>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm",
                        m.fromMe ? "rounded-br-sm bg-brand-navy text-white" : "rounded-bl-sm bg-white shadow-sm",
                      )}
                    >
                      {m.text}
                    </div>
                  )}
                  <div className={cn("mt-0.5 flex items-center gap-2 text-xs text-muted-foreground", m.fromMe && "justify-end")}>
                    {formatTime(m.sentAt)}
                    {!m.fromMe && (
                      <button type="button" className="inline-flex items-center gap-0.5 hover:text-destructive" aria-label="Reportar mensaje">
                        <FlagIcon className="size-3" aria-hidden="true" /> Reportar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <form className="flex gap-2 border-t border-border p-3">
            <input
              className="h-10 flex-1 rounded-full border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Escribí un mensaje"
              aria-label="Mensaje"
            />
            <button type="button" className="flex size-10 items-center justify-center rounded-full bg-brand-orange-strong text-white" aria-label="Enviar">
              <SendIcon className="size-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>

      <div className="mt-6 space-y-2">
        <DesignNote>
          el bloqueo de teléfonos, emails y links es BR-14 (por confirmar, D-02). El mensaje bloqueado solo lo ve quien lo
          escribió.
        </DesignNote>
        <DesignNote>en celular la lista y la conversación son dos pantallas: se entra a una conversación y se vuelve con ←.</DesignNote>
      </div>
    </>
  );
}
