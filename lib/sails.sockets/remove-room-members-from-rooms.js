/**
 * Module dependencies
 */

var _ = require('lodash');
var async = require('async');


module.exports = function(app) {

  /**
   * Unsubscribe all sockets from sourceRoom from destRooms
   *
   * @param  {String} sourceRoom   The room to get members of
   * @param  {String} destRoom The rooms to unsubscribe the members of sourceRoom from
   * @param  {Function} cb Optional callback to call after leave is completed
   */

  return function removeRoomMembersFromRooms (sourceRoom, destRooms, cb) {

    // Make cb optional
    cb = cb || function(){};

    // Make sure "sourceRoom" is a string
    if (!_.isString(sourceRoom)) {
      if (!cb) {app.log.error("Non string value used as `sourceRoom` argument in `removeRoomMembersFromRooms`: ", sourceRoom);}
      return cb(new Error("Non string value used as `sourceRoom` argument in `removeRoomMembersFromRooms`"));
    }

    // Ensure that destRooms is an array
    if (!_.isArray(destRooms)) {
      destRooms = [destRooms];
    }

    // If we were sent a socket ID as a room name, and the socket happens to
    // be connected to this server, take a shortcut
    if (_.find(Array.from(app.io.sockets.sockets), ([mapKey]) => mapKey == sourceRoom)) {
      return doLeave(_.find(Array.from(app.io.sockets.sockets), ([mapKey]) => mapKey == sourceRoom), cb);
    }

    // Broadcast an admin message telling all other connected servers to
    // run `removeRoomMembersFromRooms` with the same arguments, unless the
    // "remote" flag is set
    if (!this.remote) {
      app.hooks.sockets.broadcastAdminMessage('leave', {sourceRoom: sourceRoom, destRooms: destRooms});
    }

    // Look up all members of sourceRoom
    let sourceRoomSocketIds = Array.from(app.io.sockets.sockets.keys());
    return async.each(sourceRoomSocketIds, function(socketId, nextSocketId) {
      // Loop through the socket IDs from the room
      async.each(sourceRoomSocketIds, function(socketId, nextSocketId) {
        // Check if the socket is connected to this server (since .clients() may someday work cross-server)
        if (_.find(Array.from(app.io.sockets.sockets), ([mapKey]) => mapKey == socketId)) {
          // If so, unsubscribe it from destRooms
          return doLeave(_.find(Array.from(app.io.sockets.sockets), ([mapKey]) => mapKey == socketId)[1], nextSocketId);
        }
        // If not, just continue
        return nextSocketId();
      }, cb);
    });

    function doLeave(socket, cb) {
      return async.each(destRooms, function(destRoom, nextRoom) {
        // Ensure destRoom is a string
        if (!_.isString(destRoom)) {
          app.log.warn("Skipping non-string value for room name to add in `removeRoomMembersFromRooms`: ", destRoom);
          return nextRoom();
        }
        return socket.leave(destRoom, nextRoom);
      }, cb);
    }

  };

};