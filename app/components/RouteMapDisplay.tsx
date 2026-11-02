import React, { useEffect, useState } from "react";
import { Destination, RouteResult } from "~/models/route";
import { calculateRouteFromDestinations } from "~/services/routingService";

interface RouteMapDisplayProps {
  tripId: string;
  destinations: Destination[];
}

export function RouteMapDisplay({ tripId, destinations }: RouteMapDisplayProps) {
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRouteData() {
      setLoading(true);
      setErrorMessage(null);

      const result = await calculateRouteFromDestinations(destinations);

      if (isMounted) {
        setRouteResult(result);
        if (!result.success && result.error) {
          setErrorMessage(result.error);
        }
        setLoading(false);
      }
    }

    void loadRouteData();

    return () => {
      isMounted = false;
    };
  }, [destinations]);

  if (loading) {
    return <div className="p-6 text-center text-gray-500 font-medium">Calculating route and drawing map markers...</div>;
  }

  if (errorMessage) {
    return (
      <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
        <p className="font-semibold text-sm">Route Display Notice</p>
        <p className="text-sm mt-1">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {destinations.length === 1 ? (
          <div className="text-center">
            <p className="font-semibold text-gray-800">Single Destination View</p>
            <p className="text-sm text-gray-600 mt-1">{destinations[0].name}</p>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <p className="font-semibold text-gray-800">Active Itinerary Route Rendered</p>
            <p className="text-xs text-gray-500">
              Total Route Distance: {((routeResult?.totalDistanceMeters || 0) / 1000).toFixed(1)} km
            </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-lg shadow border border-gray-100 max-h-44 overflow-y-auto">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Ordered Stops Sequence</h4>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-900">
          {destinations
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((stop, idx) => (
              <li key={stop.id || idx} className="truncate">
                <span className="font-medium">{stop.name}</span>{" "}
                <span className="text-xs text-gray-400 font-mono">({stop.lat.toFixed(3)}, {stop.lng.toFixed(3)})</span>
              </li>
            ))}
        </ol>
      </div>
    </div>
  );
}