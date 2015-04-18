app.controller('HomeController', function ($scope, $http, $location) {
	$scope.customFeed = false;

	// either gets recent rides or custom feed from followers
	if($scope.$parent.user) {
		$scope.customFeed = true;

		$http.get('/ridesByFollower').success(function(rides){
			console.log(rides);
			$scope.rides = rides;
		});
	} else {
		$http.get('/rides').success(function(rides){
			$scope.rides = rides.splice(0, 10);
		});
	}

});