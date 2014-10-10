var lame = require('lame'),
    Speaker = require('speaker'),
    http = require('http'),
    fs = require('fs'),
    async = require('async'),
    Mplayer = require('node-mplayer'),
    colors = require('colors');

var test_url = "http://s4-2.pleer.com/0457ffbee260579f742ec3e4cd02b43d90b2a2282aa19d8bb337548fec7fd102925f9b78647ea3de5f59cb9d2468805354bc0c573b9b2c43cc629651bf1eef7a0f7da56a552e104d6fa6b946d3/fdbe2e3058.mp3";


function isDir (path_string) {
    return fs.lstatSync(path_string).isDirectory();
}

function Butler () {
    this.song = 0;
    this.parsers = [];
    this.playlist = [];
    this.player = null;
}

Butler.prototype.info = function (message, prefix) {
    prefix = prefix || "Info";
    console.log(colors.underline.green(prefix + ":") + " " + message);
}

Butler.prototype.error = function (message) {
    console.log("What a shame:".underline.red + " " + message);
}

Butler.prototype.getAssistantLogger = function (name) {
    return function (message) {
        console.log((name + ":").underline.blue + " ");
        console.log(message);
    }
}

Butler.prototype.hireAssistants = function(callback) {
    fs.readdir('./assistants', (function (err, plugins) {
        if (err && err.errno === 34) {
            fs.mkdir('./assistants');
            return;
        }
        async.eachSeries(plugins, this.hireAssistant.bind(this), callback);
    }).bind(this));
};

Butler.prototype.hireAssistant  = function(path, callback) {
    if (isDir(__dirname + "/assistants/" + path)) {
        try {
            var pkg = require('./assistants/' + path + '/package.json');
        }catch (err) {
            this.error("Assistant " + path + " is not ready to work, he is missing his package.");
            return callback();
        }
        require("./assistants/" + path + "/" + pkg.main)(this, (function (info) {
            if(pkg.message) this.info(pkg.message, "Assistant");
            this.info(info.name + " ready to work", "Assistant");
            callback();
        }).bind(this));
    } else {
        callback();
    }
}

Butler.prototype.sortParsers = function () {
    function parserSort (a, b) {
        if (a.order < b.order) return -1;
        if (a.order > b.order) return 1;
        return 0;
    }
    this.parsers.sort(parserSort);
};

Butler.prototype.addParser = function (parser) {
    this.parsers.push(parser);
}

Butler.prototype.parse = function (input) {
    for (var i in this.parsers) {
        var res = this.parsers[i].func(input);
        if (res) return res;
    }
};

Butler.prototype.play = function () {
    if (this.player !== null) this.player.stop();
    if (!this.playlist[this.song]) return;
    this.open();
};

Butler.prototype.playNext = function (url) {
    this.playlist.splice(this.song + 1, 0, this.parse(url));
};

Butler.prototype.queue = function (url) {
    this.playlist.push(this.parse(url));
    this.info("Music added to queue");
};

Butler.prototype.next = function () {
    console.log("next");
    this.stop();
    if (this.playlist[this.song + 1]) {
        console.log('nextforsure');
        this.song++;
        this.play();
    }
};

Butler.prototype.pause = function () {
    this.player.pause();
};

Butler.prototype.toggle = Butler.prototype.pause;

Butler.prototype.stop = function (callback) {
    if (this.player) this.player.stop();
    //this.player = null;
};

Butler.prototype.open = function () {
    this.player = new Mplayer(this.playlist[this.song]);
    this.player.on('error', this.error.bind(this));
    this.player.on('end', this.error.bind(this));
    this.player.play();
};


var butler = new Butler();
butler.hireAssistants(function () {
    butler.sortParsers();
    butler.queue(test_url);
    butler.play();
    /*setTimeout((function () {
        this.pause();
        setTimeout(this.pause.bind(this), 3000);
    }).bind(butler), 5000);*/
});


process.on('exit', function () {
    butler.stop();
});
