// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { ProfilePostGrid } from "./ProfilePostGrid";
import type { FeedPost } from "../../models/feed";

function post(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id: "p1",
    authorId: "user-1",
    title: "Sunset in Kyoto",
    description: "",
    imageUrl: "https://example.com/kyoto.jpg",
    createdAt: 1000,
    updatedAt: 1000,
    location: null,
    ...overrides,
  };
}

function renderGrid(posts: FeedPost[]) {
  render(
    <MemoryRouter>
      <ProfilePostGrid posts={posts} authorName="test2" />
    </MemoryRouter>,
  );
}

describe("ProfilePostGrid", () => {
  afterEach(() => cleanup());

  it("shows an empty state with a link to create a post", () => {
    renderGrid([]);
    expect(screen.getByText("No posts yet")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Create a post" }).getAttribute("href"),
    ).toBe("/createPost");
  });

  it("renders one tile per post, in the order given", () => {
    renderGrid([post({ id: "a", title: "First" }), post({ id: "b", title: "Second" })]);
    const images = screen.getAllByRole("img");
    expect(images.map((img) => img.getAttribute("alt"))).toEqual(["First", "Second"]);
  });

  it("shows the title on a plain tile when a post has no photo", () => {
    renderGrid([post({ imageUrl: "", title: "Packing tips" })]);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Packing tips")).toBeTruthy();
  });
});
