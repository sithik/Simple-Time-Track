<?php
require_once "config.php";
mysql_connect(DB_HOST,DB_USER,DB_PASS);
mysql_select_db(DB_NAME);

$SQL = "
CREATE TABLE IF NOT EXISTS `".DB_TABLE_PREFIX."timesheet` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `project_name` varchar(100) NOT NULL,
  `task_name` varchar(200) NOT NULL,
  `time` int(11) NOT NULL,
  `start` datetime NOT NULL,
  `running` tinyint(1) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `upload_date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
";
mysql_query($SQL) or die(mysql_error());
echo "Table installed!"
?>