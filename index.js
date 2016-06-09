"use strict";

var http = require("http"),
    express = require("express"),
    socketio = require("socket.io"),
    game = require("./dist/server");

var app = express(),
    server = http.Server(app),
    io = socketio(server);

app.set('port', (process.env.PORT || 3000));

app.use(express.static('dist'));

io.on('connection', game);

server.listen(app.get('port'), function () {
    console.log("Server started");
});