<?php
/**
 * 团员属性
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
        if ($row['type'] < 1) {
            $return['code'] = 5;
            $return['msg'] = "权限不足";
            die(json_encode($return));
        }
    }

    $id = $_POST['id'];
    $name = $_POST['name'];
    $career = $_POST['career'];
    $type = $_POST['type'];
    $absence = $_POST['absence'];
    $attack = $_POST['attack'];
    $control = $_POST['control'];
    $element = $_POST['element'];

    if (intval($id) === 0) {
        // 新增
        $result = $link->query("INSERT INTO luke_staff (name, career, type, absence, attack, control, element) VALUES ('$name', '$career', $type, $absence, $attack, $control, $element)");
        if ($result <= 0) {
            $return["code"] = 2;
            $return["msg"] = "新增用户失败";
        }
    } else {
        // 更新
        $result = $link->query("UPDATE luke_staff SET name = '$name', career = '$career', type = $type, absence = $absence, attack = $attack, control = $control, element = $element WHERE id = $id");
        if ($result <= 0) {
            $return["code"] = 2;
            $return["msg"] = "更新用户失败";
        }
    }
} elseif ($_POST['method'] == "batch_leave") {
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
        if ($row['type'] < 1) {
            $return['code'] = 5;
            $return['msg'] = "权限不足";
            die(json_encode($return));
        }
    }

    $idList = $_POST['idList'];
    if (empty($idList)) {
        $return["code"] = 2;
        $return["msg"] = "未选中团员";
        die(json_encode($return));
    }

    $idList_string = join(',', $idList);
    $result = $link->query("UPDATE luke_staff SET absence = 1 WHERE id IN ($idList_string)");
    if ($result <= 0) {
        $return["code"] = 2;
        $return["msg"] = "请假失败";
    }
} elseif ($_POST['method'] == "batch_return") {
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
        if ($row['type'] < 1) {
            $return['code'] = 5;
            $return['msg'] = "权限不足";
            die(json_encode($return));
        }
    }

    $idList = $_POST['idList'];
    if (empty($idList)) {
        $return["code"] = 2;
        $return["msg"] = "未选中团员";
        die(json_encode($return));
    }

    $idList_string = join(',', $idList);
    $result = $link->query("UPDATE luke_staff SET absence = 0 WHERE id IN ($idList_string)");
    if ($result <= 0) {
        $return["code"] = 2;
        $return["msg"] = "销假失败";
    }
} elseif ($_POST['method'] == "load") {
    $id = $_POST['id'];
    $result = $link->query("SELECT * FROM luke_staff WHERE id = $id AND deleted = 0");
    $row = $result->fetch_array();
    $return["data"] = array(
        "id" => $row['id'],
        "name" => $row['name'],
        "career" => $row['career'],
        "type" => $row['type'],
        "absence" => $row['absence'],
        "attack" => $row['attack'],
        "control" => $row['control'],
        "element" => $row['element']
    );
} elseif ($_POST['method'] == "delete") {
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
        if ($row['type'] < 1) {
            $return['code'] = 5;
            $return['msg'] = "权限不足";
            die(json_encode($return));
        }
    }

    $id = $_POST['id'];
    $result = $link->query("UPDATE luke_staff SET deleted = 1 WHERE id = $id");
    if ($result <= 0) {
        $return["code"] = 2;
        $return["msg"] = "删除用户失败";
    }
} elseif ($_POST['method'] == "undo") {
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
        if ($row['type'] < 1) {
            $return['code'] = 5;
            $return['msg'] = "权限不足";
            die(json_encode($return));
        }
    }

    $id = $_POST['id'];
    $result = $link->query("UPDATE luke_staff SET deleted = 0 WHERE id = $id");
    if ($result <= 0) {
        $return["code"] = 2;
        $return["msg"] = "恢复用户失败";
    }
} else {
    $return["code"] = 2;
    $return["msg"] = "method 参数错误";
}
// 关闭连接
$link->close();
die(json_encode($return));