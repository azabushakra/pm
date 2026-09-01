import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
};

export const KanbanCard = ({ card, onDelete }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative cursor-grab rounded-xl border border-[var(--stroke)] bg-white p-3",
        "shadow-[var(--shadow-sm)] transition-[box-shadow,border-color,transform] duration-150",
        "hover:border-[var(--stroke-strong)] hover:shadow-[var(--shadow-md)]",
        "focus-within:border-[var(--primary-blue)]",
        isDragging && "cursor-grabbing opacity-50"
      )}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
      <h4 className="pr-6 font-display text-[0.9375rem] font-semibold leading-snug text-[var(--ink)]">
        {card.title}
      </h4>
      <p className="mt-1.5 text-[0.8125rem] leading-5 text-[var(--ink-soft)] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {card.details}
      </p>

      <button
        type="button"
        onClick={() => onDelete(card.id)}
        className={clsx(
          "absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg",
          "text-[var(--muted)] opacity-0 transition",
          "hover:bg-red-50 hover:text-red-600",
          "focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-400",
          "group-hover:opacity-100"
        )}
        aria-label={`Delete ${card.title}`}
        title="Remove card"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M6 7l1 12h10l1-12" />
          <path d="M9 7V5h6v2" />
        </svg>
      </button>
    </article>
  );
};
