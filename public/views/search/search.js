app.controller('SearchController', function ($scope, $http, $location) {

	$scope.distanceArray = [
		{label: '10km', value: 10},
		{label: '20km', value: 20},
		{label: '30km', value: 30},
		{label: '40km', value: 40},
		{label: '50km', value: 50}
	]

	// google autocomplete from Places library
    var search = document.getElementById('search-input');
	var autocomplete = new google.maps.places.Autocomplete(search);

	$scope.searchDistance = 10;

    google.maps.event.addListener(autocomplete, 'place_changed', function () {
    	$scope.search();
    });

    $scope.search = function () {
        var place = autocomplete.getPlace();

        if(!place) {
        	$scope.searchError = 'Please enter a location';
        	return;
        }

         $http.get('ridesByLocation/?lat=' + place.geometry.location.lat() + '&lng=' + place.geometry.location.lng() + '&distance=' + $scope.searchDistance).success(function(rides){
         	$scope.rides = rides;
         });
    }
});