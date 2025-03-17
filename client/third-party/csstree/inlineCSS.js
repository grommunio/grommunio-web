/*--------------------------------------------------------------------
 inlineCSS

 inlineCSS wrapper based on CSSTree

 For HTML-based emails, the most effective and widely used method to
 ensure proper display in a wide variety of email clients is to inline
 CSS designs into the to-be-applied html elements directly. This 
 function wraps around CSSTree to do the parsing and return the
 content properly inlined.
--------------------------------------------------------------------*/

function inlineCSS(content) {
	// Parse the content as HTML fragment
	const doc = new DOMParser().parseFromString(content, 'text/html');
	const styleTags = doc.querySelectorAll('style');

	styleTags.forEach(styleTag => {
		const cssAST = CSSTree.parse(styleTag.textContent);
		cssAST.children.forEach(rule => {
			if (rule.type === 'Rule') {
				const selector = CSSTree.generate(rule.prelude);
				// Apply CSS only to elements that are not images
				const matchingElements = Array.from(doc.querySelectorAll(selector))
					.filter(element => element.tagName !== 'IMG');
				matchingElements.forEach(element => {
					const styleText = Array.from(rule.block.children)
						.map(decl => `${decl.property}: ${CSSTree.generate(decl.value)};`)
						.join(' ');
					element.style.cssText += styleText;
				});
			}
		});
		// Remove the style tag after processing
		styleTag.remove();
	});
	// Return only the inner HTML of the body (not a full document)
	return doc.body.innerHTML;
}

