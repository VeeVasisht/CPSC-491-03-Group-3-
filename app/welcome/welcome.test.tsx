// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { Welcome } from "./welcome";

describe("Welcome", () => {
  afterEach(() => cleanup());

  it("has a Travel Feed card linking to /feed", () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /Travel Feed/ });
    expect(link.getAttribute("href")).toBe("/feed");
    expect(link.textContent).toMatch(/Browse the latest posts/);
  });

  it("renders the Feed card with the same classes as the other cards", () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>,
    );
    const feed = screen.getByRole("link", { name: /Travel Feed/ });
    const map = screen.getByRole("link", { name: /Explore Map/ });
    expect(feed.className).toBe(map.className);
  });
});
