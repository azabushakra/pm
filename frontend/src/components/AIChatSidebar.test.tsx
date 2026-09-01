import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AIChatSidebar } from "@/components/AIChatSidebar";

describe("AIChatSidebar", () => {
  it("shows loading state while waiting", () => {
    render(
      <AIChatSidebar
        messages={[]}
        isLoading
        error={null}
        onSend={async () => {
          return;
        }}
      />
    );

    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });

  it("sends typed message", async () => {
    const onSend = vi.fn(async () => {
      return;
    });

    render(<AIChatSidebar messages={[]} isLoading={false} error={null} onSend={onSend} />);

    await userEvent.type(screen.getByLabelText(/message/i), "Create a card in Review");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith("Create a card in Review");
  });
});
