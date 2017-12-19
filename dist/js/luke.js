'use strict';

var staticLocalJson = null;
var staticNameList = [];
$(document).ready(function () {
    init(function () {
        // init done
        // load local
        loadStaffList();
    });

    // init popover
    $("#staff_attr_save_btn").popover({
        content: "请先在左侧团员列表选中其一",
        placement: "top",
        trigger: "manual"
    }).click(saveStaff).blur(function () {
        $(this).popover('hide');
    });

    $("#staff_list_add_btn").click(addStaff);

    // bind event
    $("#staff_list").children("div").on("click", "button", function (e) {
        readStaffAttributes(e, $(this).index());
    });

    // modal
    $('#modal_add_name').on('show.bs.modal', function () {
        // 关键代码，如没将modal设置为 block，则$modala_dialog.height() 为零
        $(this).css('display', 'block');
        var modalHeight = $(window).height() / 2 - $('#modal_add_name').find('.modal-dialog').height() / 2;
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
    var id = parseInt(e.target.getAttribute("data-id"));
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
    var list = staticLocalJson.staff_list;
    if (list[i].id === id) {
        // main attributes
        var index_namelist = staticNameList.indexOf(list[i].name);
        $("#staff_attr_name_select").val(index_namelist);
        $("#staff_attr_career_input").val(list[i].career);
        $("#staff_attr_type_select").val(list[i].type);
        $("#staff_attr_absence_check").prop("checked", list[i].absence);
        // other attributes
        $("#staff_attr_other_attack").children("label").removeClass("active").eq(list[i].attack - 1).addClass("active");
        $("#staff_attr_other_control").children("label").removeClass("active").eq(list[i].control - 1).addClass("active");
        $("#staff_attr_other_element").children("label").removeClass("active").eq(list[i].element - 1).addClass("active");
    } else {
        // Error 600:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        alert("错误代码600，请告知小明");
    }
}

function loadStaffList() {
    var $staff_list = $("#staff_list").children("div");
    $staff_list.empty();
    $.each(staticLocalJson.staff_list, function (index, item) {
        // load name list
        if (staticNameList.indexOf(item.name) === -1) {
            staticNameList.push(item.name);
        }

        // load staff
        var elementNode = document.createElement("button");
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
    var $name_select = $("#staff_attr_name_select");
    $name_select.empty();
    $name_select.append(new Option("称谓", "-1"));
    $.each(staticNameList, function (index, item) {
        $name_select.append(new Option(item, index));
    });
}

function addStaff() {
    var increment = staticLocalJson.staff_auto_increment;
    var elementNode = document.createElement("button");
    elementNode.setAttribute("type", "button");
    elementNode.setAttribute("data-id", increment);
    elementNode.className = "btn btn-default";
    elementNode.innerHTML = "新增人员";
    $("#staff_list").children("div").append(elementNode);
}

function addName() {
    var name = $("#modal_add_name_input").val().trim();
    var $modal = $("#modal_add_name");
    if (name === null || name === '') {
        $modal.modal('hide');
        return;
    }
    staticNameList.push(name);
    loadNameList();
    $("#staff_attr_name_select").val(staticNameList.length - 1);
    $modal.modal('hide');
}

//fixme 目前只支持新增用户的保存，对旧用户有BUG
function saveStaff() {
    var id = parseInt($("#staff_attr_panel").attr("data-id"));
    if (id === -1) {
        // no staff selected
        // pop over
        $('#staff_attr_save_btn').popover('show');
        return;
    }
    // create staff
    var newStaff = {
        "id": staticLocalJson.staff_auto_increment,
        "name": staticNameList[parseInt($("#staff_attr_name_select").val())],
        "career": $("#staff_attr_career_input").val().trim(),
        "type": parseInt($("#staff_attr_type_select").val()),
        "absence": $("#staff_attr_absence_check").prop('checked'),
        "attack": $("#staff_attr_other_attack").find('label.active').index() + 1,
        "control": $("#staff_attr_other_control").find('label.active').index() + 1,
        "element": $("#staff_attr_other_element").find('label.active').index() + 1
    };
    // save to cache
    var staffList = staticLocalJson.staff_list;
    staffList.push(newStaff);
    staticLocalJson.staff_list = staffList;
    staticLocalJson.staff_auto_increment = staticLocalJson.staff_auto_increment + 1;
    // refresh staff button
    var $staff_btn = $("#staff_list").children('div').children("button[data-id=" + newStaff.id + "]");
    $staff_btn.text(newStaff.name + newStaff.career);
    if (newStaff.absence) {
        $staff_btn.attr("class", "btn btn-default career-absence");
    } else if (newStaff.type === 1) {
        $staff_btn.attr("class", "btn btn-default career-c");
    } else if (newStaff.type === 2) {
        $staff_btn.attr("class", "btn btn-default career-assist");
    } else if (newStaff.type === 3) {
        $staff_btn.attr("class", "btn btn-default career-priest");
    } else {
        $staff_btn.attr("class", "btn btn-default");
    }
}

//TODO save to local on leave
//# sourceMappingURL=luke.js.map