import "@testing-library/jest-dom/vitest";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { FeedToMapButton } from "./FeedToMapButton";

const navigateMock = vi.fn();

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>(
      "react-router",
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("FeedToMapButton", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("shows the map button for a valid location", () => {
    render(
      <FeedToMapButton
        location={{
          name: "Irvine, CA",
          latitude: 33.6846,
          longitude: -117.8265,
        }}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Open Irvine, CA on map",
      }),
    ).toBeEnabled();
  });

  it("navigates to the map using the correct coordinates", () => {
    render(
      <FeedToMapButton
        location={{
          name: "Irvine, CA",
          latitude: 33.6846,
          longitude: -117.8265,
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open Irvine, CA on map",
      }),
    );

    expect(navigateMock).toHaveBeenCalledTimes(1);

    const mapUrl = navigateMock.mock.calls[0][0] as string;
    const query = mapUrl.split("?")[1];
    const params = new URLSearchParams(query);

    expect(mapUrl.startsWith("/map?")).toBe(true);
    expect(params.get("lat")).toBe("33.6846");
    expect(params.get("lng")).toBe("-117.8265");
    expect(params.get("name")).toBe("Irvine, CA");
  });

  it("does not render when the post has no location", () => {
    const { container } = render(
      <FeedToMapButton location={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("disables navigation for invalid coordinates", () => {
    render(
      <FeedToMapButton
        location={{
          name: "Invalid Location",
          latitude: 100,
          longitude: -117.8265,
        }}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Open Invalid Location on map",
    });

    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("shows an error message for an invalid location", () => {
    render(
      <FeedToMapButton
        location={{
          name: "Invalid Location",
          latitude: 100,
          longitude: -117.8265,
        }}
      />,
    );

    expect(
      screen.getByText(
        "This location is not available on the map.",
      ),
    ).toBeInTheDocument();
  });
});
