var config={apiKey:"AIzaSyB4Qd3KdxiM23NFJ_qqWCyZlPZbHAkzezY",authDomain:"tgg-api.firebaseapp.com",databaseURL:"https://tgg-api.firebaseio.com",projectId:"tgg-api",storageBucket:"tgg-api.appspot.com",messagingSenderId:"539439185960"};firebase.initializeApp(config);var database=firebase.database();
$("#getStoreLocator").bind("input",function(){var a=$(this).val();$("#getStoreLocator").find("li");2<a.length?isNaN(a)&&""!=a?0<a.indexOf(" ")?(a=a.replace(/ /g,"_"),getPostcode(a)):getPostcode(a):isNaN(a)||""==a||getSuburbs(a):clearSuggList()});
$("#getStoreLocator").keyup(function(a){var b=$("#getStoreLocator").val(),d=$("#suggestionList").first().html(),c=$("#suggestionList").find("li.active"),g=0<$("#suggestionList").find("li").length?!0:!1;13===a.keyCode&&2<b.length?0===c.length&&g?(getStoresList(d),clearSuggList()):1===c.length&&g?(getStoresList(c),clearSuggList()):4==b.split(", ").pop().length||g?4!==b.split(", ").pop().length||g||queryStoreList(b.split(", ").pop()):displayAlert("invalidFormat"):13===a.keyCode&&2>=b.length&&displayAlert("invalidFormat")});
$(document).keydown(function(a){if(40==a.keyCode)if(0!=$("#suggestionList li.active").length){var b=$("#suggestionList").find("li.active").next();$("#suggestionList li.active").removeClass("active");b.focus().addClass("active")}else $("#suggestionList").find("li:first").focus().addClass("active");38==a.keyCode&&(0!=$("#suggestionList li.active").length?(b=$("#suggestionList").find("li.active").prev(),$("#suggestionList li.active").removeClass("active"),b.focus().addClass("active")):$("#suggestionList").find("li:first").focus().addClass("active"))});
$("#btn_search").click(function(a){a=$("#getStoreLocator").val();var b=0<$("#suggestionList").find("li").length?!0:!1;2<a.length?b?(a=$("#suggestionList").first().html(),getStoresList(a),clearSuggList()):(a=a.split(", ").pop(),4!==a.length||isNaN(a)?displayAlert("invalidFormat"):queryStoreList(a)):displayAlert("invalidFormat")});
function getSuburbs(a){var b=validPostcode(a);3===a.length&&b?firebase.database().ref("postcode-api/").orderByKey().startAt(a+"0").endAt(a+"9").limitToFirst(10).once("value").then(function(b){generateSuggestions(b.val(),a)}):4===a.length&&b?firebase.database().ref("postcode-api/"+a).once("value").then(function(b){generateSuggestions(b.val(),a)}):4<a.length&&displayError("Please enter a valid postcode or suburb.")}function validPostcode(a){a=parseInt(a);return 800>a||7799<a?!1:!0}
function getPostcode(a){a=a.toUpperCase();2<a.length&&firebase.database().ref("suburb-api/").orderByKey().startAt(a).endAt(a+"\uf8ff").limitToFirst(20).once("value").then(function(a){generateSuburbSuggestions(a.val())})}
function generateSuggestions(a,b){var d="",c=getState(b);clearSuggList();a&&($.isArray(a)?a.forEach(function(a){d+="<li class='sugg-list' data-state='"+c+"' data-suburb='"+a.suburb+"' data-postcode='"+b+"' onclick='getStoresList(this)'>"+a.suburb+", "+c+", "+b+"</li>"}):$.each(a,function(a,b){b.forEach(function(b){d+="<li class='sugg-list' data-state='"+c+"' data-suburb='"+b.suburb+"' data-postcode='"+a+"' onclick='getStoresList(this)'>"+b.suburb+", "+c+", "+a+"</li>"})}),$("#suggestionList").show().html(d))}
function generateSuburbSuggestions(a){var b="";a&&(clearSuggList(),$.each(a,function(a,c){c.forEach(function(c){var d=a.replace("_"," "),g=getState(c);b+="<li class='sugg-list' data-state='"+g+"'  data-suburb='"+a+"' data-postcode='"+c+"' onclick='getStoresList(this)'>"+d+", "+g+", "+c+"</li>"})}),$("#suggestionList").show().html(b))}
function getState(a){switch(a.charAt(0)){case "0":return"NT";case "2":return a=parseInt(a),2599<a&&2619>a||2899<a&&2921>a?"ACT":"NSW";case "3":return"VIC";case "4":return"QLD";case "5":return"SA";case "6":return"WA";case "7":return"TAS";default:return"Unknown"}}function showSpinner(){$("#searchSpinner").show();$("#quitStoreLocater").hide();clearError()}function hideSpinner(){$("#searchSpinner").hide();$("#quitStoreLocater").show()}function clearSuggList(){$("#suggestionList").hide().html("")}
function clearError(){$("#noStoreAlert").remove()}function getStoresList(a){var b=$(a).attr("data-suburb"),d=$(a).attr("data-postcode");a=$(a).attr("data-state");b=b.replace("_"," ");$("#getStoreLocator").val(b+", "+a+", "+d);clearSuggList();queryStoreList(d)}function queryStoreList(a){showSpinner();firebase.database().ref("store-api/"+a).once("value").then(function(a){fetchStoreTradingHours(a.val())})}
function fetchStoreTradingHours(a){var b=[],d=2;$("#noStoreAlert").remove();null===a?displayAlert("noStore"):a[0].name&&($.each(a,function(a,g){$.ajax({url:"https://tgg-api.firebaseio.com/store-detail-api/"+g.id+".json",type:"GET",dataType:"JSON",async:!1,success:function(c){void 0===c||null===c?d+=1:b[a]=c},error:function(a){console.log("Error:"+a)}});return a<d}),hideSpinner(),displayStores(b))}
function displayAlert(a){"noStore"===a?(hideDropDown(),hideSpinner(),$(".store-locater .clearfix.marg-top-5").parent().append("<div id='noStoreAlert' class='alert alert-danger marg-top-5 marg-bottom-0'>Sorry, no store can be found within 200 km of the search radius.</div>")):"invalidFormat"===a&&(clearSuggList(),hideDropDown(),clearError(),hideSpinner(),$(".store-locater .clearfix.marg-top-5").parent().append("<div id='noStoreAlert' class='alert alert-danger marg-top-5 marg-bottom-0'>Please type in a valid postcode or suburb.</div>"))}
function hideDropDown(){$("#desktop_tb").html("");$(".store-locater").removeClass("list-expand");$("#hoursBanner").hide();$("#errorContainer").hide()}
function displayStores(a){function b(a,b){return a.slice(b).concat(a.slice(0,b))}function d(a){var b;$.each(a,function(a,c){var f=c.date,d=moment().format("YYYY-MM-DD");f=moment(f).format("YYYY-MM-DD");if(moment(d).isSame(f))return b=c,!1});return b}function c(a){var b=[];$.each(a,function(a,c){var f=c.date,d=moment().subtract(1,"days").format("YYYY-MM-DD"),h=moment().add(7,"days").format("YYYY-MM-DD");f=moment(f).format("YYYY-MM-DD");moment(f).isBetween(d,h)&&b.push(c)});return 0<b.length?b:!1}function g(a,
b){var c=[];0<b.length&&$.each(b,function(b,c){$.each(a,function(b,f){f.day===c.day&&(a[b]=c)})});$.each(a,function(a,b){c.push({time:"0"===b.open&&"0"===b.close?"<span>Closed</span>":b.open+" - "+b.close,text:b.event?b.event:""})});return c}var n=(new Date).getDay(),q="";0===n&&(n=7);var r=n-1;$.each(a,function(a,l){var h=moment(),t=l.name.toLowerCase().replace(/ /g,"-"),f=d(l.exception),m=f?f:l.trading_hours[n],p=c(l.exception),e=g(l.trading_hours,p),k="MON TUE WED THU FRI SAT SUN".split(" ");k=
b(k,r);e=b(e,r);p="0"!=m.open&&"0"!=m.close?"<p>Open today: "+m.open+" - "+m.close:"<p class='text-secondary'>Closed today";f=f?"<i class='text-warning-sat'>"+m.event+"</i>":"";h="<i class='fa fa-info-circle text-info-sat' data-toggle='popover' data-html='true' data-trigger='hover' data-placement='top' title='' data-content='<b>Trading Hours</b><table><tbody><tr><td>Today</td><td>"+h.format("DD MMM").toUpperCase()+"</td><td>"+e[0].time+" </td></tr><tr><td></td><td colspan=2><i>"+e[0].text+"</i></td><tr><td>"+
k[1]+"</td><td>"+h.add(1,"days").format("DD MMM").toUpperCase()+"</td><td>"+e[1].time+" </td></tr><tr><td></td><td colspan=2><i>"+e[1].text+"</i></td><tr><td>"+k[2]+"</td><td>"+h.add(1,"days").format("DD MMM").toUpperCase()+"</td><td>"+e[2].time+" </td></tr><tr><td></td><td colspan=2><i>"+e[2].text+"</i></td><tr><td>"+k[3]+"</td><td>"+h.add(1,"days").format("DD MMM").toUpperCase()+"</td><td>"+e[3].time+" </td></tr><tr><td></td><td colspan=2><i>"+e[3].text+"</i></td><tr><td>"+k[4]+"</td><td>"+h.add(1,
"days").format("DD MMM").toUpperCase()+"</td><td>"+e[4].time+" </td></tr><tr><td></td><td colspan=2><i>"+e[4].text+"</i></td><tr><td>"+k[5]+"</td><td>"+h.add(1,"days").format("DD MMM").toUpperCase()+"</td><td>"+e[5].time+" </td></tr><tr><td></td><td colspan=2><i>"+e[5].text+"</i></td><tr><td>"+k[6]+"</td><td>"+h.add(1,"days").format("DD MMM").toUpperCase()+"</td><td>"+e[6].time+" </td></tr><tr><td></td><td colspan=2><i>"+e[6].text+"</i></td></tbody></table>' data-original-title='"+l.name+" Store Details'></i>";
q+="<section class='hours-container'><b>"+l.name+"</b>"+h+p+"</p>"+f+"<div class='clearfix'><a href='https://www.thegoodguys.com.au/"+t+"' target='_blank'>View Trading Hours</a></div></section>"});$("#desktop_tb").html("");$(".store-locater").addClass("list-expand");$("#hoursBanner").hide();$("#errorContainer").hide();$("#desktop_tb").html(q).slideDown();$("#quitStoreLocater").show();$(function(){$('[data-toggle="popover"]').popover({container:"body"})})}
$("#quitStoreLocater").click(function(){$("#desktop_tb").slideUp();$("#quitStoreLocater").hide();$(".store-locater").removeClass("list-expand");$("#hoursBanner").delay("1000").show();$("#noStoreAlert").remove();$("#getStoreLocator").val("");hideDropDown();clearSuggList()});