var IR = require('node-ir');
var binding = require(__dirname + '/config/binding.json');

module.exports = function (butler, done) {

    this.log = butler.getAssistantLogger("IR Penguin");

    var ir = new IR(binding);
    ir.on('playpause', butler.toggle.bind(butler));
    ir.on('next', butler.nextone.bind(butler));
    ir.on('prev', butler.prevone.bind(butler));
    ir.on('up', butler.volumeUp.bind(butler));
    ir.on('down', butler.volumeDown.bind(butler));
    ir.on('stop', butler.stop.bind(butler));

    return done({name: "IR Penguin"});
}
