<?php
	$oidcSettings = Array(
		'authority' => OIDC_ISS,
		'client_id' => OIDC_CLIENT_ID,
		'response_type' => 'id_token token',
		'scope' => OIDC_SCOPE,
		'includeIdTokenInSilentRenew' => true,
		'automaticSilentRenew' => true,
		'includeIdTokenInSilentRenew' => true,
	);
?>

<script type="text/javascript"><?php require(BASE_PATH . 'client/oidc/oidc-client.js'); ?></script>
<script type="text/javascript"><?php require(BASE_PATH . 'client/oidc-kopano.js'); ?></script>
<meta name="oidc-settings" id="oidc-settings" content="<?php echo htmlspecialchars(json_encode($oidcSettings)); ?>">
