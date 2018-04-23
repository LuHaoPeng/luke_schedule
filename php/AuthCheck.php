<?php
/**
 * 检查权限
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
$auth = $_POST['auth'];
$auth = md5($auth);
$result = $link->query("SELECT type FROM luke_auth WHERE code = '$auth'");
if ($result->num_rows <= 0) {
    $return['code'] = 2;
    $return['msg'] = "授权码有误";
    die(json_encode($return));
} else {
    $row = $result->fetch_array();
    $return['data'] = $row['type'];
}

// 关闭连接
$link->close();
echo json_encode($return);