var SpriteGenerator,
	fs = require('fs'),
	red = '\u001b[31m',
	blue = '\u001b[34m',
	cyan = '\u001b[36m',
	reset = '\u001b[0m',
	under = '\u001b[90m';

String.prototype.replaceToken = function(object) {
	return this.replace(/\{([a-zA-Z]+)\}/g, function (m, key) {
		return (key in object) ? object[key] : m;
	});
};

SpriteGenerator = (function() {
	var cssTemplate = "\
.{name} {\
	width: {width}px;\
	height: {height}px;\
	background-image: url(\"{logoPath}{logoName}\");\
}\
.{name}-sprite {\
	width: {width}px;\
	height: {height}px;\
	background-position: 0 -{pos}px;\
}",
		cssFooterTemplate = "\
/* Default classes */\
[class*=\"{prefix}\"] {\
	display: block;\
	overflow: hidden;\
	background-repeat: no-repeat;\
	background-image: none;\
	text-indent: -9999px;\
}\
[class*=\"{prefix}\"][class*=-sprite] {\
	background-image: url(\"{spriteUrl}\");\
}",
		exclude = [
			"dr.dk/external/ritzau/channel/r367"//,  DR Mama

		];

	/* EPG
	*/


	function SpriteGenerator(epgFeedUrl, options) {
		this.pageResult = this.pageResult.bind(this);
		this.didWrite = this.didWrite.bind(this);
		this.epgRequestCallback = this.epgRequestCallback.bind(this);
		var host,
			_this = this;
		this.start = +new Date();
		this.options = options || {};
		this.done = this.options.done;
		this.grunt = this.options.grunt;
		this.grunt.log.writeln("" + under + ">>" + reset + " Generating Ritzau logos + sprite ...");
		this.epgFeedUrl = epgFeedUrl;
		fs.mkdir(this.options.files.logos, function(error) {});
		host = require("url").parse(this.epgFeedUrl).hostname;
		require('dns').lookup(host, function(error) {
			if (error) {
				_this.grunt.log.error("Could not connect to EPG. Check intranet connectivity.");
				_this.grunt.errorCount++;
			} else {
				fs.readdir(_this.options.files.logos, function(error, list) {
					list.forEach(function (file) {
						file = "" + _this.options.files.logos + "/" + file;
						stat = fs.statSync(file);
						if (!stat.isDirectory()) {
							fs.unlink(file);
						}
					});
					_this.epgRequest();
				});
			}
		});
	}

	/* EPG
	*/


	SpriteGenerator.prototype.epgRequest = function() {
		var XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;
		this.client = new XMLHttpRequest();
		this.client.open("GET", this.epgFeedUrl);
		this.client.addEventListener("load", this.epgRequestCallback, false);
		this.client.send();
	};

	SpriteGenerator.prototype.epgRequestCallback = function() {
		var data,
			_this = this,
			parseXml = require('xml2js').parseString;
		data = this.client.response;
		parseXml(data, function(error, result) {
			if ((result != null) && result instanceof Object) {
				//fs.writeFileSync("json-data.json", JSON.stringify(result));
				_this.channels = result["m_lcha:message"].channels.pop().channel;
				_this.parseChannels();
			}
		});
	};

	/* Channel parsing
	*/

	SpriteGenerator.prototype.parseChannels = function() {
		var _this = this;
		this.downloadedImages = 0;
		this.parsedImages = 0;
		this.totalImages = 0;
		this.channels = this.channels.filter(function (channel) {
			return channel.dr_channel != "TRUE" && channel.www_url != "http://www.dr.dk" && channel.name[0].indexOf("DR ") != 0;
		});
		this.channels.sort(function (a, b) {
			if (a.name > b.name) {
				return 1;
			}
			if (a.name < b.name) {
				return -1;
			}
			// a must be equal to b
			return 0;
		});
		this.channels.forEach(function (channel) {
			channel.ident = channel.source_url.toString().split("/").pop().toLowerCase();
			channel.images = [];
			channel.imageUrls = [];
			["logo_16", "logo_32", "logo_50"].forEach(function (prop) {
				var logo = channel[prop];
				if (logo) {
					channel.imageUrls.push(logo.toString());
				}
			});
			_this.totalImages += channel.imageUrls.length;
		});
		this.parseImages();
	};

	/* Image parsing
	*/


	SpriteGenerator.prototype.parseImages = function() {
		var _this = this;
		this.channels.filter(function(channel) {
			return channel.imageUrls && channel.imageUrls.length > 0;
		}).forEach(function (channel) {
			channel.images = channel.imageUrls.slice(0);
		});
		this.generateSprite();
	};

	SpriteGenerator.prototype.generateSprite = function() {
		var html, ws,
			phantomjs = require("phantomjs").path,
			exec = require("child_process").exec,
			path = require("path"),
			_this = this,
			options = {
				channels: _this.channels
			};

		html = "\
<style>\
	* {\
		padding: 0;\
		margin: 0;\
	}\
	img {\
		display: none;\
	}\
</style>\
<script>\
	var options = " + JSON.stringify(options) + ";\
</script>\
<canvas id=\"sprite\"></canvas>";


		this.channels.forEach(function (channel) {
			if (channel.images && channel.images.length > 0) {
				channel.images.forEach(function (url) {
					html += "<img src=\"" + url + "\" data-ident=\"" + channel.ident + "\" />";
				});
			}
		});

		html += "<script src=\"phantom-page-script.js\"></script>";
		this.temp = ("" + __dirname + "/temp.html").replace(/\\/g, "/");
		fs.writeFileSync(this.temp, html);

		var script = path.join(__dirname, "phantom-script.js"),
			args = [phantomjs, script, this.temp, this.options.files.sprite, _this.options.files.logos + "/" + this.options.css.logoPrefix + "-{id}.png"].join(" ");

		var pjs = exec(args, {
				cwd: __dirname,
				//timeout: 5000,
				maxBuffer: 2000*1024 // png data gets quite large
			}, function (error, stdout, stderr) {
			if (error) {
				console.error("Error", error);
			}
			else if (stderr) {
				console.error("Stderr", stderr);
			}
			else if (stdout) {
				_this.pageResult(stdout);
			}
		});
	};


	SpriteGenerator.prototype.didWrite = function(error) {
		this.grunt.log.ok("Finished in " + (+new Date() - this.start) + "ms");
		this.done();
	};

	SpriteGenerator.prototype.pageResult = function(result) {
		var _this = this, css;
		result = JSON.parse(result);
		fs.unlink(this.temp);

		var filenamePrefix = _this.options.css.logoPrefix,
			logoPath = _this.options.css.logoPath;

		css = cssFooterTemplate.replaceToken({
			spriteUrl: this.options.css.spritePath,
			prefix: this.options.css.logoPrefix
		});

		result.forEach(function (logo) {
			css += "\n\n" + cssTemplate.replaceToken({
				name: "" + filenamePrefix + "-" + logo.id,
				width: logo.width,
				height: logo.height,
				pos: logo.top,
				logoName: "" + filenamePrefix + "-" + logo.id + ".png",
				logoPath: logoPath
			});
		});

		fs.writeFile(this.options.files.stylesheet, css, this.didWrite);
	};

	return SpriteGenerator;

})();

module.exports = {
	SpriteGenerator: SpriteGenerator
};
