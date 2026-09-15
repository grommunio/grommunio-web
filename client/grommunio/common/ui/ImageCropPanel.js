/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui');

/**
 * @class Grommunio.common.ui.ImageCropPanel
 * @extends Ext.Window
 * @xtype grommunio.imagecroppanel
 *
 * Lets the user pan and zoom an image over a square frame and returns the
 * frame as a JPEG data URL. The circle is a hint for clients which round the
 * picture; the result is always the full square.
 */
Grommunio.common.ui.ImageCropPanel = Ext.extend(Ext.Window, {
	/**
	 * @cfg {Blob/String} source The image to crop, either a Blob/File or a data URL.
	 */
	source: undefined,

	/**
	 * @cfg {Number} outputSize Edge length in pixels of the returned image.
	 */
	outputSize: 512,

	/**
	 * @cfg {Number} maxBytes Upper bound for the encoded image. The JPEG quality
	 * is lowered, and as a last resort the edge length halved, until it fits.
	 */
	maxBytes: 512 * 1024,

	/**
	 * @cfg {String} note Text shown below the frame.
	 */
	note: undefined,

	/**
	 * @cfg {Function} callback Called with the resulting data URL.
	 */
	callback: Ext.emptyFn,

	/**
	 * @cfg {Object} scope The scope for {@link #callback}.
	 */
	scope: undefined,

	/**
	 * Edge length of the crop frame in CSS pixels.
	 * @property
	 * @type Number
	 * @private
	 */
	frameSize: 300,

	/**
	 * The decoded image, an ImageBitmap or an HTMLImageElement.
	 * @property
	 * @type Object
	 * @private
	 */
	image: undefined,

	/**
	 * Image pixels per frame pixel.
	 * @property
	 * @type Number
	 * @private
	 */
	scale: 1,

	/**
	 * Position of the image's top left corner within the frame.
	 * @property
	 * @type Number
	 * @private
	 */
	offsetX: 0,

	/**
	 * @property
	 * @type Number
	 * @private
	 */
	offsetY: 0,

	/**
	 * Active pointers by id, for dragging and pinch zoom.
	 * @property
	 * @type Object
	 * @private
	 */
	pointers: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.imagecroppanel',
			title: _('Adjust picture'),
			cls: 'k-image-crop',
			layout: 'fit',
			modal: true,
			resizable: false,
			autoHeight: true,
			width: 360,
			buttonAlign: 'right',
			buttons: [{
				text: _('Apply'),
				ref: '../applyButton',
				disabled: true,
				handler: this.onApply,
				scope: this
			},{
				text: _('Cancel'),
				handler: this.close,
				scope: this
			}]
		});

		this.pointers = {};

		Grommunio.common.ui.ImageCropPanel.superclass.constructor.call(this, config);

		this.on('afterrender', this.onAfterRender, this);
		this.on('beforedestroy', this.onBeforeDestroy, this);
	},

	/**
	 * Builds the frame and starts decoding the image.
	 * @private
	 */
	onAfterRender: function()
	{
		var body = this.body;

		this.frameEl = body.createChild({ tag: 'div', cls: 'k-image-crop-frame' });
		this.canvas = this.frameEl.createChild({
			tag: 'canvas',
			cls: 'k-image-crop-canvas',
			tabindex: 0,
			role: 'application',
			'aria-label': _('Drag to move the picture, use the slider or the mouse wheel to zoom')
		}).dom;

		this.zoomSlider = new Ext.Slider({
			renderTo: body.createChild({ tag: 'div', cls: 'k-image-crop-zoom' }),
			width: this.frameSize,
			minValue: 0,
			maxValue: 1000,
			value: 0,
			listeners: { change: this.onZoomChange, scope: this }
		});

		if (this.note) {
			body.createChild({ tag: 'div', cls: 'k-image-crop-note', html: this.note });
		}

		this.statusEl = body.createChild({ tag: 'div', cls: 'k-image-crop-status' });

		this.mon(Ext.get(this.canvas), {
			'pointerdown': this.onCropPointerDown,
			'pointermove': this.onCropPointerMove,
			'pointerup': this.onCropPointerUp,
			'pointercancel': this.onCropPointerUp,
			'wheel': this.onCropWheel,
			'keydown': this.onCropKeyDown,
			'scope': this
		});

		this.loadImage();
	},

	/**
	 * @private
	 */
	onBeforeDestroy: function()
	{
		if (this.image && this.image.close) {
			this.image.close();
		}
		if (this.objectUrl) {
			window.URL.revokeObjectURL(this.objectUrl);
		}
	},

	/**
	 * Decodes {@link #source}. createImageBitmap is preferred because it applies
	 * the EXIF orientation, which drawImage of an <img> does not do everywhere.
	 * @private
	 */
	loadImage: function()
	{
		var me = this;

		this.setStatus(_('Loading…'));

		if (this.source instanceof window.Blob && window.createImageBitmap) {
			window.createImageBitmap(this.source, { imageOrientation: 'from-image' })
				.then(function(bitmap) { me.onImageLoaded(bitmap); })
				.catch(function() { me.loadImageElement(); });
			return;
		}

		this.loadImageElement();
	},

	/**
	 * @private
	 */
	loadImageElement: function()
	{
		var me = this;
		var img = new Image();

		img.onload = function() { me.onImageLoaded(img); };
		img.onerror = function() { me.setStatus(_('This picture could not be read.')); };

		if (this.source instanceof window.Blob) {
			this.objectUrl = window.URL.createObjectURL(this.source);
			img.src = this.objectUrl;
		} else {
			img.src = this.source;
		}
	},

	/**
	 * @param {Object} image The decoded ImageBitmap or HTMLImageElement
	 * @private
	 */
	onImageLoaded: function(image)
	{
		if (this.isDestroyed) {
			return;
		}

		var width = image.width || image.naturalWidth;
		var height = image.height || image.naturalHeight;

		if (!width || !height) {
			this.setStatus(_('This picture could not be read.'));
			return;
		}

		this.image = image;
		this.minScale = this.frameSize / Math.min(width, height);
		this.maxScale = this.minScale * 8;
		this.scale = this.minScale;
		this.offsetX = (this.frameSize - width * this.scale) / 2;
		this.offsetY = (this.frameSize - height * this.scale) / 2;

		this.setStatus('');
		this.applyButton.enable();
		this.syncSlider();
		this.redraw();
	},

	/**
	 * @param {String} text The message, empty to clear it
	 * @private
	 */
	setStatus: function(text)
	{
		if (this.statusEl) {
			this.statusEl.update(text || '');
			this.statusEl.setDisplayed(!Ext.isEmpty(text));
		}
	},

	/**
	 * @return {Number} The image width in image pixels
	 * @private
	 */
	getImageWidth: function()
	{
		return this.image.width || this.image.naturalWidth;
	},

	/**
	 * @return {Number} The image height in image pixels
	 * @private
	 */
	getImageHeight: function()
	{
		return this.image.height || this.image.naturalHeight;
	},

	/**
	 * Keeps the frame covered by the image.
	 * @private
	 */
	clampOffsets: function()
	{
		var width = this.getImageWidth() * this.scale;
		var height = this.getImageHeight() * this.scale;

		this.offsetX = Math.min(0, Math.max(this.frameSize - width, this.offsetX));
		this.offsetY = Math.min(0, Math.max(this.frameSize - height, this.offsetY));
	},

	/**
	 * Draws the image, the dimmed surround and the circle hint.
	 * @private
	 */
	redraw: function()
	{
		var frame = this.frameSize;
		var ratio = window.devicePixelRatio || 1;
		var canvas = this.canvas;
		var ctx = canvas.getContext('2d');

		var pixels = Math.round(frame * ratio);

		if (canvas.width !== pixels || canvas.height !== pixels) {
			canvas.width = pixels;
			canvas.height = pixels;
			canvas.style.width = frame + 'px';
			canvas.style.height = frame + 'px';
		}

		ctx.save();
		ctx.scale(ratio, ratio);

		// White, like the flattening the JPEG will do, so this is what is stored.
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, frame, frame);

		if (this.image) {
			this.clampOffsets();
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(this.image, this.offsetX, this.offsetY,
				this.getImageWidth() * this.scale, this.getImageHeight() * this.scale);
		}

		ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
		ctx.beginPath();
		ctx.rect(0, 0, frame, frame);
		ctx.arc(frame / 2, frame / 2, frame / 2, 0, Math.PI * 2, true);
		ctx.fill('evenodd');

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(frame / 2, frame / 2, frame / 2 - 0.5, 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();
	},

	/**
	 * @private
	 */
	syncSlider: function()
	{
		var value = this.maxScale > this.minScale
			? (this.scale - this.minScale) / (this.maxScale - this.minScale) * 1000
			: 0;

		this.settingSlider = true;
		this.zoomSlider.setValue(Math.round(value), false);
		this.settingSlider = false;
	},

	/**
	 * @param {Ext.Slider} slider The zoom slider
	 * @param {Number} value The new value
	 * @private
	 */
	onZoomChange: function(slider, value)
	{
		if (this.settingSlider || !this.image) {
			return;
		}

		this.zoomTo(this.minScale + (this.maxScale - this.minScale) * value / 1000,
			this.frameSize / 2, this.frameSize / 2);
		this.redraw();
	},

	/**
	 * Zooms while keeping the image point under (x, y) in place.
	 * @param {Number} scale The new scale
	 * @param {Number} x Frame coordinate to keep fixed
	 * @param {Number} y Frame coordinate to keep fixed
	 * @private
	 */
	zoomTo: function(scale, x, y)
	{
		scale = Math.min(this.maxScale, Math.max(this.minScale, scale));

		var factor = scale / this.scale;

		this.offsetX = x - (x - this.offsetX) * factor;
		this.offsetY = y - (y - this.offsetY) * factor;
		this.scale = scale;
		this.clampOffsets();
	},

	/**
	 * @param {Ext.EventObject} event The pointer event
	 * @return {Object} The frame coordinates of the event
	 * @private
	 */
	getFramePoint: function(event)
	{
		var box = this.canvas.getBoundingClientRect();
		var browserEvent = event.browserEvent || event;

		return {
			x: browserEvent.clientX - box.left,
			y: browserEvent.clientY - box.top
		};
	},

	/**
	 * @param {Ext.EventObject} event The pointer event
	 * @private
	 */
	onCropPointerDown: function(event)
	{
		if (!this.image) {
			return;
		}

		var browserEvent = event.browserEvent;

		event.preventDefault();
		this.canvas.focus();
		this.pointers[browserEvent.pointerId] = this.getFramePoint(event);
		this.pinchDistance = this.getPointerDistance();

		try {
			this.canvas.setPointerCapture(browserEvent.pointerId);
		}
		catch (e) {
			// Capture is a convenience, dragging works without it
		}
	},

	/**
	 * @param {Ext.EventObject} event The pointer event
	 * @private
	 */
	onCropPointerMove: function(event)
	{
		var browserEvent = event.browserEvent;
		var previous = this.pointers[browserEvent.pointerId];

		if (!previous || !this.image) {
			return;
		}
		event.preventDefault();

		var point = this.getFramePoint(event);
		var ids = Object.keys(this.pointers);

		if (ids.length > 1) {
			this.pointers[browserEvent.pointerId] = point;

			var distance = this.getPointerDistance();
			var centre = this.getPointerCentre();

			if (this.pinchDistance > 0 && distance > 0) {
				this.zoomTo(this.scale * distance / this.pinchDistance, centre.x, centre.y);
				this.syncSlider();
			}
			this.pinchDistance = distance;
		} else {
			this.offsetX += point.x - previous.x;
			this.offsetY += point.y - previous.y;
			this.pointers[browserEvent.pointerId] = point;
		}

		this.redraw();
	},

	/**
	 * @param {Ext.EventObject} event The pointer event
	 * @private
	 */
	onCropPointerUp: function(event)
	{
		var browserEvent = event.browserEvent;

		delete this.pointers[browserEvent.pointerId];
		this.pinchDistance = this.getPointerDistance();
		if (this.canvas.releasePointerCapture && this.canvas.hasPointerCapture &&
			this.canvas.hasPointerCapture(browserEvent.pointerId)) {
			this.canvas.releasePointerCapture(browserEvent.pointerId);
		}
	},

	/**
	 * @return {Number} Distance between the first two pointers, 0 with fewer
	 * @private
	 */
	getPointerDistance: function()
	{
		var ids = Object.keys(this.pointers);

		if (ids.length < 2) {
			return 0;
		}

		var a = this.pointers[ids[0]];
		var b = this.pointers[ids[1]];

		return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
	},

	/**
	 * @return {Object} Midpoint between the first two pointers
	 * @private
	 */
	getPointerCentre: function()
	{
		var ids = Object.keys(this.pointers);
		var a = this.pointers[ids[0]];
		var b = this.pointers[ids[1]];

		return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	},

	/**
	 * @param {Ext.EventObject} event The wheel event
	 * @private
	 */
	onCropWheel: function(event)
	{
		if (!this.image) {
			return;
		}
		event.preventDefault();

		var point = this.getFramePoint(event);
		var delta = event.browserEvent.deltaY;

		this.zoomTo(this.scale * Math.pow(0.9988, delta), point.x, point.y);
		this.syncSlider();
		this.redraw();
	},

	/**
	 * @param {Ext.EventObject} event The key event
	 * @private
	 */
	onCropKeyDown: function(event)
	{
		if (!this.image) {
			return;
		}

		var key = event.getKey();
		var step = event.shiftKey ? 20 : 5;
		var centre = this.frameSize / 2;

		switch (key) {
			case event.LEFT: this.offsetX += step; break;
			case event.RIGHT: this.offsetX -= step; break;
			case event.UP: this.offsetY += step; break;
			case event.DOWN: this.offsetY -= step; break;
			case 187: case 107: this.zoomTo(this.scale * 1.1, centre, centre); this.syncSlider(); break;
			case 189: case 109: this.zoomTo(this.scale / 1.1, centre, centre); this.syncSlider(); break;
			default: return;
		}

		event.preventDefault();
		this.redraw();
	},

	/**
	 * Renders the frame at the output size and hands the data URL to the callback.
	 * @private
	 */
	onApply: function()
	{
		if (!this.image) {
			return;
		}

		var source = this.frameSize / this.scale;
		var dataUrl = this.encode(this.renderCrop(-this.offsetX / this.scale, -this.offsetY / this.scale, source,
			Math.min(this.outputSize, Math.max(64, Math.round(source)))));

		if (!dataUrl) {
			this.setStatus(_('This picture could not be converted.'));
			return;
		}

		this.callback.call(this.scope || this, dataUrl);
		this.close();
	},

	/**
	 * Draws the square crop onto a canvas of {@link #outputSize}. Large
	 * reductions are done in halving steps, a single one produces aliasing.
	 * @param {Number} sx Left edge of the crop in image pixels
	 * @param {Number} sy Top edge of the crop in image pixels
	 * @param {Number} size Edge length of the crop in image pixels
	 * @param {Number} target Edge length of the result, defaults to {@link #outputSize}
	 * @return {HTMLCanvasElement} The rendered canvas
	 * @private
	 */
	renderCrop: function(sx, sy, size, target)
	{
		target = target || this.outputSize;

		var step = Math.max(target, Math.min(Math.round(size), target * 4));
		var canvas = this.createCanvas(step);
		var ctx = canvas.getContext('2d');

		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(this.image, sx, sy, size, size, 0, 0, step, step);

		while (canvas.width > target * 2) {
			var half = this.createCanvas(Math.max(target, Math.round(canvas.width / 2)));
			var halfCtx = half.getContext('2d');

			halfCtx.imageSmoothingQuality = 'high';
			halfCtx.drawImage(canvas, 0, 0, half.width, half.height);
			canvas = half;
		}

		if (canvas.width === target) {
			return canvas;
		}

		var out = this.createCanvas(target);
		var outCtx = out.getContext('2d');

		outCtx.imageSmoothingQuality = 'high';
		outCtx.drawImage(canvas, 0, 0, target, target);

		return out;
	},

	/**
	 * A square canvas on white, so that transparency does not turn black in JPEG.
	 * @param {Number} size The edge length
	 * @return {HTMLCanvasElement} The canvas
	 * @private
	 */
	createCanvas: function(size)
	{
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		canvas.width = size;
		canvas.height = size;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, size, size);

		return canvas;
	},

	/**
	 * Encodes as JPEG, lowering the quality and finally the edge length until
	 * the result fits {@link #maxBytes}.
	 * @param {HTMLCanvasElement} canvas The rendered crop
	 * @return {String} The data URL, empty when it could not be encoded
	 * @private
	 */
	encode: function(canvas)
	{
		// Above 0.9 libjpeg drops the chroma subsampling, which multiplies the
		// size for no visible gain at this resolution.
		var quality = 0.85;

		while (canvas.width >= 64) {
			while (quality >= 0.4) {
				var dataUrl = canvas.toDataURL('image/jpeg', quality);

				if (Grommunio.common.ui.ImageCropPanel.dataUrlBytes(dataUrl) <= this.maxBytes) {
					return dataUrl;
				}
				quality -= 0.08;
			}

			quality = 0.8;
			canvas = this.renderCrop(-this.offsetX / this.scale, -this.offsetY / this.scale,
				this.frameSize / this.scale, Math.round(canvas.width / 2));
		}

		return '';
	}
});

/**
 * The decoded size of a base64 data URL.
 * @param {String} dataUrl The data URL
 * @return {Number} The number of bytes it encodes
 * @static
 */
Grommunio.common.ui.ImageCropPanel.dataUrlBytes = function(dataUrl)
{
	var base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
	var padding = base64.slice(-2) === '==' ? 2 : (base64.slice(-1) === '=' ? 1 : 0);

	return Math.floor(base64.length * 3 / 4) - padding;
};

Ext.reg('grommunio.imagecroppanel', Grommunio.common.ui.ImageCropPanel);
