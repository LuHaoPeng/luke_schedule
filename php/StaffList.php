<?php
/**
 * 团员列表
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

// 团员数组
$staff_list_in_order = array();
$result = $link->query("SELECT * FROM luke_staff WHERE deleted = 0 ORDER BY (career != ''), CONVERT(name USING gbk), CONVERT(career USING gbk)");
while ($row = $result->fetch_array()) {
    array_push($staff_list_in_order, array(
        "id" => $row['id'],
        "name" => $row['name'],
        "career" => $row['career'],
        "type" => $row['type'],
        "absence" => $row['absence'],
        "attack" => $row['attack'],
        "control" => $row['control'],
        "element" => $row['element']
    ));
}
$staff_list_real = array();
$result = $link->query("SELECT * FROM luke_staff");
while ($row = $result->fetch_array()) {
    array_push($staff_list_real, array(
        "id" => $row['id'],
        "name" => $row['name'],
        "career" => $row['career'],
        "type" => $row['type'],
        "absence" => $row['absence'],
        "attack" => $row['attack'],
        "control" => $row['control'],
        "element" => $row['element']
    ));
}

// 整合结果
$return_array = array(
    "staff_in_order" => $staff_list_in_order,
    "staff_real" => $staff_list_real
);

// 关闭连接
$link->close();
$return["data"] = $return_array;
echo json_encode($return);