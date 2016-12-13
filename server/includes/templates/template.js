navigator.sayswho = (function(){
	var ua= navigator.userAgent, tem,
	M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if(/trident/i.test(M[1])){
		tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
		return 'MSIE '+(tem[1] || '');
    }
	if(M[1]=== 'Chrome'){
		tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
		if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
	}
	M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);

	return M.join(' ');
})();

var bodyEl;
var maskEl;
var cntEl;
var bgEl;
var logoEl;

// Our designer doesn't want the box in the center of the screen, instead
// he wants the center of the box at 7/16 of the height of the window :-)
var centerlinePos = 7/16;

function onResize() {
	if ( !bodyEl ) return;

	var elemTop = centerlinePos * maskEl.clientHeight - cntEl.clientHeight / 2;

	cntEl.style.top = elemTop + 'px';
	cntEl.style.left = (maskEl.clientWidth - cntEl.clientWidth) / 2 + 'px';
	bgEl.style.width = maskEl.clientWidth + 'px';
	bgEl.style.height = maskEl.clientHeight + 'px';
	bgEl.style.top = -elemTop / 2 + 'px';
	bgEl.style.left = -(maskEl.clientWidth - cntEl.clientWidth) / 2 + 'px';
};

window.addEventListener('resize', onResize);
