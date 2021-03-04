/*
  Deze library is gemaakt door Uitgeverij Instruct ten behoeve van de lesmethode Fundament.
  Met deze library worden de gegevens die Buienradar via https://data.buienradar.nl/2.0/feed/json
  beschikbaar stelt op een eenvoudige manier benaderbaar.

  De weerdata die Buienradar beschikbaar stelt, is gratis, onder enkele voorwaarden.
  Die voorwaarden lees je op: https://www.buienradar.nl/overbuienradar/gratis-weerdata

  Zo mag je de data alleen gebruiken voor niet-commerciele doeleinden en is bronvermelding verplicht.
  Ook voor het gebruik van mobiele toepassingen is toestemming vereist.

  Deze versie is van 30 september 2019. Aanpassingen zijn o.a.
   - Kleine bugfixes
   - Betere memeroy usage, Buienradar data wordt nu lokaal opgeslagen en per 5 minuten refreshed
   - Als een currentLocation weerstation de benodigde info niet heeft (zoals bijv. precipitation)
       dan wordt er gekeken naar het daarna dichstbijzijnde weerstation, of die de waarde wel heeft enz.
*/


var xmlhttp = new XMLHttpRequest();
var buienradarData;
var msgNoData = "Data tijdelijk niet beschikbaar..";
var elementIsNull = "-";
var imageIsNull = "Afbeelding niet beschikbaar";
var timeOutDatarefresh = 300000;

var currentLat, currentLon;

// Laad de buienradar data
function loadBuienradarData() {
    // Is er ooit al data opgevraagd?
    if(localStorage.timestampDataLoaded) {
        console.log((+new Date - localStorage.timestampDataLoaded));
        // Is dat minder dan de timeout variabele? Dan uit local storage halen
        if((+new Date - localStorage.timestampDataLoaded) < timeOutDatarefresh) {
            buienradarData = JSON.parse(localStorage.buienradarData);
            return;
        }
    }

    // Vraag nu de data op!
    // Als reponse binnenkomt
    xmlhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            buienradarData = JSON.parse(this.responseText);
            localStorage.timestampDataLoaded = +new Date;
            localStorage.buienradarData = this.responseText;
        }
    };
    // Request versturen
    xmlhttp.open("GET", "https://api.buienradar.nl/data/public/2.0/jsonfeed", false);
    xmlhttp.send();
}


// Vraag actuele locatie op aan browser/telefoon
function getLocation() {
    // Is er iets in local storage?
    if(localStorage.currentLatLS  &&  localStorage.currentLonLS) {
        // Direct door
        saveCurrentPosition(null);
    } else {
        // Bestaat niet.
        if (navigator.geolocation) {
            // Locatie gevonden, bepaal dichstbijzijnde weerstation
            navigator.geolocation.getCurrentPosition(saveCurrentPosition);
        } else {
            alert('Huidige locatie opvragen wordt niet ondersteunt!');
        }
    }
}

// Huidige locatie opslaan
function saveCurrentPosition(position) {
    // Is er een position meegegeven?
    if(position !== null) {
        // Opslaan in localstorage
        currentLat = position.coords.latitude;
        currentLon = position.coords.longitude;
        localStorage.currentLatLS = currentLat;
        localStorage.currentLonLS = currentLon;
    } else {
        // Geen positie meegegeven, ophalen uit local storage
        currentLat = localStorage.currentLatLS;
        currentLon = localStorage.currentLonLS;
    }

    showWeatherInfo();
}

// Dichstbijzijnde weerstation bepalen
function getNearestWeatherStation(searchValue) {

    // All weerstations
    weerstations = buienradarData.actual.stationmeasurements;

    // Variabelen om mee te werken
    var dichtbij;
    var afstand = 1000;

    // Ieder weerstation aflopen
    for (var weerstation in weerstations) {
        if (weerstations.hasOwnProperty(weerstation)) {

            // Afstand bepalen ten opzichte van eigen locatie en locatie weerstation
            tempAfstand = getDistanceFromLatLonInKm(weerstations[weerstation].lat, weerstations[weerstation].lon, currentLat, currentLon);
            //console.log(weerstations[weerstation].stationname + ": " + tempAfstand + "km");

            // Is deze afstand korter dan een eerder gevonden weerstation?
            if(afstand > tempAfstand) {
                // EN bevat dit weerstation de gevraagde informatie?
                if(weerstations[weerstation].hasOwnProperty(searchValue) !== undefined) {
                    // Dan is dit nu de dichstbijzijnde
                    afstand = tempAfstand;
                    dichtbij = weerstations[weerstation];
                }
            }
        }
    }

    return dichtbij;
}


// Functie om het weerstation by ID op te halen
function getWeatherStationById(stationid) {
    // Ieder weerstation aflopen
    for (var weerstation in weerstations) {
        if (weerstations.hasOwnProperty(weerstation)) {
            if(weerstations[weerstation].stationid === stationid) {
                return weerstations[weerstation];
            }
        }
    }
    return -1;
}



// Functie om afstand te bepalen a.d.v. GPS
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

// Functie om graden naar radialen om te rekenen
function deg2rad(deg) {
    return deg * (Math.PI/180);
}



// Deel 2: alle functie om weerdata te tonen

// Predefined functions
function currentLocation_temperature(id) {
    var nearestWeatherStationData = getNearestWeatherStation("temperature");
    if(nearestWeatherStationData.temperature === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.temperature;
    }
}
function currentLocation_stationName(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.stationname === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.stationname;
    }
}
function currentLocation_stationRegio(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.regio === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.regio;
    }
}
function currentLocation_stationGraphUrl(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.graphUrl === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.graphUrl;
    }
}
function currentLocation_stationIconUrl(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.iconurl === undefined) {
        console.log(imageIsNull);
    } else {
        document.getElementById(id).src = nearestWeatherStationData.iconurl;
    }
}
function currentLocation_stationDescription(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.weatherdescription === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.weatherdescription;
    }
}
function currentLocation_stationWindDirection(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.winddirection === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.winddirection;
    }
}
function currentLocation_stationAirPressure(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.airpressure === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.airpressure;
    }
}
function currentLocation_stationGroundTemperature(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.groundtemperature === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.groundtemperature;
    }
}
function currentLocation_stationFeelTemperature(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.feeltemperature === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.feeltemperature;
    }
}
function currentLocation_stationVisibility(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.visibility === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.visibility;
    }
}
function currentLocation_stationWindSpeed(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.windspeed === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.windspeed;
    }
}
function currentLocation_stationWindSpeedBft(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.windspeedBft === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.windspeedBft;
    }
}
function currentLocation_stationHumidity(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.humidity === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.humidity;
    }
}
function currentLocation_stationSunPower(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.sunpower === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.sunpower;
    }
}
function currentLocation_stationPrecipitation(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.precipitation === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.precipitation;
    }
}
function currentLocation_stationRainFallLast24Hour(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.rainFallLast24Hour === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.rainFallLast24Hour;
    }
}
function currentLocation_stationRainFallLastHour(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.rainFallLastHour === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.rainFallLastHour;
    }
}
function currentLocation_stationWindDirectionDegree(id) {
    var nearestWeatherStationData = getNearestWeatherStation("stationname");
    if(nearestWeatherStationData.winddirectiondegrees === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = nearestWeatherStationData.winddirectiondegrees;
    }
}



// Gegevens van een specifiek weerstation
function weatherstation_temperature(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.temperature === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.temperature;
    }
}
function weatherstation_stationName(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.stationname === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.stationname;
    }
}
function weatherstation_stationRegio(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.regio === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.regio;
    }
}
function weatherstation_stationGraphUrl(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.graphUrl === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.graphUrl;
    }
}
function weatherstation_stationIconUrl(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.iconurl === undefined) {
        console.log(imageIsNull);
    } else {
        document.getElementById(id).src = weerstationData.iconurl;
    }
}
function weatherstation_stationDescription(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.weatherdescription === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.weatherdescription;
    }
}
function weatherstation_stationWindDirection(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.winddirection === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.winddirection;
    }
}
function weatherstation_stationAirPressure(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.airpressure === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.airpressure;
    }
}
function weatherstation_stationGroundTemperature(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.groundtemperature === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.groundtemperature;
    }
}
function weatherstation_stationFeelTemperature(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.feeltemperature === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.feeltemperature;
    }
}
function weatherstation_stationVisibility(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.visibility === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.visibility;
    }
}
function weatherstation_stationWindSpeed(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.windspeed === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.windspeed;
    }
}
function weatherstation_stationWindSpeedBft(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.windspeedBft === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.windspeedBft;
    }
}
function weatherstation_stationHumidity(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.humidity === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.humidity;
    }
}
function weatherstation_stationSunPower(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.sunpower === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.sunpower;
    }
}
function weatherstation_stationPrecipitation(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.precipitation === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.precipitation;
    }
}
function weatherstation_stationRainFallLast24Hour(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.rainFallLast24Hour === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.rainFallLast24Hour;
    }
}
function weatherstation_stationRainFallLastHour(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.rainFallLastHour === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.rainFallLastHour;
    }
}
function weatherstation_stationWindDirectionDegree(stationid, id) {
    var weerstationData = getWeatherStationById(stationid);
    if(weerstationData.winddirectiondegrees === undefined) {
        document.getElementById(id).innerHTML = elementIsNull;
    } else {
        document.getElementById(id).innerHTML = weerstationData.winddirectiondegrees;
    }
}



// Datum en tijd

// Alleen dagnaam
function date_showName(id, datum = new Date()) {
    // Is de parameter een datum? Zo nee, dan maken we die.
    if(Object.prototype.toString.call(datum) !== '[object Date]') {
        var nu = new Date(datum);
    } else {
        var nu = datum;
    }

    var dagen = ["zondag","maandag", "dinsdag","woensdag","donderdag","vrijdag","zaterdag"];

    document.getElementById(id).innerHTML = dagen[nu.getDay()];
}

// Volledige datum
function date_showDate(id, datum = new Date(), seperator = "-") {

    // Is de parameter een datum? Zo nee, dan maken we die.
    if(Object.prototype.toString.call(datum) !== '[object Date]') {
        var nu = new Date(datum);
    } else {
        var nu = datum;
    }

    var dag = nu.getDate();
    var dag2 = ((dag < 10) ? "0" : "") + dag;
    var maand = nu.getMonth() + 1;
    var maand2 = ((maand < 10) ? "0" : "") + maand;
    var jaar = nu.getYear();
    var jaar4 = ((jaar < 1900) ? (jaar + 1900) : (jaar));

    document.getElementById(id).innerHTML = dag2 + seperator + maand2 + seperator + jaar4;
}

// Dag/maand
function date_showDayMonth(id, datum = new Date(), seperator = "-") {

    // Is de parameter een datum? Zo nee, dan maken we die.
    if(Object.prototype.toString.call(datum) !== '[object Date]') {
        var nu = new Date(datum);
    } else {
        var nu = datum;
    }

    var dag = nu.getDate();
    var dag2 = ((dag < 10) ? "0" : "") + dag;
    var maand = nu.getMonth() + 1;
    var maand2 = ((maand < 10) ? "0" : "") + maand;

    document.getElementById(id).innerHTML = dag2 + seperator + maand2;
}

// Tijd (uur minuut)
function time_showTime(id, datum = new Date(), seperator = ":") {

    // Is de parameter een datum? Zo nee, dan maken we die.
    if(Object.prototype.toString.call(datum) !== '[object Date]') {
        var nu = new Date(datum);
    } else {
        var nu = datum;
    }

    var uur = nu.getHours();
    var uur2 = ((uur < 10) ? "0" : "") + uur;
    var minuut = nu.getMinutes();
    var minuut2 = ((minuut < 10) ? "0" : "") + minuut;

    document.getElementById(id).innerHTML = uur2 + seperator + minuut2;
}


// Losse gegevens
function buienradar_map(id) {
    document.getElementById(id).src = buienradarData.actual.actualradarurl;
}

function buienradar_sunrise() {
    return buienradarData.actual.sunrise;
}

function buienradar_sunset() {
    return buienradarData.actual.sunset;
}


// Voorspellingen
function forecast_shorterm(id) {
    document.getElementById(id).innerHTML = buienradarData.forecast.shortterm.forecast;
}
function forecast_longterm(id) {
    document.getElementById(id).innerHTML = buienradarData.forecast.longterm.forecast;
}
function forecast_title(id) {
    document.getElementById(id).innerHTML = buienradarData.forecast.weatherreport.title;
}
function forecast_summary(id) {
    document.getElementById(id).innerHTML = buienradarData.forecast.weatherreport.summary;
}
function forecast_text(id) {
    document.getElementById(id).innerHTML = buienradarData.forecast.weatherreport.text;
}
function forecast_author(id) {
    document.getElementById(id).innerHTML = buienradarData.forecast.weatherreport.author;
}


// Meerdaagse verwachting
function validateDayNumber(dagnr) {
    if(dagnr < 1) {
        return 1;
    }
    if(dagnr > 5) {
        return 5;
    }
    return dagnr;
}

function forecast_date(dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        return new Date();
    }
    return buienradarData.forecast.fivedayforecast[dagen - 1].day;
}

function forecast_minTemperature(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].mintemperature;
}

function forecast_maxTemperature(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].maxtemperature;
}

function forecast_rainChance(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].rainChance;
}

function forecast_sunChance(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].sunChance;
}

function forecast_windDirection(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].windDirection.toUpperCase();
}

function forecast_wind(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].wind;
}

function forecast_mmRainMin(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].mmRainMin;
}

function forecast_mmRainMax(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].mmRainMax;
}

function forecast_iconurl(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).src = buienradarData.forecast.fivedayforecast[dagen - 1].iconurl;
}

function forecast_weatherdescription(id, dagen = 1) {
    dagen = validateDayNumber(dagen);
    if(buienradarData.forecast.fivedayforecast.length === 0) {
        document.getElementById(id).innerHTML = msgNoData;
        return;
    }
    document.getElementById(id).innerHTML = buienradarData.forecast.fivedayforecast[dagen - 1].weatherdescription;
}




// Neerslaggrafiek
// Nieuw sinds 6 januari 2020
function toonNeerslagGrafiek(id) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {

    if(this.readyState == 4 && this.status == 200) {
        var data = this.responseText;
        var tmp = data.split("\n");
        var mmpu = 0;
        var tmpTijdstip = "";
        var arrayTijden = [23];
        var arrayNeerslag = [23];
        var counter = 0;

        // Voor iedere entry in de array tmp
        tmp.forEach(function(entry) {
        // Indien niet leeg
        if(entry != "") {
            // Start tijdstip
            if(counter == 0) {
                arrayTijden[counter] = entry.substring(4);
            }
            // Andere tijdstippen niet opnemen
            else {
                arrayTijden[counter] = "";
            }
            // Eindtijdstip
            if(entry.substring(4) != "") { tmpTijdstip = entry.substring(4); }

            // Neerslag
            // Formule is: Neerslagintensiteit = 10^((waarde-109)/32)
            var tmp2 = entry.substring(0,3);
            mmpu = Math.pow(10, ((tmp2-109)/32));

            // Opslaan in array
            arrayNeerslag[counter] = mmpu;

            // Counter verhogen
            counter++;
        }
        });

        arrayTijden[arrayTijden.length - 1] = tmpTijdstip;


        // Teken de Neerslaggrafiek
        var ctx = document.createElement('canvas');
        ctx.id = "graphCanvas"
        document.getElementById(id).appendChild(ctx);

        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: arrayTijden,
                datasets: [{
                    label: 'Neerslagintensiteit mm/u',
                    data: arrayNeerslag,
                    backgroundColor: 'rgba(66, 135, 245, 0.2)',
                    borderColor: 'rgb(66, 135, 245)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            min: 0,
                            max: 1,
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                      position: 'right'
                    }]
                }
            }
        });
    }
    }

    console.log("https://gpsgadget.buienradar.nl/data/raintext?lat="+ currentLat + "&lon="+ currentLon);
    xhr.open("GET", "https://gpsgadget.buienradar.nl/data/raintext?lat="+ currentLat + "&lon="+ currentLon);
    xhr.send();
}


// Overige Gegevens
function currentLocation_cityName(id) {
    var xmlhttp_streetmap = new XMLHttpRequest();
    xmlhttp_streetmap.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            openStreetmapData = JSON.parse(this.responseText);
            console.log(openStreetmapData);
            tmpTown = openStreetmapData.address.city;
            if(tmpTown === undefined) {
                currentLocation_stationRegio(id);
            } else {
                document.getElementById(id).innerHTML = tmpTown;
            }
        }
    };
    // Request versturen
    xmlhttp_streetmap.open("GET", "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + currentLat + "&lon=" + currentLon, false);
    xmlhttp_streetmap.send();
}
