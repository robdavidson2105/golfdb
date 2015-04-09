function drawMarker($scope, currentCourse, holeIndex, waypointIndex, lat, lon, description) {	
	if (currentCourse.markers[holeIndex] != undefined) {
		if (currentCourse.markers[holeIndex].waypoints[waypointIndex] != undefined) {
			currentCourse.markers[holeIndex].waypoints[waypointIndex].setMap(null);
			currentCourse.markers[holeIndex].waypoints[waypointIndex] = null;
		}
	} else {currentCourse.markers[holeIndex] = {}; currentCourse.markers[holeIndex].waypoints = {};}

 	currentCourse.markers[holeIndex].waypoints[waypointIndex] = new google.maps.Marker({
		position: {lat: Number(lat), lng: Number(lon)},
  		map: currentCourse.maps[holeIndex],
		draggable: true,
		title: description
		});
		var infowindow = new google.maps.InfoWindow({
		      content: description
		});
		infowindow.open(currentCourse.maps[holeIndex], currentCourse.markers[holeIndex].waypoints[waypointIndex]);

		google.maps.event.addListener(currentCourse.markers[holeIndex].waypoints[waypointIndex], 
			'dragend', 
			function(e) {	
				$scope.$apply(function($scope) {
					if ($scope.courseCtrl.editMaps) {
						currentCourse.holes[holeIndex].Waypoints[waypointIndex].Lat = Math.round(e.latLng.lat() * 1000000) / 1000000;
						currentCourse.holes[holeIndex].Waypoints[waypointIndex].Lon = Math.round(e.latLng.lng() * 1000000) / 1000000;
						drawMarker($scope, currentCourse, holeIndex, waypointIndex, e.latLng.lat(), e.latLng.lng(),
						currentCourse.holes[holeIndex].Waypoints[waypointIndex].Description);
					} else {
						drawMarker($scope, currentCourse, holeIndex, waypointIndex, 
							currentCourse.holes[holeIndex].Waypoints[waypointIndex].Lat, 
							currentCourse.holes[holeIndex].Waypoints[waypointIndex].Lon, 
							currentCourse.holes[holeIndex].Waypoints[waypointIndex].Description);
					}
					});
				});
					
	}

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
											markers: {waypoints: []}
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
				hole[i] = {HoleIndex: i, Par: 4, StrokeIndex: 0, Waypoints:[{Description: "Green", Lat: 0,Lon: 0}]};
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
					CourseU.set("Holes", angular.copy(currentCourse.holes));   // Use angular.copy to remove hashkeys from json
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
		
		// Controller function to centre the map on the last hole
		// this is useful when mapping a new course
		this.centreMap = function(i, currentCourse) {
			// Get the coords of the last hole's first waypoint
			lat = Number(currentCourse.holes[i-1].Waypoints[0].Lat);
			lon = Number(currentCourse.holes[i-1].Waypoints[0].Lon);
			// Make this hole's first waypoint the same as the last one
			currentCourse.holes[i].Waypoints[0].Lat = lat;
			currentCourse.holes[i].Waypoints[0].Lon = lon;
			// Centre both the map and the first waypoint on these new coords
			var myCenter=new google.maps.LatLng(lat,lon);
			currentCourse.maps[i].setCenter(myCenter);
			currentCourse.markers[i].waypoints[0].setPosition(myCenter);
		}

		// Controller function to logout
		this.logOut = function(details){
			Parse.User.logOut();
			var currentUser = Parse.User.current();
			window.location.reload(false); 
		}
		
		this.updateWaypointDescription = function(holeIndex, waypointIndex, currentCourse) {
			currentCourse.markers[holeIndex].waypoints[waypointIndex].setTitle(currentCourse.holes[holeIndex].Waypoints[waypointIndex].Description);
		}
		
		this.showMaps = function(currentCourse) {
			console.log("Show maps");
			for (var i = 0; i < 18; i++) {
				this.showMap(i, currentCourse);
			}
		}
		
		// Controller function to display a map for the selected course and the selected hole
		this.showMap = function(i, currentCourse) {
			var zoomLevel = 17;
			var lat = Number(currentCourse.holes[i].Waypoints[0].Lat);
			var lon = Number(currentCourse.holes[i].Waypoints[0].Lon);
	
			if (lat == 0 || lon == 0)
			{
				// if there's not coordinates saved yet - then let's see if there's any from the previous hole
				// first set up some default values
				lat = 54;
				lon = -2;
				zoomLevel = 5;
				
				// Only checking previous holes if this isn't the first hole
				if (i != 0) {
					// if the previous hole has non-default values - then lets use them
					if (Number(currentCourse.holes[i-1].Waypoints[0].Lat) != 0 && Number(currentCourse.holes[i-1].Waypoints[0].Lon) != 0) {
						lat = Number(currentCourse.holes[i-1].Waypoints[0].Lat);
						lon = Number(currentCourse.holes[i-1].Waypoints[0].Lon);
						// and zoom out a bit too
						zoomLevel = 16;
					}
				}
				currentCourse.holes[i].Waypoints[0].Lat = lat;
				currentCourse.holes[i].Waypoints[0].Lon = lon;	
			}
			
			var myCenter=new google.maps.LatLng(lat,lon);  //centre the map on the lat, lon
			//console.log("Map " + i + " centre: " + lat + "," + lon);
			
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
				var numberOfWaypoints = currentCourse.holes[i].Waypoints.length;
				for (var n = 0; n < numberOfWaypoints; n++ ) {

					drawMarker(
						$scope, 
						currentCourse, 
						i, 
						n, 
						Number(currentCourse.holes[i].Waypoints[n].Lat), 
						Number(currentCourse.holes[i].Waypoints[n].Lon), 
						currentCourse.holes[i].Waypoints[n].Description
					);
				}
				// A bug with google maps means that maps which are initially hidden don't draw correctly
				// this workaround triggers a resize to redraw the map
				// The bug shifts the centre of the map - so we have to re-centre once re-drawn
				google.maps.event.addListenerOnce(currentCourse.maps[i], 'idle', function() {
				   google.maps.event.trigger(currentCourse.maps[i], 'resize');
				   currentCourse.maps[i].setCenter(myCenter);
				   //console.log("Map " + i + " centre (callback): " + currentCourse.maps[i].getCenter().toString());
				});
			}
		}
		
		// Controller function to delete one of the waypoints on a hole
		this.deleteWaypoint = function(holeIndex, waypointIndex, currentCourse) {
			// Use splice to delete the details in the array - and shift all the following array entries down
			currentCourse.holes[holeIndex].Waypoints.splice(waypointIndex,1);
			// Now check if we have a marker drawn on the map
			if (currentCourse.markers[holeIndex] != undefined) {
				// If there is a marker then remove it from the map
				if (currentCourse.markers[holeIndex].waypoints[waypointIndex] != undefined) {
					currentCourse.markers[holeIndex].waypoints[waypointIndex].setMap(null);
					currentCourse.markers[holeIndex].waypoints[waypointIndex] = null;
				}
			}
		}
		
		// Controller function to create a new waypoint
		this.addWaypoint = function(holeIndex, currentCourse) {
			this.showMap(holeIndex, currentCourse);
			var mapCentre = currentCourse.maps[holeIndex].getCenter();
			var lat = Math.round(mapCentre.lat() * 1000000) / 1000000;
			var lon = Math.round(mapCentre.lng() * 1000000) / 1000000;
			currentCourse.holes[holeIndex].Waypoints.push({
				Description: "New Waypoint",
				Lat: lat,
				Lon: lon
			});
			drawMarker(
				$scope, 
				currentCourse, 
				holeIndex, 
				(currentCourse.holes[holeIndex].Waypoints.length - 1), 
				lat, 
				lon, 
				"New Waypoint"
			);
		}	
	});
})();