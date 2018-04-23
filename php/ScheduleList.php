<?php
/**
 * 排表历史
 */

// 返回值 code: 0 正常, 1 数据库连接失败, else 其他
$return = array(
    "code" => 0,
    "msg" => "success",
    "data" => null);

// 连接数据库
$link = new mysqli('localhost', 'www_lhp_one', 'dxXK372PiC', 'www_lhp_one');
if ($link->connect_error) {
    $return['code'] = 1;
    $return['msg'] = "链接数据库失败: " . $link->connect_error;
    die(json_encode($return));
}

$result = $link->query("SELECT id, datatime FROM luke_schedule WHERE deleted = 0 ORDER BY datatime DESC LIMIT 8");
$schedule_list = array();
while ($row = $result->fetch_array()) {
    array_push($schedule_list, array(
        'id' => $row['id'],
        'datatime' => $row['datatime']
    ));
}
$return['data'] = $schedule_list;

// 关闭连接
$link->close();
die(json_encode($return));