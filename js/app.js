(function(){

	var app = angular.module('courses', []);

	app.controller('courseController', function($scope){
		var currentUser = Parse.User.current();
		if (currentUser) {
			$scope.SignedIn = true;
			$scope.Username = currentUser.get('username');
		} else {
			$scope.SignedIn = false;
		}
		// Initialise a few variables,arrays, objects
		this.Details = [];
		var courseEntries = [];
    	this.courseDatabases = courseEntries;
		
		// Connect to Parse and query all the courses in the database
    	var GetCourses = Parse.Object.extend("Course");
    	var getCourses = new Parse.Query(GetCourses);
    	getCourses.limit(1000);
    	getCourses.find({
    		success: function(results) {
    			$scope.$apply(function(){
    				for (var i = 0; i < results.length; i++) { 
      					var object = results[i];
      					courseEntries.push({holes: object.get('Holes'), 
											author: object.get('Author'), 
											name: object.get('Name'), 
											id: object.id, 
											maps: {},
											markers: {}
										});
    				}	
    				$scope.courseDatabases = courseEntries;
    			})
  			}
   		});
    	
    	$scope.inputType = 'password';

		// Controller function to add a new course
		this.addCourse = function(currentCourse) {
			var courseInfos = new GetCourses();
			courseInfos.set("Name", currentCourse.name);
			courseInfos.set("Author", $scope.Username);
			currentCourse.holes =[];
			var hole = [];
			// Setup a new course with some default values
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

		// Controller function to update a course
		this.updateCourse = function(currentCourse){
			var Course = new Parse.Query(GetCourses);
			// The objectId is a unique identifier which allows us to select the course
			Course.equalTo("objectId", currentCourse.id);
			Course.get(currentCourse.id, {
				success: function (CourseU) {
					CourseU.set("Name", currentCourse.name);
					var hole = [];
					for (var i = 0; i < 18; i++) { 
						hole[i] = {
							HoleIndex: i, 
							Par: currentCourse.holes[i].Par, 
							StrokeIndex: currentCourse.holes[i].StrokeIndex, 
							Lat: Number(currentCourse.holes[i].Lat), 
							Long: Number(currentCourse.holes[i].Long)
						};
						currentCourse.holes[i] = hole[i];
					};
					CourseU.set("Holes", currentCourse.holes);
					CourseU.save();		
				}
			});
		}

		// Controller function to delete a course from the database
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

		// Controller function to create a new user
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
		
		// Controller function to sign in
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

		// Controller function to logout
		this.logOut = function(details){
			Parse.User.logOut();
			var currentUser = Parse.User.current();
			window.location.reload(false); 
		}
		
		// Controller function to display a map for the selected course and the selected hole
		this.showMap = function(i, currentCourse, lat, lon) {
			var zoomLevel = 18;
			var drawPin = true;
			if (lat == 0 || lon == 0)
			{
				// if there's not coordinates saved yet - then let's see if there's any from the previous hole
				// first set up some default values
				lat = 54;
				lon = -2;
				zoomLevel = 5;
				drawPin = false;
				
				// Only checking previous holes if this isn't the first hole
				if (i != 0) {
					// if the previous hole has non-default values - then lets use them
					if (currentCourse.holes[i-1].Lat != 0 && currentCourse.holes[i-1].Long != 0) {
						lat = currentCourse.holes[i-1].Lat;
						lon = currentCourse.holes[i-1].Long;
						// and zoom out a bit too
						zoomLevel = 17;
					}
				}	
			}
			
			var myCenter=new google.maps.LatLng(lat,lon);  //centre the map on the lat, lon
			
			// Set the default map properties = centred on the hole, zoomed to the right level, and a satellite view
			var mapProp = {
				center: myCenter,
				zoom: zoomLevel,
				mapTypeId: google.maps.MapTypeId.SATELLITE
			};

			// if there is no map defined then we need to create one - but lets avoid creating more than one for the same hole
			if (currentCourse.maps[i]===undefined) {	
				// Each map needs a unique ref, so use the name googleMap + course object id + hole number
				currentCourse.maps[i] = new google.maps.Map(document.getElementById("googleMap" + currentCourse.id + i), mapProp);
				// Drop a marker at the hole location
				if (drawPin) {
					drawMarker(currentCourse, i, lat, lon);
				}

				// Register a listener for a click event - if the map is clicked then we'll put a marker at that location
				google.maps.event.addListener(currentCourse.maps[i],'click',function(e) {
					$scope.$apply(function(){
						currentCourse.holes[i].Lat = Math.round(e.latLng.lat() * 1000000) / 1000000;
						currentCourse.holes[i].Long = Math.round(e.latLng.lng() * 1000000) / 1000000;
						drawMarker(currentCourse, i, currentCourse.holes[i].Lat, currentCourse.holes[i].Long);
					});
				});
			}
		}	
	});
})();