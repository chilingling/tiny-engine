import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";
import { z } from "zod";
import express from "express";
import cors from "cors";
const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";
const PORT = process.env.PORT || 3000;
// Helper function for making NWS API requests
async function makeNWSRequest(url) {
    const headers = {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making NWS request:", error);
        return null;
    }
}
// Format alert data
function formatAlert(feature) {
    const props = feature.properties;
    return [
        `Event: ${props.event || "Unknown"}`,
        `Area: ${props.areaDesc || "Unknown"}`,
        `Severity: ${props.severity || "Unknown"}`,
        `Status: ${props.status || "Unknown"}`,
        `Headline: ${props.headline || "No headline"}`,
        "---",
    ].join("\n");
}
// Create server instance
const server = new McpServer({
    name: "weather",
    version: "1.0.0",
});
// Register weather tools
server.tool("get-alerts", "Get weather alerts for a state", {
    state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
}, async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest(alertsUrl);
    if (!alertsData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve alerts data",
                },
            ],
        };
    }
    const features = alertsData.features || [];
    if (features.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `No active alerts for ${stateCode}`,
                },
            ],
        };
    }
    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: alertsText,
            },
        ],
    };
});
server.tool("get-forecast", "Get weather forecast for a location", {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Longitude of the location"),
}, async ({ latitude, longitude }) => {
    // Get grid point data
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest(pointsUrl);
    if (!pointsData) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
                },
            ],
        };
    }
    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to get forecast URL from grid point data",
                },
            ],
        };
    }
    // Get forecast data
    const forecastData = await makeNWSRequest(forecastUrl);
    if (!forecastData) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve forecast data",
                },
            ],
        };
    }
    const periods = forecastData.properties?.periods || [];
    if (periods.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "No forecast periods available",
                },
            ],
        };
    }
    // Format forecast periods
    const formattedForecast = periods.map((period) => [
        `${period.name || "Unknown"}:`,
        `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
        `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        `${period.shortForecast || "No forecast available"}`,
        "---",
    ].join("\n"));
    const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: forecastText,
            },
        ],
    };
});
// Set up Express app for SSE
const app = express();
app.use(cors());
app.use(express.json());
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});
// Root endpoint with simple HTML interface
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Weather MCP Server (SSE)</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .container { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Weather MCP Server (SSE)</h1>
      <p>This is an SSE implementation of the Weather MCP Server.</p>
      <div class="container">
        <h2>API Endpoints:</h2>
        <ul>
          <li><code>/mcp</code> - MCP HTTP endpoint</li>
          <li><code>/health</code> - Health check endpoint</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});
// Start the server
async function main() {
    // Create HTTP transport with SSE support
    const transport = new HttpServerTransport({
        app,
        path: "/mcp",
        sse: true,
    });
    // Connect the MCP server to the transport
    await server.connect(transport);
    // Start the Express server
    app.listen(PORT, () => {
        console.log(`Weather MCP Server (SSE) running on http://localhost:${PORT}`);
        console.log(`MCP endpoint available at http://localhost:${PORT}/mcp`);
    });
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
