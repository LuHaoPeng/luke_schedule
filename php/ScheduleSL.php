<?php
/**
 * 排表存取
 */

// 返回值 code: 0 正常, 1 数据库连接失败, 5 权限不足, else 其他
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

// 判断存取
if ($_POST['method'] == "save") {
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
        if ($row['type'] < 2) {
            $return['code'] = 5;
            $return['msg'] = "权限不足";
            die(json_encode($return));
        }
    }

    $time = date("Y-m-d");
    $content = $_POST['content'];
    // 先判断是否已存在
    $exist = $link->query("SELECT * FROM luke_schedule WHERE datatime = '$time' AND deleted = 0");
    if ($exist->num_rows <= 0) {
        // 不存在, insert
        $result_insert = $link->query("INSERT INTO luke_schedule (datatime, content, deleted) VALUES ('$time', '$content', 0)");
        if ($result_insert <= 0) {
            $return['code'] = 2;
            $return['msg'] = "插入schedule失败";
            die(json_encode($return));
        }
    } else {
        // 已存在, update
        $row = $exist->fetch_array();
        $row_id = $row['id'];
        $result_update = $link->query("UPDATE luke_schedule SET content = '$content' WHERE id = $row_id");
        if ($result_update <= 0) {
            $return['code'] = 2;
            $return['msg'] = "更新schedule失败";
            die(json_encode($return));
        }
    }
} elseif ($_POST['method'] == "load") {
    /* 获取参数id，如果id不为空，则根据id获取
        如果id为空，则直接取最新一条 */
    $id = $_POST['id'];
    if ($id) {
        $result = $link->query("SELECT * FROM luke_schedule WHERE id = $id AND deleted = 0");
        $return['data'] = $result->fetch_array();
    } else {
        $result = $link->query("SELECT * FROM ( SELECT * FROM luke_schedule WHERE deleted = 0 ORDER BY id DESC ) t GROUP BY t.deleted");
        $return['data'] = $result->fetch_array();
    }
} else {
    $return["code"] = 2;
    $return["msg"] = "method 参数错误";
}
// 关闭连接
$link->close();
die(json_encode($return));