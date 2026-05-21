import { MessageCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";

export function StudentFabs() {
  const { t, dir } = useI18n();
  const [chatOpen, setChatOpen] = useState(false);

  const startSide = dir === "rtl" ? "right" : "left";
  const endSide = dir === "rtl" ? "left" : "right";

  return (
    <>
      {/* AI Support — start side (left in LTR) */}
      <button
        onClick={() => toast.info("AI assistant coming soon — ask anything about your journey")}
        aria-label={t("fab.ai")}
        className="fixed bottom-24 z-40 flex h-13 w-13 items-center justify-center rounded-full border border-border bg-surface-2 text-foreground shadow-elevated transition hover:scale-105"
        style={{ [startSide]: "1rem", height: "3.25rem", width: "3.25rem" } as React.CSSProperties}
      >
        <Sparkles className="h-5 w-5 text-primary" />
      </button>

      {/* Chat — end side (right in LTR) */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        aria-label={t("fab.chat")}
        className="fixed bottom-24 z-40 flex items-center justify-center rounded-full bg-gradient-gold shadow-gold transition hover:scale-105"
        style={{ [endSide]: "1rem", height: "3.25rem", width: "3.25rem" } as React.CSSProperties}
      >
        <MessageCircle className="h-5 w-5 text-primary-foreground" />
      </button>

      {chatOpen && (
        <div
          className="fixed bottom-40 z-40 w-72 rounded-2xl border border-border bg-card p-4 shadow-elevated"
          style={{ [endSide]: "1rem" } as React.CSSProperties}
        >
          <p className="text-sm font-semibold text-foreground">{t("fab.chat")}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Connect with your agency advisor — real-time chat coming soon.
          </p>
        </div>
      )}
    </>
  );
}
