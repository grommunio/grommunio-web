<?php

namespace WAYF;

require_once __DIR__ . '/DerEncoder.php';
require_once __DIR__ . '/X509.php';

/**
 * OCSP is able to encode OCSPRequests and decode OCSPResponses - just enough for NemID use.
 *
 * Encoding methods delegate to the shared DerEncoder class.
 */
class OCSP extends X509 {
	public function request($certids = []) {
		$certids_der = '';
		foreach ($certids as $certid) {
			$certids_der .= $this->sequence(
				DerEncoder::algorithmIdentifier($certid['hash_alg']) .
							$this->octetstring($certid['issuerNameHash']) .
							$this->octetstring($certid['issuerKeyHash']) .
							$certid['serialNumber_der']
			);
		}

		return $this->sequence($this->sequence($this->sequence($this->sequence($certids_der))));
	}

	private function sequence($pdu) {
		return DerEncoder::sequence($pdu);
	}

	protected function octetstring($s) {
		return DerEncoder::octetString($s);
	}

	protected function s2oid($s) {
		return DerEncoder::oid((string) $s);
	}

	public function certOcspID($certid = [], $hash_alg = 'sha256') {
		$hash_algs = ['sha1' => "1.3.14.3.2.26", 'sha256' => "2.16.840.1.101.3.4.2.1"];
		if (!isset($hash_algs[$hash_alg], $certid['issuerName'], $certid['issuerKey'], $certid['serialNumber_der'], $certid['serialNumber'])) {
			throw new \InvalidArgumentException('Incomplete certificate identifier for OCSP request');
		}

		return [
			'hash_alg' => $hash_algs[$hash_alg],
			'hash_alg_name' => $hash_alg,
			'issuerNameHash' => openssl_digest($certid['issuerName'], $hash_alg, true),
			'issuerKeyHash' => openssl_digest($certid['issuerKey'], $hash_alg, true),
			'serialNumber_der' => $certid['serialNumber_der'],
			'serialNumber' => (string) $certid['serialNumber'],
		];
	}

	public function response($der) {
		$this->init($der);
		$this->beginsequence();
		$ocspresponse = [];
		$ocspresponse['responseStatus'] = $this->responseStatus();
		if ($ocspresponse['responseStatus'] === 'successful') {
			$ocspresponse['responseBytes'] = $this->responseBytes();
		}
		$this->end();

		return $ocspresponse;
	}

	protected function responseStatus() {
		$responsestatus = [
			'successful',
			'malformedRequest',
			'internalError',
			'tryLater',
			'NOT USED',
			'sigRequired',
			'unauthorized',
		];

		$status = $this->next(10);
		if (!isset($responsestatus[$status])) {
			throw new \UnexpectedValueException("Unknown OCSP response status {$status}");
		}

		return $responsestatus[$status];
	}

	protected function responseBytes() {
		$res = [];
		$this->begin(0);
		$this->beginsequence();
		$res['responseType'] = $this->oid();
		if ($res['responseType'] === 'ocspBasic') {
			$res['BasicOCSPResponse'] = $this->ocspBasic($this->next(4));
		}
		$this->end();
		$this->end();

		return $res;
	}

	protected function ocspBasic($der) {
		$res = [];
		$this->xtns->init($der);
		$this->xtns->beginsequence();
		$res['tbsResponseData_der'] = $this->xtns->der();
		$res['tbsResponseData'] = $this->tbsResponseData();
		$signatureAlgorithmParameters = null;
		$res['signatureAlgorithm'] = $this->xtns->signatureAlgorithm($signatureAlgorithmParameters);
		if ($signatureAlgorithmParameters !== null) {
			$res['signatureAlgorithmParameters'] = $signatureAlgorithmParameters;
		}
		$res['signature'] = $this->xtns->next(3);

		if ($this->xtns->peek() === 0) {
			$this->xtns->begin(0);
			if ($this->xtns->peek() === 16) {
				$this->xtns->beginsequence();
				$x = new X509();
				$res['certs'] = [];
				while ($this->xtns->in()) {
					$res['certs'][] = $x->certificate($this->xtns->der(null, true)); # get and continue past ...
				}
				$this->xtns->end();
			}
			$this->xtns->end();
		}
		$this->xtns->end();

		return $res;
	}

	protected function tbsResponseData() {
		$res = ['version' => '0'];
		$this->xtns->beginsequence();
		if ($this->xtns->peek() === 0) {
			$this->xtns->begin(0);
			$res['version'] = $this->xtns->next(2);
			$this->xtns->end();
		}
		$choice = $this->xtns->peek();
		if ($choice !== 1 && $choice !== 2) {
			throw new \UnexpectedValueException("Unsupported OCSP responderID choice {$choice}");
		}
		$this->xtns->begin($choice);
		if ($choice === 1) {
			$res['responderID']['byName'] = $this->xtns->name();
		}
		else {
			$res['responderID']['byKey'] = $this->xtns->keyident();
		}
		$this->xtns->end();
		$res['producedAt'] = $this->xtns->time();
		$res['responses'] = $this->singleResponses();
		if ($this->xtns->in() && $this->xtns->peek() === 1) {
			$this->xtns->begin(1);
			$res['responseExtensions'] = $this->xtns->extensions();
			$this->xtns->end();
		}
		$this->xtns->end();

		return $res;
	}

	protected function singleResponses() {
		$res = [];
		$this->xtns->beginsequence();
		while ($this->xtns->in()) {
			$srres = [];
			$this->xtns->beginsequence();
			$srres['certID'] = $this->certID();
			$certstatuses = ['good', 'revoked', 'unknown'];
			$status = $this->xtns->peek();
			if (!isset($certstatuses[$status])) {
				throw new \UnexpectedValueException("Unknown OCSP certificate status {$status}");
			}
			$srres['certStatus'] = $certstatuses[$status];
			if ($status === 1) {
				$this->xtns->begin(1);
				$srres['revokedInfo']['revocationTime'] = $this->xtns->time();
				if ($this->xtns->in() && $this->xtns->peek() === 0) {
					$this->xtns->begin(0);
					$srres['revokedInfo']['revocationReason'] = $this->xtns->next(10);
					$this->xtns->end();
				}
				$this->xtns->end();
			}
			else {
				$this->xtns->next($status);
			}
			$srres['thisUpdate'] = $this->xtns->time();
			if ($this->xtns->in() && $this->xtns->peek() === 0) {
				$this->xtns->begin(0);
				$srres['nextupdate'] = $this->xtns->time();
				$this->xtns->end();
			}
			if ($this->xtns->in() && $this->xtns->peek() === 1) {
				$this->xtns->begin(1);
				$srres['singleExtensions'] = $this->xtns->extensions();
				$this->xtns->end();
			}
			$res[] = $srres;
			$this->xtns->end();
		}
		$this->xtns->end();

		return $res;
	}

	public function certID() {
		$res = [];
		$this->xtns->beginsequence();
		$res['hashAlgorithm'] = $this->xtns->signatureAlgorithm();
		$res['issuerNameHash'] = $this->xtns->next(4);
		$res['issuerKeyHash'] = $this->xtns->next(4);
		$res['serialNumber'] = $this->xtns->next(2);
		$this->xtns->end();

		return $res;
	}

	/**
	 * Decode RSASSA-PSS parameters from an AlgorithmIdentifier.
	 *
	 * @return array{hash: string, mgfHash: string, saltLength: int, trailerField: int}
	 */
	public function rsaPssParameters(string $der): array {
		$parameters = [
			'hash' => 'sha1',
			'mgfHash' => 'sha1',
			'saltLength' => 20,
			'trailerField' => 1,
		];

		$this->init($der);
		$this->beginsequence();
		if ($this->in() && $this->peek() === 0) {
			$this->begin(0);
			$hashParameters = null;
			$parameters['hash'] = $this->normalizeHashAlgorithm($this->signatureAlgorithm($hashParameters));
			$this->requireNullOrAbsentParameters($hashParameters);
			$this->end();
		}
		if ($this->in() && $this->peek() === 1) {
			$this->begin(1);
			$mgfParameters = null;
			$mgfAlgorithm = $this->signatureAlgorithm($mgfParameters);
			$this->end();
			if ($mgfAlgorithm !== 'pkcs1-MGF' || !is_string($mgfParameters)) {
				throw new \UnexpectedValueException('RSASSA-PSS requires MGF1 parameters');
			}
			$mgfIdentifier = (new self())->algorithmIdentifier($mgfParameters);
			$parameters['mgfHash'] = $this->normalizeHashAlgorithm($mgfIdentifier['algorithm']);
			$this->requireNullOrAbsentParameters($mgfIdentifier['parameters']);
		}
		if ($this->in() && $this->peek() === 2) {
			$this->begin(2);
			$parameters['saltLength'] = $this->smallNonNegativeInteger(
				$this->nonNegativeInteger('RSASSA-PSS salt length'),
				'salt length'
			);
			$this->end();
		}
		if ($this->in() && $this->peek() === 3) {
			$this->begin(3);
			$parameters['trailerField'] = $this->smallNonNegativeInteger(
				$this->nonNegativeInteger('RSASSA-PSS trailer field'),
				'trailer field'
			);
			$this->end();
		}
		$this->end();
		if ($this->i !== strlen($der)) {
			throw new \UnexpectedValueException('Trailing data after RSASSA-PSS parameters');
		}

		return $parameters;
	}

	/**
	 * Decode one complete AlgorithmIdentifier value.
	 *
	 * @return array{algorithm: string, parameters: null|string}
	 */
	private function algorithmIdentifier(string $der): array {
		$this->init($der);
		$parameters = null;
		$algorithm = $this->signatureAlgorithm($parameters);
		if ($this->i !== strlen($der)) {
			throw new \UnexpectedValueException('Trailing data after AlgorithmIdentifier');
		}

		return ['algorithm' => $algorithm, 'parameters' => $parameters];
	}

	private function normalizeHashAlgorithm(string $algorithm): string {
		$algorithm = str_replace('-', '', strtolower($algorithm));
		if (!in_array($algorithm, ['sha1', 'sha224', 'sha256', 'sha384', 'sha512'], true)) {
			throw new \UnexpectedValueException("Unsupported RSASSA-PSS hash algorithm {$algorithm}");
		}

		return $algorithm;
	}

	private function requireNullOrAbsentParameters(?string $parameters): void {
		if ($parameters !== null && $parameters !== "\x05\x00") {
			throw new \UnexpectedValueException('Invalid hash AlgorithmIdentifier parameters');
		}
	}

	private function smallNonNegativeInteger($value, string $name): int {
		if (!is_string($value) || preg_match('/\A(?:0|[1-9][0-9]{0,8})\z/D', $value) !== 1) {
			throw new \UnexpectedValueException("Invalid RSASSA-PSS {$name}");
		}

		return (int) $value;
	}
}
