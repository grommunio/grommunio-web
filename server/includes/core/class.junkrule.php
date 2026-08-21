<?php

/**
 * JunkRule.
 *
 * Builds and parses the Outlook Junk Email Rule: the IPM.ExtendedRule.Message
 * FAI message in the inbox whose PR_EXTENDED_RULE_MSG_CONDITION carries the
 * blocked senders, safe senders and safe recipients lists in the restriction
 * format of MS-OXORULE, exactly as Outlook reads and writes them (MS-OXCSPAM).
 * All integers little-endian. Strings inside the blobs UTF-16LE, including
 * trailing U+0000 codepoint.
 * Array counts are 32-bit (extended rule flavour of MS-OXCDATA v20 §2.12).
 */
class JunkRule {
	public const PROVIDER = 'JunkEmailRule';
	public const RULE_NAME = 'Junk E-mail rule';

	// ST_ENABLED | ST_EXIT_LEVEL | ST_SKIP_IF_SCL_IS_SAFE (MS-OXCSPAM v12 §3.1.4.1)
	public const RULE_STATE = 0x31;

	private const RES_AND = 0x00;
	private const RES_OR = 0x01;
	private const RES_NOT = 0x02;
	private const RES_CONTENT = 0x03;
	private const RES_PROPERTY = 0x04;
	private const RES_EXIST = 0x08;
	private const RES_SUB = 0x09;
	private const RES_COMMENT = 0x0A;

	private const TAG_SENDER = 0x0C1F001F;     // PidTagSenderEmailAddress
	private const TAG_RECIPIENT = 0x3003001F;  // PidTagEmailAddress
	private const TAG_SCL = 0x40760003;        // PidTagContentFilterSpamConfidenceLevel
	private const SUBOBJ_RECIPIENTS = 0x0E12000D;

	private const FL_FULLSTRING_IGNORECASE = 0x00010000;
	private const FL_SUBSTRING_IGNORECASE = 0x00010001;

	private const MOVESTAMP_NAME = "http://schemas.microsoft.com/exchange/junkemailmovestamp";
	private const PS_PUBLIC_STRINGS = "\x29\x03\x02\x00\x00\x00\x00\x00\xC0\x00\x00\x00\x00\x00\x00\x46";

	/**
	 * Serialize the junk rule condition (MS-OXCSPAM v12 §2.2.4 template).
	 *
	 * Every list entry starting with '@' is a domain (substring clause). Any
	 * other entry is an address (fullstring clause). $contacts carries the trusted
	 * contact addresses Outlook maintains. Pass through what parse() returned.
	 *
	 * @param array $blockedSenders  addresses and @domains
	 * @param array $safeSenders    addresses and @domains
	 * @param array $safeRecipients addresses and @domains
	 * @param array $contacts       trusted contact addresses (preserved verbatim)
	 *
	 * @return string the PR_EXTENDED_RULE_MSG_CONDITION blob
	 */
	public static function buildCondition($blockedSenders, $safeSenders, $safeRecipients, $contacts = []) {
		[$blockedAddr, $blockedDom] = self::splitList($blockedSenders);
		[$safeAddr, $safeDom] = self::splitList($safeSenders);
		[$recipAddr, $recipDom] = self::splitList($safeRecipients);

		$sclClause = self::resAnd([
			self::resExist(self::TAG_SCL),
			self::resProperty(0x02 /* RELOP_GT */, self::TAG_SCL, pack('V', 0xFFFFFFFF)),
		]);

		$tree = self::resAnd([
			self::resOr([
				self::contentList($blockedAddr, self::TAG_SENDER, self::FL_FULLSTRING_IGNORECASE),
				self::resAnd([
					self::resOr([
						$sclClause,
						self::contentList($blockedDom, self::TAG_SENDER, self::FL_SUBSTRING_IGNORECASE),
					]),
					self::resNot(self::resOr([
						self::contentList($safeDom, self::TAG_SENDER, self::FL_SUBSTRING_IGNORECASE),
						self::resSub(self::contentList($recipDom, self::TAG_RECIPIENT, self::FL_SUBSTRING_IGNORECASE)),
					])),
				]),
			]),
			self::resNot(self::resOr([
				self::contentList($safeAddr, self::TAG_SENDER, self::FL_FULLSTRING_IGNORECASE),
				self::resSub(self::contentList($recipAddr, self::TAG_RECIPIENT, self::FL_FULLSTRING_IGNORECASE)),
				self::contentList($contacts, self::TAG_SENDER, self::FL_SUBSTRING_IGNORECASE),
			])),
		]);

		// No named properties in the condition.
		return pack('v', 0) . $tree;
	}

	/**
	 * Serialize the junk rule actions, i.e. OP_MOVE to the junk folder plus OP_TAG
	 * with PidNameExchangeJunkEmailMoveStamp (MS-OXORULE v23 §2.2.4.1.9).
	 *
	 * @param string $junkFolderEntryId the 46-byte junk folder entryid
	 * @param int    $moveStamp         the stamp from PR_ADDITIONAL_REN_ENTRYIDS[5]
	 *
	 * @return string the PR_EXTENDED_RULE_MSG_ACTIONS blob
	 */
	public static function buildActions($junkFolderEntryId, $moveStamp) {
		$name = iconv('UTF-8', 'UTF-16LE', self::MOVESTAMP_NAME) . "\x00\x00";
		$propName = "\x01" . self::PS_PUBLIC_STRINGS . chr(strlen($name)) . $name;
		$namedProps = pack('v', 1) . pack('v', 0x8001) . pack('V', strlen($propName)) . $propName;

		$moveData = pack('V', 1) . "\x01" .
			pack('V', strlen($junkFolderEntryId)) . $junkFolderEntryId;
		$tagData = pack('V', (0x8001 << 16) | 0x0003) . pack('V', $moveStamp);

		$blocks = '';
		foreach ([[0x01, $moveData], [0x09, $tagData]] as [$type, $data]) {
			$body = chr($type) . pack('V', 0) . pack('V', 0) . $data;
			$blocks .= pack('V', strlen($body)) . $body;
		}

		return $namedProps . pack('V', 1) . pack('V', 2) . $blocks;
	}

	/**
	 * Parse a condition blob back into the lists. Walks the restriction tree
	 * leniently, classifying every string comparison by property, fuzzy level
	 * and polarity, so rules Outlook rewrote in a different shape still parse.
	 *
	 * @param string $blob the PR_EXTENDED_RULE_MSG_CONDITION value
	 *
	 * @return array|false lists or false when the blob cannot be parsed
	 */
	public static function parseCondition($blob) {
		$pos = 0;
		if (!self::skipNamedProps($blob, $pos)) {
			return false;
		}
		$tree = self::pullRestriction($blob, $pos, 0);
		if ($tree === false) {
			return false;
		}

		$lists = [
			'blocked_senders' => [],
			'safe_senders' => [],
			'safe_recipients' => [],
			'contacts' => [],
		];
		self::collect($tree, false, false, $lists);

		foreach ($lists as &$l) {
			$l = array_values(array_unique($l));
		}

		return $lists;
	}

	/**
	 * @param array $entries
	 * @return array [addresses, domains] split on the leading '@'
	 */
	private static function splitList($entries) {
		$addr = [];
		$dom = [];
		foreach ($entries as $e) {
			$e = trim((string) $e);
			if ($e === '') {
				continue;
			}
			if ($e[0] === '@') {
				$dom[] = $e;
			}
			else {
				$addr[] = $e;
			}
		}

		return [$addr, $dom];
	}

	private static function utf16($str) {
		return iconv('UTF-8', 'UTF-16LE', $str) . "\x00\x00";
	}

	private static function resAnd($subs) {
		return chr(self::RES_AND) . pack('V', count($subs)) . implode('', $subs);
	}

	private static function resOr($subs) {
		return chr(self::RES_OR) . pack('V', count($subs)) . implode('', $subs);
	}

	private static function resNot($sub) {
		return chr(self::RES_NOT) . $sub;
	}

	private static function resSub($sub) {
		return chr(self::RES_SUB) . pack('V', self::SUBOBJ_RECIPIENTS) . $sub;
	}

	private static function resExist($tag) {
		return chr(self::RES_EXIST) . pack('V', $tag);
	}

	private static function resProperty($relop, $tag, $packedValue) {
		return chr(self::RES_PROPERTY) . chr($relop) . pack('V', $tag) . pack('V', $tag) . $packedValue;
	}

	private static function resContent($fuzzy, $tag, $str) {
		return chr(self::RES_CONTENT) . pack('V', $fuzzy) . pack('V', $tag) . pack('V', $tag) . self::utf16($str);
	}

	/**
	 * @return string a RES_OR of one RES_CONTENT per entry (zero-count when empty)
	 */
	private static function contentList($entries, $tag, $fuzzy) {
		$subs = [];
		foreach ($entries as $e) {
			$subs[] = self::resContent($fuzzy, $tag, $e);
		}

		return self::resOr($subs);
	}

	private static function skipNamedProps($blob, &$pos) {
		if (strlen($blob) < $pos + 2) {
			return false;
		}
		$count = unpack('v', substr($blob, $pos, 2))[1];
		$pos += 2;
		if ($count === 0) {
			return true;
		}
		$pos += 2 * $count;
		if (strlen($blob) < $pos + 4) {
			return false;
		}
		$size = unpack('V', substr($blob, $pos, 4))[1];
		$pos += 4 + $size;

		return $pos <= strlen($blob);
	}

	/**
	 * Pull one restriction. Returns a node array or false.
	 * Nodes: ['t' => type, 'subs' => [], 'tag' => int, 'fuzzy' => int, 'val' => string].
	 * A depth bound keeps a hostile deeply-nested blob from exhausting memory.
	 */
	private static function pullRestriction($blob, &$pos, $depth = 0) {
		if ($pos >= strlen($blob) || $depth > 64) {
			return false;
		}
		$type = ord($blob[$pos++]);

		switch ($type) {
			case self::RES_AND:
			case self::RES_OR:
				$count = self::pullUint32($blob, $pos);
				if ($count === false || $count > 0x10000) {
					return false;
				}
				$subs = [];
				for ($i = 0; $i < $count; ++$i) {
					$sub = self::pullRestriction($blob, $pos, $depth + 1);
					if ($sub === false) {
						return false;
					}
					$subs[] = $sub;
				}

				return ['t' => $type, 'subs' => $subs];

			case self::RES_NOT:
				$sub = self::pullRestriction($blob, $pos, $depth + 1);

				return $sub === false ? false : ['t' => $type, 'subs' => [$sub]];

			case self::RES_CONTENT:
				$fuzzy = self::pullUint32($blob, $pos);
				$tag = self::pullUint32($blob, $pos);
				$vtag = self::pullUint32($blob, $pos);
				if ($vtag === false) {
					return false;
				}
				$val = self::pullValue($blob, $pos, $vtag & 0xFFFF);
				if ($val === false) {
					return false;
				}

				return ['t' => $type, 'fuzzy' => $fuzzy, 'tag' => $tag, 'val' => $val];

			case self::RES_PROPERTY:
				++$pos; // relop
				$tag = self::pullUint32($blob, $pos);
				$vtag = self::pullUint32($blob, $pos);
				if ($vtag === false || self::pullValue($blob, $pos, $vtag & 0xFFFF) === false) {
					return false;
				}

				return ['t' => $type, 'tag' => $tag];

			case self::RES_EXIST:
				$tag = self::pullUint32($blob, $pos);

				return $tag === false ? false : ['t' => $type, 'tag' => $tag];

			case self::RES_SUB:
				$subobj = self::pullUint32($blob, $pos);
				$sub = self::pullRestriction($blob, $pos, $depth + 1);

				return $sub === false ? false : ['t' => $type, 'tag' => $subobj, 'subs' => [$sub]];

			case self::RES_COMMENT:
				$count = ord($blob[$pos++] ?? "\x00");
				for ($i = 0; $i < $count; ++$i) {
					$vtag = self::pullUint32($blob, $pos);
					if ($vtag === false || self::pullValue($blob, $pos, $vtag & 0xFFFF) === false) {
						return false;
					}
				}
				$present = ord($blob[$pos++] ?? "\x00");
				if ($present) {
					$sub = self::pullRestriction($blob, $pos, $depth + 1);
					if ($sub === false) {
						return false;
					}

					return $sub;
				}

				return ['t' => self::RES_AND, 'subs' => []];

			default:
				return false;
		}
	}

	private static function pullUint32($blob, &$pos) {
		if (strlen($blob) < $pos + 4) {
			return false;
		}
		$v = unpack('V', substr($blob, $pos, 4))[1];
		$pos += 4;

		return $v;
	}

	/**
	 * Pull a property value of the given PT type. Strings decode to UTF-8.
	 */
	private static function pullValue($blob, &$pos, $type) {
		switch ($type) {
			case 0x001F: // PT_UNICODE
				$end = $pos;
				$len = strlen($blob);
				while ($end + 1 < $len && ($blob[$end] !== "\x00" || $blob[$end + 1] !== "\x00")) {
					$end += 2;
				}
				if ($end + 1 >= $len) {
					return false;
				}
				$val = iconv('UTF-16LE', 'UTF-8', substr($blob, $pos, $end - $pos));
				$pos = $end + 2;

				return $val;

			case 0x001E: // PT_STRING8
				$end = strpos($blob, "\x00", $pos);
				if ($end === false) {
					return false;
				}
				$val = substr($blob, $pos, $end - $pos);
				$pos = $end + 1;

				return $val;

			case 0x0003: // PT_LONG
			case 0x000A: // PT_ERROR
				$v = self::pullUint32($blob, $pos);

				return $v === false ? false : (string) $v;

			case 0x000B: // PT_BOOLEAN
				if ($pos >= strlen($blob)) {
					return false;
				}

				return (string) ord($blob[$pos++]);

			case 0x0002: // PT_SHORT
				if (strlen($blob) < $pos + 2) {
					return false;
				}
				$v = unpack('v', substr($blob, $pos, 2))[1];
				$pos += 2;

				return (string) $v;

			case 0x0102: // PT_BINARY
				$len = self::pullUint32($blob, $pos);
				if ($len === false || strlen($blob) < $pos + $len) {
					return false;
				}
				$val = substr($blob, $pos, $len);
				$pos += $len;

				return $val;

			default:
				return false;
		}
	}

	/**
	 * Classify every string comparison in the tree into the four lists.
	 * $negated: inside an odd number of RES_NOT.
	 * $inRecipients: inside a RES_SUB on the recipients table.
	 */
	private static function collect($node, $negated, $inRecipients, &$lists) {
		switch ($node['t']) {
			case self::RES_AND:
			case self::RES_OR:
				foreach ($node['subs'] as $sub) {
					self::collect($sub, $negated, $inRecipients, $lists);
				}
				break;

			case self::RES_NOT:
				self::collect($node['subs'][0], !$negated, $inRecipients, $lists);
				break;

			case self::RES_SUB:
				self::collect($node['subs'][0], $negated, true, $lists);
				break;

			case self::RES_CONTENT:
				$val = $node['val'];
				if (!is_string($val) || $val === '') {
					break;
				}
				$substring = (($node['fuzzy'] ?? 0) & 0x0001) === 0x0001;
				if ($inRecipients) {
					if (!$negated) {
						break;
					}
					$lists['safe_recipients'][] = $val;
				}
				elseif (!$negated) {
					$lists['blocked_senders'][] = $val;
				}
				elseif ($substring && $val[0] !== '@') {
					// Outlook's trusted-contacts clause contains full addresses matched
					// as substrings. It is preserved, and never shown as safe senders.
					$lists['contacts'][] = $val;
				}
				else {
					$lists['safe_senders'][] = $val;
				}
				break;
		}
	}
}
