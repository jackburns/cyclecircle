app.controller('RideDetailsController', function ($scope, $http, $location, $routeParams) {
	var rideId = $routeParams.rideId;

	$http.get('/rides/' + rideId).success(function (ride) {
		$scope.ride = ride;
		console.log($scope.ride);
		initMap();
	});

	$scope.saved = false; 

	// check if ride has already been saved
	if($scope.$parent.user) {
		var savedRides = $scope.$parent.user.savedRides;

		for(var i = 0; i < savedRides.length; i++) {
			if(rideId === savedRides[i]) {
				$scope.saved = true;
			}
		}
	}
	$scope.saveRide = function () {
		if(!$scope.$parent.user) {
			$location.path('#/login');
			return;
		}

		$http.put('/saveRide', {'rideId': rideId}).success(function (user){
			$scope.saved = true;
			$scope.$parent.user = user;
			$scope.ride.saved++;
		});
	}

	$scope.removeRide = function () {
		if(!$scope.$parent.user) {
			$location.path('#/login');
			return;
		}

		$http.put('removeRide', {'rideId': rideId}).success(function (user) {
			$scope.saved = false;
			$scope.$parent.user = user;
			$scope.ride.saved--;
		});
	}

	$http.get('/reviewsByRide/' + rideId).success(function (reviews) {
		console.log(reviews);
		$scope.reviews = reviews;
	});

	$scope.submitReview = function (review) {
		review.rideId = rideId;
		review.username = $scope.$parent.user.username;
		review.rideName = $scope.ride.name;

		$http.post('/review', review).success(function (reviews) {
			$scope.reviews = reviews;
		});
	}

	function initMap() {
    	var directionsDisplay = new google.maps.DirectionsRenderer({}),
    		directionsService = new google.maps.DirectionsService();

        var rideMap = $scope.ride.map;

        var mapOptions = {
            zoom: 14,
        };

        var map = new google.maps.Map(
            document.getElementById('map-canvas'),
            mapOptions);

        var waypoints = [];

        // loads in waypoints from map data
        for(var i = 0; i < rideMap.waypoints.length; i++) {
        	waypoints[i] = {'location': new google.maps.LatLng(rideMap.waypoints[i][0], rideMap.waypoints[i][1]), 'stopover':false }
        }


        // recreates map route
	    directionsService.route({
	    	'origin': new google.maps.LatLng(rideMap.start.lat, rideMap.start.lng),
		    'destination': new google.maps.LatLng(rideMap.end.lat, rideMap.end.lng),
		    'waypoints': waypoints,
		    'travelMode': google.maps.DirectionsTravelMode.BICYCLING}, 

		    // recalculates total distance
		    function(res,sts) {
		        if(sts=='OK'){
		        	directionsDisplay.setDirections(res);
		        	var result = directionsDisplay.getDirections();

        	        var total = 0;
			        var myroute = result.routes[0];

			        for (var i = 0; i < myroute.legs.length; i++) {
			            total += myroute.legs[i].distance.value;
			        }

			        total = total / 1000.0;
			        document.getElementById('total').innerHTML = total + ' km';
		        }
		    });

        var bikeLayer = new google.maps.BicyclingLayer();
        bikeLayer.setMap(map);
        directionsDisplay.setMap(map);
    }

});