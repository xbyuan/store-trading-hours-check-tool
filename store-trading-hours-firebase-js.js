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
            var isExceptionStyleToday = exceptionToday?"bg-info-sat bg-lighten-4 bg-transparent":"";
            // Check whether there are exception days in the next 7 days
            var exceptionBetween = getExceptionBetween(value.exception);
            // Get hours for next 7 days after exception check
            var tradingHours = generateWeeklyHours(value.trading_hours, exceptionBetween);
            // List Dates to display in popover
            var tradingDates = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            // Re-order dates from today to the next 7 day
                tradingDates = reOrderDate(tradingDates, dateToQuery);
                tradingHours = reOrderDate(tradingHours, dateToQuery);
            // Check is today open
            var isOpenToday = (tradingHourToday.open != '0') && (tradingHourToday.close != '0') ? true : false;
            // Display close text if it's closed today
            var angleDown = "<i class='fa fa-angle-down marg-left-5 text-info-sat'></i>";
            var hours = isOpenToday ? 
                        (isBetweenTime(tradingHourToday.open, tradingHourToday.close)?
                            ("<div class='col-xs-3 padd-0'>Today </div>" + "<div class='col-xs-2 padd-0'>" + today.format("DD MMM.").toUpperCase() + "</div>" + "<div class='col-xs-7 hidden-nextdays padd-0 open-now' onclick='expandDays(this)'><span class='open-dot'></span>" + tradingHourToday.open + "am" + " - " + tradingHourToday.close + "pm" +angleDown + "</div>"):  
                            ("<div class='col-xs-3 padd-0'>Today </div>" + "<div class='col-xs-2 padd-0'>" + today.format("DD MMM.").toUpperCase() + "</div>" + "<div class='col-xs-7 hidden-nextdays padd-0 closed-now' onclick='expandDays(this)'><span class='open-dot'></span>" + tradingHourToday.open + "am" + " - " + tradingHourToday.close + "pm" + angleDown + "</div>")) : 
                        ("<div class='col-xs-3 padd-0'>Today </div><div class='col-xs-2 padd-0'>" + today.format("DD MMM.").toUpperCase()+"</div><div class='col-xs-7 hidden-nextdays closed-now text-secondary padd-0' onclick='expandDays(this)'><span class='open-dot'></span>Closed " + angleDown + "</div>");
            // Get event text if today is an exception
            var eventText = exceptionToday?("<div class='col-xs-12 padd-0 text-black text-medium'>" + tradingHourToday.event + "</div>"):"";
            // Generate popover HTML
            var nextDayHours =  "<section class='next-days-hours disp-none'>" + 
                                    "<div class='clearfix padd-left-15 " + tradingHours[1].style + "'>" +
                                        "<div class='col-xs-12 text-black text-medium'>" + tradingHours[1].text + "</div>" +
                                        "<div class='col-xs-3'>" + tradingDates[1] + "</div>" +
                                        "<div class='col-xs-2'>" + today.add(1, 'days').format("DD MMM.").toUpperCase() + "</div>" +
                                        "<div class='col-xs-7'>" + tradingHours[1].time + "</div>" +
                                    "</div>" + 
                                    "<div class='clearfix padd-left-15 " + tradingHours[2].style + "'>" +
                                        "<div class='col-xs-12 text-black text-medium'>" + tradingHours[2].text + "</div>" +
                                        "<div class='col-xs-3'>" + tradingDates[2] + "</div>" +
                                        "<div class='col-xs-2'>" + today.add(1, 'days').format("DD MMM.").toUpperCase() + "</div>" +
                                        "<div class='col-xs-7'>" + tradingHours[2].time + "</div>" +
                                    "</div>" + 
                                    "<div class='clearfix padd-left-15 " + tradingHours[3].style + "'>" +
                                        "<div class='col-xs-12 text-black text-medium'>" + tradingHours[3].text + "</div>" +
                                        "<div class='col-xs-3'>" + tradingDates[3] + "</div>" +
                                        "<div class='col-xs-2'>" + today.add(1, 'days').format("DD MMM.").toUpperCase() + "</div>" +
                                        "<div class='col-xs-7'>" + tradingHours[3].time + "</div>" +
                                    "</div>" + 
                                    "<div class='clearfix padd-left-15 " + tradingHours[4].style + "'>" +
                                        "<div class='col-xs-12 text-black text-medium'>" + tradingHours[4].text + "</div>" +
                                        "<div class='col-xs-3'>" + tradingDates[4] + "</div>" +
                                        "<div class='col-xs-2'>" + today.add(1, 'days').format("DD MMM.").toUpperCase() + "</div>" +
                                        "<div class='col-xs-7'>" + tradingHours[4].time + "</div>" +
                                    "</div>" + 
                                    "<div class='clearfix padd-left-15 " + tradingHours[5].style + "'>" +
                                        "<div class='col-xs-12 text-black text-medium'>" + tradingHours[5].text + "</div>" +
                                        "<div class='col-xs-3'>" + tradingDates[5] + "</div>" +
                                        "<div class='col-xs-2'>" + today.add(1, 'days').format("DD MMM.").toUpperCase() + "</div>" +
                                        "<div class='col-xs-7'>" + tradingHours[5].time + "</div>" +
                                    "</div>" + 
                                    "<div class='clearfix padd-left-15 " + tradingHours[6].style + "'>" +
                                        "<div class='col-xs-12 text-black text-medium'>" + tradingHours[6].text + "</div>" +
                                        "<div class='col-xs-3'>" + tradingDates[6] + "</div>" +
                                        "<div class='col-xs-2'>" + today.add(1, 'days').format("DD MMM.").toUpperCase() + "</div>" +
                                        "<div class='col-xs-7'>" + tradingHours[6].time + "</div>" +
                                    "</div>" + 
                                "</section>";
            var popover = "<i class='fa fa-info-circle text-info-sat text-size-85 marg-left-5' data-toggle='popover' data-html='true' data-trigger='hover' data-placement='top' title='' data-content='<p>Address: " + value.address + ", " + value.state + ", " + value.postcode + "</p><p>Contact: " + value.phone + "</p><p>" + value.email_address + "</p>' data-original-title='<b>" + value.name + " Store Details</b>'></i>";
            var viewAll = "<span class='pull-right view-all text-info-sat text-size-75 text-light' onclick='expandDaysText(this)'>View all hours</span>";
            // Generate HTML for every single store
            var htmlToWrite = "<section class='hours-container'>" +
                "<h4 class='padd-left-15 marg-0 padd-10 text-black text-medium'>" + value.name + popover + viewAll + "</h4>" +
                //popover +
                //"<p>" + value.address + ", " + value.suburb + ", " + value.state + ", " + value.postcode + "</p>" +
                //"<h5 class='marg-top-10 marg-bottom-5'>Trading Hours: " + "<a class='pull-right text-size-85 text-info-sat' href='#'>View all hours</a></h5>" +
                "<div class='clearfix padd-left-15 " + isExceptionStyleToday + "'>" +
                eventText +
                hours +
                "</div>" +
                nextDayHours +
                //"<div class='clearfix'>" +
                //"<a href='https://www.thegoodguys.com.au/" + convertedStoreName + "' target='_blank'>View Trading Hours</a>" +
                //"<span> | </span>" +
                //"<a href='https://www.thegoodguys.com.au/" + convertedStoreName + "' target='_blank'>Get directions</a>" +
                //"</div>" +
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
                    res.push(val);
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
                var text = val.event?val.event:"",
                    style = (text.length > 1)?"bg-info-sat bg-lighten-4":"";
                res.push({"time": checkOpen(val), "text": text, "style": style});
            });
            function checkOpen(data) {
                var hours = (data.open === "0" && data.close === "0") ? "<span class='text-secondary'>Closed</span>" : (data.open + "am" + " - " + data.close + "pm");
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
        function isBetweenTime(openTime, closeTime) {
            var format = "HH:mm",
                time   = moment(),
                open   = moment(openTime, format),
                close  = moment(closeTime, format).add(12, 'hours');
                console.log(open + "/" + close);
            return time.isBetween(open, close);
        }
    }
    $("#quitStoreLocater").click(function() {
        $("#desktop_tb").slideUp();
        $("#quitStoreLocater").hide();
        $(".store-locater").removeClass('list-expand');
        $("#hoursBanner").delay("1000").show();
        $("#noStoreAlert").remove();
        $("#getStoreLocator").val("");
        hideDropDown();
        clearSuggList();
    });
    $(function () {
        expandDays = function (elm) {
            $(elm).parent().next(".next-days-hours").slideToggle();
            if($(elm).find('.fa').hasClass('fa-angle-down')){
                $(elm).find('.fa').removeClass('fa-angle-down').addClass('fa-angle-up');
                $(elm).parent().parent().children('h4').find('.view-all').text('View less hours');
                $(elm).parent().removeClass('bg-transparent');
            } else {
                $(elm).find('.fa').removeClass('fa-angle-up').addClass('fa-angle-down');
                $(elm).parent().parent().children('h4').find('.view-all').text('View all hours');
                $(elm).parent().addClass('bg-transparent');
            }
        };
        expandDaysText = function (elm) {
            $(elm).parent().siblings(".next-days-hours").slideToggle();
            if($(elm).parent().siblings('div').find('.fa').hasClass('fa-angle-down')){
                $(elm).parent().siblings('div').find('.fa').removeClass('fa-angle-down').addClass('fa-angle-up');
                $(elm).text('View less hours');
                $(elm).parent().siblings('div').removeClass('bg-transparent');
            } else {
                $(elm).parent().siblings('div').find('.fa').removeClass('fa-angle-up').addClass('fa-angle-down');
                $(elm).text('View all hours');
                $(elm).parent().siblings('div').addClass('bg-transparent');
            }
        };
    });