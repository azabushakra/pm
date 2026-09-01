import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { initialData } from "@/lib/kanban";

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

const createOkResponse = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("KanbanBoard", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (_input, init) => {
      const requestUrl = String(_input);
      if (!init || init.method === "GET") {
        return createOkResponse({ username: "user", board: initialData });
      }

      if (requestUrl.endsWith("/api/ai/chat")) {
        return createOkResponse({
          username: "user",
          assistantMessage: "Done.",
          boardUpdated: false,
          usedFallback: false,
          board: initialData,
        });
      }

      return createOkResponse({
        username: "user",
        board: JSON.parse(String(init.body)),
      });
    }) as typeof fetch;
  });

  it("renders five columns", async () => {
    render(<KanbanBoard username="user" />);
    expect(await screen.findAllByTestId(/column-/i)).toHaveLength(5);
  });

  it("renames a column", async () => {
    render(<KanbanBoard username="user" />);
    await screen.findByText(/all changes saved/i);
    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/board\/user$/),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard username="user" />);
    await screen.findByText(/all changes saved/i);
    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });

  it("renders assistant response from chat", async () => {
    render(<KanbanBoard username="user" />);
    await screen.findByText(/all changes saved/i);

    await userEvent.type(screen.getByLabelText(/message/i), "Summarize board");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Done.")).toBeInTheDocument();
  });

  it("updates board UI when AI returns board update", async () => {
    global.fetch = vi.fn(async (_input, init) => {
      const requestUrl = String(_input);
      if (!init || init.method === "GET") {
        return createOkResponse({ username: "user", board: initialData });
      }

      if (requestUrl.endsWith("/api/ai/chat")) {
        const nextBoard = {
          ...initialData,
          columns: initialData.columns.map((column) =>
            column.id === "col-backlog" ? { ...column, title: "Ideas" } : column
          ),
        };

        return createOkResponse({
          username: "user",
          assistantMessage: "Renamed backlog.",
          boardUpdated: true,
          usedFallback: false,
          board: nextBoard,
        });
      }

      return createOkResponse({
        username: "user",
        board: JSON.parse(String(init?.body)),
      });
    }) as typeof fetch;

    render(<KanbanBoard username="user" />);
    await screen.findByText(/all changes saved/i);

    await userEvent.type(screen.getByLabelText(/message/i), "Rename backlog");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByDisplayValue("Ideas")).toBeInTheDocument();
  });
});
