var Butler = require('./lib/butler');
var AssistantLoader = require('./lib/assistants');

var test_url = "http://s4-2.pleer.com/0457ffbee260579f742ec3e4cd02b43d90b2a2282aa19d8bb337548fec7fd102925f9b78647ea3de5f59cb9d2468805354bc0c573b9b2c43cc629651bf1eef7a0f7da56a552e104d6fa6b946d3/fdbe2e3058.mp3";


var butler = new Butler();
var assLoader = new AssistantLoader(butler);
assLoader.init();
assLoader.hireAssistants(function () {
    butler.sortParsers();
    butler.queue({url: test_url});
    butler.queue({url: "../door/song.mp3", title: "Survival", artist: "Eminem", cover: "http://upload.wikimedia.org/wikipedia/en/4/43/Eminem_-_Survival_Artwork.jpg"});
    butler.queue({url: "https://www.youtube.com/watch?v=NlmezywdxPI"});
    butler.play();
});


process.on('SIGINT', function () {
    butler.kill();
    process.exit();
});
