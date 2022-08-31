const SocketIO = require('socket.io');

const socket = (server: any) => {
  const io = SocketIO(server, {
    path: '/socket.io',
  });
  io.on('connection', (socket: any) => {
    const req = socket.request;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('새로운 클라이언트 접속', ip, socket.id);

    socket.on('feed-uploaded', (data: { id: number }) => {
      io.emit('feed-uploading', data.id);
      console.log('업로드했습니다!', data.id);
    });

    socket.on('error', (error: Error) => {
      console.error(error);
    });

    socket.on('disconnect', () => {
      console.log('클라이언트 접속 해제', ip, socket.id);
    });
  });
};
export default socket;
