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

wsServer.on('connection', (websocket) => {
    console.log('Connection established');
    websocket.on('message', (data) => {
        console.log(`The message from client ${data}`)
        websocket.send(map)
    })
})


httpServer.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
