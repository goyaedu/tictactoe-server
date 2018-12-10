const uuidv4 = require('uuid/v4');

module.exports = function(server) {

    // 방 정보
    var rooms = [];

    var io = require('socket.io')(server, {
        transports: ['websocket'],
    });

    io.on('connection', function(socket) {
        console.log('Connected: ' + socket.id);

        if (rooms.length > 0) {
            var rId = rooms.shift();
            socket.join(rId, function() {
                socket.emit('joinRoom', { room: rId });
                io.to(rId).emit('startGame');
            });
        } else {
            var roomName = uuidv4();
            socket.join(roomName, function() {
                socket.emit('createRoom', { room: roomName });
                rooms.push(roomName);
            });
        }

        socket.on('disconnecting', function(reson) {
            console.log('Disconnected: ' + socket.id);

            var socketRooms = Object.keys(socket.rooms).filter(item => item != socket.id);
            console.dir(socketRooms);

            socketRooms.forEach(function(room) {
                socket.broadcast.to(room).emit('exitRoom');

                // 혼자 만든 방의 유저가 disconnect 되면 해당 방 제거
                var idx = rooms.indexOf(room);
                if (idx != -1)
                {
                    rooms.splice(idx, 1);
                }
            });
        });

        socket.on('doPlayer', function(playerInfo) {

            var roomId = playerInfo.room;
            var cellIndex = playerInfo.position;

            socket.broadcast.to(roomId).emit('doOpponent',
            { position: cellIndex });
            
        });

        socket.on('message', function(msg) {
            console.dir(msg);
            socket.broadcast.emit('chat', msg);
        });
    });
};
