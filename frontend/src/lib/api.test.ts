import { fetchBoard, saveBoard } from "@/lib/api";
import { initialData } from "@/lib/kanban";

const boardResponse = {
  username: "user",
  board: initialData,
};

describe("api client", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (_input, init) => {
      if (!init || init.method === "GET") {
        return new Response(JSON.stringify(boardResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          username: "user",
          board: JSON.parse(String(init.body)),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;
  });

  it("loads board data", async () => {
    const board = await fetchBoard("user");
    expect(board.columns).toHaveLength(5);
    expect(board.cards["card-1"].title).toBe("Align roadmap themes");
  });

  it("saves board data", async () => {
    const updated = {
      ...initialData,
      columns: initialData.columns.map((column) =>
        column.id === "col-backlog" ? { ...column, title: "Ideas" } : column
      ),
    };

    const board = await saveBoard("user", updated);
    expect(board.columns[0].title).toBe("Ideas");
  });
});
