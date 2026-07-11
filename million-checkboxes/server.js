import http from "node:http";
import path from "node:path";

import express from "express";
import { Server } from "socket.io";

import { publisher, subscriber, redis } from "./redis-connection.js";

const CHECK_BOX = 100;
const REDIS_KEY = "checkbox-key";
const rateLimitingKey = "rate-limit";

async function main() {
  const PORT = process.env.PORT ?? 8000;
  const app = new express();

  const httpServer = http.createServer(app);
  const io = new Server();

  io.attach(httpServer);

  await subscriber.subscribe("internal-server:checkbox");

  subscriber.on("message", async (channel, data) => {
    if (channel === "internal-server:checkbox") {
      const { id, checked } = JSON.parse(data);
      io.emit("server:checkbox", { id, checked });
    }
  });

  app.use(express.static(path.resolve("./public")));
  app.get("/health", (req, res) => {
    res.send({ type: "health-check" });
  });
  app.get("/checkboxes", async (req, res) => {
    const existingData = await redis.get(REDIS_KEY);
    if (existingData) {
      const remoteData = await JSON.parse(existingData);
      return res.json({ checkbox: remoteData });
    } else {
      return res.json({ checkbox: new Array(CHECK_BOX).fill(false) });
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected`);

    socket.on("client:checkbox", async (data) => {
      const latestOperation = await redis.get(`${rateLimitingKey}:${socket.id}`);
      if (latestOperation) {
        const elapsedTime = Date.now() - latestOperation;
        if (elapsedTime < 5.5 * 1000) {
          socket.emit("server:rate-limit", { message: "Please wait." });
          return;
        }
      }
      await redis.set(`${rateLimitingKey}:${socket.id}`, Date.now());

      const existingData = await redis.get(REDIS_KEY);
      if (existingData) {
        const remoteData = JSON.parse(existingData);
        remoteData[data.id] = data.checked;
        await redis.set(REDIS_KEY, JSON.stringify(remoteData));
      } else {
        await redis.set(
          REDIS_KEY,
          JSON.stringify(new Array(CHECK_BOX).fill(false)),
        );
      }
      await publisher.publish("internal-server:checkbox", JSON.stringify(data));
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server is running http://localhost:${PORT}`);
  });
}

main();







