var fs = require('fs'),
    async = require('async'),
    Mplayer = require('node-mplayer'),
    colors = require('colors');
    events = require('events');

var test_url = "http://s4-2.pleer.com/0457ffbee260579f742ec3e4cd02b43d90b2a2282aa19d8bb337548fec7fd102925f9b78647ea3de5f59cb9d2468805354bc0c573b9b2c43cc629651bf1eef7a0f7da56a552e104d6fa6b946d3/fdbe2e3058.mp3";


function isDir (path_string) {
    return fs.lstatSync(path_string).isDirectory();
}

function Butler () {
    this.song = 0;
    this.parsers = [];
    this.playlist = [];
    this.player = null;
    this.volume = 50;
    this.status = {
        fading: false
    };
    events.EventEmitter.call(this);
}

Butler.prototype.__proto__ = events.EventEmitter.prototype;

/**
 * Logging methods
 */
Butler.prototype.info = function (message, prefix) {
    prefix = prefix || "Info";
    console.log(colors.underline.green(prefix + ":") + " " + message);
}

Butler.prototype.warn = function (message) {
    console.log("Could be a problem:".underline.yellow + " " + message);
}

Butler.prototype.error = function (message) {
    console.log("What a shame:".underline.red + " " + message);
}

Butler.prototype.getAssistantLogger = function (name) {
    return function (message) {
        console.log((name + ":").underline.blue + " " + message);
    }
}


/**
 * Assistants methods
 */
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

/**
 * Parsing methods
 */
Butler.prototype.sortParsers = function () {
    function parserSort (a, b) {
        if (a.order < b.order) return -1;
        if (a.order > b.order) return 1;
        return 0;
    }
    this.parsers.sort(parserSort);
};

Butler.prototype.parse = function (input, done) {
    async.detectSeries(this.parsers, function (parser, callback) {
        parser.check(input, callback)
    }, (function (res) {
        if (typeof res === "undefined") {
            this.warn("This input could not be parsed: " + input);
            done(null);
        } else {
            this.info(res.type + " detected");
            res.func(input, done);
        }
    }).bind(this));
};

/**
 * Player methods
 */
 Butler.prototype.open = function () {
     this.player = new Mplayer(this.playlist[this.song]);
     this.player.on('error', this.error.bind(this));
     this.info("Playing at volume "+this.volume);
     this.player.play({
         volume: this.volume
     });
 };

Butler.prototype.play = function () {
    function c () {
        if (!this.playlist[this.song]) return;
        this.open();
        this.emit('butler:play');
    }
    if (this.player !== null) return this.player.stop(c.bind(this));
    return c.call(this);

};

Butler.prototype.playNumber = function (nb) {
    if (this.playlist[nb]) {
        var vol = this.volume;
        this.stop((function () {
            this.song = nb;
            this.volume = vol;
            this.play();
        }).bind(this));
    }
}

Butler.prototype.nextone = function () {
    this.info("Next song");
    this.playNumber(this.song + 1);
};
Butler.prototype.prevone = function () {
    this.info("Previous song");
    this.playNumber(this.song - 1);
};

Butler.prototype.pause = function () {
    this.player.pause();
};

Butler.prototype.toggle = Butler.prototype.pause;

Butler.prototype.stop = function (callback) {
    if (this.player !== null) {
        this.fadeVolume(0, 10, 50, (function () {
            this.player.stop();
            this.player.on('end', (function () {
                this.player = null;
                callback();
            }).bind(this));
        }).bind(this));
    } else {
        callback();
    }
};

Butler.prototype.setVolume = function (volume) {
    this.volume = Math.min(100,Math.max(0,volume));
    if (this.player !== null) {
        this.player.setVolume(this.volume);
    }
}

Butler.prototype.fadeVolume = function (to, step, smoothing, callback) {
    this.status.fading = true;
    to = Math.min(100, Math.max(0, to));
    // Current volume is not in the step window
    if (this.volume <= to - step || this.volume >= to + step) {
        var dir = 1;
        if (to < this.volume) dir = -1
        this.setVolume(this.volume + (dir*step));
        setTimeout(this.fadeVolume.bind(this, to, step, smoothing, callback), smoothing);
    } else {
        callback = callback || function () {};
        this.setVolume(to);
        this.status.fading = false;
        this.emit('butler:fadeend');
        callback();
    }
}

Butler.prototype.volumeUp = function () {
    if (this.status.fading) {
        this.on('butler:fadend', this.volumeUp.bind(this));
        return;
    }
    this.info("Volume up");
    this.fadeVolume(this.volume + 5, 2, 50);
}

Butler.prototype.volumeDown = function () {
    if (this.status.fading) {
        this.on('butler:fadend', this.volumeDown.bind(this));
        return;
    }
    this.info("Volume down");
    this.fadeVolume(this.volume - 5, 2, 50);
}

/**
 * Playlist methods
 */
Butler.prototype.playNext = function (url) {
    this.parse(url, (function (parsed) {
        if (parsed !== null) {
            this.playlist.splice(this.song + 1, 0, parsed);
        }
    }).bind(this));
};

Butler.prototype.queue = function (url) {
    this.parse(url, (function (parsed) {
        if (parsed !== null) {
            this.playlist.push(parsed);
            this.info("Music added to queue");
        }
    }).bind(this));
};

var butler = new Butler();
butler.hireAssistants(function () {
    butler.sortParsers();
    butler.queue(test_url);
    butler.queue("../door/song.mp3");
    butler.queue("fobgofjdsbglsfndmg");
    butler.queue("https://www.youtube.com/watch?v=NlmezywdxPI");
    butler.play();
});


process.on('exit', function () {
    butler.player.stop();
});
