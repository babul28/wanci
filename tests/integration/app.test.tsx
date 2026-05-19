import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App";
import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock Canvas and Image APIs
beforeAll(() => {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      close: vi.fn(),
    }),
  );

  const mockUrl = {
    createObjectURL: vi.fn().mockReturnValue("blob:test-url"),
    revokeObjectURL: vi.fn(),
  };
  vi.stubGlobal("URL", mockUrl);

  // Mock canvas toBlob
  HTMLCanvasElement.prototype.toBlob = function (callback: any) {
    callback(new Blob(["test"], { type: "image/jpeg" }));
  };

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 100 }),
  }) as any;
});

describe("App Integration", () => {
  it("should upload image, edit metadata, and show download button", async () => {
    render(<App />);

    // Find the file input directly
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for upload to process
    await waitFor(() => {
      expect(screen.getByText("Download Edited Photo")).toBeDefined();
    });

    // Edit metadata
    const tsInput = screen.getByPlaceholderText("e.g. 2026-05-19 14:30:00");
    fireEvent.change(tsInput, { target: { value: "2027-01-01 10:00:00" } });

    const locInput = screen.getByPlaceholderText("e.g. 40.7128° N, 74.0060° W");
    fireEvent.change(locInput, { target: { value: "10.0, 20.0" } });

    expect(screen.getByDisplayValue("2027-01-01 10:00:00")).toBeDefined();
    expect(screen.getByDisplayValue("10.0, 20.0")).toBeDefined();
  });
});
