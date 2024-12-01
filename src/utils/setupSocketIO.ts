import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import log from "./logger";
export function setupSocketIO(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.ORIGIN,
    },
  });

  io.on("connection", (socket) => {
    log.info(`${socket.id} client has connected`);
  });
  io.on("disconnect", (socket) => {
    log.info("disconnected " + socket.id);
  });
  return io;
}
