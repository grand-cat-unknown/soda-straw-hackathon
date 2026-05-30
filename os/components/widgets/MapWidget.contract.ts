import {
  PlaceArraySchema,
  PlaceSchema,
  RouteSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const MapWidgetContract: WidgetContract = {
  type: "map",
  title: "Map",
  description: "Renders places and routes, and publishes selected markers.",
  inputs: {
    markers: {
      schema: PlaceArraySchema,
      description: "Pins to drop on the map.",
    },
    route: {
      schema: RouteSchema,
      description: "Optional route to draw through the markers.",
      optional: true,
    },
  },
  outputs: {
    availableMarkers: {
      schema: PlaceArraySchema,
      description: "All markers currently rendered by the map, typically the available contacts sent into the map.",
    },
    selectedMarker: {
      schema: PlaceSchema,
      description: "Marker the user last clicked.",
    },
  },
  render: {
    renderer: "map",
    defaultLayout: { size: "xlarge", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      availableMarkers: "Current rendered markers",
      selectedMarker: "Marker click or marker selection buttons",
    },
  },
  toolCandidates: [
    {
      capabilityId: "maps.search_places",
      inputPort: "markers",
      resultPath: "$.places",
      transform: "placesToMarkers",
      purpose: "Render place search results on a map.",
    },
    {
      capabilityId: "maps.geocode",
      inputPort: "markers",
      resultPath: "$.places",
      transform: "placesToMarkers",
      purpose: "Render geocoded places on a map.",
    },
    {
      capabilityId: "maps.directions",
      inputPort: "route",
      resultPath: "$",
      transform: "directionsToRoute",
      purpose: "Render a backend route on the map.",
    },
  ],
  toolActions: {
    searchPlaces: {
      capabilityId: "maps.search_places",
      refreshBindings: ["markers"],
    },
    directions: {
      capabilityId: "maps.directions",
      refreshBindings: ["route"],
    },
  },
};
