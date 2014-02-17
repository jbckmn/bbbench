
/*
 * socket.io routing
 */

var fs = require('fs')
    , config = JSON.parse(fs.readFileSync('./config.json'))
    , passport = require('passport')
    , moment = require('moment')
    , User = require('../models/user')
    , Bench = require('../models/bench');

module.exports = function (app, io) {

  io.sockets.on('connection', function (socket) {

    socket.on('findPlayerBenches', function (data) {
      Bench.findPlayerBenches(data, io);
    });

    socket.on('addPlayersToBench', function (data) {
      Bench.addPlayers(data, io);
    });

    socket.on('removePlayerFromBench', function (data) {
      Bench.removePlayer(data, io);
    });

    socket.on('setBenchCaptain', function (data) {
      Bench.setCaptain(data, io);
    });

  });

};