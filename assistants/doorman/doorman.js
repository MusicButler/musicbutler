var gpio = require('node-gpio');
var GPIO = gpio.GPIO;
var CapacitiveTouch = gpio.CapacitiveTouch;

module.exports = function (butler, done) {

    var that = this;
    this.log = butler.getAssistantLogger("Doorman");

    var status = "waiting";
    var paul = "inside";
    var start = null;
    var end = null;
    var diff = 0;

    function togglePaul() {
        paul = paul === "inside" ? "outside" : "inside";
        that.log("Paul is " + paul);
    }

    var handle = new CapacitiveTouch("24", "25");
    handle.open();
    handle.threshold = 1000;

    /*while (true) {
        console.log(handle.getSample(10));
    }*/

    handle.on("changed", function (data) {
        if(data.value) {
            start = new Date();
        } else {
            end = new Date();
            if (start !== null) {
                diff = end.getTime() - start.getTime();
                if (diff < 1000) {
                    butler.toggle();
                    return;
                }
            }
            start = null;
            end = null;
        }
        if (status === "waiting") {
            if (data.value) {
                // The door is closed and someone touches the handle
                status = "processing";
            } else if (status === "processing") {

            }
        } else if (status === "processing") {
            if (data.value) {

            } else {
                if (diff < 3000 && paul === "inside") {
                    that.log("stop: " + diff);
                    // will change in the future
                    butler.pause();
                } else {
                    that.log("play: " + diff);
                    // will hcnage in the future
                    butler.pause();
                }
                status = "waitingsecondtouch";
            }
        } else if (status === "waitingsecondtouch") {
            if (!data.value) {
                togglePaul();
                status = "waiting";
            }
        }

    });
    var tolerence = 50;
    handle.listen(tolerence);

    return done({name: "Doorman"});

}
