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

	// Add some classes to the body tag, so we can change styles (for IE)
	bodyEl.className += (bodyEl.className.length>0 ? ' ' : '') +
		navigator.sayswho.split(' ')[0] + ' ' +
		navigator.sayswho.replace(' ','');

	var img = document.createElement('img');
	img.onload = function() {
		cntEl.style.visibility = 'visible';
	};
	img.src = window.getComputedStyle(maskEl, false).backgroundImage.slice(4, -1).replace(/"/g, "");

	// call it once to initialize the elements
	onResize();

	window.addEventListener('resize', onResize);

	return onResize;
}());
