<?php declare(strict_types=1);

namespace Datamate\SeafileApi\Exception;

final class UnexpectedJsonTextResponseException extends InvalidResponseException
{
    /**
     * @var string the unexpected JSON Text of the API response
     */
    private $jsonText;

    /**
     * utility method to shorten a string (e.g. to create shorter messages)
     *
     * @param string $buffer
     * @param int $size
     * @return string ASCII, printable with other characters escaped (C-slashes)
     */
    public static function shorten(string $buffer, int $size = 32): string
    {
        if ($size >= $len = strlen($buffer)) {
            $buffer = addcslashes($buffer, "\0..\37\42\134\177..\377");
            return "\"$buffer\"";
        }

        $buffer = substr($buffer, 0, max(0, $size - 8));
        $buffer = addcslashes($buffer, "\0..\37\42\134\177..\377");

        return "($len) \"$buffer ...";
    }

    public static function create(string $message, string $jsonText, \Throwable $previous = null): UnexpectedJsonTextResponseException
    {
        $exception = new self($message, 500, $previous);
        $exception->jsonText = $jsonText;

        return $exception;
    }

    public function getJsonText(): string
    {
        return $this->jsonText;
    }
}
