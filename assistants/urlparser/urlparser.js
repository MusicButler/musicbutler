var regex = require('./urlregex').regex;

function defaultParser (song, done) {
    return done(song.url.match(regex) ? song : false);
}

function test (song, done) {
    return done(song.url.match(regex));
}

module.exports = function (player, done) {
    player.parsers.push({order: 99, check: test, func: defaultParser, type: "URL"});
    done({name: "Default Parser"});
}
