<?php
require_once "config.php";
mysql_connect(DB_HOST,DB_USER,DB_PASS);
mysql_select_db(DB_NAME);

log_message("INFO","New request: \nGET (".serialize($_GET).") \nPOST(".serialize($_POST).")");

if($_GET['ac'] == "single_upload") {
    $data = $_POST;
    $SQL = "
    INSERT INTO 
    `".DB_TABLE_PREFIX."timesheet` 
    (
    `task_id`, `project_name`, `task_name`, `time`, `start`, `running`, `user_id`
    )
    VALUES (
    '". mysql_escape_string($_POST['task_id']) ."',
    '". mysql_escape_string($_POST['project_name']) ."',
    '". mysql_escape_string($_POST['task_name']) ."',
    '". mysql_escape_string($_POST['time']) ."',
    '". mysql_escape_string($_POST['start']) ."',
    '". mysql_escape_string($_POST['running']) ."',
    '". mysql_escape_string($_POST['user_id']) ."'
    );
    ";
    
    mysql_query($SQL);
    $output = array("result" => true);
    header('Content-type: application/json');
    echo json_encode($output);
}
elseif($_GET['ac'] == "multiple_upload") {
    $items = $_POST["items"];
    if(is_array($items)){
        $success_data = array();
        foreach($items as $task){
            
            update_or_insert($task);
            $success_data[] = $task['task_id'];
            
        }
        
        $output = array(
            "result" => true,
            "success_entries" => $success_data
        );
    }
    else{
        $output = array(
            "result" => false,
            "success_entries" => array()
        );
    }
    header('Content-type: application/json');
    echo json_encode($output);
}


function update_or_insert($task = array()){
    $where = array(
        "task_id" => $task['task_id'],
        "user_id" => $task['user_id']
    );
    $data = array(
        "project_name"  => $task['project_name'],
        "task_name"     => $task['task_name'],
        "time"          => $task['time'],
        "start"         => $task['start'],
        "running"       => $task['running'],
        "task_id"       => $task['task_id'],
        "user_id"       => $task['user_id']
    );
    $records = crud_get(DB_TABLE_PREFIX."timesheet",$where);
    if($records != false)
    {
        $id = $records[0]['id'];
        crud_update(DB_TABLE_PREFIX."timesheet",$data,$where);
    }
    else{
        $id = crud_insert(DB_TABLE_PREFIX."timesheet",$data);
    }
    return $id;
}

?>