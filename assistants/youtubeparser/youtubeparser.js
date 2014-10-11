var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var request = require('request');
var youtubeRegex = new RegExp("(?:http|https|)(?::\/\/|)(?:www.|)(?:youtu\\.be\/|youtube\\.com(?:\/embed\/|\/v\/|\/watch\\?v=|\/ytscreeningroom\\?v=|\/feeds\/api\/videos\/|\/user\\S*[^\\w\\-\\s]|\\S*[^\\w\-\\s]))([\\w\\-]{11})[a-z0-9;:@#?&%=+\/\$_.-]*", 'i');
var youtubePrefix = "https://www.youtube.com/watch?v=";

function youtubeParser (input, done) {
    var parts = input.match(youtubeRegex);
    if (parts) {
        var id = parts[1];
        var yUrl = youtubePrefix + id;
        var processUrl = "";
        var location = "./cache/";
        var filename = location + id + ".mp3";
        if (fs.existsSync(filename)) {
            return done(filename);
        }
        butler.emit("youtubedl:startdownloading");
        var youtubeDl = spawn('youtube-dl', ["--extract-audio", "--audio-format", "mp3", yUrl, "-o", filename]);
        youtubeDl.on('error', function (err) {
            console.log(err);
            return done(false);
        });
        youtubeDl.on("exit", function (code) {
            butler.emit("youtubedl:downloaded");
            return done(filename);
        });
    } else {
        return done(false);
    }
}

function test (input, done) {
    return done(youtubeRegex.test(input));
}

module.exports = function (butler, done) {

    var avconv = spawn("avconv", []);
    avconv.on("error", function (err) {
        if (err.code === "ENOENT") {
            done(null);
        }
    });

    var ytdl = spawn("youtube-dl", ["--version"]);
    ytdl.on("error", function (err) {
        if (err.code === "ENOENT") {
            done(null);
        }
    });

    butler.parsers.push({
        order: 98,
        check: test,
        func: youtubeParser,
        type: "Youtube"});

    done({name: "Youtube parser"});
}
