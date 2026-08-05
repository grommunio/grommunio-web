/* exported resizeLoginBox */
const resizeLoginBox = (function() {
	// Our designer doesn't want the box in the center of the screen, instead
	// he wants the center of the box at 7/16 of the height of the window :-)
	const centerlinePos = 7/16;
	const bodyEl = document.getElementsByTagName('body')[0];
	const bgEl = document.getElementById('bg');
	const cntEl = document.getElementById('form-container');
	const maskEl = document.getElementById('loading-mask') || bodyEl;

	function onResize() {
		if (!bodyEl) {
			return;
		}

		const elemTop = centerlinePos * maskEl.clientHeight - cntEl.clientHeight / 2;
		const left = (maskEl.clientWidth - cntEl.clientWidth) / 2;

		cntEl.style.top = elemTop + 'px';
		cntEl.style.left = left + 'px';
		bgEl.style.width = maskEl.clientWidth + 'px';
		bgEl.style.height = maskEl.clientHeight + 'px';
		bgEl.style.top = -elemTop + 'px';
		bgEl.style.left = -left + 'px';
	}

	// the background may be a plain gradient without an image to wait for
	const show = function() {
		cntEl.style.visibility = 'visible';
	};
	const bgImage = /url\("?([^")]+)"?\)/.exec(window.getComputedStyle(maskEl, false).backgroundImage);
	if (bgImage) {
		const img = document.createElement('img');
		img.onload = img.onerror = show;
		img.src = bgImage[1];
	} else {
		show();
	}

	// call it once to initialize the elements
	onResize();

	window.addEventListener('resize', onResize);

	return onResize;
}());
