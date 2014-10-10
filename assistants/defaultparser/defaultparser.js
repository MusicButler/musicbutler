function defaultParser (input) {
    return input;
}

module.exports = function (player, done) {
    player.parsers.push({order: 99, func: defaultParser});
    done({name: "Default Parser"});
}
