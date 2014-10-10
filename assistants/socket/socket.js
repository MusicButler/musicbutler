var http = require('http');
var fs = require('fs');
module.exports = function (butler, done) {

    var that = this;
    this.log = butler.getAssistantLogger("Sockets");


    var server = http.createServer(function (req, res) {
        fs.readFile(__dirname + "/index.html", "utf8", function (err, data) {
            res.end(data);
        });
    });

    var io = require('socket.io')(server);

    io.on('connection', (function (socket) {
        this.log('Client connected from ' + socket.handshake.address);
        socket.on('toggle', butler.toggle.bind(butler));
        socket.on('queue', butler.queue.bind(butler));
        socket.on('nextone', butler.next.bind(butler));
        socket.on('disconnect', function () {
            that.log('Client disconnected from ' + socket.handshake.address);
            this.removeAllListeners();
        });
        socket.on('error', function (err) {
            butler.error(err);
        });
    }).bind(this));
    io.on('error', function (err) {
        bulter.error(err);
    });

    server.listen(8008);

    return done({name: "Hermès"});
}
