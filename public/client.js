"use strict";

(function () {

    var socket;
    var canvas = document.getElementById('gameBoard');
    var guessLogList = document.getElementById('guessLogList');
    var scoreList = document.getElementById('scoreList');
    var canvasPressed = false, drawLock = true;
    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    var initClientX, initClientY;

    function setConnectionStatus(message) {
        var connectionStatus = document.getElementById('connectionStatus');
        connectionStatus.innerText = message;
    }

    function setCurrentView(viewName) {
        var views = ['Join', 'Game', 'Result'];

        for(var i=0; i < views.length; i++) {
            var viewDisplay = 'none';
            if (views[i] === viewName) {
                viewDisplay = 'block'
            }
            document
                .getElementById('page' + views[i])
                .style.display = viewDisplay;
        }
    }

    function setVisibility(component, visibility) {
        component.style.display = visibility;
    }

    function bindConnectionEvents() {
        socket.on("connect", function () {
            setConnectionStatus('Have fun!')
        });

        socket.on("disconnect", function () {
            setConnectionStatus("Connection lost!");
        });

        socket.on("error", function () {
            setConnectionStatus("Connection error!");
        });
    }

    function bindGameEvents() {
        socket.on('gameStart', function (payload) {
            console.log(payload);
            var playersList = document.getElementById('playersList');
            for (var i = 0; i < payload.players.length; i++) {
                var user = payload.players[i];
                var ele = document.createElement('li');
                ele.innerText = user.name + ' [ ' + user.score + ' ] ';
                ele.id = 'player' + user.id;
                playersList.appendChild(ele);
            }
            if (payload.word) {
                drawLock = false;
                document.getElementById('help').innerHTML = 'Draw <b>' + payload.word + '</b>';
                setVisibility(document.getElementById('guessComponent'), 'none');
            } else {
                drawLock = true;
                setVisibility(document.getElementById('guessComponent'), 'block');
            }
        });

        var remoteMousePressed = false;
        socket.on('draw-mousedown', function (evt) {
            console.log('draw event', evt);
            remoteMousePressed = true;
            ctx.beginPath();
            ctx.moveTo(evt.clientX - rect.left, evt.clientY - rect.top);
        });
        socket.on('draw-mouseup', function (evt) {
            console.log('draw event', evt);
            remoteMousePressed = false;
        });
        socket.on('draw-mousemove', function (evt) {
            console.log('draw event', evt);
            if (remoteMousePressed) {
                ctx.lineTo(evt.clientX - rect.left, evt.clientY - rect.top);
                ctx.moveTo(evt.clientX - rect.left, evt.clientY - rect.top);
                ctx.stroke();
            }
        });
        socket.on('guess-correct', function (payload) {
            console.log('correct', payload);
            var ele = document.createElement('li');
            ele.innerHTML = payload.by  + ' found the lost object (+1)';
            document.getElementById('player' + payload.byId).innerText = payload.by + ' [ ' + payload.score + ' ] ';
            guessLogList.appendChild(ele);
            setVisibility(document.getElementById('guessComponent'), 'none');
        });
        socket.on('guess-wrong', function (payload) {
            console.log('wrong', payload);
            var ele = document.createElement('li');
            ele.innerHTML = 'Wrong guess <b>' + payload.word + '</b> by ' + payload.by;
            guessLogList.appendChild(ele);
        });
        socket.on('game-end', function (payload) {
            console.log('game-end', payload);
            setCurrentView('Result');
            for (var i = 0; i < payload.players.length; i++) {
                var player = payload.players[i];
                var ele = document.createElement('li');
                ele.innerHTML = player.name + ' - ' + player.score;
                scoreList.appendChild(ele);
            }
        });
    }

    window.joinGame = function(username) {
        socket.emit('join', {username: username});
        setCurrentView('Game');
    };

    window.guessWord = function(word) {
        socket.emit('guess', {word: word});
    };
    
    canvas.addEventListener('mousedown', function (evt) {
      console.log('event mousedown', evt);
      if (drawLock) return;
      canvasPressed = true;
      ctx.beginPath();
      ctx.moveTo(evt.clientX - rect.left, evt.clientY - rect.top);
      socket.emit('draw-mousedown', { clientX: evt.clientX, clientY: evt.clientY});
    });
    
    canvas.addEventListener('mouseup', function (evt) {
      console.log('event mouseup', evt);
      if (drawLock) return;
      canvasPressed = false;
      socket.emit('draw-mouseup', {});
    });
    
    canvas.addEventListener('mousemove', function (evt) {
      console.log('event mousemove', evt);
      if (drawLock) return;
      if (canvasPressed) {
        ctx.lineTo(evt.clientX - rect.left, evt.clientY - rect.top);
        ctx.moveTo(evt.clientX - rect.left, evt.clientY - rect.top);
        ctx.stroke();
        socket.emit('draw-mousemove', { clientX: evt.clientX, clientY: evt.clientY});
      }
    });
    /**
     * Client module init
     */
    function init() {
        setCurrentView('Join');
        setConnectionStatus('Initializing game...');
        socket = io({ upgrade: false, transports: ["websocket"] });
        bindConnectionEvents();
        bindGameEvents();
    }

    window.addEventListener("load", init, false);

})();
