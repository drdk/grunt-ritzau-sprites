window.onload = makeSprite;

function $ (selector) {
	return Array.prototype.slice.call((typeof selector == "string") ? document.querySelectorAll(selector) : selector, 0);
}

function makeSprite () {
	var canvas, ctx, largestImageWithIdent,
		channels = options.channels,
		maxWidth = 110,
		maxHeight = 35,
		minWidth = 40,
		minHeight = 20,
		width = 0,
		height = 0,
		offset = 0,
		idealRatio = maxHeight / maxWidth,
		result = [];

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
		var size = {
				width: image.width,
				height: image.height
			},
			ratio = image.height / image.width;

		if (size.width > maxWidth || size.height > maxHeight) {
			if (ratio > idealRatio) {
				size.height = maxHeight;
				size.width = Math.round(maxHeight / ratio);
			}
			else {
				size.width = maxWidth;
				size.height = Math.round(maxWidth * ratio);
			}
		}
		else if (size.width < minWidth && size.height < minHeight) {
			size.width *= 2;
			size.height *= 2;
		}
		return size;
	}

	width = 0;
	height = 0;

	channels.forEach(function (channel) {
		var image = largestImageWithIdent(channel.ident);
		if (image) {
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
				result.push({
					id: channel.ident,
					width: channel.size.width,
					height: channel.size.height,
					top: offset
				});
				offset += channel.size.height;
			}
			catch (e) {
			}
		}
	});
	
	result = JSON.stringify(result);

	if (typeof window.callPhantom === 'function') {
		window.callPhantom(result);
	}
	else if (window.console) {
		console.log(result);
	}
	
}