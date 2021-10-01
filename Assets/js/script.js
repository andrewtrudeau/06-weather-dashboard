const apiKey = "77a5f5e9021668e3908aa9d8669df015"

// List of city names, populates if there is something in localStorage //

var cityNames = [];

if (localStorage.getItem("cityNames")) {

    cityNames = localStorage.getItem("cityNames").split(',');

    for (let i = 0; i < cityNames.length; i++)
        addCityButton(cityNames[i]);

}

//////////////////////
// Helper Functions //
//////////////////////

// Changes: john smith --> John Smith //

let toTitleCase = (str) => {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

// The API gives us a code and a url to get the image given the code //

let getIconURL = code => `https://openweathermap.org/img/wn/${code}@2x.png`;

// The api gives us an ugly date, but we can fix that //

let prettyDate = ugly => {
    let year = ugly.substring(0, 4);
    let month = ugly.substring(5, 7);
    let day = ugly.substring(8, 11);
    if (day[0] === '0') day = day[1];

    return month + "/" + day + "/" + year;

}

// Api docs state that units are in kelvin, we must convert to fahrenheit //

let fahrenheit = kelvin => (kelvin - 273.15) * 9 / 5 + 32;

// Api docs state that units are in meters per second, we must convert to MPH //

let milesPerHour = metersPerSecond => metersPerSecond * 2.237;

// This updates the CSS to set the background color of UVI based on UVI value //

let uviClass = uvi => {
    if (uvi < 3)
        return "uvi-low"
    if (uvi < 8)
        return "uvi-moderate"
    if (uvi < 11)
        return "uvi-high"
    else
        return "uvi-extreme"
};

// Show or hide data based on whether a location that is selected is valid //

function showData() {
    $(".card").show();
    $(".five-day").show();
    $(".sectionTitle").show();
}

function hideData() {
    $(".card").hide();
    $(".five-day").hide();
    $(".sectionTitle").hide();
}

// Get UVI data from separate api call, why is it separate? couldn't tell yah //

let queryUVI = (lat, lon) => "https://api.openweathermap.org/data/2.5/onecall?lat=" + lat +
    "&lon=" + lon +
    "&exclude={part}&appid=" + apiKey;

///////////////////
// Page Builders //
///////////////////

// Update local storage and location list //

function addCity(cityName) {

    // Lets standardize the city name to make it more 
    // recognizable so we don't get duplicates based on
    // one different character.
    let prettyCityName = toTitleCase(cityName);

    // Add button to html
    if (!cityNames.includes(prettyCityName)) {
        addCityButton(prettyCityName);
        cityNames.push(prettyCityName);
    }

    // Update local storage
    localStorage.setItem("cityNames", cityNames);
}

// This code adds a new location and makes a listener for it //

function addCityButton(cityName) {
    let id = cityName.replace(/\s+/g, '-').toLowerCase();

    $('#drop-down').append(`<a href="#" id="${id}">${cityName}</a>`);

    $('#' + id).click((event) => {
        event.preventDefault();
        getWeather(event.currentTarget.textContent);

    });

}

// Add HTML of card to dom //

function getCardHTML(date, iconCode, temp, windSpeed, humidity) {

    return `
        <div class="card">
            ${getCardBodyHTML(date, iconCode, temp, windSpeed, humidity)}
        </div>
    `;
}

function getCardBodyHTML(date, iconCode, temp, windSpeed, humidity) {
    let imgSrc = getIconURL(iconCode);

    return `
        <img src="${imgSrc}" alt="Weather Image">
        <p>${prettyDate(date)}</p>
        <p>${temp.toFixed(2)} °F</p>
        <p>Wind: ${windSpeed.toFixed(2)} MPH</p>
        <p>Humidity: ${humidity}%</p>
    `;
}

function buildForecast(data, uvi) {

    // Clear cards
    $('#largeCard').empty();
    $('#fiveDay').empty();

    // Large Card
    let date = data.list[0].dt_txt;
    let iconCode = data.list[0].weather[0].icon;
    let temp = fahrenheit(data.list[0].main.temp);
    let windSpeed = milesPerHour(data.list[0].wind.speed);
    let humidity = data.list[0].main.humidity;

    $('#largeCard').append(getCardBodyHTML(date, iconCode, temp, windSpeed, humidity));

    // Large card has UVI, small ones do not
    $('#largeCard').append(`<p>UV Index: <span class="uvi ${uviClass(uvi)}">${uvi}</span></p>`);

    // The rest of cards
    for (let i = 7; i < 40; i += 8) {
        date = data.list[i].dt_txt;
        iconCode = data.list[i].weather[0].icon;
        temp = fahrenheit(data.list[i].main.temp);
        windSpeed = milesPerHour(data.list[i].wind.speed);
        humidity = data.list[i].main.humidity;

        $('#fiveDay').append(getCardHTML(date, iconCode, temp, windSpeed, humidity));

    }

    showData();

}

// Begs the server for the information to build our website //

function getWeather(cityName) {

    var queryURLForecast = "https://api.openweathermap.org/data/2.5/forecast?q=" + cityName +
        "&appid=" + apiKey;

    fetch(queryURLForecast).then(response => {

        if (response.ok) {
            response.json().then(data => {

                fetch(queryUVI(data.city.coord.lat, data.city.coord.lon))
                    .then(res => {
                        if (res.ok) {
                            res.json().then(dataUV => {

                                buildForecast(data, dataUV.current.uvi);

                            });
                        } else
                            hideData();

                    });

                // Update HTML h1 to location name
                $("#location").text(toTitleCase(cityName));

                // Add city data to local storage 
                addCity(cityName);
            });
        } else
            hideData();
    });
}

// Click the submit button to access that location's data //

$("#submit").click((event) => {
    event.preventDefault();

    getWeather($('#cityInput').val());

    $('#cityInput').val(""); // Clear text box value
});

// Hide data on page load //

hideData();
