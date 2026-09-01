import type { CSSProperties } from "react";
import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { stageColor, type Card, type Column } from "@/lib/kanban";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  /** True while a dragged card would land in this column. */
  isTarget?: boolean;
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
};

export const KanbanColumn = ({
  column,
  cards,
  isTarget = false,
  onRename,
  onAddCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver: isDirectlyOver } = useDroppable({ id: column.id });
  // Hovering a card resolves the collision to that card, not to the column, so
  // the column highlight also honours the target reported by the board.
  const isOver = isDirectlyOver || isTarget;

  const style = { "--stage": stageColor(column.id) } as CSSProperties;

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-[var(--surface-sunken)] transition-colors duration-150",
        isOver
          ? "border-[var(--stage)] bg-[color-mix(in_srgb,var(--stage)_7%,white)]"
          : "border-[var(--stroke)]"
      )}
      data-testid={`column-${column.id}`}
    >
      <div className="h-1 w-full shrink-0 bg-[var(--stage)]" />

      <header className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--stage)]" />
        <input
          value={column.title}
          onChange={(event) => onRename(column.id, event.target.value)}
          className={clsx(
            "min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5",
            "font-display text-[0.9375rem] font-semibold text-[var(--ink)] outline-none transition",
            "hover:border-[var(--stroke)] hover:bg-white",
            "focus:border-[var(--primary-blue)] focus:bg-white"
          )}
          aria-label="Column title"
        />
        <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--stage)_14%,white)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[color-mix(in_srgb,var(--stage)_75%,black)]">
          {cards.length}
        </span>
      </header>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
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
          <div
            className={clsx(
              "flex min-h-[88px] items-center justify-center rounded-xl border border-dashed px-3 text-center text-[0.8125rem] transition-colors",
              isOver
                ? "border-[var(--stage)] text-[var(--stage)]"
                : "border-[var(--stroke-strong)] text-[var(--muted)]"
            )}
          >
            Drop a card here
          </div>
        )}

        <div className="mt-2">
          <NewCardForm onAdd={(title, details) => onAddCard(column.id, title, details)} />
        </div>
      </div>
    </section>
  );
};
