var regex = require('./urlregex').regex;

function defaultParser (input, done) {
    return done(input.match(regex) ? input : false);
}

function test (input, done) {
    return done(input.match(regex));
}

module.exports = function (player, done) {
    player.parsers.push({order: 99, check: test, func: defaultParser, type: "URL"});
    done({name: "Default Parser"});
}
