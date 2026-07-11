"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";
import type { DistrictBoundary } from "@/lib/types";

export type DistrictAggregation = {
  districtName: string;
  regencyName: string;
  total: number;
  students: number;
  stekomStudents: number;
};

interface BoundaryPolygonsProps {
  boundaries: DistrictBoundary[];
  aggregations: Record<string, DistrictAggregation>;
  onPolygonClick: (boundary: DistrictBoundary, stats: DistrictAggregation | null) => void;
}

const COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
  "#14b8a6", // teal-500
  "#a855f7", // purple-500
];

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

export function BoundaryPolygons({ boundaries, aggregations, onPolygonClick }: BoundaryPolygonsProps) {
  const map = useMap();
  const polygonsRef = useRef<google.maps.Polygon[]>([]);

  useEffect(() => {
    if (!map) return;

    // Cleanup old polygons
    polygonsRef.current.forEach((polygon) => {
      google.maps.event.clearInstanceListeners(polygon);
      polygon.setMap(null);
    });
    polygonsRef.current = [];

    // Render new polygons
    boundaries.forEach((boundary) => {
      const geojson = boundary.simplified_geojson;
      if (!geojson || geojson.type !== "MultiPolygon") return;

      const color = stringToColor(boundary.district_code);
      
      const paths = geojson.coordinates.flatMap((polygon) => {
        return polygon.map((ring) => {
          return ring.map(([lng, lat]) => ({ lat, lng }));
        });
      });

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.15,
        zIndex: 1, // keep zIndex low so markers can be clicked
      });

      polygon.setMap(map);
      polygonsRef.current.push(polygon);

      const stats = aggregations[boundary.district_code] ?? null;

      polygon.addListener("click", () => {
        onPolygonClick(boundary, stats);
      });
    });

    return () => {
      polygonsRef.current.forEach((polygon) => {
        google.maps.event.clearInstanceListeners(polygon);
        polygon.setMap(null);
      });
      polygonsRef.current = [];
    };
  }, [map, boundaries, aggregations, onPolygonClick]);

  return null;
}
