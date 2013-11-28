window.onload = function () {

  var images = Array.prototype.slice.call(document.images, 0),
    count = images.length;
  
  images.forEach(function (image) {
    if (image.complete) {
      countDown();
    }
    else {
      image.onload = countDown;
    }
  });
  
  function countDown() {
    count--;
    if (!count) {
      makeSprite();
    }
  }

};


function makeSprite () {
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
    images = document.querySelectorAll("img[data-ident='" + ident + "']");
    result = null;
    for (_i = 0, _len = images.length; _i < _len; _i++) {
      image = images[_i];
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
    try {
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
    catch (e) {

    }
  }

  var images = Array.prototype.slice.call(document.images, 0);
  images.forEach(function (image) {
    image.parentNode.removeChild(image);
  });

  result = {
    /*
    sprite: JSON.stringify(canvas.toDataURL({
      format: "png"
    })),
    */
    css: css,
    width: width,
    height: height,
    images: imgs
  };
  
  result = JSON.stringify(result);

  if (typeof window.callPhantom === 'function') {
    window.callPhantom(result);
  }
  else if (window.console) {
    console.log(result);
  }
  
};