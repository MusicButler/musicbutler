var async = require('async'),
    GBlaster = require('node-ghettoblaster'),
    colors = require('colors'),
    events = require('events');

function Butler () {
    this.song = 0;
    this.parsers = [];
    this.playlist = [];
    this.notifiers = [];
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

Butler.prototype.notify = function (message, info) {
    message = 'butler:' + message;
    this.emit(message, info);
    for (var i in this.notifiers) {
        this.notifiers[i](message, info);
    }
}

Butler.prototype.notifyPlayingStatus = function () {
    this.notify("playing", this.playing());
}

/**
 * Player methods
 */
 Butler.prototype.open = function () {
     this.player = new GBlaster(this.playlist[this.song]);
     this.player.on('error', this.error.bind(this));
     this.player.on('resumed', this.notifyPlayingStatus.bind(this));
     this.player.on('paused', this.notifyPlayingStatus.bind(this));
     this.info("Playing at volume "+this.volume);
     this.player.play({
        volume: this.volume
     });
     this.player.on('ended', (function () {
        this.nextone();
    }).bind(this));
 };

Butler.prototype.play = function () {
    if (this.player !== null) return this.player.stop(this.play.bind(this));    // If the player is still runnning, better stop it before
    if (!this.playlist[this.song]) return;
    this.open();
    this.notifyPlayingStatus();
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

Butler.prototype.resume = function () {
    this.player.resume();
};

Butler.prototype.toggle = function () {
    this.player.toggle();
};

Butler.prototype.stop = function (callback) {
    callback = callback || function (){};
    if (this.player !== null) {
        this.fadeVolume(0, 10, 50, (function () {
            this.player.on('stopped', (function () {
                this.player = null;
                callback();
            }).bind(this));
            this.player.stop();
        }).bind(this));
    } else {
        callback();
    }
};

Butler.prototype.playing = function () {
    if (this.player !== null)
        return this.player.playing;
    return false;
}

Butler.prototype.kill = function () {
    this.player.stop();
}

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
        this.notify('fadeend');
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

module.exports = Butler;
