/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.ui.htmleditor');

/**
 * @class Grommunio.common.ui.htmleditor.InlineCSS
 * Moves the rules of a mail's &lt;style&gt; sheets into the style attributes
 * of the elements they match. TinyMCE drops &lt;style&gt; while parsing, so a
 * quoted mail keeps its formatting only when inlined beforehand. Parsing and
 * value handling are left to the browser's own CSS engine.
 * @singleton
 */
Grommunio.common.ui.htmleditor.InlineCSS = function() {
	// Selectors for states and pseudo elements an inline style cannot express
	var unusableRe = /::|:(hover|active|focus|focus-within|focus-visible|visited|target|before|after|first-line|first-letter)\b/i;

	// Splits a selector list at its top-level commas
	function splitSelectors(text) {
		var parts = [], depth = 0, quote = null, start = 0;
		for (var i = 0; i < text.length; i++) {
			var ch = text[i];
			if (quote) {
				if (ch === '\\') {
					i++;
				} else if (ch === quote) {
					quote = null;
				}
			} else if (ch === '"' || ch === "'") {
				quote = ch;
			} else if (ch === '(' || ch === '[') {
				depth++;
			} else if (ch === ')' || ch === ']') {
				depth--;
			} else if (ch === ',' && depth === 0) {
				parts.push(text.slice(start, i).trim());
				start = i + 1;
			}
		}
		parts.push(text.slice(start).trim());
		return parts;
	}

	// Specificity as one number, close enough for mail stylesheets
	function specificity(selector) {
		var a = 0, b = 0, c = 0;
		var s = selector.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '')
			.replace(/:where\([^()]*\)/gi, '')
			.replace(/\[[^\]]*\]/g, function() { b++; return ' '; })
			.replace(/#[\w-]+/g, function() { a++; return ' '; })
			.replace(/\.[\w-]+/g, function() { b++; return ' '; })
			// :not(), :is() and :has() count their arguments only
			.replace(/:(?:not|is|has)\(/gi, ' (')
			.replace(/:[\w-]+(\([^()]*\))?/g, function() { b++; return ' '; });
		c = (s.match(/(?:^|[\s>+~(])[a-z][\w-]*/gi) || []).length;
		return a * 10000 + b * 100 + c;
	}

	function copyDeclarations(from, to, important) {
		for (var i = 0; i < from.length; i++) {
			var prop = from[i];
			var prio = from.getPropertyPriority(prop);
			if ((prio === 'important') === important) {
				to.setProperty(prop, from.getPropertyValue(prop), prio);
			}
		}
	}

	return {
		/**
		 * @param {String} content HTML, a fragment or a whole document
		 * @return {String} the body's HTML with every usable rule inlined
		 */
		inline: function(content)
		{
			var doc = new DOMParser().parseFromString(content, 'text/html');
			// Sheets of an inert document are parsed, but never applied
			var scratch = document.implementation.createHTMLDocument('');
			var matches = [];
			var order = 0;

			Array.prototype.forEach.call(doc.querySelectorAll('style'), function(styleTag) {
				// A sheet inside a quoted mail styles that quote, not the whole message
				var parent = styleTag.parentElement;
				var scope = !parent || parent.closest('head') ? doc.body : parent;
				var holder = scratch.createElement('style');
				holder.textContent = styleTag.textContent;
				scratch.head.appendChild(holder);
				var rules = holder.sheet ? Array.prototype.slice.call(holder.sheet.cssRules) : [];
				holder.remove();
				styleTag.remove();

				// Only top-level style rules; @media and friends cannot be decided here
				rules.forEach(function(rule) {
					if (!(rule instanceof CSSStyleRule) || rule.style.length === 0) {
						return;
					}
					splitSelectors(rule.selectorText).forEach(function(selector) {
						if (unusableRe.test(selector)) {
							return;
						}
						var elements;
						try {
							elements = scope.querySelectorAll(selector);
						} catch (e) {
							return;
						}
						var weight = specificity(selector);
						var pos = order++;
						Array.prototype.forEach.call(elements, function(element) {
							// Leave images alone, inline images depend on their size attributes
							if (element.tagName !== 'IMG') {
								matches.push({ element: element, weight: weight, pos: pos, style: rule.style });
							}
						});
					});
				});
			});

			// The cascade: specificity, then source order. The element's own
			// style beats the sheet, except for the sheet's !important.
			matches.sort(function(x, y) {
				return x.weight - y.weight || x.pos - y.pos;
			});
			var byElement = new Map();
			matches.forEach(function(m) {
				if (!byElement.has(m.element)) {
					byElement.set(m.element, []);
				}
				byElement.get(m.element).push(m.style);
			});
			byElement.forEach(function(styles, element) {
				var result = scratch.createElement('span').style;
				var own = scratch.createElement('span');
				own.setAttribute('style', element.getAttribute('style') || '');
				styles.forEach(function(style) {
					copyDeclarations(style, result, false);
				});
				copyDeclarations(own.style, result, false);
				styles.forEach(function(style) {
					copyDeclarations(style, result, true);
				});
				copyDeclarations(own.style, result, true);
				element.setAttribute('style', result.cssText);
			});

			return doc.body.innerHTML;
		}
	};
}();
