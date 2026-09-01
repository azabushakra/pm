import type { Card } from "@/lib/kanban";

type KanbanCardPreviewProps = {
  card: Card;
};

export const KanbanCardPreview = ({ card }: KanbanCardPreviewProps) => (
  <article className="rotate-2 cursor-grabbing rounded-xl border border-[var(--stroke-strong)] bg-white p-3 shadow-[var(--shadow-lg)]">
    <h4 className="font-display text-[0.9375rem] font-semibold leading-snug text-[var(--ink)]">
      {card.title}
    </h4>
    <p className="mt-1.5 text-[0.8125rem] leading-5 text-[var(--ink-soft)] break-words [overflow-wrap:anywhere]">
      {card.details}
    </p>
  </article>
);
