function parser (input) {
    console.log('dummy');
    return input;
}
module.exports = function (player, done) {
    player.parsers.push({order: 1, func: parser});
    done({name: "Dummy parser"});
}
