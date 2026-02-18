<?php

namespace WAYF;

require_once __DIR__ . '/DerEncoder.php';

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

		return [
			'hash_alg' => $hash_algs[$hash_alg],
			'issuerNameHash' => openssl_digest($certid['issuerName'], $hash_alg, true),
			'issuerKeyHash' => openssl_digest($certid['issuerKey'], $hash_alg, true),
			'serialNumber_der' => $certid['serialNumber_der'],
		];
	}

	public function response($der) {
		$this->init($der);
		$this->beginsequence();
		$ocspresponse['responseStatus'] = $this->responseStatus();
		if ($ocspresponse['responseStatus'] == 'successful') {
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

		return $responsestatus[$this->next(10)];
	}

	protected function responseBytes() {
		$this->next(0);
		$this->beginsequence();
		$res['responseType'] = $this->oid();
		if ($res['responseType'] == 'ocspBasic') {
			$res['BasicOCSPResponse'] = $this->ocspBasic($this->next(4));
		}
		$this->end();

		return $res;
	}

	protected function ocspBasic($der) {
		$this->xtns->init($der);
		$this->xtns->beginsequence();
		$res['tbsResponseData_der'] = $this->xtns->der();
		$res['tbsResponseData'] = $this->tbsResponseData();
		$res['signatureAlgorithm'] = $this->xtns->signatureAlgorithm();
		$res['signature'] = $this->xtns->next(3);

		if ($this->xtns->peek() === 0) {
			$this->xtns->next(0);
			if ($this->xtns->peek() === 16) {
				$this->xtns->beginsequence();
				$x = new X509();
				while ($this->xtns->in()) {
					$res['certs'][] = $x->certificate($this->xtns->der(null, true)); # get and continue past ...
				}
				$this->xtns->end();
			}
		}
		$this->xtns->end();

		return $res;
	}

	protected function tbsResponseData() {
		$res['version'] = 0;
		$this->xtns->beginsequence();
		if ($this->xtns->peek() == 0) {
			$this->xtns->next(0);
			$res['version'] = $this->xtns->next(2);
		}
		$choice = $this->xtns->peek();
		$this->xtns->next();
		if ($choice == 1) {
			$res['responderID']['byName'] = $this->xtns->name();
		}
		elseif ($choice == 2) {
			$res['responderID']['byKey'] = $this->xtns->keyident();
		}
		$res['producedAt'] = $this->xtns->time();
		$res['responses'] = $this->singleResponses();
		$this->xtns->end();

		return $res;
	}

	protected function singleResponses() {
		$this->xtns->beginsequence();
		while ($this->xtns->in()) {
			$this->xtns->beginsequence();
			$srres['certID'] = $this->certID();
			$certstatuses = ['good', 'revoked', 'unknown'];
			$srres['certStatus'] = $certstatuses[$this->xtns->peek()];
			$this->xtns->next();
			$srres['thisUpdate'] = $this->xtns->time();
			if ($this->xtns->in() && $this->xtns->peek() == 0) {
				$this->xtns->next(0);
				$srres['nextupdate'] = $this->xtns->time();
			}
			if ($this->xtns->in() && $this->xtns->peek() == 1) {
				$this->xtns->next(1);
				$srres['singleextensions'] = $this->xtns->next;
			}
			$res[] = $srres;
			$this->xtns->end();
		}
		$this->xtns->end();

		return $res;
	}

	public function certID() {
		$this->xtns->beginsequence();
		$res['hashAlgorithm'] = $this->xtns->signatureAlgorithm();
		$res['issuerNameHash'] = $this->xtns->next(4);
		$res['issuerKeyHash'] = $this->xtns->next(4);
		$res['serialNumber'] = $this->xtns->next(2);
		$this->xtns->end();

		return $res;
	}
}
