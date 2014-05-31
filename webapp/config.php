<?php

define('DB_HOST','localhost');
define('DB_USER','root');
define('DB_PASS','');
define('DB_NAME','dev_simple_time_track');
define('DB_TABLE_PREFIX','stt_');

define('BASE_PATH',dirname(__FILE__).'/');

require_once "db_functions.php";

/**
 * Write Log File
 *
 * Generally this function will be called using the global log_message() function
 *
 * @access	public
 * @param	string	the error level
 * @param	string	the error message
 * @param	bool	whether the error is a native PHP error
 * @return	bool
 */
function log_message($level = 'error', $msg='')
{
	$level = strtoupper($level);

	$filepath = BASE_PATH.'log_'.date('Y-m-d').'.php';
	$message  = '';

	if ( ! file_exists($filepath))
	{
		$message .= "<"."?php  if ( ! defined('PHYPATH')) exit('No direct script access allowed'); ?".">\n\n";
	}

	if ( ! $fp = fopen($filepath, 'ab'))
	{
		return FALSE;
	}

	$message .= $level.' '.(($level == 'INFO') ? ' -' : '-').' '.date('Y-m-d H:i:s'). ' --> '.$msg."\n";

	flock($fp, LOCK_EX);
	fwrite($fp, $message);
	flock($fp, LOCK_UN);
	fclose($fp);

	chmod($filepath, 0666);
	return TRUE;
}

?>