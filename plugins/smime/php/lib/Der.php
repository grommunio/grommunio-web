<?php

namespace WAYF;

require_once 'Oids.php';

class Der extends Oids {
	protected $tag;
	protected $len;
	protected $value;
	protected $class;
	protected $constructed;
	protected $buffer;
	protected $stack = [];
	protected $i;
	private $id;

	protected function init($der) {
		if (!is_string($der) || $der === '') {
			throw new \UnexpectedValueException('DER input must be a non-empty string');
		}

		$this->buffer = $der;
		$this->i = 0;
		$this->stack = [];
		$this->id = uniqid();
	}

	protected function dump($note = '') {
		$z = strlen((string) $this->buffer) - $this->i;
		print_r("{$note}\n");
		print_r("len: {$z}\n");
		print_r(chunk_split(bin2hex(substr((string) $this->buffer, $this->i)), 2, ':'));
		echo "\n";
	}

	protected function pr($note = '') {
		$savei = $this->i;
		$byte = ord($this->buffer[$this->i++]);
		$tag = $byte & 0x1F;
		$class = $byte & 0xC0;
		$constructed = $byte & 0x20;
		$len = $this->vallen();
		$this->i = $savei;
		print_r("{$note}\n");
		print_r("i  : {$this->i}\n");
		print_r("len: {$len}\n");
		print_r("class:   {$class}\n");
		print_r("tag  :   {$tag}\n");
		print_r(chunk_split(bin2hex(substr((string) $this->buffer, $this->i, min(32, strlen((string) $this->buffer) - $this->i))) . "\n", 2, ':'));
		print_r("---\n");
	}

	private function tlv($expectedtag = null) {
		$this->requireBytes(1);
		$byte = ord($this->buffer[$this->i++]);
		$this->tag = $byte & 0x1F;
		if ($this->tag === 0x1F) {
			throw new \UnexpectedValueException('High-tag-number DER values are not supported');
		}
		if ($expectedtag !== null && $expectedtag < 0) {
			$this->tag = $expectedtag = -$expectedtag;
		}
		if ($expectedtag !== null && $expectedtag !== $this->tag) {
			throw new \UnexpectedValueException("Expected DER tag {$expectedtag}, got {$this->tag} ({$this->id})");
		}
		$this->class = $byte & 0xC0;
		$this->constructed = $byte & 0x20;
		$this->len = $this->vallen();
		$this->requireBytes($this->len);
	}

	protected function next($expectedtag = null) {
		$this->tlv($expectedtag);
		$this->value = null;
		if ($this->constructed) {
			return;
		}
		$value = substr((string) $this->buffer, $this->i, $this->len);
		if ($this->class == 0 || $this->class == 0x80) {
			if ($this->tag == 2 || $this->tag == 10) { # ints and enums
				if ($value === '') {
					throw new \UnexpectedValueException('DER INTEGER must not be empty');
				}
				$int = '0';
				foreach (str_split($value) as $byte) {
					$int = $this->decimalMultiplyAndAdd($int, 256, ord($byte));
				}
				$this->value = $int;
			}
			elseif ($this->tag == 1) { # boolean
				if (strlen($value) !== 1) {
					throw new \UnexpectedValueException('DER BOOLEAN must contain exactly one byte');
				}
				$this->value = ord($value) != 0;
			}
			elseif ($this->tag == 3) { # bit string
				$this->value = $value;
			}
			elseif ($this->tag == 5) { # null
				$this->value = null;
			}
			else {
				$this->value = $value;
			}
		}
		$this->i += $this->len;

		return $this->value;
	}

	/**
	 * Decode a canonical, non-negative DER INTEGER as an unsigned decimal string.
	 *
	 * @param string $name value name used in parse errors
	 *
	 * @return string normalized unsigned decimal value
	 */
	protected function nonNegativeInteger(string $name = 'DER INTEGER'): string {
		$this->tlv(2);
		if ($this->class !== 0 || $this->constructed || $this->len === 0) {
			throw new \UnexpectedValueException("Invalid {$name}");
		}
		$value = substr((string) $this->buffer, $this->i, $this->len);
		$this->i += $this->len;
		if ((ord($value[0]) & 0x80) !== 0) {
			throw new \UnexpectedValueException("{$name} must be non-negative");
		}
		if (strlen($value) > 1 && $value[0] === "\x00" && (ord($value[1]) & 0x80) === 0) {
			throw new \UnexpectedValueException("Non-canonical {$name}");
		}

		$number = '0';
		foreach (str_split($value) as $byte) {
			$number = $this->decimalMultiplyAndAdd($number, 256, ord($byte));
		}

		return $number;
	}

	protected function der($expectedtag = null, $pass = false) {
		$oldi = $this->i;
		$this->tlv($expectedtag);
		$i = $this->i;
		if (!$pass) {
			$this->i = $oldi;
		}
		else {
			$this->i += $this->len;
		}

		return substr((string) $this->buffer, $oldi, $this->len + $i - $oldi);
	}

	/*
	 * if provided with a tag and the tag is equal to the current tag
	 * peek considers it EXPLICIT, consumes it and return true
	 */
	protected function peek($tag = null) {
		$t = null;
		$end = end($this->stack);
		if ($end !== false && $this->i < $end) {
			$this->requireBytes(1);
			$t = ord($this->buffer[$this->i]) & 0x1F;
		}
		if ($tag !== null) {
			if ($t === $tag) {
				$this->next($tag);

				return true;
			}

			return false;
		}

		return $t;
	}

	protected function vallen() {
		$this->requireBytes(1);
		$byte = ord($this->buffer[$this->i++]);
		$res = $len = $byte & 0x7F;
		if ($byte >= 0x80) {
			if ($len === 0) {
				throw new \UnexpectedValueException('DER does not permit indefinite lengths');
			}
			if ($len > PHP_INT_SIZE) {
				throw new \UnexpectedValueException('DER length exceeds the supported integer size');
			}
			$this->requireBytes($len);
			$res = 0;
			for ($c = 0; $c < $len; ++$c) {
				$res = $res * 256 + ord($this->buffer[$this->i++]);
			}
		}

		return $res;
	}

	protected function beginsequence($tag = 16) {
		$this->begin($tag);
	}

	protected function beginset($tag = 17) {
		$this->begin($tag);
	}

	protected function begin($tag) {
		$this->next($tag);
		array_push($this->stack, $this->i + $this->len);
	}

	protected function in() {
		$end = end($this->stack);

		return $end !== false && $this->i < $end;
	}

	protected function end() {
		$end = array_pop($this->stack);
		if ($end === null || $end !== $this->i) {
			throw new \UnexpectedValueException("DER sequence or set length does not match: {$end} != {$this->i}");
		}
	}

	protected function extensions(array $allowedUnsupportedCritical = []) {
		$this->beginsequence();
		$extns = [];
		while ($this->in()) {
			$theext = [];
			$this->beginsequence();
			$extnID = $this->oid();
			$theext['critical'] = false;
			if ($this->peek() === 1) {
				$theext['critical'] = $this->next(1);
				if ($theext['critical'] !== true) {
					throw new \UnexpectedValueException("Extension {$extnID} encodes the DEFAULT critical value");
				}
			}
			$theext['extnValue'] = $this->next(4);

			if (method_exists($this, $extnID)) {
				try {
					$theext['extnValue'] = call_user_func([$this, $extnID], $theext['extnValue']);
				}
				catch (\Throwable $e) {
					if ($theext['critical']) {
						throw new \UnexpectedValueException("Unable to parse critical extension {$extnID}", 0, $e);
					}
					$theext['extnValue'] = chunk_split(bin2hex((string) $theext['extnValue']), 2, ':');
				}
			}
			elseif ($theext['critical'] && !in_array($extnID, $allowedUnsupportedCritical, true)) {
				throw new \UnexpectedValueException("Unsupported critical extension {$extnID}");
			}
			else {
				$theext['extnValue'] = chunk_split(bin2hex((string) $theext['extnValue']), 2, ':');
			}
			$this->end();
			$extns[$extnID] = $theext;
		}
		$this->end();

		return $extns;
	}

	protected function signatureAlgorithm(&$parametersDer = null) {
		$this->beginsequence();
		$salg = $this->oid();
		$parametersDer = null;
		if ($this->in()) {
			$parametersDer = $this->der(null, true);
		}
		$this->end();

		return $salg;
	}

	protected function name($tag = null) {
		$this->beginsequence($tag);
		$res = [];
		while ($this->in()) {
			$parts = [];
			$this->beginset(); # set of AttributeTypeAndValue
			while ($this->in()) {
				$this->beginsequence();
				$parts[$this->oid()] = $this->next(); # AttributeValue
				$this->end();
			}
			$this->end();
			$res[] = $parts;
		}
		$this->end();

		return $res;
	}

	protected function oid($tag = 6) {
		$v = $this->oid_($this->next($tag));

		return $this->oids[$v] ?? $v;
	}

	protected function oid_($oid) {
		if (!is_string($oid) || $oid === '') {
			throw new \UnexpectedValueException('DER OBJECT IDENTIFIER must not be empty');
		}

		$len = strlen($oid);
		$arcs = [];
		$n = '0';
		$atArcStart = true;
		for ($c = 0; $c < $len; ++$c) {
			$x = ord($oid[$c]);
			if ($atArcStart && $x === 0x80) {
				throw new \UnexpectedValueException('Non-minimal DER OBJECT IDENTIFIER arc');
			}
			$n = $this->decimalMultiplyAndAdd($n, 128, $x & 0x7F);
			if (($x & 0x80) === 0) {
				if ($arcs === []) {
					if ($this->compareDecimalToInt($n, 40) < 0) {
						$arcs[] = '0';
						$arcs[] = $n;
					}
					elseif ($this->compareDecimalToInt($n, 80) < 0) {
						$arcs[] = '1';
						$arcs[] = $this->decimalSubtractInt($n, 40);
					}
					else {
						$arcs[] = '2';
						$arcs[] = $this->decimalSubtractInt($n, 80);
					}
				}
				else {
					$arcs[] = $n;
				}
				$n = '0';
				$atArcStart = true;
			}
			else {
				$atArcStart = false;
			}
		}
		if ((ord($oid[$len - 1]) & 0x80) !== 0) {
			throw new \UnexpectedValueException('Truncated DER OBJECT IDENTIFIER arc');
		}

		return implode('.', $arcs) . '*';
	}

	protected function time($tag = null) {
		$time = $this->next($tag);
		if ($this->tag == 23) {
			$time = (substr((string) $time, 0, 2) < 50 ? '20' : '19') . $time;
		}
		elseif ($this->tag != 24) {
			throw new \UnexpectedValueException('Expected DER UTC or generalized time');
		}
		if (preg_match('/\A[0-9]{14}Z\z/D', (string) $time) !== 1) {
			throw new \UnexpectedValueException('Invalid DER time value');
		}

		return $time;
	}

	protected function keyident($tag = 4) {
		return chunk_split(bin2hex((string) $this->next($tag)), 2, ':');
	}

	/**
	 * Ensure that the requested number of bytes remains in the current value.
	 */
	private function requireBytes(int $length): void {
		$limit = strlen((string) $this->buffer);
		$containerEnd = end($this->stack);
		if ($containerEnd !== false) {
			$limit = min($limit, $containerEnd);
		}
		if ($length < 0 || $this->i > $limit - $length) {
			throw new \UnexpectedValueException('Truncated DER value');
		}
	}

	/**
	 * Compare an unsigned normalized decimal string with a small integer.
	 */
	private function compareDecimalToInt(string $number, int $value): int {
		$other = (string) $value;
		if (strlen($number) !== strlen($other)) {
			return strlen($number) <=> strlen($other);
		}

		return strcmp($number, $other);
	}

	/**
	 * Subtract a small integer from an unsigned decimal string.
	 */
	private function decimalSubtractInt(string $number, int $subtrahend): string {
		$result = '';
		$borrow = $subtrahend;
		for ($i = strlen($number) - 1; $i >= 0; --$i) {
			$value = (ord($number[$i]) - 48) - ($borrow % 10);
			$borrow = intdiv($borrow, 10);
			if ($value < 0) {
				$value += 10;
				++$borrow;
			}
			$result = $value . $result;
		}

		return ltrim($result, '0') ?: '0';
	}

	/**
	 * Multiply an unsigned decimal string and add a byte without requiring BCMath.
	 */
	private function decimalMultiplyAndAdd(string $number, int $multiplier, int $addend): string {
		$result = '';
		$carry = $addend;
		for ($i = strlen($number) - 1; $i >= 0; --$i) {
			$value = ((ord($number[$i]) - 48) * $multiplier) + $carry;
			$result = ($value % 10) . $result;
			$carry = intdiv($value, 10);
		}
		while ($carry > 0) {
			$result = ($carry % 10) . $result;
			$carry = intdiv($carry, 10);
		}

		return ltrim($result, '0') ?: '0';
	}
}
