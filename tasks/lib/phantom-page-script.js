window.onload = function () {

	var images = $(document.images),
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

function $ (selector) {
	return Array.prototype.slice.call((typeof selector == "string") ? document.querySelectorAll(selector) : selector, 0);
}

String.prototype.replaceToken = function(object) {
	return this.replace(/\{([a-zA-Z]+)\}/g, function (m, key) {
		return (key in object) ? object[key] : m;
	});
};

function makeSprite () {
	var canvas, css, ctx, height, imgs, largestImageWithIdent, moo, offset, result, width,
		cssTemplate = options.cssTemplate,
		channels = options.channels,
		logoPath = options.logoPath,
		filenamePrefix = options.filenamePrefix,
		maxWidth = 110,
		maxHeight = 35,
		minWidth = 40,
		minHeight = 20;

	moo = [];

	largestImageWithIdent = function(ident) {
		var images = $("img[data-ident='" + ident + "']"),
			maxWidth = 0,
			result;
		images.forEach(function (image) {
			if (image.width > maxWidth) {
				maxWidth = image.width;
				result = image;
			}
		});
		return result;
	};

	function getSize (image) {
		var wfactor = maxWidth / image.width,
			yfactor = maxHeight / image.height,
			factor = Math.min(wfactor, yfactor);

		if (image.width < minWidth && image.height < minHeight) {
			factor = 2;
		}

		return {
			width: Math.ceil(image.width * factor),
			height: Math.ceil(image.height * factor)
		};
	}

	width = 0;
	height = 0;
	css = "";
	imgs = [];

	channels.forEach(function (channel) {
		var image = largestImageWithIdent(channel.ident);
		if (image) {
			if (image.height < 30) {
				moo.push(channel.ident);
			}
			channel.spriteImage = image;
			channel.size = getSize(image);
			if (width < channel.size.width) {
				width = channel.size.width;
			}
			height += channel.size.height;
		}
	});

	canvas = document.getElementById("sprite");
	ctx = canvas.getContext("2d");
	canvas.width = width;
	canvas.height = height;
	offset = 0;

	channels.forEach(function (channel) {
		if (channel.spriteImage) {
			try {
				ctx.drawImage(channel.spriteImage, 0, offset, channel.size.width, channel.size.height);
				imgs.push(channel.spriteImage.src.replace("file://", ""));
				offset += channel.size.height;
				css += "\n\n" + cssTemplate.replaceToken({
					name: "" + filenamePrefix + "-" + channel.ident,
					width: channel.size.width,
					height: channel.size.height,
					pos: offset - channel.size.height,
					logoName: "" + filenamePrefix + "-" + channel.ident + ".png",
					logoPath: logoPath
				});
			}
			catch (e) {
			}
		}
	});

	var images = Array.prototype.slice.call(document.images, 0);
	images.forEach(function (image) {
		image.parentNode.removeChild(image);
	});

	result = {
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
	
}