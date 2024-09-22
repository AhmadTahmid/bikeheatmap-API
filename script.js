// Initialize the map centered on Bologna
var map = L.map('map').setView([44.4939, 11.3426], 13);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var heatLayer;
var bikeData = {}; // Object to store data grouped by hour

// Fetch data from the API
function fetchData() {
    var url = 'https://opendata.comune.bologna.it/api/records/1.0/search/?dataset=colonnine-conta-bici&rows=10000';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            processData(data.records);
            // Initialize heatmap with the default hour (e.g., 12 PM)
            updateHeatmap(12);
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Process the fetched data
function processData(records) {
    records.forEach(record => {
        var fields = record.fields;

        // Check if 'data' field exists
        if (!fields.data) {
            console.warn('Missing data field for record:', record);
            return; // Skip this record
        }

        var date = new Date(fields.data);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date for record:', record);
            return; // Skip this record
        }
        var hour = date.getHours();

        var coords = fields.geo_point_2d; // Updated to use 'geo_point_2d'
        var count = fields.totale || 1; // Default to 1 if 'totale' is missing

        if (!bikeData[hour]) {
            bikeData[hour] = [];
        }

        if (coords && coords.length >= 2) {
            // Push data in the format [lat, lon, intensity]
            bikeData[hour].push([coords[0], coords[1], count]);
        } else {
            console.warn('Missing coordinates for record:', record);
        }
    });
}


// Update the heatmap based on the selected hour
function updateHeatmap(hour) {
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }

    var data = bikeData[hour] || [];

    heatLayer = L.heatLayer(data, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
    }).addTo(map);

    document.getElementById('time-display').innerText = 'Hour: ' + hour + ':00';
}

// Event listener for the time slider
document.getElementById('time-slider').addEventListener('input', function(e) {
    var hour = e.target.value;
    updateHeatmap(hour);
});

// Fetch data when the page loads
fetchData();
