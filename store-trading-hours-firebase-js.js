var config = {
    apiKey: "AIzaSyB4Qd3KdxiM23NFJ_qqWCyZlPZbHAkzezY",
    authDomain: "tgg-api.firebaseapp.com",
    databaseURL: "https://tgg-api.firebaseio.com",
    projectId: "tgg-api",
    storageBucket: "tgg-api.appspot.com",
    messagingSenderId: "539439185960"
};
firebase.initializeApp(config);
// Initialize Firebase Database
var database = firebase.database();
// Trigger suburb/postcode recommendation search when typing
$("#getStoreLocator").bind('input', function() {
    var userInput = $(this).val(),
        queryInput = "",
        li = $("#getStoreLocator").find('li');
    // Min 3 digits required
    if (userInput.length > 2) {
        // If user type in a suburb name
        if (isNaN(userInput) && userInput != ""){
            if (userInput.indexOf(' ') > 0) {
                queryInput = userInput.replace(/ /g, '_');
                getPostcode(queryInput);
            } else {
                getPostcode(userInput);
            }
        // If user type in a postcode
        } else if(!isNaN(userInput) && (userInput != "")) {
            getSuburbs(userInput);
        }
    // Clean recommendation dropdown when there are less than 3 digits in the search bar
    } else {
        clearSuggList();
    }
});
// Enter event
$("#getStoreLocator").keyup(function(event) {
    var inputVal = $("#getStoreLocator").val(),
        getDefaultRecommendation = $("#suggestionList").first().html(),
        focused = $("#suggestionList").find("li.active"),
        rec = $("#suggestionList").find("li").length > 0 ? true : false;
        
    if (event.keyCode === 13 && inputVal.length > 2) {
        if (focused.length === 0 && rec) {
            // Search by the first recommendation if user press Enter
            getStoresList(getDefaultRecommendation);
            clearSuggList();
        } else if (focused.length === 1 && rec) {
            getStoresList(focused);
            clearSuggList();
        } else if (inputVal.split(", ").pop().length != 4 && !rec) {
            displayAlert("invalidFormat");
        } else if (inputVal.split(", ").pop().length === 4 && !rec) {
            queryStoreList(inputVal.split(", ").pop());
        }
    } else if (event.keyCode === 13 && inputVal.length <= 2){
        displayAlert("invalidFormat");
    }
});
// Change focus if press up/down arrow key
$(document).keydown(function(event) {
    if(event.keyCode == 40) {
        if($("#suggestionList li.active").length!=0) {
            var target = $("#suggestionList").find("li.active").next();
            $("#suggestionList li.active").removeClass("active");
            target.focus().addClass("active");
        } else {
            $('#suggestionList').find("li:first").focus().addClass("active");
        }
    }
    if (event.keyCode == 38) {      
        if($("#suggestionList li.active").length!=0) {
            var target = $("#suggestionList").find("li.active").prev();
            $("#suggestionList li.active").removeClass("active");
            target.focus().addClass("active");
        } else {
            $('#suggestionList').find("li:first").focus().addClass("active");
        }
    }
})
// Go button click event
$("#btn_search").click(function(event) {
    var userInput = $("#getStoreLocator").val(),
        rec = $("#suggestionList").find("li").length > 0 ? true : false;
    if (userInput.length > 2) {
        if(rec) {
            var getDefaultRecommendation = $("#suggestionList").first().html();
            getStoresList(getDefaultRecommendation);
            clearSuggList();
        } else {
            var getVal = userInput.split(", ").pop();
            if (getVal.length === 4 && !isNaN(getVal)) {
                queryStoreList(getVal);
            } else {
                displayAlert("invalidFormat");
            }
        }
    } else {
        displayAlert("invalidFormat");
    }
});
// Query Suburbs
function getSuburbs(userInput) {
    var isPostcodeValid = validPostcode(userInput);
    if (userInput.length === 3 && isPostcodeValid) {
        firebase.database()
            .ref('postcode-api/')
            .orderByKey()
            .startAt(userInput + '0')
            .endAt(userInput + '9')
            .limitToFirst(10)
            .once('value')
            .then(function(snapshot){
                generateSuggestions(snapshot.val(), userInput);
        });
    } else if (userInput.length === 4 && isPostcodeValid) {
        firebase.database()
            .ref('postcode-api/' + userInput)
            .once('value')
            .then(function(snapshot){
                generateSuggestions(snapshot.val(), userInput);
        });
    } else if (userInput.length > 4) {
        displayError("Please enter a valid postcode or suburb.");
    }
    
}
function validPostcode(postcode){
    var code = parseInt(postcode);
    if(code<800 || code>7799) {
        return false;
    } else {
        return true;
    }
}
// Query postcode
function getPostcode(userInput) {
    var input = userInput.toUpperCase();
    if (input.length > 2) {
        firebase.database()
            .ref('suburb-api/')
            .orderByKey()
            .startAt(input)
            .endAt(input + '\uf8ff')
            .limitToFirst(20)
            .once('value')
            .then(function(snapshot){
                generateSuburbSuggestions(snapshot.val());
        });
    }
}
// Generate recommendation list
function generateSuggestions(data, postcode) {
    var html = "",
        state = getState(postcode);
    clearSuggList();
    if (data) {
        if ($.isArray(data)) {
            data.forEach(function(item) {
                var li = "<li class='sugg-list' data-state='" + state + "' data-suburb='" + item.suburb + "' data-postcode='" + postcode + "' onclick='getStoresList(this)'>" + item.suburb + ", " + state + ", " + postcode + "</li>";
                html += li;
            });
        } else {
            $.each(data, function(postcode, suburbs) {
                suburbs.forEach(function(item) {
                    var li = "<li class='sugg-list' data-state='" + state + "' data-suburb='" + item.suburb + "' data-postcode='" + postcode + "' onclick='getStoresList(this)'>" + item.suburb + ", " + state + ", "  + postcode + "</li>";
                    html += li;
                });
            });
        } 
        $('#suggestionList').show().html(html);
    }   
}
// Generate recommendation list
function generateSuburbSuggestions(data) {
    var html = "";
    if (data) {
        clearSuggList();
        $.each(data, function(index, el) {
            el.forEach(function(item){
                var displaySuburb = index.replace('_', ' '),
                    state = getState(item);
                var li = "<li class='sugg-list' data-state='" + state + "'  data-suburb='" + index + "' data-postcode='" + item + "' onclick='getStoresList(this)'>" + displaySuburb + ", " + state + ", "  + item + "</li>";
                html += li;
            });
        });
        $('#suggestionList').show().html(html);
    } 
}
function getState(postcode){
    switch(postcode.charAt(0)){
        case "0":
        return "NT";
        break;
        case "2":
            var code = parseInt(postcode);
            if((code>2599 && code<2619) || (code>2899 && code<2921)){
                return "ACT";
            } else {
                return "NSW";
            }
        break;
        case "3":
        return "VIC";
        break;
        case "4":
        return "QLD";
        break;
        case "5":
        return "SA";
        case "6":
        return "WA";
        break;
        case "7":
        return "TAS";
        break;
        default:
        return "Unknown";
    }
}
function showSpinner() {
    $("#searchSpinner").show();
    $("#quitStoreLocater").hide();
    clearError();
}
function hideSpinner() {
    $("#searchSpinner").hide();
    $("#quitStoreLocater").show();
}
function clearSuggList() {
    $('#suggestionList').hide().html("");
}
function clearError() {
    $("#noStoreAlert").remove();
} 
// Get a nearby store list returned
function getStoresList(thisObj) {
    var suburb = $(thisObj).attr("data-suburb"),
        postcode = $(thisObj).attr("data-postcode"),
        state = $(thisObj).attr("data-state"),
        displaySuburb = suburb.replace('_', ' ');
    $("#getStoreLocator").val(displaySuburb + ", " + state + ", " + postcode);
    clearSuggList();
    queryStoreList(postcode);
}
function queryStoreList(postcode) {
    showSpinner();
    firebase.database()
        .ref('store-api/' + postcode)
        .once('value')
        .then(function(snapshot){
            fetchStoreTradingHours(snapshot.val());
    });
}
// Get hours accroading to the nearby store list
function fetchStoreTradingHours(data) {
    var nearbyStoreData = [],
        storeLocations = data,
        limit = 2;
    $("#noStoreAlert").remove();
    if (storeLocations === null) {
        displayAlert("noStore");
    } else if (storeLocations[0].name) {
        $.each(storeLocations, function(i, val) {
            $.ajax({
                url: 'https://tgg-api.firebaseio.com/store-detail-api/' + val.id + '.json',
                type: "GET",
                dataType: "JSON",
                async: false,
                success: function(res) {
                    var resData = res;
                    if (resData === undefined || resData === null) {
                        limit = limit + 1;
                    } else {
                        nearbyStoreData[i] = resData;
                    }
                },
                error: function(xhr) {
                    console.log("Error:" + xhr);
                }
            });
            return i < limit;
        });
        hideSpinner();
        displayStores(nearbyStoreData);
    }
}
function displayAlert(type) {
    if (type === "noStore") {
        hideDropDown();
        hideSpinner();
        $(".store-locater .clearfix.marg-top-5").parent().append("<div id='noStoreAlert' class='alert alert-danger marg-top-5 marg-bottom-0'>Sorry, no store can be found within 200 km of the search radius.</div>");
    } else if (type === "invalidFormat") {
        clearSuggList();
        hideDropDown();
        clearError();
        hideSpinner();
        $(".store-locater .clearfix.marg-top-5").parent().append("<div id='noStoreAlert' class='alert alert-danger marg-top-5 marg-bottom-0'>Please type in a valid postcode or suburb.</div>");
    }
}
function hideDropDown() {
    $("#desktop_tb").html("");
    $(".store-locater").removeClass('list-expand');
    $("#hoursBanner").hide();
    $("#errorContainer").hide();
}
function displayStores(stores) {
    var getDate = new Date(),
        dateToday = getDate.getDay(),
        htmlInner = "";
    // Convert dates of the week to match the DB order
    if (dateToday === 0) {
        dateToday = 7;
    }
    var dateToQuery = dateToday - 1;
    $.each(stores, function(n, value) {
        var today = moment();
        // Convert store name to store URL
        var storeName = value.name.toLowerCase(); 
        var convertedStoreName = storeName.replace(/ /g, '-');
        // Check exceptions
        var exceptionToday = getExceptionToday(value.exception);
        // Get today's hours
        var tradingHourToday = exceptionToday?exceptionToday:value.trading_hours[dateToday];
        // Check whether there are exception days in the next 7 days
        var exceptionBetween = getExceptionBetween(value.exception);
        // Get hours for next 7 days after exception check
        var tradingHours = generateWeeklyHours(value.trading_hours, exceptionBetween);
        // List Dates to display in popover
        var tradingDates = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
        // Re-order dates from today to the next 7 day
            tradingDates = reOrderDate(tradingDates, dateToQuery);
            tradingHours = reOrderDate(tradingHours, dateToQuery);
        // Check is today open
        var isOpenToday = (tradingHourToday.open != '0') && (tradingHourToday.close != '0') ? true : false;
        // Display close text if it's closed today
        var hours = isOpenToday ? ("<p>Open today: " + tradingHourToday.open + " - " + tradingHourToday.close) : ("<p class='text-secondary'>Closed today");
        // Get event text if today is an exception
        var eventText = exceptionToday?("<i class='text-warning-sat'>" + tradingHourToday.event + "</i>"):"";
        // Generate popover HTML
        var popover = "<i class='fa fa-info-circle text-info-sat' data-toggle='popover' data-html='true' data-trigger='hover' data-placement='top' title='' data-content='" +
            "<b>Trading Hours</b><table><tbody>" + 
                "<tr><td>"+"Today"+"</td><td>"+today.format("DD MMM").toUpperCase()+"</td><td>"+tradingHours[0].time+" </td></tr>"+
                "<tr><td></td><td colspan=" + "2" + "><i>"+tradingHours[0].text+"</i></td>" +
                "<tr><td>"+tradingDates[1]+"</td><td>"+today.add(1, 'days').format("DD MMM").toUpperCase()+"</td><td>"+tradingHours[1].time+" </td></tr>"+
                "<tr><td></td><td colspan=" + "2" + "><i>"+tradingHours[1].text+"</i></td>" +
                "<tr><td>" + tradingDates[2] + "</td><td>"+today.add(1, 'days').format("DD MMM").toUpperCase()+"</td><td>" + tradingHours[2].time + " </td></tr>" +
                "<tr><td></td><td colspan=" + "2" + "><i>" +                     tradingHours[2].text + "</i></td>" +
                "<tr><td>" + tradingDates[3] + "</td><td>"+today.add(1, 'days').format("DD MMM").toUpperCase()+"</td><td>" + tradingHours[3].time + " </td></tr>" +
                "<tr><td></td><td colspan=" + "2" + "><i>" +                     tradingHours[3].text + "</i></td>" +
                "<tr><td>" + tradingDates[4] + "</td><td>"+today.add(1, 'days').format("DD MMM").toUpperCase()+"</td><td>" + tradingHours[4].time + " </td></tr>" +
                "<tr><td></td><td colspan=" + "2" + "><i>" +                     tradingHours[4].text + "</i></td>" +
                "<tr><td>" + tradingDates[5] + "</td><td>"+today.add(1, 'days').format("DD MMM").toUpperCase()+"</td><td>" + tradingHours[5].time + " </td></tr>" +
                "<tr><td></td><td colspan=" + "2" + "><i>" +                     tradingHours[5].text + "</i></td>" +
                "<tr><td>" + tradingDates[6] + "</td><td>"+today.add(1, 'days').format("DD MMM").toUpperCase()+"</td><td>" + tradingHours[6].time + " </td></tr>" +
                "<tr><td></td><td colspan=" + "2" + "><i>" +                     tradingHours[6].text + "</i></td>" +
            "</tbody></table>' data-original-title='" + value.name + " Store Details'></i>";
        // Generate HTML for every single store
        var htmlToWrite = "<section class='hours-container'>" +
            "<b>" + value.name + "</b>" + popover +
            hours + "</p>" +
            eventText +
            "<div class='clearfix'>" +
            "<a href='https://www.thegoodguys.com.au/" + convertedStoreName + "' target='_blank'>View Trading Hours</a>" +
            //"<span> | </span>" +
            //"<a href='https://www.thegoodguys.com.au/" + convertedStoreName + "' target='_blank'>Get directions</a>" +
            "</div>" +
            "</section>";
        htmlInner += htmlToWrite;
    });
    // Display list
    slideDown();

    // Initialize popover by BS
    $(function() {
        $('[data-toggle="popover"]').popover({container: 'body'});
    });
    function slideDown() {
        $("#desktop_tb").html("");
        $(".store-locater").addClass('list-expand');
        $("#hoursBanner").hide();
        $("#errorContainer").hide();
        $("#desktop_tb").html(htmlInner).slideDown();
        $("#quitStoreLocater").show();
    }
    function reOrderDate(data, index) {
        return data.slice(index).concat(data.slice(0, index));
    }
    function getExceptionToday(data) {
        var res;
        $.each(data, function(i, val){
            if (isSameDay(val.date)) {
                res = val;
                return false;
            }
        });
        return res;
    }
    function getExceptionBetween(exception) {
        var res = [];
        $.each(exception, function(i, val){
            if(isBetweenDay(val.date)){
                res.push(val)
            }
        });
        var isException = (res.length > 0) ? res : false;
        return isException;
    }
    function generateWeeklyHours(hours, exceptionHours) {
        var res = [],
            commHours = hours;
        if(exceptionHours.length > 0) {
            $.each(exceptionHours, function(index, el) {
                $.each(commHours, function(n, v){
                    if(v.day === el.day){
                        commHours[n] = el;
                    }
                });
            });
        }
        $.each(commHours, function(i, val) {
            var text = val.event?val.event:"";
            res.push({"time": checkOpen(val), "text": text});
        });
        function checkOpen(data) {
            var hours = (data.open === "0" && data.close === "0") ? "<span>Closed</span>" : (data.open + " - " + data.close);
            return hours;
        }
        return res;
    }
    function isSameDay(dateToCompare) {
        var dOne = moment().format('YYYY-MM-DD'),
            dTwo = moment(dateToCompare).format('YYYY-MM-DD');
        return moment(dOne).isSame(dTwo);
    }
    function isBetweenDay(date) {
        var today = moment().subtract(1, 'days').format('YYYY-MM-DD'),
            range = moment().add(7, 'days').format('YYYY-MM-DD'),
            day   = moment(date).format('YYYY-MM-DD');
        return moment(day).isBetween(today, range);
    }
}
$("#quitStoreLocater").click(function() {
    $("#desktop_tb").slideUp();
    $("#quitStoreLocater").hide();
    $(".store-locater").removeClass('list-expand');
    $("#hoursBanner").delay("1000").show();
    $("#noStoreAlert").remove();
    $("#getStoreLocator").val("")
    hideDropDown();
    clearSuggList();
});