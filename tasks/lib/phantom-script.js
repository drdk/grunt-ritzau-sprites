var fs = require("fs"),
	webpage = require("webpage"),
	system = require("system");

phantom.onError = function (msg, trace) {
	var msgStack = ["PHANTOM ERROR: " + msg];
	if (trace && trace.length) {
		msgStack.push("TRACE:");
		trace.forEach(function (t) {
			Stack.push(" -> " + (t.file || t.sourceURL) + ": " + t.line + (t.function ? " (in function " + t.function + ")" : ""));
		});
	}
	system.stderr.write(msgStack.join("\n"));
	phantom.exit(1);
};

var url = system.args[1],
	output = system.args[2],
	page = webpage.create();

page.onCallback = function (response) {

	var size = page.evaluate(function () {
		return {width: sprite.offsetWidth, height: sprite.offsetHeight};
	});

	page.viewportSize = size;

	page.render(output);
	page.close();
	system.stdout.write(response);
	phantom.exit();

};

page.open(url);