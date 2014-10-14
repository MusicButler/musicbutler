var fs = require('fs');
function fileParser (song, done) {
    return done(fs.existsSync(song.url) ? song : false);
}
function test (song, done) {
    return done(fs.existsSync(song.url));
}
module.exports = function (butler, done) {
    butler.parsers.push({order: 100, check: test, func: fileParser, type: "File"});

    done({name: "File parser"});
}
