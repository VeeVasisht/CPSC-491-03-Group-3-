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
  // Built from local time so the expected date doesn't depend on the test machine's timezone.
  createdAt: new Date(2026, 9, 7, 12).getTime(),
  updatedAt: new Date(2026, 9, 7, 12).getTime(),
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

  it("renders createdAt as a formatted date", () => {
    render(<PostCard post={base} />);
    const time = screen.getByText("Oct 7, 2026");
    expect(time.tagName).toBe("TIME");
    expect(time.getAttribute("dateTime")).toBe(new Date(base.createdAt).toISOString());
  });

  it("renders the location name when the post has a location", () => {
    render(
      <PostCard
        post={{ ...base, location: { name: "Kyoto, Japan", latitude: 35.0116, longitude: 135.7681 } }}
      />,
    );
    expect(screen.getByText(/Kyoto, Japan/)).toBeTruthy();
  });

  it("renders without a location line when the post has no location", () => {
    render(<PostCard post={base} />);
    expect(screen.queryByText(/📍/)).toBeNull();
    expect(screen.getByText("Sunset in Kyoto")).toBeTruthy();
  });
});
