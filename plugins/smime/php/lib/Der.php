<?php
namespace WAYF;
require_once('Oids.php');

class Der extends Oids {
    protected $tag, $len, $value, $class, $constructed;
    protected $buffer, $stack = array();
    protected $i;
    private $ignoredextensions = array(
        'netscape-cert-type' => 1,
    );
    private $id;
    
    protected function init($der) {
        $this->buffer = $der;
        $this->i = 0;
        $this->id = uniqid();
    }
    
    protected function dump($note = '') {
        $z = strlen($this->buffer) - $this->i;
        print_r("$note\n");
        print_r("len: $z\n");
        print_r(chunk_split(bin2hex(substr($this->buffer, $this->i)), 2, ':'));
        print "\n";
    }
    
    protected function pr($note = '') {
        $savei = $this->i;
        $byte = ord($this->buffer[$this->i++]);
        $tag = $byte & 0x1f;
        $class = $byte & 0xc0;
        $constructed = $byte & 0x20;
        $len = $this->vallen();
        $this->i = $savei;
        print_r("$note\n");
        print_r("i  : {$this->i}\n");
        print_r("len: {$len}\n");
        print_r("class:   {$class}\n");
        print_r("tag  :   {$tag}\n");
        print_r(chunk_split(bin2hex(substr($this->buffer, $this->i, min(32, strlen($this->buffer) - $this->i))) . "\n", 2, ':'));
        print_r("---\n");
    }
 
    private function tlv($expectedtag = null) {
        $byte = ord($this->buffer[$this->i++]);
        $this->tag = $byte & 0x1f;
        if ($expectedtag < 0) $this->tag = $expectedtag = -$expectedtag;
        if ($expectedtag && $expectedtag != $this->tag) {
            trigger_error("expected tag == $expectedtag, got {$this->tag} {$this->id}\n", E_USER_ERROR);
        }
        $this->class = $byte & 0xc0;
        $this->constructed = $byte & 0x20;
        $this->len = $this->vallen();
    }

    protected function next($expectedtag = null)
    {
        $this->tlv($expectedtag);
        if ($this->constructed) {
            return;
        } else {
            $value = substr($this->buffer, $this->i, $this->len);
            if ($this->class == 0 || $this->class == 0x80) {
                if ($this->tag == 2 || $this->tag == 10) { # ints and enums
                    $int = 0;
                    foreach (str_split($value) as $byte) {
                        $int = bcmul($int, '256', 0);
                        $int = bcadd($int, ord($byte), 0);
                    }
                    $this->value = $int;
                } elseif ($this->tag == 1) { # boolean
                    $this->value = ord($value) != 0;
                } elseif ($this->tag == 3) { # bit string 
                    $this->value = $value;
                } elseif ($this->tag == 5) { # null
                    $this->value = null;
                } else {
                    $this->value = $value;
                }
            }
            $this->i += $this->len;
            return $this->value;
        }
    }
    
    protected function der($expectedtag = null, $pass = false) {
        $oldi = $this->i;
        $this->tlv($expectedtag);
        $i = $this->i;
        if (!$pass) {
            $this->i = $oldi;
        } else {
            $this->i += $this->len; 
        }
        return substr($this->buffer, $oldi, $this->len + $i - $oldi);
    }
    
    /* 
     * if provided with a tag and the tag is equal to the current tag
     * peek considers it EXPLICIT, consumes it and return true
     */
    protected function peek($tag = null) {
        $t = null;
        if ($this->i < end($this->stack)) $t = ord($this->buffer[$this->i]) & 0x1f;
        if ($tag !== null) {
            if ($t === $tag) {
                $this->next($tag);
                return true;
            } else {
                return false;
            }
        } 
        return $t;
    }

    protected function vallen()
    {
        $byte = ord($this->buffer[$this->i++]);
        $res = $len = $byte & 0x7f;
        if ($byte >= 0x80) {
            $res = 0;
            for ($c = 0; $c < $len; $c++) {
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
	    return $this->i < end($this->stack);
	}

	protected function end() {
	    $end = array_pop($this->stack);
	    if ($end != $this->i) trigger_error("sequence or set length does not match: $end != {$this->i}", E_USER_ERROR); 
	}
	
	protected function extensions() {
        $this->beginsequence();
        $extns = array();
        while($this->in()) {
            $this->beginsequence();
			$extnID = $this->oid();
		    $theext['critical'] = $this->peek(1);
			$theext['extnValue'] = $this->next(4);
            try {
                if (method_exists($this, $extnID)) {
                    $theext['extnValue'] = call_user_func(array($this, $extnID), $theext['extnValue']);
                } elseif (!empty($ignoredextensions['$extnID'])) {
                    trigger_error("Unknown extension $extnID", E_USER_ERROR); 
                } else {
                    $theext['extnValue'] = chunk_split(bin2hex($theext['extnValue']), 2, ':');
                }
            } catch (\Exception $e) {
               $theext['extnValue'] = chunk_split(bin2hex($theext['extnValue']), 2, ':');
            }
            $this->end();
			$extns[$extnID] = $theext;
		}
        $this->end();
		return $extns;
	}
	
    protected function signatureAlgorithm()
    {
   		$this->beginsequence();
   		$salg = $this->oid();
   		if ($this->in()) {
   		    $this->next(); # alg param - ignore for now
   		}
        $this->end();
   		return $salg;
    }
    
    protected function name($tag = null)
    {
   		$this->beginsequence($tag);  # seq of RDN
        $res = array();
        while($this->in()) {
            $parts = array();
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

    protected function oid($tag = 6)
    {
        $v = $this->oid_($this->next($tag));
        if (isset($this->oids[$v])) {
            return $this->oids[$v];
        }
        return $v;
    }

    protected function oid_($oid)
    {
        $len = strlen($oid);
        $v = "";
        $n = 0;
        for ($c = 0; $c < $len; $c++) {
            $x = ord($oid[$c]);
            $n = $n * 128 + ($x & 0x7f);
            if ($x <= 127) {
                $v .= $v ? '.' . $n : ((int) ($n / 40) . '.' . ($n % 40));
                $n = 0;
            }
        }
        return $v . '*';
    }
    
    protected function time($tag = null)
    {
        $time = $this->next($tag);
        if ($this->tag == 23) {
            $time = (substr($time, 0, 2) < 50 ? '20' : '19') . $time;
        } elseif ($this->tag != 24) {
            trigger_error('expected der utc or generalized time', E_USER_ERROR);
        }
        return $time;
    }
    
    protected function keyident($tag = 4) {
        return chunk_split(bin2hex($this->next($tag)), 2, ':');
    }
}
