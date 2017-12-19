'use strict';
let staticLocalJson = null;
let staticNameList = [];
$(document).ready(function () {
    init(function () {
        // init done
        // load local
        loadStaffList();
    });

    // bind event
    $("#staff_list").children("div").on("click", "button", function (e) {
        readStaffAttributes(e, $(this).index());
    });

    // modal
    $('#modal_add_name').on('show.bs.modal', function (e) {
        // 关键代码，如没将modal设置为 block，则$modala_dialog.height() 为零
        $(this).css('display', 'block');
        let modalHeight = $(window).height() / 2 - $('#modal_add_name').find('.modal-dialog').height() / 2;
        $(this).find('.modal-dialog').css({
            'margin-top': modalHeight
        });
    });
    $("#modal_add_name").on("shown.bs.modal", function (e) {
        $("#modal_add_name_input").val('');
        $("#modal_add_name_input").focus();
        $('#modal_add_name_input').keydown(function (e) {
            if (e.keyCode === 13) {
                addName();
            }
        });
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
        $("#staff_attr_absence_check").removeAttr("checked");
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
        if (list[i].absence) {
            $("#staff_attr_absence_check").attr("checked", "checked");
        } else {
            $("#staff_attr_absence_check").removeAttr("checked");
        }
        // other attributes
        $("#staff_attr_other_attack").children("label").removeClass("active").eq(list[i].attack - 1).addClass("active");
        $("#staff_attr_other_control").children("label").removeClass("active").eq(list[i].control - 1).addClass("active");
        $("#staff_attr_other_element").children("label").removeClass("active").eq(list[i].element - 1).addClass("active");
    } else {
        // Error 600:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        // TODO
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
    loadNameList()
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
    let increment = staticLocalJson.staff_auto_increment;
    let elementNode = document.createElement("button");
    elementNode.setAttribute("type", "button");
    elementNode.setAttribute("data-id", increment);
    elementNode.className = "btn btn-default";
    elementNode.innerHTML = "新增人员";
    $("#staff_list").children("div").append(elementNode);
}

function addName() {
    let name = $("#modal_add_name_input").val();
    if (name === null) {
        return
    }
    staticNameList.push(name);
    loadNameList();
    $("#staff_attr_name_select").val(staticNameList.length - 1);
    $("#modal_add_name").modal('hide');
}