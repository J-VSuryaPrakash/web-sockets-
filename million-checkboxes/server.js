import http from "http";
import path from "path";
import fs from "node:fs/promises";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT ?? 9000;
const map = new Map();

const httpServer = new http.createServer(async (req, res) => {
  const indexFile = await fs.readFile(path.resolve("./index.html"), "utf-8");
  res.setHeader("Content-Type", "text/html");
  return res.end(indexFile);
});

const wsServer = new WebSocketServer({ server: httpServer });

wsServer.on("connection", (websocket) => {
  console.log("Connection established");
  websocket.on("message", (data) => {
    const eventData = JSON.parse(data);
    if (eventData.type === "init") {
      let list = [];
      for (let key of map.keys()) {
        list.push(parseInt(key));
      }
      websocket.send(JSON.stringify(list));
    }
    if (eventData.type === "state") {
      wsServer.clients.forEach((websocket) => {
        const id = eventData.id;
        const state = eventData.state;

        if (state) {
          map.set(id, true);
          websocket.send(
            JSON.stringify({ type: "state", id: id, state: state }),
          );
        } else {
          map.delete(id);
          websocket.send(
            JSON.stringify({ type: "state", id: id, state: state }),
          );
        }
      });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
