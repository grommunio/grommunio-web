<?php

require_once __DIR__ . '/smimeTest.php';
require_once dirname(__DIR__, 3) . '/server/includes/core/class.plugin.php';

set_include_path(dirname(__DIR__) . '/php' . PATH_SEPARATOR . get_include_path());
require_once dirname(__DIR__) . '/php/plugin.smime.php';

defined('PR_SMTP_ADDRESS') || define('PR_SMTP_ADDRESS', 1);
defined('PR_ADDRTYPE') || define('PR_ADDRTYPE', 2);

/**
 * @internal
 *
 * @covers \Pluginsmime::getPublicKeysForRecipients
 */
class RecipientCertificatesTest extends SMIMETest {
	public function testRecipientCertificatesDoNotLeakBetweenRows(): void {
		$plugin = new class extends Pluginsmime {
			public function getGABUser($email) {
				return $email;
			}

			public function getGABCert($user) {
				return 'gab:' . $user;
			}

			public function getPublicKey($emailAddress, $multiple = false) {
				return base64_encode('store:' . $emailAddress);
			}

			public function resolveRecipients(array $recipients): array {
				return $this->getPublicKeysForRecipients($recipients);
			}
		};

		$certificates = $plugin->resolveRecipients([
			[PR_SMTP_ADDRESS => 'directory@example.test', PR_ADDRTYPE => 'EX'],
			[PR_SMTP_ADDRESS => 'smtp@example.test', PR_ADDRTYPE => 'SMTP'],
		]);

		$this->assertSame([
			'gab:directory@example.test',
			'store:smtp@example.test',
		], $certificates);
	}
}
