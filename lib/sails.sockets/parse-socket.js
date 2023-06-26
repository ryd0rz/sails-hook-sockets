module.exports = function (app){
  return function parseSocket(socket){

    // If the thing passed in looks like `req`, not a socket, then use its
    // req.socket instead if possible.
    if (socket && socket.socket && socket.socket.join && socket.socket.emit && socket.end) {
      socket = socket.socket;
    }

    // Check for header-based socket Ids
    if (socket && socket.headers && socket.headers.socketId) {
      socket= _.filter(Array.from(app.io.sockets), x => {
        return x[0] === socket.headers.socketId;
      })[0][1];
    }

    // Make sure the thing is a socket
    if (socket && socket.emit && socket.join && socket.leave) {
      return socket;
    }

    // Otherwise return undefined.
    return undefined;
  };
};
