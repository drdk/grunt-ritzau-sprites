// Generated by CoffeeScript 1.6.3
var SpriteGenerator, XMLHttpRequest, blue, cyan, evaluation, fs, http, parseXml, phantom, red, reset, under,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

evaluation = function(options) {
  var canvas, channel, channels, css, cssTemplate, ctx, filenamePrefix, height, image, imgs, largestImageWithIdent, logoPath, moo, offset, result, width, _i, _j, _len, _len1;
  cssTemplate = options.cssTemplate;
  channels = options.channels;
  logoPath = options.logoPath;
  filenamePrefix = options.filenamePrefix;
  moo = [];
  String.prototype.replaceObject = function(obj) {
    var key, re, result;
    result = this;
    for (key in obj) {
      re = new RegExp("{" + key + "}", "g");
      result = result.replace(re, obj[key]);
    }
    return result;
  };
  largestImageWithIdent = function(ident) {
    var image, images, maxWidth, result, _i, _len;
    maxWidth = 0;
    images = document.querySelectorAll("img");
    result = null;
    for (_i = 0, _len = images.length; _i < _len; _i++) {
      image = images[_i];
      if (image.getAttribute("data-ident") !== ident) {
        continue;
      }
      if (image.width > maxWidth) {
        maxWidth = image.width;
        result = image;
      }
    }
    return result;
  };
  width = 0;
  height = 0;
  css = "";
  imgs = [];
  for (_i = 0, _len = channels.length; _i < _len; _i++) {
    channel = channels[_i];
    image = largestImageWithIdent(channel.ident);
    if (image) {
      if (!(image.height >= 30)) {
        moo.push(channel.ident);
      }
      channel.spriteImage = image;
      if (!(width >= image.width)) {
        width = image.width;
      }
      height += image.height;
    }
  }
  canvas = document.getElementById("sprite");
  ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  offset = 0;
  for (_j = 0, _len1 = channels.length; _j < _len1; _j++) {
    channel = channels[_j];
    if (!channel.spriteImage) {
      continue;
    }
    ctx.drawImage(channel.spriteImage, 0, offset);
    imgs.push(channel.spriteImage.src.replace("file://", ""));
    offset += channel.spriteImage.height;
    css += "\n\n" + cssTemplate.replaceObject({
      name: "" + filenamePrefix + "-" + channel.ident,
      width: channel.spriteImage.width,
      height: channel.spriteImage.height,
      pos: offset - channel.spriteImage.height,
      logoName: "" + filenamePrefix + "-" + channel.ident + ".png",
      logoPath: logoPath
    });
  }
  result = {
    sprite: JSON.stringify(canvas.toDataURL({
      format: "png"
    })),
    css: css,
    width: width,
    height: height,
    images: imgs
  };
  return result;
};

XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;

fs = require('fs');

parseXml = require('xml2js').parseString;

http = require('http');

phantom = require("node-phantom");

red = '\u001b[31m';

blue = '\u001b[34m';

cyan = '\u001b[36m';

reset = '\u001b[0m';

under = '\u001b[90m';

String.prototype.replaceObject = function(obj) {
  var key, re, result;
  result = this;
  for (key in obj) {
    re = new RegExp("{" + key + "}", "g");
    result = result.replace(re, obj[key]);
  }
  return result;
};

SpriteGenerator = (function() {
  SpriteGenerator.prototype.cssTemplate = ".{name} {\n    width: {width}px;\n    height: {height}px;\n    background-image: url(\"{logoPath}{logoName}\");\n}\n.{name}-sprite {\n    width: {width}px;\n    height: {height}px;\n    background-position: 0 -{pos}px;\n}";

  SpriteGenerator.prototype.cssFooterTemplate = "/* Default classes */\n[class*=\"{prefix}\"] {\n    display: block;\n    overflow: hidden;\n    background-repeat: no-repeat;\n    background-image: none;\n    text-indent: -9999px;\n}\n[class*=\"{prefix}\"][class*=-sprite] {\n    background-image: url(\"{spriteUrl}\");\n}";

  /* EPG
  */


  function SpriteGenerator(epgFeedUrl, options) {
    this.pageResult = __bind(this.pageResult, this);
    this.didWrite = __bind(this.didWrite, this);
    this.phantomCreated = __bind(this.phantomCreated, this);
    this.epgRequestCallback = __bind(this.epgRequestCallback, this);
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
        return _this.grunt.errorCount++;
      } else {
        return fs.readdir(_this.options.files.logos, function(error, list) {
          var file, stat, _i, _len;
          for (_i = 0, _len = list.length; _i < _len; _i++) {
            file = list[_i];
            file = "" + _this.options.files.logos + "/" + file;
            stat = fs.statSync(file);
            if (!stat.isDirectory()) {
              fs.unlink(file);
            }
          }
          return _this.epgRequest();
        });
      }
    });
  }

  /* EPG
  */


  SpriteGenerator.prototype.epgRequest = function() {
    this.client = new XMLHttpRequest();
    this.client.open("GET", this.epgFeedUrl);
    this.client.addEventListener("load", this.epgRequestCallback, false);
    return this.client.send();
  };

  SpriteGenerator.prototype.epgRequestCallback = function() {
    var data,
      _this = this;
    data = this.client.response;
    return parseXml(data, function(error, result) {
      if ((result != null) && result instanceof Object) {
        _this.channels = result["m_lcha:message"].channels.pop().channel;
        return _this.parseChannels();
      }
    });
  };

  /* Channel parsing
  */


  SpriteGenerator.prototype.validImageExtension = function(channel, string) {
    var valid;
    valid = [".gif", ".png", ".jpg", ".jpeg"];
    if (valid.indexOf(string.substr(string.lastIndexOf("."))) === -1) {
      this.grunt.log.warn("Invalid image extension for " + cyan + channel.name + reset + " " + under + "(" + channel.ident + ")" + reset + " - skipping");
      return false;
    }
    return true;
  };

  SpriteGenerator.prototype.parseChannels = function() {
    var channel, i, _i, _len, _ref;
    this.downloadedImages = 0;
    this.parsedImages = 0;
    this.totalImages = 0;
    _ref = this.channels;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      channel = _ref[i];
      channel.ident = [].concat(channel.source_url.toString().split("/")).pop().toLowerCase();
      channel.images = [];
      channel.imageUrls = [];
      if (!(!channel.logo_16 || !this.validImageExtension(channel, channel.logo_16.toString()))) {
        channel.imageUrls.push(channel.logo_16.toString());
      }
      if (!(!channel.logo_32 || !this.validImageExtension(channel, channel.logo_32.toString()))) {
        channel.imageUrls.push(channel.logo_32.toString());
      }
      if (!(!channel.logo_50 || !this.validImageExtension(channel, channel.logo_50.toString()))) {
        channel.imageUrls.push(channel.logo_50.toString());
      }
      this.totalImages += channel.imageUrls.length;
    }
    return this.parseImages();
  };

  /* Image parsing
  */


  SpriteGenerator.prototype.parseImages = function() {
    var channel, i, j, url, _i, _len, _ref, _results;
    _ref = this.channels;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      channel = _ref[i];
      if (!(channel.imageUrls && channel.imageUrls.length > 0)) {
        continue;
      }
      _results.push((function() {
        var _j, _len1, _ref1, _results1;
        _ref1 = channel.imageUrls;
        _results1 = [];
        for (j = _j = 0, _len1 = _ref1.length; _j < _len1; j = ++_j) {
          url = _ref1[j];
          _results1.push(this.downloadImages(channel, url, j));
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };

  SpriteGenerator.prototype.downloadImages = function(channel, url, i) {
    var filename,
      _this = this;
    filename = "" + this.options.files.logos + "/" + this.options.files.logoPrefix + "-" + channel.ident + "-temp" + i + ".png";
    return http.get(url, function(response) {
      if (!(response.statusCode >= 200 && response.statusCode < 400)) {
        _this.grunt.log.warn("Failed to download sprite " + cyan + url + reset + " " + under + "(" + channel.ident + ")" + reset + " -- Status code: " + response.statusCode);
      }
      return response.pipe(fs.createWriteStream(filename)).on("close", function() {
        _this.downloadedImages++;
        channel.images.push({
          filename: filename,
          url: url,
          dimensions: null,
          dimensionSum: 0
        });
        if (_this.downloadedImages === _this.totalImages) {
          return _this.generateSprite();
        }
      });
    });
  };

  SpriteGenerator.prototype.generateSprite = function() {
    var channel, html, image, ws, _i, _j, _len, _len1, _ref, _ref1;
    html = "<canvas id=\"sprite\"></canvas>";
    _ref = this.channels;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      channel = _ref[_i];
      if (!(channel.imageUrls && channel.imageUrls.length > 0)) {
        continue;
      }
      _ref1 = channel.images;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        image = _ref1[_j];
        html += "<img src=\"" + image.filename + "\" data-ident=\"" + channel.ident + "\" />";
      }
    }
    this.temp = "" + __dirname + "/temp.html";
    ws = fs.createWriteStream(this.temp);
    ws.write(html);
    ws.close();
    return phantom.create(this.phantomCreated, {
      parameters: {
        "local-to-remote-url-access": "yes"
      }
    });
  };

  SpriteGenerator.prototype.phantomCreated = function(error, ph) {
    var fn, params,
      _this = this;
    params = {
      channels: this.channels,
      cssTemplate: this.cssTemplate,
      logoPath: this.options.css.logoPath,
      filenamePrefix: this.options.css.logoPrefix
    };
    fn = "function() { return (" + (evaluation.toString()) + ").apply(this, " + (JSON.stringify([params])) + ");}";
    this.phantom = ph;
    return ph.createPage(function(error, page) {
      return page.open(_this.temp, function(error, status) {
        return page.evaluate(fn, _this.pageResult);
      });
    });
  };

  /* Phantom
  */


  SpriteGenerator.prototype.didWrite = function(error) {
    var end;
    if (--this.jobs === 0) {
      end = +new Date();
      this.grunt.log.ok("Finished in " + (end - this.start) + "ms");
      return this.done();
    }
  };

  SpriteGenerator.prototype.pageResult = function(error, result) {
    var buffer, css, filename, _i, _len, _ref,
      _this = this;
    if (error) {
      grunt.errorCount++;
      grunt.log.error("Fatal error:", error);
      return;
    }
    this.phantom.exit();
    fs.unlink(this.temp);
    _ref = result.images;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      filename = _ref[_i];
      fs.renameSync(filename, filename.replace(/\-temp\d\./gi, "."));
    }
    fs.readdir(this.options.files.logos, function(error, list) {
      var file, stat, _j, _len1;
      for (_j = 0, _len1 = list.length; _j < _len1; _j++) {
        file = list[_j];
        if (file.lastIndexOf("temp") === -1) {
          continue;
        }
        file = "" + _this.options.files.logos + "/" + file;
        stat = fs.statSync(file);
        if (!stat.isDirectory()) {
          fs.unlink(file);
        }
      }
      return _this.didWrite();
    });
    this.jobs = 3;
    buffer = result.sprite.substring(1, result.sprite.length - 2);
    buffer = buffer.replace(/^data:image\/png;base64,/, "");
    fs.writeFile(this.options.files.sprite, buffer, 'base64', this.didWrite);
    css = this.cssFooterTemplate.replaceObject({
      spriteUrl: this.options.css.spritePath,
      prefix: this.options.css.logoPrefix
    });
    css += result.css;
    return fs.writeFile(this.options.files.stylesheet, css, this.didWrite);
  };

  return SpriteGenerator;

})();

module.exports = {
  SpriteGenerator: SpriteGenerator
};
