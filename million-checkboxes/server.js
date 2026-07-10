import http from 'node:http';
import path from 'node:path';

import express from 'express';
import { Server } from 'socket.io';

const CHECK_BOX = 100;
const store = {
  checkbox : new Array(CHECK_BOX).fill(false)
}

async function main(){

  const PORT = process.env.PORT ?? 8000;
  const app = new express();

  const httpServer = http.createServer(app);
  const io = new Server();
  
  io.attach(httpServer)
  
  app.use(express.static(path.resolve('./public')))
  app.get('/health', (req, res) => {
    res.send({'type': 'health-check'});
  })
  app.get('/checkboxes', (req, res) => {
    return res.json({checkbox: store.checkbox});
  })


  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`);

    socket.on('client:checkbox', (data) => {
      const {id, checked} = data;
      store.checkbox[id] = checked;
      io.emit('server:checkbox', data);
    })

  })

  httpServer.listen(PORT, () => {
    console.log(`Server is running http://localhost:${PORT}`)
  })

}

main();