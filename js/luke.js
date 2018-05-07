'use strict';
let staticLocalStaffList = null;
const timeTable = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '0:00', '0:30'];
let staticNameList = [];
let scheduleHistoryHtml = "";

$(document).ready(function () {
    init(function () {
        // init popovers
        initPopovers();
        // bind events
        bindEvents();
        // bind draw line
        bindDrawLine();

        // show modal authorize
        if (typeof sessionStorage.authorized === "undefined") {
            $("div#modal_authorize").modal('show');
        }
    });

    // init switch
    $("input#edit_lock").bootstrapSwitch({
        'state': false,
        'size': 'small',
        'onText': '\u2714',
        'offText': '\u2718',
        'onSwitchChange': function () {
            let state = $("input#edit_lock").bootstrapSwitch('state');
            let $chart = $('div#schedule');
            if (state === true) {
                $chart.find('table thead th').children('span').show();
                $chart.children('div').show();
            } else if (state === false) {
                $chart.find('table thead th').children('span').hide();
                $chart.children('div').hide();
            }
        }
    });

    // make draggable
    makeDraggable($('div#staff_list'), $("button#staff_list_move_handle"));
});

/**
 * request data from server
 * @param callback called on completion
 */
function init(callback) {
    $("div#schedule").children('h3').text(new Date().toLocaleDateString().replace(/\//g, '-'));
    // load from server
    requestStaff(function () {
        requestSchedule(null, callback);
    });
    requestScheduleList();
}

/**
 * request staff list from server
 * @param callback called on completion
 */
function requestStaff(callback) {
    $.post("php/StaffList.php", function (data, status) {
        if (status === "success") {
            let json = JSON.parse(data);
            if (json.code === 0) {
                // local list
                staticLocalStaffList = json.data.staff_real;
                // load staff
                loadStaffList(json.data.staff_in_order);
                // toast when not on load
                if (callback == null) {
                    $.toast({
                        text: "已获取最新团员列表",
                        showHideTransition: 'fade',
                        icon: "info"
                    });
                }
            } else {
                // alert error
                $.toast({
                    heading: "error",
                    text: json.msg,
                    showHideTransition: 'fade',
                    icon: "error"
                });
            }
            // callback
            if (callback !== null && typeof callback === "function") {
                callback();
            }
        } else {
            // alert fail
            $.toast({
                heading: "获取团员列表失败",
                text: "请稍后尝试刷新页面",
                showHideTransition: 'fade',
                icon: "error",
                hideAfter: false
            });
        }
    });
}

/**
 * if id is not null, request corresponding schedule; else request the newest
 * @param id id of schedule
 * @param callback called on completion
 */
function requestSchedule(id, callback) {
    $.post("php/ScheduleSL.php", {
        "method": "load",
        "id": id
    }, function (data, status) {
        if (status === "success") {
            let json = JSON.parse(data);
            if (json.code === 0) {
                // construct chart
                if (json.data) {
                    constructChart(json.data.datatime, json.data.content);
                    // load check
                    loadCheck();
                }
                // toast when not on load
                if (callback == null) {
                    $.toast({
                        text: "排表载入完成",
                        showHideTransition: 'fade',
                        icon: "info"
                    });
                }
            } else {
                // alert error
                $.toast({
                    heading: "error",
                    text: json.msg,
                    showHideTransition: 'fade',
                    icon: "error"
                });
            }
            // callback
            if (callback !== null && typeof callback === "function") {
                callback();
            }
        } else {
            // alert fail
            $.toast({
                heading: "获取排表失败",
                text: "请稍后尝试刷新页面",
                showHideTransition: 'fade',
                icon: "error",
                hideAfter: false
            });
        }
    });
}

/**
 * request schedule list from server, and form it into html string
 * @returns {string} html string
 */
function requestScheduleList() {
    $.post("php/ScheduleList.php", function (data, status) {
        if (status === "success") {
            let json = JSON.parse(data);
            if (json.code === 0) {
                // construct chart
                if (json.data) {
                    // construct list
                    let list = json.data;
                    let contentHtml = "<ul>";
                    list.forEach(function (item) {
                        contentHtml += "<li><a class='schedule-history' data-id=\"" + item.id + "\">" + item.datatime.substr(0, 10) + "</a></li>";
                    });
                    contentHtml += "</ul>";
                    scheduleHistoryHtml = contentHtml;
                } else {
                    // no data
                    scheduleHistoryHtml = "暂无排表历史";
                }
            } else {
                scheduleHistoryHtml = "暂无排表历史";
                // alert error
                $.toast({
                    heading: "error",
                    text: json.msg,
                    showHideTransition: 'fade',
                    icon: "error"
                });
            }
        } else {
            scheduleHistoryHtml = "暂无排表历史";
            // alert fail
            $.toast({
                heading: "获取排表历史失败",
                text: "请稍后尝试刷新页面",
                showHideTransition: 'fade',
                icon: "error",
                hideAfter: false
            });
        }
    });
}

/**
 * construct chart
 * @param time chart data time
 * @param arrayParam array of the whole chart
 * @returns {boolean} false if chartArray is in wrong format
 */
function constructChart(time, arrayParam) {
    let chartArray = JSON.parse(arrayParam.replace(/[\u4e00-\u9fa5\w]+/g, function (a) {
        return '"' + a + '"';
    }));
    if (chartArray instanceof Array) {
        // clear schedule
        let $schedule = $("div#schedule");
        $schedule.html("");
        // add time and search box
        $schedule.append('<h3 class="text-center">' + time.substr(0, 10) + '</h3>');
        $schedule.append('<input title="在排表区查找对象" type="search" class="pull-right" id="schedule_search" autocomplete="off">');
        let tableHtml = '';
        // chartArray is the whole schedule
        chartArray.forEach(function (periodArray, indexPeriod) {
            if (periodArray instanceof Array) {
                // periodArray是一个时间段，对应table
                tableHtml += '<table class="table table-bordered text-center"><thead><tr>\n' +
                    ' <th class="bg-success">' + timeTable[indexPeriod] + '\n' +
                    '     <span class="pull-right" style="display: none;">\n' +
                    '         <button title="在该时间段末尾增加一个团" type="button" class="btn btn-info btn-xxs" name="row-add">\n' +
                    '             <span class="glyphicon glyphicon-plus"></span>\n' +
                    '         </button>\n' +
                    '         <button title="将该时间段末尾的团删去" type="button" class="btn btn-info btn-xxs" name="row-delete">\n' +
                    '             <span class="glyphicon glyphicon-minus"></span>\n' +
                    '         </button>\n' +
                    '     </span>\n' +
                    ' </th>\n' +
                    ' <th class="text-center" colspan="4">光</th>\n' +
                    ' <th class="text-center" colspan="4">暗</th>\n' +
                    ' </tr></thead><tbody>';
                periodArray.forEach(function (teamArray, indexTeam) {
                    if (teamArray instanceof Array) {
                        // teamArray是一个队，对应tr
                        tableHtml += '<tr><th scope="row">' + String.fromCharCode(65 + indexTeam) + '</th>';
                        teamArray.forEach(function (staffId) {
                            staffId = parseInt(staffId);
                            if (staffId === 0) {
                                // add null td
                                tableHtml += '<td></td>';
                            } else {
                                // staff是一个团员id，对应td
                                let staff = staticLocalStaffList[staffId - 1];
                                if (parseInt(staff.id) === staffId) {
                                    tableHtml += '<td data-id="' + staff.id + '" data-name="' + staff.name + '">' + staff.name + staff.career + '</td>';
                                } else {
                                    // Error 60x:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
                                    alert("错误代码604，请告知小明");
                                }
                            }
                        });
                        tableHtml += '</tr>';
                    } else {
                        // wrong format
                        return false;
                    }
                });
                tableHtml += '</tbody></table>';
            } else {
                // wrong format
                return false;
            }
        });
        $schedule.append(tableHtml);
        $schedule.append('<div class="text-center" style="margin-bottom: 15px;display: none;">\n' +
            ' <button title="末尾增加一个时间段" type="button" class="btn btn-primary btn-sm" name="chart-add">\n' +
            '     <span class="glyphicon glyphicon-plus"></span>\n' +
            ' </button>\n' +
            ' <button title="删去末尾的时间段" type="button" class="btn btn-primary btn-sm" name="chart-delete">\n' +
            '     <span class="glyphicon glyphicon-minus"></span>\n' +
            ' </button></div>');
    } else {
        // wrong format
        return false;
    }
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

    $("button#schedule_history_btn").popover({
        content: scheduleHistoryHtml,
        html: true,
        placement: "bottom",
        trigger: "focus"
    });
}

/**
 * bind events
 */
function bindEvents() {
    let $schedule = $("div#schedule");
    // click on a staff button to read its attributes
    $("div#staff_list").children("div").on('click', 'button', function (e) {
        readStaffAttributes(e);
    });

    // filter staff
    $("div#staff_list_filter").find("input[name='options']").on('change', filterStaff);

    // search
    $("input#staff_search").on('change keydown', function (e) {
        if (e.type === "keydown" && e.keyCode !== 13) return;
        let $list = $("div#staff_list").children("div").children("button");
        let key = $(this).val().trim();
        if (key === "") {
            $list.show();
        } else {
            $list.hide().filter(":contains(" + key + ")").show();
        }
    });
    $schedule.on('change keydown', "input#schedule_search", function (e) {
        if (e.type === "keydown" && e.keyCode !== 13) return;
        let $cell = $("div#schedule").find("tbody tr td");
        let key = $(this).val().trim();
        if (key === "") {
            $cell.removeClass("schedule-search-result");
        } else {
            $cell.removeClass("schedule-search-result").filter(":contains(" + key + ")").addClass("schedule-search-result");
        }
    });

    // modal
    $('div#modal_add_name').on('show.bs.modal', function () {
        // 关键代码，如没将modal设置为 block，则$modala_dialog.height() 为零
        $(this).css('display', 'block');
        let modalHeight = $(window).height() / 2 - $('div#modal_add_name').find('.modal-dialog').height() / 2;
        $(this).find('.modal-dialog').css({
            'margin-top': modalHeight
        });
    }).on("shown.bs.modal", function () {
        $("input#modal_add_name_input").focus();
    });
    $("input#modal_add_name_input").on('keydown', function (e) {
        if (e.keyCode === 13) {
            addName();
        }
    });
    $('div#modal_authorize').on('show.bs.modal', function () {
        // 关键代码，如没将modal设置为 block，则$modala_dialog.height() 为零
        $(this).css('display', 'block');
        let modalHeight = $(window).height() / 2 - $('div#modal_authorize').find('.modal-dialog').height() / 2;
        $(this).find('.modal-dialog').css({
            'margin-top': modalHeight
        });
    }).on("shown.bs.modal", function () {
        $("input#modal_authorize_input").focus();
    });
    $("input#modal_authorize_input").on('keydown', function (e) {
        if (e.keyCode === 13) {
            checkAuth();
        }
    });

    // row/chart add&delete
    $schedule.on('click', "[name='row-add']", function () {
        let $table = $(this).parentsUntil('div#schedule').filter('table');
        let count = $table.find('tbody tr').length;
        if (count >= 7) return;// max support 7 rows per chart
        $table.append('<tr><th scope="row">' + String.fromCharCode(65 + count) + '队</th><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
        resizeSVG();
    }).on('click', "[name='row-delete']", function () {
        let $tr = $(this).parentsUntil('div#schedule').filter('table').find('tbody tr');
        let count = $tr.length;
        if (count <= 1) return;// min support 1 row per chart
        $tr.eq(count - 1).remove();
        resizeSVG();
    }).on('click', "[name='chart-add']", function () {
        let count = $("div#schedule").children("table").length;
        if (count >= 10) return;// max support 10 charts
        $("<table class=\"table table-bordered text-center\">\n" +
            "<thead>\n" +
            "<tr>\n" +
            "    <th class=\"bg-success\">" + timeTable[count] + "\n" +
            "        <span class=\"pull-right\">\n" +
            "            <button title=\"在该时间段末尾增加一个团\"  type=\"button\" class=\"btn btn-info btn-xxs\" name=\"row-add\">\n" +
            "                <span class=\"glyphicon glyphicon-plus\"></span>\n" +
            "            </button>\n" +
            "            <button title=\"将该时间段末尾的团删去\" type=\"button\" class=\"btn btn-info btn-xxs\" name=\"row-delete\">\n" +
            "                <span class=\"glyphicon glyphicon-minus\"></span>\n" +
            "            </button>\n" +
            "        </span>\n" +
            "    </th>\n" +
            "    <th class=\"text-center\" colspan=\"4\">光</th>\n" +
            "    <th class=\"text-center\" colspan=\"4\">暗</th>\n" +
            "</tr>\n" +
            "</thead>\n" +
            "<tbody>\n" +
            "<tr>\n" +
            "    <th scope=\"row\">A队</th>\n" +
            "    <td></td>\n" +
            "    <td></td>\n" +
            "    <td></td>\n" +
            "    <td></td>\n" +
            "    <td></td>\n" +
            "    <td></td>\n" +
            "    <td></td>\n" +
            "    <td></td>\n" +
            "</tr>\n" +
            "</tbody>\n" +
            "</table>").insertBefore("div#schedule>div");
        resizeSVG();
    }).on('click', "[name='chart-delete']", function () {
        let $table = $("div#schedule").children("table");
        let count = $table.length;
        if (count <= 1) return;// min support 1 chart
        $table.eq(count - 1).remove();
        resizeSVG();
    });

    // export
    $("button#export_btn").on("click", function () {
        html2canvas($("div#schedule").get(0)).then(function (canvas) {
            $("img#screen_shot_img").attr("src", canvas.toDataURL());
        });
        $("div#modal_img").modal("show");
    });

    // load schedule history
    $(".page-header").on("click", "a.schedule-history", function () {
        let id = $(this).attr("data-id");
        requestSchedule(id, null);
    });
}

/**
 * experience. have none access to save changes
 */
function experience() {
    sessionStorage.authorized = "false";
    $("div#modal_authorize").modal('hide');
}

/**
 * check auth.
 */
function checkAuth() {
    let code = $("input#modal_authorize_input").val().trim();
    let $enter = $("button#btn_auth_enter");
    // clear help block
    let $help = $("span#helpBlock");

    $.post("php/AuthCheck.php", {
        "auth": code
    }, function (data, status) {
        if (status === "success") {
            // success message
            let json = JSON.parse(data);
            if (json.code === 0) {
                // correct auth code
                if (parseInt(json.data) === 1) {
                    $help.html('<b>团员授权</b>：只可保存团员区改动');
                    $enter.prop("disabled", false);
                } else if (parseInt(json.data) === 2) {
                    $help.html('<b>团长授权</b>：可保存所有改动');
                    $enter.prop("disabled", false);
                }
            } else if (json.code === 2) {
                // wrong auth code
                $help.text('授权码不对，无保存权限，请联系小明');
                $enter.prop("disabled", true);
            } else {
                $.toast({
                    heading: "error",
                    text: json.msg,
                    showHideTransition: 'fade',
                    icon: "error"
                });
            }
        }
    });
}

/**
 * authorize. set session authorization and enter.
 */
function authorize() {
    sessionStorage.auth = $("input#modal_authorize_input").val().trim();
    sessionStorage.authorized = "true";
    $("div#modal_authorize").modal('hide');
}

/**
 * when a staff button is clicked, load his attributes
 * @param e event object
 */
function readStaffAttributes(e) {
    let id = parseInt(e.target.getAttribute("data-id"));
    $("div#staff_attr_panel").attr("data-id", id);
    // new staff
    if (id === 0) {
        // reset attributes group
        resetStaffAttributesPanel();
        return;
    }
    // read local attributes
    let staff = staticLocalStaffList[id - 1];
    if (parseInt(staff.id) === id) {
        // main attributes
        let index_namelist = staticNameList.indexOf(staff.name);
        $("select#staff_attr_name_select").val(index_namelist);
        $("input#staff_attr_career_input").val(staff.career);
        $("select#staff_attr_type_select").val(staff.type);
        $("input#staff_attr_absence_check").prop("checked", staff.absence === '1');
        // other attributes
        $("div#staff_attr_other_attack").children("label").removeClass("active").eq(staff.attack - 1).addClass("active");
        $("div#staff_attr_other_control").children("label").removeClass("active").eq(staff.control - 1).addClass("active");
        $("div#staff_attr_other_element").children("label").removeClass("active").eq(staff.element - 1).addClass("active");
    } else {
        // Error 60x:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
        alert("错误代码600，请告知小明");
    }
}

/**
 * reset staff attributes panel
 */
function resetStaffAttributesPanel() {
    $("select#staff_attr_name_select").val(-1);
    $("input#staff_attr_career_input").val("");
    $("select#staff_attr_type_select").val(0);
    $("input#staff_attr_absence_check").prop("checked", false);
    $("div#staff_attr_other_attack").children("label").removeClass("active").eq(0).addClass("active");
    $("div#staff_attr_other_control").children("label").removeClass("active").eq(0).addClass("active");
    $("div#staff_attr_other_element").children("label").removeClass("active").eq(0).addClass("active");
}

/**
 * load staff list on the left from local json
 */
function loadStaffList(staffList) {
    let $staff_list = $("div#staff_list").children("div");
    $staff_list.empty();
    $.each(staffList, function (index, item) {
        // add to nameList
        if (staticNameList.indexOf(item.name) === -1) {
            staticNameList.push(item.name);
        }

        // load staff
        let elementNode = document.createElement("button");
        elementNode.setAttribute("type", "button");
        elementNode.setAttribute("data-id", item.id);
        elementNode.className = "btn btn-default";
        elementNode.innerHTML = item.name + item.career;
        if (item.type === '1') {
            elementNode.className += " career-c";
        } else if (item.type === '2') {
            elementNode.className += " career-assist";
        } else if (item.type === '3') {
            elementNode.className += " career-priest";
        }
        if (item.absence === '1') {
            elementNode.className += " career-absence";
        }
        $staff_list.append(elementNode);
    });
    resizeSVG();
    loadNameList();
    resetStaffAttributesPanel();
}

/**
 * create name select widget from static list
 */
function loadNameList() {
    let $name_select = $("select#staff_attr_name_select");
    $name_select.empty();
    $name_select.append(new Option("称谓", "-1"));
    $.each(staticNameList, function (index, item) {
        $name_select.append(new Option(item, index));
    });
}

/**
 * check '.in-schedule' from schedule and check '.absence' from staff list
 */
function loadCheck() {
    let $cell = $("div#schedule").find("tbody tr td");
    let $staff = $("div#staff_list").children("div").find("button");
    // reset in-schedule
    $staff.removeClass("in-schedule");
    $cell.each(function () {
        let text = $(this).text();
        if (text === null || text === "" || text === "空") return;
        let $target = $staff.filter(":contains(" + text + ")");
        let $current = $(this);
        $target.each(function () {
            if ($(this).text() === text) {
                if ($(this).hasClass("career-absence")) {
                    $current.removeAttr("data-id").removeAttr("data-name").text("");
                } else if (!$(this).hasClass("in-schedule")) {
                    $(this).addClass("in-schedule");
                }
            }
        });
    });
}

/**
 * filter staff list according to the checkboxes
 */
function filterStaff() {
    let filterConditions = [".career-c", ".career-assist", ".career-priest", ".in-schedule", ".career-absence"];

    let $staff_list = $("div#staff_list");
    // show all
    $staff_list.find("button[data-id]").show();

    // filter hide
    let $filterInputs = $("div#staff_list_filter").find("input");
    $filterInputs.each(function () {
        let index = parseInt($(this).attr("data-filter"));
        if (!$(this).parent().hasClass('active')) {
            // hide
            $("div#staff_list").find(filterConditions[index - 1]).hide();
        }
    });
}

/**
 * add a blank staff button
 */
function addStaff() {
    let $btn_list = $("div#staff_list").children('div');
    let increment = 0;
    let exist = $btn_list.children("button").is("[data-id=" + increment + "]");
    if (exist) {
        $("button#staff_list_add_btn").popover('show');
        return;
    }
    let elementNode = document.createElement("button");
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
    let $input = $("input#modal_add_name_input");
    let name = $input.val().trim();
    let $modal = $("div#modal_add_name");
    if (name === null || name === '') {
        $modal.modal('hide');
        return;
    }
    staticNameList.push(name);
    loadNameList();
    $("select#staff_attr_name_select").val(staticNameList.length - 1);
    $modal.modal('hide');
    $input.val('');
}

/**
 * save the attribute changes to local
 * and refresh the corresponding button
 */
function saveStaff() {
    let id = parseInt($("div#staff_attr_panel").attr("data-id"));
    let $staff_btn = $("div#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {// no staff selected or btn was deleted
        // pop over
        $('button#staff_attr_save_btn').popover('show');
        return;
    }
    // read staff
    let data = {
        "method": "save",
        "auth": sessionStorage.auth,
        "id": id,
        "name": staticNameList[parseInt($("select#staff_attr_name_select").val())],
        "career": $("input#staff_attr_career_input").val().trim(),
        "type": parseInt($("select#staff_attr_type_select").val()),
        "absence": $("input#staff_attr_absence_check").prop('checked'),
        "attack": $("div#staff_attr_other_attack").find('label.active').index() + 1,
        "control": $("div#staff_attr_other_control").find('label.active').index() + 1,
        "element": $("div#staff_attr_other_element").find('label.active').index() + 1
    };

    // submit changes
    if (sessionStorage.authorized === "true") {
        $.post("php/StaffAttr.php", data, function (data, status) {
            if (status === "success") {
                // success message
                let json = JSON.parse(data);
                if (json.code === 0) {
                    // reload staff list
                    requestStaff(loadCheck);
                    $.toast({
                        text: "保存成功",
                        showHideTransition: 'fade',
                        icon: "success"
                    });
                } else if (json.code === 5) {
                    // alert NO AUTH
                    $.toast({
                        heading: "权限不足",
                        text: "需要团员以上权限才可操作，<a onclick='$(\"div#modal_authorize\").modal(\"show\");$(this).siblings(\".close-jq-toast-single\").click();'>重新登录</a>",
                        showHideTransition: 'fade',
                        hideAfter: false,
                        icon: "warning"
                    });
                } else {
                    $.toast({
                        heading: "保存失败",
                        text: json.msg,
                        showHideTransition: 'fade',
                        icon: "error"
                    });
                }
            }
        });
    } else {
        if (data.id === 0) {
            // add to local json
            data.id = Math.round(Math.random() * 100) + staticLocalStaffList.length;
            staticLocalStaffList.push(data);
            // refresh staff button
            $staff_btn.attr("data-id", data.id);
        }
        $staff_btn.text(data.name + data.career);
        if (data.type === 1) {
            $staff_btn.attr("class", "btn btn-default career-c");
        } else if (data.type === 2) {
            $staff_btn.attr("class", "btn btn-default career-assist");
        } else if (data.type === 3) {
            $staff_btn.attr("class", "btn btn-default career-priest");
        } else if (data.type === 0) {
            $staff_btn.attr("class", "btn btn-default");
        }
        if (data.absence) {
            $staff_btn.addClass("career-absence");
        }

        // alert NO AUTH
        $.toast({
            heading: "无此权限",
            text: "体验账号所做修改仅限于页面，不会提交到服务器，<a onclick='$(\"div#modal_authorize\").modal(\"show\");$(this).siblings(\".close-jq-toast-single\").click();'>重新登录</a>",
            showHideTransition: 'fade',
            hideAfter: false,
            icon: "warning"
        });
    }
}

/**
 * delete the corresponding staff button both from page and static json
 */
function deleteStaff() {
    let id = parseInt($("div#staff_attr_panel").attr("data-id"));
    let $staff_btn = $("div#staff_list").children('div').children("button[data-id=" + id + "]");
    if (id === -1 || !$staff_btn.is('button')) {// no staff selected or btn was deleted
        // pop over
        $("button#staff_attr_del_btn").popover('show');
        return;
    }

    if (id === 0) {// newly added
        $staff_btn.remove();
        return;
    }
    let textDeleted = $staff_btn.text();
    // submit changes
    if (sessionStorage.authorized === "true") {
        $.post("php/StaffAttr.php", {
            "method": "delete",
            "id": id,
            "auth": sessionStorage.auth
        }, function (data, status) {
            if (status === "success") {
                // success message
                let json = JSON.parse(data);
                if (json.code === 0) {
                    // reload staff list
                    requestStaff(loadCheck);
                    $.toast({
                        heading: "删除成功",
                        text: "已删除<b>" + textDeleted + "</b>，<a onclick=\"undoDeleteStaff(" + id + ");$(this).siblings(\".close-jq-toast-single\").click();\">撤销删除</a>",
                        showHideTransition: 'fade',
                        hideAfter: false,
                        icon: "success"
                    });
                } else if (json.code === 5) {
                    // alert NO AUTH
                    $.toast({
                        heading: "权限不足",
                        text: "需要团员以上权限才可操作，<a onclick='$(\"div#modal_authorize\").modal(\"show\");$(this).siblings(\".close-jq-toast-single\").click();'>重新登录</a>",
                        showHideTransition: 'fade',
                        hideAfter: false,
                        icon: "warning"
                    });
                } else {
                    $.toast({
                        heading: "删除失败",
                        text: json.msg,
                        showHideTransition: 'fade',
                        icon: "error"
                    });
                }
            }
        });
    } else {
        $staff_btn.remove();
        // delete from static json
        if (parseInt(staticLocalStaffList[id - 1].id) === id) {
            staticLocalStaffList.splice(id - 1, 1);
        } else {
            // Error 60x:载入顺序与列表顺序不一致，需要手动查找定位（一般不会出现）
            alert("错误代码602，请告知小明");
        }
        // alert NO AUTH
        $.toast({
            heading: "无此权限",
            text: "体验账号所做修改仅限于页面，不会提交到服务器，<a onclick='$(\"div#modal_authorize\").modal(\"show\");$(this).siblings(\".close-jq-toast-single\").click();'>重新登录</a>",
            showHideTransition: 'fade',
            hideAfter: false,
            icon: "warning"
        });
    }
}

/**
 * recover the staff just deleted
 * @param idDeleted id of the deleted staff
 */
function undoDeleteStaff(idDeleted) {
    $.post("php/StaffAttr.php", {
        "method": "undo",
        "id": idDeleted,
        "auth": sessionStorage.auth
    }, function (data, status) {
        if (status === "success") {
            // success message
            let json = JSON.parse(data);
            if (json.code === 0) {
                // reload staff list
                requestStaff(loadCheck);
                $.toast({
                    text: "已恢复",
                    showHideTransition: 'fade',
                    icon: "info"
                });
            } else if (json.code === 5) {
                // alert NO AUTH
                $.toast({
                    heading: "权限不足",
                    text: "需要团员以上权限才可操作，<a onclick='$(\"div#modal_authorize\").modal(\"show\");$(this).siblings(\".close-jq-toast-single\").click();'>重新登录</a>",
                    showHideTransition: 'fade',
                    hideAfter: false,
                    icon: "warning"
                });
            } else {
                $.toast({
                    heading: "恢复失败",
                    text: json.msg,
                    showHideTransition: 'fade',
                    icon: "error"
                });
            }
        }
    });
}

/**
 * premium auth. save schedule changes to local chart.txt file
 */
function saveSchedule() {
    // save schedule
    if (sessionStorage.authorized === "true") {
        let content = extractSchedule();
        $.post("php/ScheduleSL.php", {
            "method": "save",
            "content": content,
            "auth": sessionStorage.auth
        }, function (data, status) {
            if (status === "success") {
                // success message
                let json = JSON.parse(data);
                if (json.code === 0) {
                    $.toast({
                        text: "保存成功",
                        showHideTransition: 'fade',
                        icon: "success"
                    });
                } else if (json.code === 5) {
                    // alert NO AUTH
                    $.toast({
                        heading: "无此权限",
                        text: "只有团长权限可以保存排表，<a onclick='$(\"div#modal_authorize\").modal(\"show\");$(this).siblings(\".close-jq-toast-single\").click();'>重新登录</a>",
                        showHideTransition: 'fade',
                        hideAfter: false,
                        icon: "warning"
                    });
                } else {
                    $.toast({
                        heading: "保存失败",
                        text: json.msg,
                        showHideTransition: 'fade',
                        icon: "error"
                    });
                }
            }
        });
    } else {
        // alert NO AUTH
        $.toast({
            heading: "无此权限",
            text: "体验账号所做修改仅限于页面，不会提交到服务器，<a onclick='$(\"div#modal_authorize\").modal(\"show\");$(this).siblings(\".close-jq-toast-single\").click();'>重新登录</a>",
            showHideTransition: 'fade',
            hideAfter: false,
            icon: "warning"
        });
    }
}

/**
 * extract the whole schedule
 * @returns {string} nested array of the schedule
 */
function extractSchedule() {
    let $schedule = $("div#schedule");
    let scheduleArray = [];
    $schedule.find("table").each(function () {
        let $table = $(this);
        // each table is one period
        let periodArray = [];
        $table.find("tbody tr").each(function () {
            let $tr = $(this);
            // each tr is one team
            let staffArray = [];
            $tr.find("td").each(function () {
                let $td = $(this);
                // each td is one staff
                let id = $td.attr("data-id");
                staffArray.push(id && id > 1 ? id : 0);
            });
            periodArray.push("[" + staffArray.toString() + "]");
        });
        scheduleArray.push("[" + periodArray.toString() + "]");
    });
    return "[" + scheduleArray.toString().toString() + "]";
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
    let isMove = false;
    let X, Y;
    $handle.on('mousedown', function (e) {
        isMove = true;
        X = e.pageX - parseInt($object.css("left"));
        Y = e.pageY - parseInt($object.css("top"));
    });
    $(document).on('mousemove', function (e) {
        if (isMove) {
            let left = e.pageX - X;
            let top = e.pageY - Y;
            $object.css({left: left, top: top});
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
    $('.line').css({width: document.body.scrollWidth, height: document.body.scrollHeight});
}

/**
 * when drag event happening on a staff button, draw a line from start to end
 * if the dragging ends within the schedule chart, fill the cell with the staff
 *
 * add support for exchanging staffs in the schedule
 */
function bindDrawLine() {
    // reinitialize svg width & height
    $('.line').css({width: document.body.scrollWidth, height: document.body.scrollHeight});
    // bind
    let isDraw = false, isDrop = false, isExchange = false;
    let $svg = $('svg');
    // button
    let staffId;
    // table
    let $td;
    // pick staff
    let $buttons = $("div#staff_list").children('div');
    $buttons.on('mousedown', 'button', function (e) {
        // unlock drawing
        isDraw = true;
        // read staff id
        staffId = parseInt($(e.target).attr('data-id'));
        // draw a line
        $svg.children('line').attr({x1: e.pageX, y1: e.pageY, x2: e.pageX, y2: e.pageY});
    });
    let $schedule = $("div#schedule");
    $schedule.on("mousedown", "table tr td", function (e) {
        // unlock drawing
        isDraw = true;
        // exchange flag
        isExchange = true;
        // read staff
        $td = $(e.target);
        // draw a line
        $svg.children('line').attr({x1: e.pageX, y1: e.pageY, x2: e.pageX, y2: e.pageY});
    });
    // draw line
    $(document).on('mousemove', function (e) {
        if (isDraw) {
            if (!$svg.is(':visible')) {
                $svg.show();
            }
            // draw a line
            $svg.children('line').attr({x2: e.pageX, y2: e.pageY});
        }
    }).on('mouseup', function () {
        if (isDraw) {
            isDraw = false;
            $svg.hide();

            // allow drop
            isDrop = true;
            setTimeout(function () {
                isDrop = false;
            }, 50);
        }
    });
    // drop staff
    $schedule.on('mouseover', 'table tr td', function () {
        if (isDrop) {
            if (isExchange) {
                // exchange
                let staff_id = $td.attr("data-id");
                let staff_name = $td.attr("data-name");
                let staff_text = $td.text();
                let $target = $(this);
                let this_id = $target.attr("data-id");
                let this_name = $target.attr("data-name");
                let this_text = $target.text();
                $td.attr("data-id", !this_id ? "" : this_id);
                $td.attr("data-name", !this_name ? "" : this_name);
                $td.text(!this_text ? "" : this_text);
                $target.attr("data-id", !staff_id ? "" : staff_id);
                $target.attr("data-name", !staff_name ? "" : staff_name);
                $target.text(!staff_text ? "" : staff_text);
                // reset
                isExchange = false;
                // mark duplication
                markDuplicate(false, $td);
                markDuplicate(false, $target);
                return;
            }
            let staff = staticLocalStaffList[staffId - 1];
            if (parseInt(staff.id) === staffId) {
                let id_replaced = parseInt($(this).attr("data-id"));
                let $staff_list = $("div#staff_list");
                // remove duplication
                if (staff.name !== "空") {
                    let $contain = $("div#schedule").find("tbody tr td").filter('[data-id="' + staffId + '"]');
                    $contain.each(function () {
                        $(this).removeAttr("data-id").removeAttr("data-name").text("");
                    });
                }
                // fill in the cell
                $(this).attr('data-id', staffId).attr('data-name', staff.name).text(staff.name + staff.career);
                // set staff to '.in-schedule'
                let $staff_in = $staff_list.find('button[data-id="' + staffId + '"]');
                if (!$staff_in.hasClass('in-schedule') && staff.name !== "空") {
                    $staff_in.addClass('in-schedule');
                    // hide
                    if ($("div#staff_list_filter").find('input[data-filter=4]').prop("checked") === false) {
                        $staff_in.hide();
                    }
                }
                // consider REPLACE
                if (id_replaced > 1) {
                    let $contain = $staff_list.find('button[data-id="' + id_replaced + '"]');
                    $contain.each(function () {
                        $(this).removeClass("in-schedule").show();
                    })
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
    if (scale) {

    } else {
        if (typeof arguments[1] === "object") {
            // recover
            let $obj = arguments[1];
            let $td = $obj.parentsUntil('table').find('td');
            $td.css('color', '');
            // check
            let map = {};
            $.each($td, function () {
                let key = $(this).attr('data-name');
                if (key !== "空" && !!key) {
                    if (typeof map[key] === "undefined") {
                        map[key] = 1;// first met
                    } else if (map[key] === 1) {
                        $td.filter('[data-name=' + key + ']').css('color', 'red');
                        map[key] = 2;// handled
                    }
                }
            });
        } else {
            // Error 70x:参数传递错误
            alert("错误代码701，请告知小明");
        }
    }
}

