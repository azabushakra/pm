import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/kanban";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
};

const STAGE_STYLE_BY_ID: Record<
  string,
  {
    bar: string;
    badge: string;
    surface: string;
    ring: string;
  }
> = {
  "col-backlog": {
    bar: "bg-amber-500",
    badge: "text-amber-700",
    surface: "border-amber-100",
    ring: "ring-amber-300",
  },
  "col-discovery": {
    bar: "bg-sky-500",
    badge: "text-sky-700",
    surface: "border-sky-100",
    ring: "ring-sky-300",
  },
  "col-progress": {
    bar: "bg-violet-500",
    badge: "text-violet-700",
    surface: "border-violet-100",
    ring: "ring-violet-300",
  },
  "col-review": {
    bar: "bg-rose-500",
    badge: "text-rose-700",
    surface: "border-rose-100",
    ring: "ring-rose-300",
  },
  "col-done": {
    bar: "bg-emerald-500",
    badge: "text-emerald-700",
    surface: "border-emerald-100",
    ring: "ring-emerald-300",
  },
};

export const KanbanColumn = ({
  column,
  cards,
  onRename,
  onAddCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const stageStyle = STAGE_STYLE_BY_ID[column.id] ?? STAGE_STYLE_BY_ID["col-backlog"];

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex h-[620px] min-h-[620px] flex-col overflow-hidden rounded-3xl border bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] transition",
        stageStyle.surface,
        isOver && ["ring-2", stageStyle.ring]
      )}
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <div className="flex items-center gap-3">
            <div className={clsx("h-2 w-10 rounded-full", stageStyle.bar)} />
            <span className={clsx("text-xs font-semibold uppercase tracking-[0.2em]", stageStyle.badge)}>
              {cards.length} cards
            </span>
          </div>
          <input
            value={column.title}
            onChange={(event) => onRename(column.id, event.target.value)}
            className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-[var(--navy-dark)] outline-none"
            aria-label="Column title"
          />
        </div>
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onDelete={(cardId) => onDeleteCard(column.id, cardId)}
              />
            ))}
          </div>
        </SortableContext>
        {cards.length === 0 && (
          <div className="mt-1 flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-[var(--stroke)] px-3 py-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            Drop a card here
          </div>
        )}
      </div>
      <NewCardForm
        onAdd={(title, details) => onAddCard(column.id, title, details)}
      />
    </section>
  );
};
