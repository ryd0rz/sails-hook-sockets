module.exports = function (app){
  return function parseSocket(socket){

    // If the thing passed in looks like `req`, not a socket, then use its
    // req.socket instead if possible.
    if (socket && socket.socket && socket.socket.join && socket.socket.emit && socket.end) {
      socket = socket.socket;
    }

    // Check for header-based socket Ids
    if (socket && socket.headers && socket.headers.socketid) {
      const entry = _.find(Array.from(app.io.sockets.sockets), ([mapKey]) => mapKey == socket.headers.socketid)
      socket = entry ? entry[1] : undefined;
    }

    // Make sure the thing is a socket
    if (socket && socket.emit && socket.join && socket.leave) {
      return socket;
    }

    // Otherwise return undefined.
    return undefined;
  };
};
