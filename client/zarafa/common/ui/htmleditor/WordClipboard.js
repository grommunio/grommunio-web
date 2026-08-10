Ext.namespace("Zarafa.common.ui.htmleditor");

/**
 * @class Zarafa.common.ui.htmleditor.WordClipboard
 * @singleton
 *
 * Recovers the images of a paste that originates from Microsoft Word.
 *
 * Word never puts its images in the HTML flavour of the clipboard. It writes
 * them to a temporary directory and references them, either as VML
 * <v:imagedata src="file:///.../clip_image001.png"> or as a plain
 * <img src="file:///...">, neither of which a web page is allowed to load. The
 * image bytes are on the clipboard, but only inside the text/rtf flavour, as
 * hex-encoded \pngblip / \jpegblip picture groups.
 *
 * TinyMCE cannot help here: its clipboard-image handling only runs for a paste
 * that carries no HTML at all, and a Word paste always carries HTML. So the
 * pictures are mined out of the RTF and substituted back into the HTML before
 * it is inserted.
 */
Zarafa.common.ui.htmleditor.WordClipboard = {
	/**
	 * Picture types that can be turned into an <img>. \wmetafile and \emfblip
	 * are metafile renderings of a picture that is also present as a bitmap, so
	 * they are deliberately not handled.
	 * @property
	 * @type Object
	 */
	blipMimeTypes: {
		pngblip: "image/png",
		jpegblip: "image/jpeg"
	},

	/**
	 * Groups whose contents duplicate a picture found elsewhere: \shprslt is the
	 * fallback rendering of a \shp, \nonshppict the pre-\shppict fallback.
	 * @property
	 * @type Object
	 */
	fallbackGroups: {
		shprslt: true,
		nonshppict: true
	},

	/**
	 * Test whether a paste looks like Word content whose images need recovering.
	 * Kept cheap so it can gate the (potentially multi-megabyte) RTF parsing.
	 *
	 * @param {String} html the text/html flavour
	 * @return {Boolean} true if it references at least one unloadable image
	 */
	needsImageRecovery: function(html)
	{
		return !Ext.isEmpty(html) && /src\s*=\s*["']?file:/i.test(html);
	},

	/**
	 * Walk the RTF once, recording the groups that matter with their extents.
	 * Doing this in a single pass is what keeps a document with many pictures
	 * linear rather than quadratic.
	 *
	 * @param {String} rtf the text/rtf flavour
	 * @return {Array} objects with {kind, start, end, depth} in document order
	 * @private
	 */
	scanGroups: function(rtf)
	{
		var groups = [];
		var stack = [];
		var depth = 0;

		for (var i = 0; i < rtf.length; i++) {
			var c = rtf.charAt(i);
			if (c === "\\") {
				i++;                        // escaped character or control word
				continue;
			}
			if (c === "{") {
				depth++;
				var m = /^\{\\\*?\\?([a-z]+)/i.exec(rtf.substr(i, 20));
				var group = {
					kind: m ? m[1].toLowerCase() : "",
					start: i,
					end: -1,
					depth: depth
				};
				groups.push(group);
				stack.push(group);
			} else if (c === "}") {
				var open = stack.pop();
				if (open) {
					open.end = i + 1;
				}
				depth--;
			}
		}
		// Anything still open ran off the end of a truncated payload.
		for (var j = 0; j < stack.length; j++) {
			stack[j].end = rtf.length;
		}
		return groups;
	},

	/**
	 * @param {Object} inner a group as returned by {@link #scanGroups}
	 * @param {Object} outer a group as returned by {@link #scanGroups}
	 * @return {Boolean} true if inner lies entirely within outer
	 * @private
	 */
	isContainedIn: function(inner, outer)
	{
		return outer.start <= inner.start && inner.end <= outer.end;
	},

	/**
	 * Extract the pictures from an RTF clipboard payload, in document order.
	 *
	 * Each picture carries the shape name Word gave it, which is what matches it
	 * back to the HTML -- see {@link #rewriteImages}.
	 *
	 * @param {String} rtf the text/rtf flavour
	 * @return {Array} objects with {name, mime, base64, width, height}
	 */
	parsePictures: function(rtf)
	{
		var pictures = [];
		if (Ext.isEmpty(rtf)) {
			return pictures;
		}

		var groups = this.scanGroups(rtf);
		var fallbacks = [];
		var shapes = [];
		var picts = [];
		var i;
		for (i = 0; i < groups.length; i++) {
			if (this.fallbackGroups[groups[i].kind]) {
				fallbacks.push(groups[i]);
			} else if (groups[i].kind === "shp") {
				shapes.push(groups[i]);
			} else if (groups[i].kind === "pict") {
				picts.push(groups[i]);
			}
		}

		var nameRe = /\{\\sp\{\\sn wzName\}\{\\sv ([^}]*)\}\}/;

		for (var p = 0; p < picts.length; p++) {
			var pict = picts[p];

			var isFallback = false;
			for (var f = 0; f < fallbacks.length; f++) {
				if (this.isContainedIn(pict, fallbacks[f])) {
					isFallback = true;
					break;
				}
			}
			if (isFallback) {
				continue;
			}

			var group = rtf.slice(pict.start, pict.end);

			var blip = null;
			for (var name in this.blipMimeTypes) {
				if (group.indexOf("\\" + name) >= 0) {
					blip = name;
					break;
				}
			}
			// \bin marks a binary payload, which getData() has already mangled.
			if (blip === null || /\\bin\d/.test(group)) {
				continue;
			}

			// The payload is the hex run following the picture's control words
			// and any nested group such as {\*\blipuid ...}. Strip the group's
			// own braces first, or its closing brace is mistaken for the last
			// nested group and the payload is read as empty.
			var inner = group.slice(1, group.length - 1);
			var lastNested = inner.lastIndexOf("}");
			var body = lastNested >= 0 ? inner.slice(lastNested + 1) : inner;
			// Drop any leading control words, whose numeric arguments would
			// otherwise be read as picture bytes (\picw50595 -> "50595").
			body = body.replace(/^[\s\r\n]*(?:\\[a-zA-Z]+-?\d*[ ]?[\s\r\n]*)*/, "");
			var hex = body.replace(/[^0-9a-fA-F]/g, "");
			if (hex.length < 16) {
				continue;
			}

			// The picture's shape name is stored in one of two places depending
			// on how the image is anchored: an inline picture carries it in
			// {\*\picprop} inside the \pict group itself, a floating one in the
			// enclosing {\shp} as a sibling property -- where it may appear
			// either before or after the picture, so the enclosing group and not
			// proximity is what identifies it.
			var shapeName = null;
			var nameMatch = nameRe.exec(group);
			if (!nameMatch) {
				var owner = null;
				for (var s = 0; s < shapes.length; s++) {
					if (this.isContainedIn(pict, shapes[s]) &&
						(owner === null || shapes[s].depth > owner.depth)) {
						owner = shapes[s];
					}
				}
				if (owner) {
					nameMatch = nameRe.exec(rtf.slice(owner.start, owner.end));
				}
			}
			if (nameMatch) {
				shapeName = nameMatch[1].trim();
			}

			// \picscaleX is a percentage applied on top of the goal size, so the
			// two must be combined before the result can be compared with the
			// size the HTML declares. Twips convert to CSS pixels at 96dpi.
			var goal = /\\picwgoal(\d+)\\pichgoal(\d+)/.exec(group);
			var scaleX = /\\picscalex(\d+)/.exec(group);
			var scaleY = /\\picscaley(\d+)/.exec(group);
			var factorX = scaleX ? parseInt(scaleX[1], 10) / 100 : 1;
			var factorY = scaleY ? parseInt(scaleY[1], 10) / 100 : 1;

			pictures.push({
				name: shapeName,
				mime: this.blipMimeTypes[blip],
				base64: this.hexToBase64(hex),
				width: goal ? Math.round(parseInt(goal[1], 10) / 15 * factorX) : 0,
				height: goal ? Math.round(parseInt(goal[2], 10) / 15 * factorY) : 0
			});
		}
		return pictures;
	},

	/**
	 * @param {String} hex a run of hex digits
	 * @return {String} the same bytes, base64 encoded
	 * @private
	 */
	hexToBase64: function(hex)
	{
		// Built in chunks so that a multi-megabyte picture cannot exceed the
		// argument limit of String.fromCharCode.
		var parts = [];
		var chunk = [];
		for (var i = 0; i + 1 < hex.length; i += 2) {
			chunk.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
			if (chunk.length === 8192) {
				parts.push(chunk.join(""));
				chunk = [];
			}
		}
		parts.push(chunk.join(""));
		return btoa(parts.join(""));
	},

	/**
	 * Collect the image references that the browser would actually try to
	 * render, in document order.
	 *
	 * Word emits each picture twice: once as VML inside a downlevel-hidden
	 * conditional comment, once as an <img> inside a downlevel-revealed block --
	 * or, when it relies on VML, only the VML and no <img> at all. Comments are
	 * blanked out first so that exactly one representation per picture is left.
	 *
	 * @param {String} html the text/html flavour
	 * @return {Array} objects describing each replaceable reference
	 * @private
	 */
	findImageSlots: function(html)
	{
		var slots = [];
		var visible = html.replace(/<!--[\s\S]*?-->/g, function(comment) {
			return new Array(comment.length + 1).join(" ");  // keep offsets stable
		});

		var re = /<img\b[^>]*>|<v:shape\b[^>]*>[\s\S]*?<\/v:shape>/gi;
		var match;
		while ((match = re.exec(visible)) !== null) {
			var tag = html.substr(match.index, match[0].length);
			var isImg = /^<img/i.test(tag);
			if (isImg) {
				var src = /src\s*=\s*["']?([^"'\s>]+)/i.exec(tag);
				if (!src || !/^file:/i.test(src[1])) {
					continue;               // a normal, loadable image
				}
			} else if (!/<v:imagedata\b/i.test(tag)) {
				continue;                   // a drawing, not a picture
			}

			// Word names the shape in v:shapes on the <img>, or in id on the VML.
			var nameAttr = /(?:v:shapes|id)\s*=\s*["']([^"']+)["']/i.exec(tag);
			var width = /\bwidth\s*=\s*["']?(\d+)/i.exec(tag);
			var height = /\bheight\s*=\s*["']?(\d+)/i.exec(tag);
			var style = /style\s*=\s*["']([^"']*)["']/i.exec(tag);
			var styleWidth = style ? /width\s*:\s*([\d.]+)pt/i.exec(style[1]) : null;
			var styleHeight = style ? /height\s*:\s*([\d.]+)pt/i.exec(style[1]) : null;

			slots.push({
				start: match.index,
				length: match[0].length,
				isImg: isImg,
				// _x0020_ is how Word escapes a space in these attributes
				name: nameAttr ? nameAttr[1].replace(/_x0020_/g, " ").trim() : null,
				width: width ? parseInt(width[1], 10) :
					(styleWidth ? Math.round(parseFloat(styleWidth[1]) * 96 / 72) : 0),
				height: height ? parseInt(height[1], 10) :
					(styleHeight ? Math.round(parseFloat(styleHeight[1]) * 96 / 72) : 0),
				styleDimensions: (styleWidth ? "width:" + styleWidth[1] + "pt;" : "") +
					(styleHeight ? "height:" + styleHeight[1] + "pt;" : "")
			});
		}
		return slots;
	},

	/**
	 * Replace Word's unloadable image references with the pictures recovered
	 * from the RTF.
	 *
	 * Matching is by shape name, because the order of the pictures in the RTF
	 * does NOT follow the order of the references in the HTML: for a floating
	 * image Word writes the pictures in anchor order while laying them out in
	 * reading order, so pairing them by index silently swaps images that sit
	 * next to each other. Size is used only for shapes Word left unnamed, and
	 * the position only when neither is available.
	 *
	 * @param {String} html the text/html flavour
	 * @param {Array} pictures as returned by {@link #parsePictures}
	 * @return {Object} {html, replaced}
	 */
	rewriteImages: function(html, pictures)
	{
		var slots = this.findImageSlots(html);
		var used = [];
		var replacements = [];
		var i;

		var pick = function(slot, index) {
			var candidate;
			if (slot.name) {
				for (candidate = 0; candidate < pictures.length; candidate++) {
					if (!used[candidate] && pictures[candidate].name === slot.name) {
						used[candidate] = true;
						return pictures[candidate];
					}
				}
			}
			if (slot.width && slot.height) {
				// The two representations round to the pixel differently, so a
				// small tolerance is needed -- but a size match is only accepted
				// when it is unambiguous.
				var hits = [];
				for (candidate = 0; candidate < pictures.length; candidate++) {
					if (!used[candidate] &&
						Math.abs(pictures[candidate].width - slot.width) <= 2 &&
						Math.abs(pictures[candidate].height - slot.height) <= 2) {
						hits.push(candidate);
					}
				}
				if (hits.length === 1) {
					used[hits[0]] = true;
					return pictures[hits[0]];
				}
			}
			if (!used[index] && pictures[index]) {
				used[index] = true;
				return pictures[index];
			}
			return null;
		};

		for (i = 0; i < slots.length; i++) {
			var picture = pick(slots[i], i);
			if (!picture) {
				continue;
			}
			// Always as width/height attributes: the editor's extended_valid_elements
			// permits only src/alt/width/height on an <img>, so a style carrying the
			// size is stripped and the picture renders at its full native size --
			// which for a screenshot means it overflows the message and pushes the
			// text into a narrow column beside it.
			var dimensions = slots[i].width && slots[i].height ?
				' width="' + slots[i].width + '" height="' + slots[i].height + '"' : "";
			replacements.push({
				start: slots[i].start,
				length: slots[i].length,
				html: '<img src="data:' + picture.mime + ";base64," + picture.base64 + '"' + dimensions + ">"
			});
		}

		// Applied back to front so that the offsets collected above stay valid.
		var out = html;
		for (i = replacements.length - 1; i >= 0; i--) {
			out = out.slice(0, replacements[i].start) + replacements[i].html +
				out.slice(replacements[i].start + replacements[i].length);
		}

		// Now that the pictures have been taken out of it, drop the leftover VML
		// and Office markup. This is not cosmetic: Word writes these elements
		// self-closing (<v:rect ... />), and an HTML parser does not honour that
		// on an unknown element -- so such a tag stays OPEN and adopts the rest of
		// the paragraph as its children. A floating annotation shape carries
		// position:absolute plus its own narrow width, which then lays the
		// following text out as a narrow column on top of the image.
		out = out.replace(/<\/?(?:v|o|w|x)\:[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g, "");

		return { html: out, replaced: replacements.length };
	}
};
