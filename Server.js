
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('start game',function(){
    console.log('user started game');
  });
  socket.on('update ball position', function(x, y){
    console.log(x, y);
    //Body.setPosition(ball, {x: ball.position.x, y: ball.position.y});
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
