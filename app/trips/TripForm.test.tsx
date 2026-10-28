// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TripForm } from "./TripForm";

afterEach(cleanup);

function completeForm() {
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: " Germany trip " } });
  fireEvent.change(screen.getByLabelText(/destination/i), { target: { value: " Berlin " } });
  fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-10-26" } });
  fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: "2026-10-31" } });
}

describe("TripForm", () => {
  it("renders required trip fields", () => {
    render(<TripForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/destination/i) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/start date/i) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/end date/i) as HTMLInputElement).required).toBe(true);
  });

  it("submits validated, trimmed values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TripForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    completeForm();
    fireEvent.click(screen.getByRole("button", { name: /save trip/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      title: "Germany trip", description: "", destination: "Berlin",
      startDate: "2026-10-26", endDate: "2026-10-31",
    }));
  });

  it("shows validation errors instead of submitting reversed dates", async () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    completeForm();
    // HTML date min constraint is bypassed here to exercise the JS validation.
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: "2026-11-05" } });
    fireEvent.submit(screen.getByRole("button", { name: /save trip/i }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringMatching(/end date/i));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("displays save failures", async () => {
    render(<TripForm onSubmit={vi.fn().mockRejectedValue(new Error("Save failed"))} onCancel={vi.fn()} />);
    completeForm();
    fireEvent.click(screen.getByRole("button", { name: /save trip/i }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Save failed");
  });

  it("invokes cancel without submitting", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
