app.controller('LoginController', function($scope, $http, $location) {
	
	$scope.login = function(user) {
		$http.post('/login', user).success(function(response) {
			$scope.loginError = '';
			$scope.$parent.user = response;
			$location.path('/');
		}).error(function(err){
			$scope.loginError = 'Incorrect Login Information';
		});
	}

	$scope.register = function(user) {
		$http.post('/register', user).success(function(response) {
			$scope.$parent.user = response;
			$location.path('/');
		}).error(function(err){
			$scope.registerError = err;
		});
	}

	// listener for retype password field
	$scope.retypePassword = "";
	$scope.$watch('retypePassword', function(newVal, oldVal) {
		if ($scope.newUser && $scope.newUser.password && newVal !== $scope.newUser.password) {
			$scope.registerError = 'Passwords dont match';
		} else {
			$scope.registerError = '';
		}
	});
});