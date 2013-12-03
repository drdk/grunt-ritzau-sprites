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
				fs.writeFileSync("json-data.json", JSON.stringify(result));
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
			return channel.type == "tv" && channel.dr_channel != "TRUE" && channel.www_url != "http://www.dr.dk" && channel.name[0].indexOf("DR ") != 0;
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
				 	if (logo.toString().match(/\.(?:gif|png|jpe?g)$/)) {
						channel.imageUrls.push(logo.toString());
					}
					else {
						console.log("Invalid image extension for " + cyan + channel.name + reset + " " + under + "(" + channel.ident + ")" + reset + " - skipping");
					}
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
			channel.imageUrls.forEach(function (url, index) {
				_this.downloadImages(channel, url, index);
			});
		});
	};

	SpriteGenerator.prototype.downloadImages = function(channel, url, i) {
		var _this = this,
			http = require('http'),
			suffix = url.replace(/^.*?(\.[a-z]+|)$/, "$1"),
			filename = "" + this.options.files.logos + "/" + this.options.files.logoPrefix + "-" + channel.ident + "-temp" + i + (suffix || ".png");
		
		http.get(url, function(response) {
			if (!(response.statusCode >= 200 && response.statusCode < 400)) {	
				console.log("Failed to download sprite " + cyan + url + reset + " " + under + "(" + channel.ident + ")" + reset + " -- Status code: " + response.statusCode);
				filename += ".404.png";
			}
			response.pipe(fs.createWriteStream(filename)).on("close", function() {
				_this.totalImages--;
				channel.images.push({
					filename: filename,
					url: url,
					dimensions: null,
					dimensionSum: 0
				});
				if (!_this.totalImages) {
					_this.generateSprite();
				}
			});
		});
	};

	SpriteGenerator.prototype.generateSprite = function() {
		var html, ws,
			phantomjs = require("phantomjs").path,
			exec = require("child_process").exec,
			path = require("path"),
			_this = this,
			options = {
				channels: _this.channels,
				cssTemplate: cssTemplate,
				logoPath: _this.options.css.logoPath,
				filenamePrefix: _this.options.css.logoPrefix
			};

		html = "\
<style>\
	* {\
		padding: 0;\
		margin: 0;\
	}\
</style>\
<script>\
	var options = " + JSON.stringify(options) + ";\
</script>\
<canvas id=\"sprite\"></canvas>";


		this.channels.forEach(function (channel) {
			if (channel.imageUrls && channel.imageUrls.length > 0) {
				channel.images.forEach(function (image) {
					var file = path.relative(__dirname, image.filename);
					html += "<img src=\"" + file.replace(/\\/g, "/") + "\" data-ident=\"" + channel.ident + "\" />";
				});
			}
		});

		html += "<script src=\"phantom-page-script.js\"></script>";
		this.temp = ("" + __dirname + "/temp.html").replace(/\\/g, "/");
		fs.writeFileSync(this.temp, html);

		var script = path.join(__dirname, "phantom-script.js"),
			args = [phantomjs, script, this.temp, this.options.files.sprite].join(" ");

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
		if (--this.jobs === 0) {
			this.grunt.log.ok("Finished in " + (+new Date() - this.start) + "ms");
			this.done();
		}
	};

	SpriteGenerator.prototype.pageResult = function(result) {
		var _this = this, css;
		result = JSON.parse(result);
		fs.unlink(this.temp);
		result.images.forEach(function(filename) {
			fs.renameSync(filename, filename.replace(/\-temp\d\./gi, "."));
		});
		this.jobs = 2;
		fs.readdir(this.options.files.logos, function(error, list) {
			list.forEach(function(file) {
				if (file.lastIndexOf("temp") > -1) {
					file = "" + _this.options.files.logos + "/" + file;
					stat = fs.statSync(file);
					if (!stat.isDirectory()) {
						fs.unlink(file);
					}
				}
			});
			_this.didWrite();
		});

		css = cssFooterTemplate.replaceToken({
			spriteUrl: this.options.css.spritePath,
			prefix: this.options.css.logoPrefix
		});
		css += result.css;
		fs.writeFile(this.options.files.stylesheet, css, this.didWrite);
	};

	return SpriteGenerator;

})();

module.exports = {
	SpriteGenerator: SpriteGenerator
};
