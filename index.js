import http from "http";
import { WebSocketServer } from "ws";
import fs from "node:fs/promises";
import path from "node:path";

const PORT = process.env.PORT ?? 8000;

const httpServer = http.createServer(async (req, res) => {
  const indexFile = await fs.readFile(path.resolve("./index.html"), "utf-8");
  res.setHeader("Content-Type", "text/html");
  return res.end(indexFile);
});
const wsServer = new WebSocketServer({ server: httpServer });

wsServer.on("connection", (websocket) => {
  console.log("Web socket connection established!...");
  websocket.on("message", (data) => {
    wsServer.clients.forEach((websocket) => {
      websocket.send(data.toString());
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
