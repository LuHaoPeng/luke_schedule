<?php
/**
 * 系统设置
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

// 检查权限
$rule = $_POST['rule'];
$result = $link->query("SELECT `value` FROM sys_setting WHERE `name` = '$rule' AND `status` = 1");
if ($result->num_rows <= 0) {
    $return['code'] = 2;
    $return['msg'] = $rule . "设置不存在";
    die(json_encode($return));
} else {
    $row = $result->fetch_array();
    $return['data'] = $row['value'];
}

// 关闭连接
$link->close();
echo json_encode($return);