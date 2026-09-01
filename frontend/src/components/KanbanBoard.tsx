"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AIChatSidebar, type ChatMessage } from "@/components/AIChatSidebar";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { fetchBoard, saveBoard } from "@/lib/api";
import { sendChatMessage } from "@/lib/ai";
import {
  createId,
  initialData,
  moveCard,
  normalizeBoardColumns,
  type BoardData,
} from "@/lib/kanban";

type KanbanBoardProps = {
  username: string;
  onLogout?: () => void;
};

export const KanbanBoard = ({ username, onLogout }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData>(() => initialData);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board.cards, [board.cards]);

  useEffect(() => {
    let cancelled = false;

    const loadBoard = async () => {
      setIsLoading(true);
      try {
        const loaded = await fetchBoard(username);
        if (!cancelled) {
          setBoard(normalizeBoardColumns(loaded));
          setSaveError(null);
        }
      } catch {
        if (!cancelled) {
          setBoard(initialData);
          setSaveError("Unable to load saved board. Showing local fallback.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadBoard();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const persistBoard = async (nextBoard: BoardData) => {
    setIsSaving(true);
    try {
      await saveBoard(username, nextBoard);
      setSaveError(null);
    } catch {
      setSaveError("Unable to save changes right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const applyBoardChange = (updater: (current: BoardData) => BoardData) => {
    setBoard((current) => {
      const next = normalizeBoardColumns(updater(current));
      void persistBoard(next);
      return next;
    });
  };

  const columnIdFor = (id: string) =>
    board.columns.find((column) => column.id === id || column.cardIds.includes(id))?.id ??
    null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverColumnId(event.over ? columnIdFor(event.over.id as string) : null);
  };

  const handleDragCancel = () => {
    setActiveCardId(null);
    setOverColumnId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    setOverColumnId(null);

    if (!over || active.id === over.id) {
      return;
    }

    applyBoardChange((prev) => ({
      ...prev,
      columns: moveCard(prev.columns, active.id as string, over.id as string),
    }));
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    applyBoardChange((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    applyBoardChange((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: { id, title, details: details || "No details yet." },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    applyBoardChange((prev) => {
      return {
        ...prev,
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(([id]) => id !== cardId)
        ),
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      };
    });
  };

  const handleSendChat = async (message: string) => {
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsChatLoading(true);
    setChatError(null);

    try {
      const response = await sendChatMessage(username, message);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.assistantMessage },
      ]);
      if (response.boardUpdated) {
        setBoard(normalizeBoardColumns(response.board));
        setSaveError(null);
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to reach AI assistant right now.";
      setChatError(message);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not respond right now. Please try again shortly.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const activeCard = activeCardId ? cardsById[activeCardId] : null;
  const totalCards = Object.keys(board.cards).length;

  const status = isLoading
    ? { label: "Loading board", tone: "text-[var(--muted)]", dot: "bg-[var(--muted)]" }
    : isSaving
      ? { label: "Saving", tone: "text-[var(--primary-blue)]", dot: "bg-[var(--primary-blue)]" }
      : { label: "All changes saved", tone: "text-[var(--muted)]", dot: "bg-[#10a37a]" };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)] xl:h-screen xl:overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 border-b border-[var(--stroke)] bg-white px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--navy-dark)]">
            <span className="grid grid-cols-2 gap-[3px]">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[var(--accent-yellow)]" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[var(--primary-blue)]" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[var(--primary-blue)]" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[#10a37a]" />
            </span>
          </span>
          <h1 className="truncate font-display text-base font-semibold text-[var(--ink)]">
            Kanban Studio
          </h1>
        </div>

        <span className="hidden text-[0.8125rem] text-[var(--muted)] sm:inline">
          {totalCards} cards
        </span>

        <div className="ml-auto flex items-center gap-3">
          {saveError ? (
            <p className="hidden max-w-[280px] truncate text-xs font-medium text-red-700 sm:block">
              {saveError}
            </p>
          ) : null}
          <p className={`flex items-center gap-1.5 text-xs font-medium ${status.tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </p>
          <span className="hidden h-5 w-px bg-[var(--stroke)] sm:block" />
          <span className="hidden text-[0.8125rem] font-medium text-[var(--ink-soft)] sm:inline">
            {username}
          </span>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-[var(--stroke)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-[var(--stroke-strong)] hover:text-[var(--ink)]"
            >
              Log out
            </button>
          ) : null}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 xl:grid xl:grid-cols-[minmax(0,1fr)_340px]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Columns share the width when they fit and scroll sideways when
              they do not, so they never squeeze down to an unreadable width. */}
          <div className="scroll-slim min-h-0 overflow-x-auto max-xl:h-[70vh]">
            <section className="grid h-full min-w-[1060px] grid-cols-5 gap-3">
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId])}
                  isTarget={overColumnId === column.id}
                  onRename={handleRenameColumn}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </section>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <div className="w-[260px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="flex min-h-0 flex-col max-xl:h-[460px]">
          <AIChatSidebar
            messages={chatMessages}
            isLoading={isChatLoading}
            error={chatError}
            onSend={handleSendChat}
          />
        </div>
      </main>
    </div>
  );
};
