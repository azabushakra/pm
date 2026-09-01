import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthGate } from "@/components/AuthGate";

describe("AuthGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows login form by default", () => {
    render(<AuthGate />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    render(<AuthGate />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("blocks access with wrong credentials", async () => {
    render(<AuthGate />);

    await userEvent.type(screen.getByLabelText("Username"), "wrong");
    await userEvent.type(screen.getByLabelText("Password"), "bad");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Incorrect username or password.");
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
  });

  it("allows login with demo credentials", async () => {
    render(<AuthGate />);

    await userEvent.type(screen.getByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
    expect(sessionStorage.getItem("pm-authenticated")).toBe("true");
  });

  it("restores authenticated state from session storage", () => {
    sessionStorage.setItem("pm-authenticated", "true");
    render(<AuthGate />);

    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("logs out and returns to login screen", async () => {
    render(<AuthGate />);

    await userEvent.type(screen.getByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(sessionStorage.getItem("pm-authenticated")).toBeNull();
  });
});
