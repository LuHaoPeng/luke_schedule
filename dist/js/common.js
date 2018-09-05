"use strict";

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    }return fmt;
};

/**
 * add value to the corresponding field without making changes to the origin {Date}
 * @param field
 * @param value
 * @returns {Date}
 */
Date.prototype.add = function (field, value) {
    value *= 1;
    if (isNaN(value)) {
        value = 0;
    }
    // make a copy
    var date = new Date(this.getTime());
    switch (field) {
        case "y":
            date.setFullYear(date.getFullYear() + value);
            break;
        case "M":
            date.setMonth(date.getMonth() + value);
            break;
        case "d":
            date.setDate(date.getDate() + value);
            break;
        case "h":
            date.setHours(date.getHours() + value);
            break;
        case "m":
            date.setMinutes(date.getMinutes() + value);
            break;
        case "s":
            date.setSeconds(date.getSeconds() + value);
            break;
        default:
    }
    return date;
};
//# sourceMappingURL=common.js.map