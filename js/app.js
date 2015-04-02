(function(){

	var app = angular.module('courses', []);
	var selectedHole = 0

	app.controller('courseController', function($scope){
		var currentUser = Parse.User.current();
		if (currentUser) {
			$scope.SignedIn = true;
			$scope.Username = currentUser.get('username');
		} else {
			$scope.SignedIn = false;
		}
		this.Details = [];
		var courseEntries = [];
    	this.courseDatabases = courseEntries;
    	var GetCourses = Parse.Object.extend("Course");
    	var getCourses = new Parse.Query(GetCourses);
    	getCourses.limit(1000);
    	getCourses.find({
    		success: function(results) {
    			$scope.$apply(function(){
    				for (var i = 0; i < results.length; i++) { 
      					var object = results[i];
      					courseEntries.push({holes: object.get('Holes'), author: object.get('Author'), name: object.get('Name'), location: object.get('Address'), geoLink: object.get('MapsLink'), id: object.id});
    				}	
    				$scope.courseDatabases = courseEntries;
    			})
  			}
   		});
    	
    	$scope.inputType = 'password';

		this.addCourse = function(currentCourse) {
			var courseInfos = new GetCourses();
			var empty = [];
			courseInfos.set("Name", currentCourse.name);
			courseInfos.set("Address", currentCourse.location);
			courseInfos.set("MapsLink", currentCourse.geoLink);
			courseInfos.set("Author", $scope.Username);
			currentCourse.holes =[];
			var hole = [];
			for (var i = 0; i < 18; i++) { 
				hole[i] = {HoleIndex: i, Par: 4, Lat: 0, Long: 0, StrokeIndex: 0};
				currentCourse.holes[i] = hole[i];
			};
			
			courseInfos.set("Holes", currentCourse.holes);
			courseInfos.save(null, {
				success: function (obj) {
            		window.location.reload(false); 
				}
			});
		}



		this.updateCourse = function(currentCourse){
			var Course = new Parse.Query(GetCourses);
			Course.equalTo("objectId", currentCourse.id);
			Course.get(currentCourse.id, {
				success: function (CourseU) {
					CourseU.set("Name", currentCourse.name);
					CourseU.set("Address", currentCourse.location);
					CourseU.set("MapsLink", currentCourse.geoLink);
					var hole = [];
					for (var i = 0; i < 18; i++) { 
						hole[i] = {HoleIndex: i, Par: currentCourse.holes[i].Par, StrokeIndex: currentCourse.holes[i].StrokeIndex, Lat: currentCourse.holes[i].Lat, Long: currentCourse.holes[i].Long};
						//hole[i] = {HoleIndex: i, Par: currentCourse.pars[i], StrokeIndex: currentCourse.strokeIndex[i]};
						currentCourse.holes[i] = hole[i];
					};
					CourseU.set("Holes", currentCourse.holes);
					CourseU.save();		
				}
			});
		}

		this.deleteCourse = function(currentCourse){
			var Course = new Parse.Query(GetCourses);
			Course.equalTo("objectId", currentCourse.id);
			Course.get(currentCourse.id, {
				success: function (CourseU) {
					CourseU.destroy({
						success: function (obj) {
            			window.location.reload(false); 
						}
					});
				}
			});
		}

		this.signUp = function(details){
			var user = new Parse.User();
			user.set("username", details.Username);
			user.set("password", details.Password);
			user.signUp(null,{
				success: function () {
					var currentUser = Parse.User.current();
					if (currentUser) {
						$scope.SignedIn = true;
					} else {
					}
					window.location.reload(false); 
				}		
			});
		}

		this.signIn = function(details){
			Parse.User.logIn(details.Username, details.Password, {
				success: function(user) {
					var currentUser = Parse.User.current();
					if (currentUser) {
						$scope.SignedIn = true;
						window.location.reload(false); 		
					} else {
						$scope.PassWrong = true;
					}					
				}
			})
		}

		this.logOut = function(details){
			Parse.User.logOut();
			var currentUser = Parse.User.current();
			window.location.reload(false); 
		}
		
		this.showMap = function(i) {
			console.log("Test " + i);
			$scope.clicked = false;
			//selectedHole = i;
			//$scope.showMapForHole = true;
		}
		

	});

    
})();