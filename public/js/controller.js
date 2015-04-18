var app = angular.module('CycleCircleApp', ['ngRoute']);

app.controller('CycleCircleController', function($scope, $http, $location) {
	$scope.user = null;
	
	$http.get('/loggedin').success(function (user) {
		$scope.user = user;
	});

	$scope.logout = function() {
		$http.post('/logout').success(function (response) {
			$scope.user = null;
			$location.url('/home');
		});
	};
});

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/home', {
		templateUrl: '../views/home/home.html',
		controller: 'HomeController'
	}).
	when('/login', {
		templateUrl: '../views/login/login.html',
		controller: 'LoginController'
	}).
	when('/create', {
		templateUrl: '../views/create/create.html',
		controller: 'CreateController'
	}).
	when('/ride/:rideId', {
		templateUrl: '../views/rideDetails/rideDetails.html',
		controller: 'RideDetailsController'
	}).
	when('/search', {
		templateUrl: '../views/search/search.html',
		controller: 'SearchController'
	}).
	when('/profile/:username', {
		templateUrl: '../views/profile/profile.html',
		controller: 'ProfileController'
	}).
	otherwise({
		redirectTo: '/home'
	});
	}
]);
