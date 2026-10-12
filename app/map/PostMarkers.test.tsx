import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import type { PostMarker } from "../models/postMarker";
import { PostMarkers } from "./PostMarkers";

// Mimic the real Leaflet interaction: only the selected marker's popup opens.
vi.mock("react-leaflet", () => ({
  CircleMarker: ({ children, center }: {
    children: React.ReactNode;
    center: [number, number];
  }) => {
    const [open, setOpen] = useState(false);
    return <div data-center={JSON.stringify(center)}>
      <button type="button" aria-label={`Select marker ${center.join(",")}`}
        onClick={() => setOpen((value) => !value)}>Marker</button>
      {open && children}
    </div>;
  },
  Popup: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
}));

const kyoto: PostMarker = {
  id: "kyoto-id", title: "Kyoto trip", description: "Amazing sunset",
  imageUrl: "https://example.com/kyoto.jpg",
  location: { name: "Kyoto", latitude: 35.0116, longitude: 135.7681 },
};
const tokyo: PostMarker = { ...kyoto, id: "tokyo-id", title: "Tokyo trip", location: {
  name: "Tokyo", latitude: 35.6762, longitude: 139.6503,
} };

function DetailStub() {
  const { postId } = useParams();
  return <p>Detail post ID: {postId}</p>;
}

function renderMarkers(posts: PostMarker[]) {
  return render(<MemoryRouter initialEntries={["/map"]}>
    <Routes>
      <Route path="/map" element={<PostMarkers posts={posts} />} />
      <Route path="/posts/:postId" element={<DetailStub />} />
    </Routes>
  </MemoryRouter>);
}

afterEach(() => cleanup());

describe("Sprint 3 marker preview and navigation", () => {
  it("S3-TC04: selecting a marker opens the correct post preview", () => {
    renderMarkers([kyoto, tokyo]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Select marker 35.6762,139.6503" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Tokyo trip");
    expect(screen.getByRole("dialog")).toHaveTextContent("Tokyo");
    expect(screen.queryByText("Kyoto trip")).not.toBeInTheDocument();
  });

  it("S3-TC05: preview navigation opens the matching Post Detail ID", () => {
    renderMarkers([kyoto, tokyo]);
    fireEvent.click(screen.getByRole("button", { name: "Select marker 35.0116,135.7681" }));
    fireEvent.click(screen.getByRole("link", { name: "View post" }));
    expect(screen.getByText("Detail post ID: kyoto-id")).toBeInTheDocument();
  });
});
