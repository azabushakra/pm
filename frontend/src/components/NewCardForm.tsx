import { useState, type FormEvent } from "react";

const initialFormState = { title: "", details: "" };

type NewCardFormProps = {
  onAdd: (title: string, details: string) => void;
};

export const NewCardForm = ({ onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      return;
    }
    onAdd(formState.title.trim(), formState.details.trim());
    setFormState(initialFormState);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-[0.8125rem] font-semibold text-[var(--muted)] transition hover:border-[var(--stroke)] hover:bg-white hover:text-[var(--primary-blue)]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        Add a card
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-xl border border-[var(--stroke)] bg-white p-2 shadow-[var(--shadow-sm)]"
    >
      <input
        value={formState.title}
        onChange={(event) =>
          setFormState((prev) => ({ ...prev, title: event.target.value }))
        }
        placeholder="Card title"
        autoFocus
        className="w-full rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[0.875rem] font-medium text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary-blue)]"
        required
      />
      <textarea
        value={formState.details}
        onChange={(event) =>
          setFormState((prev) => ({ ...prev, details: event.target.value }))
        }
        placeholder="Details"
        rows={2}
        className="w-full resize-none rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[0.8125rem] text-[var(--ink-soft)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary-blue)]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-[var(--secondary-purple)] px-3 py-1.5 text-[0.8125rem] font-semibold text-white transition hover:brightness-110"
        >
          Add card
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setFormState(initialFormState);
          }}
          className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
