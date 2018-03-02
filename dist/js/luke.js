'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var staticLocalJson = {
    "staff_auto_increment": 0,
    "staff_list": [],
    "last_schedule": "",
    "authorize": ""
};
var staticNameList = [];
$(document).ready(function () {
    init(function () {
        // init done
        // load local
        loadStaffList();
        if (staticLocalJson.last_schedule !== "") {
            $("div#schedule").html(staticLocalJson.last_schedule);
        }
    });

    $('div#schedule').children('h3').text(new Date().toLocaleDateString().replace(/\//g, '-'));

    // init popovers
    initPopovers();

    // init switch
    $("input#edit_lock").bootstrapSwitch({
        'state': false,
        'size': 'small',
        'onText': "\u2714",
        'offText': "\u2718",
        'onSwitchChange': function onSwitchChange() {
            var state = $("input#edit_lock").bootstrapSwitch('state');
            var $chart = $('div#schedule');
            if (state === true) {
                $chart.find('table thead th').children('span').show();
                $chart.children('div').show();
            } else if (state === false) {
                $chart.find('table thead th').children('span').hide();
                $chart.children('div').hide();
            }
        }
    });

    // bind events
    bindEvents();

    // bind draw line
    bindDrawLine();

    // make draggable
    makeDraggable($('div#staff_list'), $("button#staff_list_move_handle"));

    // show modal authorize
    if (sessionStorage.authorized === null) {
        $("div#modal_authorize").modal('show');
    }
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
    $("button#staff_list_add_btn").popover({
        content: "一次只能新增一个空白团员",
        placement: "top",
        trigger: "manual"
    }).on('click', addStaff).on('blur', function () {
        $(this).popover('hide');
    });

    $("button#staff_attr_save_btn").popover({
        content: "请先在左侧团员列表选中其一",
        placement: "top",
        trigger: "manual"
    }).on('click', saveStaff).on('blur', function () {
        $(this).popover('hide');
    });

    $("button#staff_attr_del_btn").popover({
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
    $("div#staff_list").children("div").on('click', 'button', function (e) {
        readStaffAttributes(e, $(this).index());
    });

    // save data on leaving
    window.onbeforeunload = saveToLocal;

    // filter staff
    $("div#staff_list_filter").find("input[name='options']").on('change', function () {
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
        } else if (type === '5') {
            className = '.career-absence';
        }
        if ($(this).parent().hasClass('active')) {
            // show
            $("div#staff_list").find(className).show();
        } else {
            // hide
            $("div#staff_list").find(className).hide();
        }
    });

    // modal
    $('div#modal_add_name').on('show.bs.modal', function () {
        // 关键代码，如没将modal设置为 block，则$modala_dialog.height() 为零
        $(this).css('display', 'block');
        var modalHeight = $(window).height() / 2 - $('div#modal_add_name').find('.modal-dialog').height() / 2;
        $(this).find('.modal-dialog').css({
            'margin-top': modalHeight
        });
    }).on("shown.bs.modal", function () {
        $("input#modal_add_name_input").focus();
    });
    $("input#modal_add_name_input").on('keydown', function (e) {
        if (e.keyCode === 13) {
            addName();
            $(this).val('');
        }
    });
    $('div#modal_authorize').on('show.bs.modal', function () {
        // 关键代码，如没将modal设置为 block，则$modala_dialog.height() 为零
        $(this).css('display', 'block');
        var modalHeight = $(window).height() / 2 - $('div#modal_authorize').find('.modal-dialog').height() / 2;
        $(this).find('.modal-dialog').css({
            'margin-top': modalHeight
        });
    }).on("shown.bs.modal", function () {
        $("input#modal_authorize_input").focus();
    });
    $("input#modal_authorize_input").on('keydown', function (e) {
        if (e.keyCode === 13) {
            authorize();
            $(this).val('');
        }
    });

    // row/chart add&delete
    var alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    var time = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '0:00', '0:30'];
    $("div#schedule").on('click', "[name='row-add']", function () {
        var $table = $(this).parentsUntil('div#schedule').filter('table');
        var count = $table.find('tbody tr').length;
        if (count >= 7) return; // max support 7 rows per chart
        $table.append('<tr><th scope="row">' + alphabet[count] + '队</th><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
        resizeSVG();
    }).on('click', "[name='row-delete']", function () {
        var $tr = $(this).parentsUntil('div#schedule').filter('table').find('tbody tr');
        var count = $tr.length;
        if (count <= 1) return; // min support 1 row per chart
        $tr.eq(count - 1).remove();
        resizeSVG();
    }).on('click', "[name='chart-add']", function () {
        var count = $("div#schedule").children("table").length;
        if (count >= 10) return; // max support 10 charts
        $("<table class=\"table table-bordered text-center\">\n" + "<thead>\n" + "<tr>\n" + "    <th class=\"bg-success\">" + time[count] + "\n" + "        <span class=\"pull-right\">\n" + "            <button type=\"button\" class=\"btn btn-info btn-xxs\" name=\"row-add\">\n" + "                <span class=\"glyphicon glyphicon-plus\"></span>\n" + "            </button>\n" + "            <button type=\"button\" class=\"btn btn-info btn-xxs\" name=\"row-delete\">\n" + "                <span class=\"glyphicon glyphicon-minus\"></span>\n" + "            </button>\n" + "        </span>\n" + "    </th>\n" + "    <th class=\"text-center\" colspan=\"4\">光</th>\n" + "    <th class=\"text-center\" colspan=\"4\">暗</th>\n" + "</tr>\n" + "</thead>\n" + "<tbody>\n" + "<tr>\n" + "    <th scope=\"row\">A队</th>\n" + "    <td></td>\n" + "    <td></td>\n" + "    <td></td>\n" + "    <td></td>\n" + "    <td></td>\n" + "    <td></td>\n" + "    <td></td>\n" + "    <td></td>\n" + "</tr>\n" + "</tbody>\n" + "</table>").insertBefore("div#schedule>div");
        resizeSVG();
    }).on('click', "[name='chart-delete']", function () {
        var $table = $("div#schedule").children("table");
        var count = $table.length;
        if (count <= 1) return; // min support 1 chart
        $table.eq(count - 1).remove();
        resizeSVG();
    });
}

/**
 * authorize. if not, the user won't have access to save changes
 */
function authorize() {
    var code = $("input#modal_authorize_input").val().trim();
    var $modal = $("div#modal_authorize");
    // clear help block
    var $help = $("span#helpBlock");
    $help.text('');
    if (md5(code) === staticLocalJson.authorize) {
        sessionStorage.authorized = true;
        $modal.modal('hide');
    } else {
        sessionStorage.authorized = false;
        $help.text('授权码不对，请联系小明');
    }
}

/**
 * when a staff button is clicked, load his attributes
 * @param e event object
 * @param i index of that button
 */
function readStaffAttributes(e, i) {
    var id = parseInt(e.target.getAttribute("data-id"));
    $("div#staff_attr_panel").attr("data-id", id);
    // new staff
    if (id === staticLocalJson.staff_auto_increment) {
        // reset attributes group
        $("select#staff_attr_name_select").val(-1);
        $("input#staff_attr_career_input").val("");
        $("select#staff_attr_type_select").val(0);
        $("input#staff_attr_absence_check").prop("checked", false);
        $("div#staff_attr_other_attack").children("label").removeClass("active").eq(0).addClass("active");
        $("div#staff_attr_other_control").children("label").removeClass("active").eq(0).addClass("active");
        $("div#staff_attr_other_element").children("label").removeClass("active").eq(0).addClass("active");
        return;
    }
    // read local attributes
    var list = staticLocalJson.staff_list;
    if (list[i].id === id) {
        // main attributes
        var index_namelist = staticNameList.indexOf(list[i].name);
        $("select#staff_attr_name_select").val(index_namelist);
        $("input#staff_attr_career_input").val(list[i].career);
        $("select#staff_attr_type_select").val(list[i].type);
        $("input#staff_attr_absence_check").prop("checked", list[i].absence);
        // other attributes
        $("div#staff_attr_other_attack").children("label").removeClass("active").eq(list[i].attack - 1).addClass("active");
        $("div#staff_attr_other_control").children("label").removeClass("active").eq(list[i].control - 1).addClass("active");
        $("div#staff_attr_other_element").children("label").removeClass("active").eq(list[i].element - 1).addClass("active");
    } else {
        console.log(i + ' ' + list[i].id + ' ' + id);
        // Error 60x:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        alert("错误代码600，请告知小明");
    }
}

/**
 * load staff list on the left from local json
 */
function loadStaffList() {
    var $staff_list = $("div#staff_list").children("div");
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
        } else if (item.type === 3) {
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
    var $name_select = $("select#staff_attr_name_select");
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
    var $btn_list = $("div#staff_list").children('div');
    var increment = staticLocalJson.staff_auto_increment;
    var exist = $btn_list.children("button").is("[data-id=" + increment + "]");
    if (exist) {
        $("button#staff_list_add_btn").popover('show');
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
    var name = $("input#modal_add_name_input").val().trim();
    var $modal = $("div#modal_add_name");
    if (name === null || name === '') {
        $modal.modal('hide');
        return;
    }
    staticNameList.push(name);
    loadNameList();
    $("select#staff_attr_name_select").val(staticNameList.length - 1);
    $modal.modal('hide');
}

/**
 * save the attribute changes to local
 * and refresh the corresponding button
 */
function saveStaff() {
    var id = parseInt($("div#staff_attr_panel").attr("data-id"));
    var $staff_btn = $("div#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {
        // no staff selected or btn was deleted
        // pop over
        $('button#staff_attr_save_btn').popover('show');
        return;
    }
    // read staff
    var staff = {
        "id": id,
        "name": staticNameList[parseInt($("select#staff_attr_name_select").val())],
        "career": $("input#staff_attr_career_input").val().trim(),
        "type": parseInt($("select#staff_attr_type_select").val()),
        "absence": $("input#staff_attr_absence_check").prop('checked'),
        "attack": $("div#staff_attr_other_attack").find('label.active').index() + 1,
        "control": $("div#staff_attr_other_control").find('label.active').index() + 1,
        "element": $("div#staff_attr_other_element").find('label.active').index() + 1
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
            // Error 60x:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
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
    } else if (staff.type === 0) {
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
    var id = parseInt($("div#staff_attr_panel").attr("data-id"));
    var $staff_btn = $("div#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {
        // no staff selected or btn was deleted
        // pop over
        $("button#staff_attr_del_btn").popover('show');
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
        // Error 60x:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        alert("错误代码602，请告知小明");
    }
}

/**
 * save all changes to local .json file
 */
function saveToLocal() {
    console.log(sessionStorage.authorized);
    if (sessionStorage.authorized === null || sessionStorage.authorized === false) {
        return;
    }
    // save schedule to local
    staticLocalJson.last_schedule = $("div#schedule").html();

    // stringify
    var dataToStore = JSON.stringify(staticLocalJson, null, 4);
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
 * when nodes be added to or removed from DOM and the height has changed,
 * the svg needs to resize
 */
function resizeSVG() {
    $('.line').css({ width: document.body.scrollWidth, height: document.body.scrollHeight });
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
    var $svg = $('svg');
    // pick staff
    var $buttons = $("div#staff_list").children('div');
    $buttons.on('mousedown', 'button', function (e) {
        // unlock drawing
        isDraw = true;
        // read staff id
        staffId = parseInt($(e.target).attr('data-id'));
        // draw a line
        $svg.children('line').attr({ x1: e.pageX, y1: e.pageY, x2: e.pageX, y2: e.pageY });
    });
    // draw line
    $(document).on('mousemove', function (e) {
        if (isDraw) {
            if (!$svg.is(':visible')) {
                $svg.show();
            }
            // draw a line
            $svg.children('line').attr({ x2: e.pageX, y2: e.pageY });
        }
    }).on('mouseup', function () {
        if (isDraw) {
            isDraw = false;
            $svg.hide();

            // allow drop
            isDrop = true;
            setTimeout(function () {
                isDrop = false;
            }, 10);
        }
    });
    // drop staff
    $('div#schedule').on('mouseover', 'table tr td', function () {
        if (isDrop) {
            var staff = staticLocalJson.staff_list[staffId - 1];
            if (staff.id === staffId) {
                // fill in the cell
                $(this).attr({ 'data-name': staff.name }).text(staff.name + staff.career);
                // set staff to '.in-schedule'
                // TODO consider REPLACE
                var $staff_in = $("div#staff_list").find('button[data-id=' + staffId + ']');
                if (!$staff_in.hasClass('in-schedule')) {
                    $staff_in.addClass('in-schedule');
                    // hide
                    if ($("div#staff_list_filter").find('input[data-filter=4]').prop("checked") === false) {
                        $staff_in.hide();
                    }
                }
            } else {
                // Error 60x:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
                alert("错误代码603，请告知小明");
            }
            isDrop = false;
            // check duplication partly
            markDuplicate(false, $(this));
        }
    });
}

/**
 * check duplication in schedule
 * @param scale boolean. true:wholly, false:partly. if false, a root object is needed
 */
function markDuplicate(scale) {
    // TODO async
    if (scale) {} else {
        if (_typeof(arguments[1]) === "object") {
            // recover
            var $obj = arguments[1];
            var $td = $obj.parentsUntil('table').find('td');
            $td.css('color', '');
            // check
            var map = {};
            $.each($td, function () {
                var key = $(this).attr('data-name');
                if (typeof map[key] === "undefined") {
                    map[key] = 1; // first met
                } else if (map[key] === 1) {
                    $td.filter('[data-name=' + key + ']').css('color', 'red');
                    map[key] = 2; // handled
                }
            });
        } else {
            // Error 70x:参数传递错误
            alert("错误代码701，请告知小明");
        }
    }
}
//# sourceMappingURL=luke.js.map