$(function () {
    $("#slider_1").slider({
        value: 100,
        min: 0,
        max: 100
    });
});
$("#slider_1").slider('value', 100);
$("#slider_1").slider('refresh');
$(function () {
    $("#slider_2").slider({
        min: 0,
        max: 100,
        value: 0
    });
});
$(function () {
    var spinner = $("#novolog_spinner").spinner({
        max: 10,
        change: function( event, ui ) {}
    });
});
$(function () {
    var spinner = $("#glargine_spinner").spinner({
        max: 30,
        change: function( event, ui ) {}

    });
});
