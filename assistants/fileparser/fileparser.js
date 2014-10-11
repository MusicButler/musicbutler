var fs = require('fs');
function fileParser (input, done) {
    return done(fs.existsSync(input) ? input : false);
}
function test (input, done) {
    return done(fs.existsSync(input));
}
module.exports = function (butler, done) {
    butler.parsers.push({order: 100, check: test, func: fileParser, type: "File"});

    done({name: "File parser"});
}
