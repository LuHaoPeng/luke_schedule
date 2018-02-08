'use strict';

var staticLocalJson = {
    "staff_auto_increment": 0,
    "staff_list": []
};
var staticNameList = [];
$(document).ready(function () {
    init(function () {
        // init done
        // load local
        loadStaffList();
    });

    // init popovers
    initPopovers();

    // bind events
    bindEvents();

    // bind draw line
    bindDrawLine();

    // make draggable
    makeDraggable($('#staff_list'), $("#staff_list_move_handle"));

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
    $("#modal_add_name_input").on('keydown', function (e) {
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

/**
 * init popovers
 */
function initPopovers() {
    $("#staff_list_add_btn").popover({
        content: "一次只能新增一个空白团员",
        placement: "top",
        trigger: "manual"
    }).on('click', addStaff).on('blur', function () {
        $(this).popover('hide');
    });

    $("#staff_attr_save_btn").popover({
        content: "请先在左侧团员列表选中其一",
        placement: "top",
        trigger: "manual"
    }).on('click', saveStaff).on('blur', function () {
        $(this).popover('hide');
    });

    $("#staff_attr_del_btn").popover({
        content: "请先在左侧团员列表选中其一",
        placement: "top",
        trigger: "manual"
    }).on('click', deleteStaff).on('blur', function () {
        $(this).popover('hide');
    });
}

/**
 * bind events
 */
function bindEvents() {
    // click on a staff button to read its attributes
    $("#staff_list").children("div").on('click', 'button', function (e) {
        console.log('click button');
        readStaffAttributes(e, $(this).index());
    });

    // save data on leaving
    window.onbeforeunload = saveToLocal;

    // filter staff
    $("#staff_list_filter").find("input[name='options']").on('change', function () {
        var type = $(this).attr("data-filter");
        var className = void 0;
        if (type === '1') {
            className = '.career-c';
        } else if (type === '2') {
            className = '.career-assist';
        } else if (type === '3') {
            className = '.career-priest';
        } else if (type === '4') {
            className = '.in-schedule';
        } else {
            className = '.career-absence';
        }
        if ($(this).parent().hasClass('active')) {
            // show
            $("#staff_list").children('div').find(className).show();
        } else {
            // hide
            $("#staff_list").children('div').find(className).hide();
        }
    });
}

/**
 * when a staff button is clicked, load his attributes
 * @param e event object
 * @param i index of that button
 */
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
        console.log(i + ' ' + list[i].id + ' ' + id);
        // Error 600:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        alert("错误代码600，请告知小明");
    }
}

/**
 * load staff list on the left from local json
 */
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
        if (item.type === 1) {
            elementNode.className += " career-c";
        } else if (item.type === 2) {
            elementNode.className += " career-assist";
        } else {
            elementNode.className += " career-priest";
        }
        if (item.absence) {
            elementNode.className += " career-absence";
        }
        $staff_list.append(elementNode);
    });
    loadNameList();
}

/**
 * create name select widget from static list
 */
function loadNameList() {
    var $name_select = $("#staff_attr_name_select");
    $name_select.empty();
    $name_select.append(new Option("称谓", "-1"));
    $.each(staticNameList, function (index, item) {
        $name_select.append(new Option(item, index));
    });
}

/**
 * add a blank staff button
 */
function addStaff() {
    var $btn_list = $("#staff_list").children('div');
    var increment = staticLocalJson.staff_auto_increment;
    var exist = $btn_list.children("button").is("[data-id=" + increment + "]");
    if (exist) {
        $("#staff_list_add_btn").popover('show');
        return;
    }
    var elementNode = document.createElement("button");
    elementNode.setAttribute("type", "button");
    elementNode.setAttribute("data-id", increment.toString());
    elementNode.className = "btn btn-default";
    elementNode.innerHTML = "新增人员";
    $btn_list.append(elementNode);
}

/**
 * add a new staff name to static list
 * and reload the name select widget
 */
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

/**
 * save the attribute changes to local
 * and refresh the corresponding button
 */
function saveStaff() {
    var id = parseInt($("#staff_attr_panel").attr("data-id"));
    var $staff_btn = $("#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {
        // no staff selected or btn was deleted
        // pop over
        $('#staff_attr_save_btn').popover('show');
        return;
    }
    // read staff
    var staff = {
        "id": id,
        "name": staticNameList[parseInt($("#staff_attr_name_select").val())],
        "career": $("#staff_attr_career_input").val().trim(),
        "type": parseInt($("#staff_attr_type_select").val()),
        "absence": $("#staff_attr_absence_check").prop('checked'),
        "attack": $("#staff_attr_other_attack").find('label.active').index() + 1,
        "control": $("#staff_attr_other_control").find('label.active').index() + 1,
        "element": $("#staff_attr_other_element").find('label.active').index() + 1
    };
    if (staff.id === staticLocalJson.staff_auto_increment) {
        // new staff
        // save to cache
        staticLocalJson.staff_list.push(staff);
        staticLocalJson.staff_auto_increment++;
    } else {
        // old staff
        var index = $staff_btn.index();
        if (staticLocalJson.staff_list[index].id === staff.id) {
            staticLocalJson.staff_list[index] = staff;
        } else {
            // Error 601:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
            alert("错误代码601，请告知小明");
        }
    }
    // refresh staff button
    $staff_btn.text(staff.name + staff.career);
    if (staff.type === 1) {
        $staff_btn.attr("class", "btn btn-default career-c");
    } else if (staff.type === 2) {
        $staff_btn.attr("class", "btn btn-default career-assist");
    } else if (staff.type === 3) {
        $staff_btn.attr("class", "btn btn-default career-priest");
    } else {
        $staff_btn.attr("class", "btn btn-default");
    }
    if (staff.absence) {
        $staff_btn.addClass("career-absence");
    }
}

/**
 * delete the corresponding staff button both from page and static json
 */
function deleteStaff() {
    var id = parseInt($("#staff_attr_panel").attr("data-id"));
    var $staff_btn = $("#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {
        // no staff selected or btn was deleted
        // pop over
        $('#staff_attr_del_btn').popover('show');
        return;
    }

    var index = $staff_btn.index();
    // delete btn
    $staff_btn.remove();
    if (staticLocalJson.staff_auto_increment === id) {
        // newly added
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

/**
 * save all changes to local .json file
 */
function saveToLocal() {
    var dataToStore = JSON.stringify(staticLocalJson);
    $.ajax({
        method: 'post',
        url: 'php/saveJSON.php',
        async: false, // important
        data: {
            'toStore': dataToStore
        }
    }).done(function (data) {
        console.log(data + ' characters saved');
    });
}

/**
 * make the corresponding dom draggable
 * @param $object jquery selector, object to be dragged
 * @param $handle the move handle
 */
function makeDraggable($object, $handle) {
    if (!$object instanceof jQuery) {
        return;
    }
    var isMove = false;
    var X = void 0,
        Y = void 0;
    $handle.on('mousedown', function (e) {
        isMove = true;
        X = e.pageX - parseInt($object.css("left"));
        Y = e.pageY - parseInt($object.css("top"));
    });
    $(document).on('mousemove', function (e) {
        if (isMove) {
            var left = e.pageX - X;
            var top = e.pageY - Y;
            $object.css({ left: left, top: top });
        }
    }).on('mouseup', function () {
        isMove = false;
    });
}

/**
 * when drag event happening on a staff button, draw a line from start to end
 * if the dragging ends within the schedule chart, fill the cell with the staff
 */
function bindDrawLine() {
    // reinitialize svg width & height
    $('.line').css({ width: document.body.scrollWidth, height: document.body.scrollHeight });
    // bind
    var staffId = void 0;
    var isDraw = false,
        isDrop = false;
    // pick staff
    var $buttons = $("#staff_list").children('div');
    $buttons.on('mousedown', 'button', function (e) {
        console.log('down button');
        // unlock drawing
        isDraw = true;
        // read staff id
        staffId = parseInt($(e.target).attr('data-id'));
        // draw a line
        $('svg').show().children('line').attr({ x1: e.pageX, y1: e.pageY, x2: e.pageX, y2: e.pageY });
    });
    // draw line
    $(document).on('mousemove', function (e) {
        if (isDraw) {
            // draw a line
            $('svg').children('line').attr({ x2: e.pageX, y2: e.pageY });
        }
    }).on('mouseup', function () {
        console.log('up document');
        if (isDraw) {
            isDraw = false;
            $('svg').hide();
            isDrop = true;
        }
    });
    // drop staff
    $('table tr td').on('mouseover', function () {
        if (isDrop) {
            var staff = staticLocalJson.staff_list[staffId - 1];
            if (staff.id === staffId) {
                // fill in the cell
                $(this).attr({ 'data-name': staff.name }).text(staff.name + staff.career);
                // hide source
            }
            isDrop = false;
        }
    });
}
//# sourceMappingURL=luke.js.map