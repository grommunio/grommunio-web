<?php

namespace WAYF {
	function mb_convert_encoding($value, $toEncoding, $fromEncoding) {
		unset($value, $toEncoding, $fromEncoding);

		return [];
	}
}

namespace {
	use WAYF\NemidLogin;

	chdir(dirname(__DIR__));
	require_once 'php/lib/Nemid.php';

	$config = (object) [
		'certificate' => 'test/user.crt',
		'serverurlprefix' => 'https://example.test',
		'nonceprefix' => 'test-',
	];

	try {
		(new NemidLogin())->prepareparamsfornemid($config);

		throw new RuntimeException('A failed NemID parameter conversion was accepted.');
	}
	catch (RuntimeException $e) {
		if ($e->getMessage() !== 'Unable to normalize NemID request parameters.') {
			throw $e;
		}
	}

	echo "NemID parameter encoding checks passed\n";
}
