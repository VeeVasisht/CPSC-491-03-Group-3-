// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PostCard } from "./PostCard";
import type { FeedPost } from "../../models/feed";

const base: FeedPost = {
  id: "p1",
  authorId: "user-1",
  title: "Sunset in Kyoto",
  description: "Amazing evening light.",
  imageUrl: "https://img/kyoto.png",
  createdAt: 1000,
  updatedAt: 1000,
  location: null,
};

describe("PostCard", () => {
  afterEach(() => cleanup());

  it("renders the post title and description", () => {
    render(<PostCard post={base} />);
    expect(screen.getByText("Sunset in Kyoto")).toBeTruthy();
    expect(screen.getByText("Amazing evening light.")).toBeTruthy();
  });

  it("renders the image with the title as alt text", () => {
    render(<PostCard post={base} />);
    const img = screen.getByAltText("Sunset in Kyoto") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("https://img/kyoto.png");
  });

  it("does not render an image when imageUrl is empty", () => {
    render(<PostCard post={{ ...base, imageUrl: "" }} />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});