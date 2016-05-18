<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">

		<!-- Always force latest IE rendering engine (even in intranet) & Chrome Frame
		Remove this if you use the .htaccess -->
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

		<title><?php echo $webappTitle; ?></title>
		<meta name="description" content="Kopano WebApp is the ultimate frontend client for Kopano server. A rich collaboration platform utilizing e-mail, calendars, webmeetings, file sharing and more.">
		<meta name="author" content="Kopano.io">

		<meta name="viewport" content="width=device-width, initial-scale=1.0">

		<!--link rel="apple-touch-icon" href="/apple-touch-icon.png"-->
		<link rel="icon" href="<?php echo $favicon ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon ?>" type="image/x-icon">

		<link rel="stylesheet" type="text/css" href="client/resources/css/external/login.css">

		<?php
			/* Add the styling of the theme */
			$css = Theming::getCss($theme);
			if ( count($css) ){
				foreach ( $css as $file ){
					echo '<link rel="stylesheet" type="text/css" href="'.$file.'">';
				}
			}
		?>

		<script>
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
			var cntEl;
			var bgEl;
			
			// Our designer doesn't want the box in the center of the screen, instead
			// he wants the center of the box at 7/16 of the height of the window :-)
			var centerlinePos = 7/16;

			function onResize() {
				if ( !bodyEl ) return;
				
				var top = centerlinePos * bodyEl.clientHeight - cntEl.clientHeight / 2;
				
				cntEl.style.top = top + 'px';
				cntEl.style.left = (bodyEl.clientWidth - cntEl.clientWidth) / 2 + 'px';
				bgEl.style.width = bodyEl.clientWidth + 'px';
				bgEl.style.height = bodyEl.clientHeight + 'px';
				bgEl.style.top = (-top + (navigator.sayswho==='MSIE 9'?200:0) / 2) + 'px';
				bgEl.style.left = -(bodyEl.clientWidth - cntEl.clientWidth + (navigator.sayswho==='MSIE 9'?200:0)) / 2 + 'px';
			};
			window.addEventListener('resize', onResize);

			function onLoad() {
				if (document.getElementById("username").value == ""){
					document.getElementById("username").focus();
				}else if (document.getElementById("password").value == ""){
					document.getElementById("password").focus();
				} else {
					document.getElementById("submitbutton").focus();
				}
			}
			window.onload = onLoad;
		</script>
		
		<script type="text/javascript" src="client/fingerprint.js" ></script>
	</head>

	<body class="login">
		<div id="form-container">
			<div id="bg"></div>
			<div id="content">
				<div class="left">
					<div id="logo"></div>
					<h2><?php echo $version; ?></h2>
					<?php if ( !empty($branch) ) { ?>
					<h2><i><?php echo $branch; ?></i></h2>
					<?php } ?>
					<h2 class="zcp-version"><?php echo $zcpversion; ?></h2>
				</div>
				<div class="right">
					<h1>Welcome</h1>
					<form action="<?php echo $url ?>" method="post">
						<label for="username">Username</label>
						<input type="text" name="username" id="username" value="<?php echo $user; ?>" autofocus="autofocus">
						
						<label for="password">Password</label>
						<input type="password" name="password" id="password">
						
						<?php if ( isset($error) ) { ?>
						<div id="error"><?php echo $error; ?></div>
						<?php } ?>

						<input id="submitbutton" class="button" type="submit" value="Sign in">
					</form>
				</div>
			</div>
		</div>

		<script type="text/javascript">
			bodyEl = document.getElementsByTagName('body')[0];
			cntEl = document.getElementById('form-container');
			bgEl = document.getElementById('bg');

			// Add some classes to the body tag, so we can change styles (for IE)
			bodyEl.className += (bodyEl.className.length>0 ? ' ' : '') + navigator.sayswho.split(' ')[0];
			bodyEl.className += ' ' + navigator.sayswho.replace(' ','');
			
			// Show the login box when the background image has loaded
			var img = document.createElement('img');
			img.onload = function(){
				cntEl.style.visibility = 'visible';
			}
			img.src = window.getComputedStyle(bodyEl, false).backgroundImage.slice(4, -1).replace(/"/g, "");

			// call it once to initialize the elements
			onResize();

			// Show a spinner when submitting
			var form = document.getElementsByTagName('form')[0];
			// Some browsers need some time to draw the spinner (MS Edge!),
			// so we use this variable to delay the submit a little;
			var firstSubmit = true;
			form.onsubmit = function(){
				if ( !firstSubmit ){
					return true;
				}
				// Adding this class will show the loader
				cntEl.className += ' loading';
				// Call onResize, because an error message might have enlarged the login box, 
				// so it is out of position.
				onResize();
				firstSubmit = false;
				window.setTimeout(function(){ form.submit(); }, 10);
				return false;
			};
		</script>
	</body>
</html>
