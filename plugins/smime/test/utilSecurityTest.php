<?php

require_once 'test/smimeTest.php';
require_once 'php/util.php';

/**
 * @internal
 *
 * @coversNothing
 */
class UtilSecurityTest extends SMIMETest {
	public function testLegacyNumericResourceHostsAreRejected() {
		$urls = [
			'http://2130706433/',
			'http://017700000001/',
			'http://0x7f000001/',
			'http://0x7f.0.0.1/',
			'http://0177.0x0.0.01/',
		];

		foreach ($urls as $url) {
			$this->assertNull(aiaResolvePin($url, true), $url);
		}
	}

	public function testOrdinaryDnsHostRemainsAvailableForPrivatePkiOptIn() {
		$this->assertSame([], aiaResolvePin('https://ca.example.test/aia', true));
	}

	public function testAiaCacheRejectsUnsafeEntriesAndReplacesLinksAtomically() {
		$baseDir = sys_get_temp_dir() . '/smime-aia-' . bin2hex(random_bytes(8));
		$cacheDir = $baseDir . '/smime';
		$cacheFile = $cacheDir . '/aia-test.pem';
		$target = $baseDir . '/target';
		$this->assertTrue(mkdir($cacheDir, 0750, true));

		try {
			$this->assertSame(6, file_put_contents($target, 'target'));
			$this->assertTrue(symlink($target, $cacheFile));
			$this->assertNull(readAiaCacheFile($cacheFile));
			$this->assertTrue(writeAiaCacheFile($cacheDir, $cacheFile, 'cached'));
			clearstatcache(true, $cacheFile);
			$this->assertFalse(is_link($cacheFile));
			$this->assertSame('cached', file_get_contents($cacheFile));
			$this->assertSame('target', file_get_contents($target));
			$this->assertSame(0, fileperms($cacheDir) & 0077);
			$this->assertSame(0, fileperms($cacheFile) & 0077);

			$this->assertTrue(unlink($cacheFile));
			$this->assertSame(6, file_put_contents($cacheFile, 'legacy'));
			$this->assertTrue(chmod($cacheFile, 0660));
			clearstatcache(true, $cacheFile);
			$this->assertNull(readAiaCacheFile($cacheFile));
		}
		finally {
			@unlink($cacheFile);
			@unlink($target);
			@rmdir($cacheDir);
			@rmdir($baseDir);
		}
	}
}
