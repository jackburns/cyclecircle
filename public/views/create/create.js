app.controller('CreateController', function ($scope, $http, $location) {
	if(!$scope.$parent.user) {
		$location.path('/');
	}

    $scope.submitRoute = function () {

    	if(!origin) {
    		$scope.mapError = 'Please add origin';
    		return;
    	}

    	if(!destination) {
    		$scope.mapError = 'Please add destination';
    		return;
    	}

    	if(!$scope.nameText) {
    		$scope.mapError = 'Please add ride name';
    		return;
    	}
    	if(!$scope.descriptionText) {
    		$scope.mapError = 'Please add ride description';
    		return;
    	}

        var waypoints = [], data = {},
            routeLeg = directionsDisplay.directions.routes[0].legs[0];

        data.start = {'lat': routeLeg.start_location.lat(), 'lng': routeLeg.start_location.lng()};
        data.end = {'lat': routeLeg.end_location.lat(), 'lng': routeLeg.end_location.lng()};

        for (var i = 0; i < routeLeg.via_waypoints.length; i++) {
            waypoints[i] = [routeLeg.via_waypoints[i].lat(), routeLeg.via_waypoints[i].lng()];
        }

        data.waypoints = waypoints;

        var str = JSON.stringify(data);
        var ride = {
        	'name': $scope.nameText,
        	'description': $scope.descriptionText,
        	'creator': $scope.$parent.user.username,
        	'map': data,
        	'start': $('#map-start').val(),
        	'end': $('#map-end').val()
        }
        
        $http.post('/ride', ride).success(function(response) {
			$location.path('/');
			console.log('success');
        }).error(function(err){
        	console.log('error' + err);
        	$scope.mapError = err;
        });
    }

    var renderOptions = {
        draggable: true
    };

    origin = null;
    destination = null;

    var directionsDisplay = new google.maps.DirectionsRenderer(renderOptions);
    var directionsService = new google.maps.DirectionsService();

    function initialize() {

        var mapOptions = {
            zoom: 14,
        };

        var map = new google.maps.Map(
            document.getElementById('map-canvas'),
            mapOptions);


        var start = document.getElementById('map-start');
        var end = document.getElementById('map-end');
        var startAutocomplete = new google.maps.places.Autocomplete(start);
        var endAutocomplete = new google.maps.places.Autocomplete(end);
        startAutocomplete.bindTo('bounds', map);
        endAutocomplete.bindTo('bounds', map);


        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var geolocate = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(geolocate);
            });
        }

        var bikeLayer = new google.maps.BicyclingLayer();
        bikeLayer.setMap(map);
        directionsDisplay.setMap(map);

        google.maps.event.addListener(directionsDisplay, 'directions_changed', function () {
            computeTotalDistance(directionsDisplay.getDirections());
        });

        google.maps.event.addListener(startAutocomplete, 'place_changed', function () {
            var place = startAutocomplete.getPlace();
            console.log(place);

            origin = place.geometry.location;

            calcRoute();
        });

        google.maps.event.addListener(endAutocomplete, 'place_changed', function () {
            var place = endAutocomplete.getPlace();

            destination = place.geometry.location;

            calcRoute();
        });
    }


    function calcRoute() {
        if (origin && destination) {

            var request = {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.BICYCLING
            };

            directionsService.route(request, function (response, status) {
                console.log('sup');
                if (status == google.maps.DirectionsStatus.OK) {
                    console.log('sup');
                    directionsDisplay.setDirections(response);
                }
            });
        }
    };

    function computeTotalDistance(result) {
        var total = 0;
        var myroute = result.routes[0];
        for (var i = 0; i < myroute.legs.length; i++) {
            total += myroute.legs[i].distance.value;
        }
        total = total / 1000.0;
        document.getElementById('total').innerHTML = total + ' km';
    }

    initialize();
});