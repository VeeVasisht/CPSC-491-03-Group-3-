import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { BaseMap } from "./Map";

const { mockSetView, mockMap } = vi.hoisted(() => {
  const mockSetView = vi.fn();

  return {
    mockSetView,
    mockMap: {
      setView: mockSetView,
    },
  };
});

vi.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    center,
    zoom,
  }: {
    children: React.ReactNode;
    center: [number, number];
    zoom: number;
  }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
    >
      {children}
    </div>
  ),

  TileLayer: () => <div data-testid="tile-layer" />,

  CircleMarker: ({
    children,
    center,
  }: {
    children: React.ReactNode;
    center: [number, number];
  }) => (
    <div
      data-testid="user-location-marker"
      data-center={JSON.stringify(center)}
    >
      {children}
    </div>
  ),

  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,

  // IMPORTANT: always return the same object
  useMap: () => mockMap,
}));

vi.mock("leaflet", () => {
  const controls: HTMLElement[] = [];

  class MockControl {
    onAdd!: () => HTMLElement;

    addTo() {
      const element = this.onAdd();
      controls.push(element);
      document.body.appendChild(element);

      return this;
    }

    remove() {
      const element = controls.pop();
      element?.remove();
    }
  }

  return {
    default: {
      Control: {
        extend: (definition: Record<string, unknown>) => {
          return class extends MockControl {
            options = definition.options;

            constructor() {
              super();

              if (typeof definition.onAdd === "function") {
                this.onAdd = definition.onAdd as () => HTMLElement;
              }
            }
          };
        },
      },

      DomUtil: {
        create: (_tagName: string, className: string) => {
          const button = document.createElement("button");
          button.className = className;

          return button;
        },
      },

      DomEvent: {
        disableClickPropagation: vi.fn(),

        on: (element: HTMLElement, event: string, handler: EventListener) => {
          element.addEventListener(event, handler);
        },
      },
    },
  };
});

describe("BaseMap", () => {
  let getCurrentPositionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentPositionMock = vi.fn();

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: getCurrentPositionMock,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the base map using the default center", () => {
    render(<BaseMap />);

    const map = screen.getByTestId("map-container");

    expect(map).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();

    expect(map).toHaveAttribute(
      "data-center",
      JSON.stringify([34.0522, -118.2437]),
    );

    expect(map).toHaveAttribute("data-zoom", "11");
  });

  it("requests the user's current location", () => {
    render(<BaseMap />);

    expect(getCurrentPositionMock).toHaveBeenCalledOnce();
  });

  it("centers the map on the user's location when permission is granted", async () => {
    const getCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 33.8883,
          longitude: -118.309,
        },
      });
    });

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition,
      },
    });

    render(<BaseMap />);

    await waitFor(() => {
      expect(mockSetView).toHaveBeenCalledWith([33.8883, -118.309], 14);
    });
  });

  it("displays a marker at the user's current location", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 33.8883,
              longitude: -118.309,
            },
          });
        }),
      },
    });

    render(<BaseMap />);

    const marker = await screen.findByTestId("user-location-marker");

    expect(marker).toHaveAttribute(
      "data-center",
      JSON.stringify([33.8883, -118.309]),
    );

    expect(screen.getByText("You are here")).toBeInTheDocument();
  });

  it("keeps the default map state when location permission is denied", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 1,
            message: "User denied Geolocation",
          });
        }),
      },
    });

    render(<BaseMap />);

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith(
        "Unable to get user's location:",
        "User denied Geolocation",
      );
    });

    expect(mockSetView).not.toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  it("recenters the map when the recenter button is clicked", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 33.8883,
              longitude: -118.309,
            },
          });
        }),
      },
    });

    render(<BaseMap />);

    const recenterButton = await screen.findByRole("button", {
      name: "Recenter map on my location",
    });

    // Clear the initial setView call caused by obtaining
    // the user's location.
    mockSetView.mockClear();

    fireEvent.click(recenterButton);

    expect(mockSetView).toHaveBeenCalledOnce();

    expect(mockSetView).toHaveBeenCalledWith([33.8883, -118.309], 14);
  });
});
