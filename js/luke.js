'use strict';
let staticLocalJson = {
    "staff_auto_increment": 0,
    "staff_list": []
};
let staticNameList = [];
$(document).ready(function () {
    init(function () {
        // init done
        // load local
        loadStaffList();
    });

    // init popover
    $("#staff_list_add_btn").popover({
        content: "一次只能新增一个空白团员",
        placement: "top",
        trigger: "manual"
    }).click(addStaff).blur(function () {
        $(this).popover('hide');
    });

    $("#staff_attr_save_btn").popover({
        content: "请先在左侧团员列表选中其一",
        placement: "top",
        trigger: "manual"
    }).click(saveStaff).blur(function () {
        $(this).popover('hide');
    });

    $("#staff_attr_del_btn").popover({
        content: "请先在左侧团员列表选中其一",
        placement: "top",
        trigger: "manual"
    }).click(deleteStaff).blur(function () {
        $(this).popover('hide');
    });

    // bind event
    $("#staff_list").children("div").on("click", "button", function (e) {
        readStaffAttributes(e, $(this).index());
    });
    $(window).bind('beforeunload', saveToLocal);

    // modal
    $('#modal_add_name').on('show.bs.modal', function () {
        // 关键代码，如没将modal设置为 block，则$modala_dialog.height() 为零
        $(this).css('display', 'block');
        let modalHeight = $(window).height() / 2 - $('#modal_add_name').find('.modal-dialog').height() / 2;
        $(this).find('.modal-dialog').css({
            'margin-top': modalHeight
        });
    }).on("shown.bs.modal", function () {
        $("#modal_add_name_input").focus();
    });
    $("#modal_add_name_input").keydown(function (e) {
        if (e.keyCode === 13) {
            addName();
            $(this).val('');
        }
    });
});

/**
 * load local config file
 * @param callback called on completion
 */
function init(callback) {
    $.getJSON("data/luke_config.json", function (data) {
        if (data == null) {
            return;
        }
        staticLocalJson = data;
    }).done(callback);
}

function readStaffAttributes(e, i) {
    let id = parseInt(e.target.getAttribute("data-id"));
    $("#staff_attr_panel").attr("data-id", id);
    // new staff
    if (id === staticLocalJson.staff_auto_increment) {
        // reset attributes group
        $("#staff_attr_name_select").val(-1);
        $("#staff_attr_career_input").val("");
        $("#staff_attr_type_select").val(0);
        $("#staff_attr_absence_check").prop("checked", false);
        $("#staff_attr_other_attack").children("label").removeClass("active").eq(0).addClass("active");
        $("#staff_attr_other_control").children("label").removeClass("active").eq(0).addClass("active");
        $("#staff_attr_other_element").children("label").removeClass("active").eq(0).addClass("active");
        return;
    }
    // read local attributes
    let list = staticLocalJson.staff_list;
    if (list[i].id === id) {
        // main attributes
        let index_namelist = staticNameList.indexOf(list[i].name);
        $("#staff_attr_name_select").val(index_namelist);
        $("#staff_attr_career_input").val(list[i].career);
        $("#staff_attr_type_select").val(list[i].type);
        $("#staff_attr_absence_check").prop("checked", list[i].absence);
        // other attributes
        $("#staff_attr_other_attack").children("label").removeClass("active").eq(list[i].attack - 1).addClass("active");
        $("#staff_attr_other_control").children("label").removeClass("active").eq(list[i].control - 1).addClass("active");
        $("#staff_attr_other_element").children("label").removeClass("active").eq(list[i].element - 1).addClass("active");
    } else {
        console.log(i+' '+list[i].id+' '+id);
        // Error 600:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        alert("错误代码600，请告知小明");
    }
}

function loadStaffList() {
    let $staff_list = $("#staff_list").children("div");
    $staff_list.empty();
    $.each(staticLocalJson.staff_list, function (index, item) {
        // load name list
        if (staticNameList.indexOf(item.name) === -1) {
            staticNameList.push(item.name);
        }

        // load staff
        let elementNode = document.createElement("button");
        elementNode.setAttribute("type", "button");
        elementNode.setAttribute("data-id", item.id);
        elementNode.className = "btn btn-default";
        elementNode.innerHTML = item.name + item.career;
        if (item.absence) {
            elementNode.className += " career-absence";
        } else if (item.type === 1) {
            elementNode.className += " career-c";
        } else if (item.type === 2) {
            elementNode.className += " career-assist";
        } else {
            elementNode.className += " career-priest";
        }
        $staff_list.append(elementNode);
    });
    loadNameList();
}

function loadNameList() {
    let $name_select = $("#staff_attr_name_select");
    $name_select.empty();
    $name_select.append(new Option("称谓", "-1"));
    $.each(staticNameList, function (index, item) {
        $name_select.append(new Option(item, index));
    });
}

function addStaff() {
    let $btn_list = $("#staff_list").children('div');
    let increment = staticLocalJson.staff_auto_increment;
    let exist = $btn_list.children("button").is("[data-id=" + increment + "]");
    if (exist) {
        $("#staff_list_add_btn").popover('show');
        return;
    }
    let elementNode = document.createElement("button");
    elementNode.setAttribute("type", "button");
    elementNode.setAttribute("data-id", increment.toString());
    elementNode.className = "btn btn-default";
    elementNode.innerHTML = "新增人员";
    $btn_list.append(elementNode);
}

function addName() {
    let name = $("#modal_add_name_input").val().trim();
    let $modal = $("#modal_add_name");
    if (name === null || name === '') {
        $modal.modal('hide');
        return;
    }
    staticNameList.push(name);
    loadNameList();
    $("#staff_attr_name_select").val(staticNameList.length - 1);
    $modal.modal('hide');
}

function saveStaff() {
    let id = parseInt($("#staff_attr_panel").attr("data-id"));
    let $staff_btn = $("#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {// no staff selected or btn was deleted
        // pop over
        $('#staff_attr_save_btn').popover('show');
        return;
    }
    // read staff
    let staff = {
        "id": id,
        "name": staticNameList[parseInt($("#staff_attr_name_select").val())],
        "career": $("#staff_attr_career_input").val().trim(),
        "type": parseInt($("#staff_attr_type_select").val()),
        "absence": $("#staff_attr_absence_check").prop('checked'),
        "attack": $("#staff_attr_other_attack").find('label.active').index() + 1,
        "control": $("#staff_attr_other_control").find('label.active').index() + 1,
        "element": $("#staff_attr_other_element").find('label.active').index() + 1
    };
    if (staff.id === staticLocalJson.staff_auto_increment) { // new staff
        // save to cache
        staticLocalJson.staff_list.push(staff);
        staticLocalJson.staff_auto_increment++;
    } else { // old staff
        let index = $staff_btn.index();
        if (staticLocalJson.staff_list[index].id === staff.id) {
            staticLocalJson.staff_list[index] = staff;
        } else {
            // Error 601:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
            alert("错误代码601，请告知小明");
        }
    }
    // refresh staff button
    $staff_btn.text(staff.name + staff.career);
    if (staff.absence) {
        $staff_btn.attr("class", "btn btn-default career-absence");
    } else if (staff.type === 1) {
        $staff_btn.attr("class", "btn btn-default career-c");
    } else if (staff.type === 2) {
        $staff_btn.attr("class", "btn btn-default career-assist");
    } else if (staff.type === 3) {
        $staff_btn.attr("class", "btn btn-default career-priest");
    } else {
        $staff_btn.attr("class", "btn btn-default");
    }
}

function deleteStaff() {
    let id = parseInt($("#staff_attr_panel").attr("data-id"));
    let $staff_btn = $("#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {// no staff selected or btn was deleted
        // pop over
        $('#staff_attr_del_btn').popover('show');
        return;
    }

    let index = $staff_btn.index();
    // delete btn
    $staff_btn.remove();
    if (staticLocalJson.staff_auto_increment === id) {// newly added
        return;
    }
    // delete from static json
    if (staticLocalJson.staff_list[index].id === id) {
        staticLocalJson.staff_list.splice(index, 1);
    } else {
        // Error 602:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        alert("错误代码602，请告知小明");
    }
}

function saveToLocal() {
    let dataToStore = JSON.stringify(staticLocalJson);
    $.ajax({
        method: 'post',
        url: 'php/saveJSON.php',
        async: true,
        data: {
            'toStore': dataToStore
        }
    }).done(function (data) {
        console.log(data + ' characters saved');
    });
}