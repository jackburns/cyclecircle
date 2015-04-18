app.controller('ProfileController', function ($scope, $http, $location, $routeParams) {
	var username = $routeParams.username;
	$scope.activeUser = false;
	$scope.savedRides = [];
	$scope.following = false;


	if(username === $scope.$parent.user.username){
		$scope.activeUser = true;
	}

	$http.get('/user/' + username).success(function(user){
		$scope.profile = user;
		
		// get favorited rides for user from ids
		for(var i = 0; i < user.savedRides.length; i++) {
			$http.get('/rides/' + user.savedRides[i]).success(function (ride) {
				$scope.savedRides.push(ride);
			});
		}

		for(i = 0; i < $scope.$parent.user.following.length; i++) {
			if($scope.$parent.user.following[i] === username) {
				$scope.following = true;
			}
		}

	}).error(function(err){
		$scope.profileError = err;
	});

	$http.get('/ridesByUser/' + username).success(function(rides){
		$scope.rides = rides;
	});

	$http.get('/reviewsByUser/' + username).success(function(reviews){
		$scope.reviews = reviews;
		console.log(reviews);
	});

	$scope.follow = function () {
		$http.put('/follow/', {'username': username}).success(function (user) {
			$scope.$parent.user = user;
			$scope.following = true;
		});
	}

	$scope.unfollow = function() {
		$http.put('/unfollow/', {'username': username}).success(function (user) {
			$scope.$parent.user = user;
			$scope.following = false;
		});
	}
});
