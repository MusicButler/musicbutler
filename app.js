var Butler = require('./lib/butler');
var AssistantLoader = require('./lib/assistants');

var test_url = "http://s4-2.pleer.com/0457ffbee260579f742ec3e4cd02b43d90b2a2282aa19d8bb337548fec7fd102925f9b78647ea3de5f59cb9d2468805354bc0c573b9b2c43cc629651bf1eef7a0f7da56a552e104d6fa6b946d3/fdbe2e3058.mp3";


var butler = new Butler();
var assLoader = new AssistantLoader(butler);
assLoader.init();
assLoader.hireAssistants(function () {
    butler.sortParsers();
    butler.queue({url: "https://www.youtube.com/watch?v=NlmezywdxPI"});
    butler.queue({url: "https://www.youtube.com/watch?v=ab9176Srb5Y"});
    butler.queue({url: "https://www.youtube.com/watch?v=j5-yKhDd64s"});
    butler.queue({url: "https://www.youtube.com/watch?v=RSdKmX2BH7o"});
    butler.queue({url: "https://www.youtube.com/watch?v=rjFaenf1T-Y"});
    butler.queue({url: "https://www.youtube.com/watch?v=0jfU7pw76ZE"});
});


process.on('SIGINT', function () {
    butler.kill();
    process.exit();
});
