var user;

$(document).ready(		
	function() {
		//arguments of openDatabase: the Database, the version, a display name 
		//and an estimated size  (in bytes here: 1MB) of the data to be stored in the database
		database = openDatabase("DBInteractiveRoom" , "", "the Room Designer database", 1048576);	 
		if(!database){
			throw new Error("Database connection failed");
		}
		
		$("#menu-type").accordion({
			autoHeight: false,
			navigation: true
		});				
		
		/*****	Room Navigation Menu	*****/
		$("#chooseRoom").click(function(){
			if ($("#chooseRoom").hasClass("choosingRoomClicked")){
				$("#chooseRoom").removeClass("choosingRoomClicked");
			}
			else{
				$("#chooseRoom").addClass("choosingRoomClicked");			
				$("#newRoom").removeClass("choosingRoomClicked");
				$("#friendRoom").removeClass("choosingRoomClicked");
			}
		});
		
		$("#newRoom").click(function(){
			if ($("#newRoom").hasClass("choosingRoomClicked")){
				$("#newRoom").removeClass("choosingRoomClicked");
				$("#chooseNewRoom").hide();
			}
			else{
				$("#newRoom").addClass("choosingRoomClicked");			
				$("#chooseRoom").removeClass("choosingRoomClicked");				
				$("#friendRoom").removeClass("choosingRoomClicked");
				$("#chooseNewRoom").show();				
			}
		});
		
		$("#friendRoom").click(function(){
			if ($("#friendRoom").hasClass("choosingRoomClicked")){
				$("#friendRoom").removeClass("choosingRoomClicked");
			}
			else{
				$("#friendRoom").addClass("choosingRoomClicked");				
				$("#newRoom").removeClass("choosingRoomClicked");
				$("#chooseRoom").removeClass("choosingRoomClicked");
			}
		});
			
		/** register Form handling**/
		$("#fregister").submit(function(event){
			/* stop form from submitting normally */
		    event.preventDefault(); 
		    
		    var username = $("#newUsername").val();
		    var password = $("#newPassword").val();
		    var passwordConf = $("#newPasswordConf").val();
		    
		    if(username == null || password == null || passwordConf == null){
				alert("Fill in username and password and confirm password!")
				return;
			}			
		    if (password != passwordConf){
		    	alert("Password does not match confirmation!");
				return;
		    }
			$.post('scripts/register.php', {newUsername: username, newPassword: password}, 
					function(data, jqxhr){
						alert("done: "+ data);
						$('#overlayRegister').hide();
						user = username;
					})
		});
		$("#flogin").submit(function(event){
			/* stop form from submitting normally */
		    event.preventDefault(); 
			var username = $("#username").val();
		    var password = $("#password").val();
		    var serverAddress = $("#server-address").val();
			if(username == null ||password == null ||serverAddress == null ){
				alert("Fill in username, password and server address!");
				return;
			}
			$("#index").hide();
			$("#choose").show();
			
		});
		
		/** Test Scrollbar **/
		$('#furnitureContent').serialScroll({
			items:'li',
			prev:'#furnitureBrowser #prev',
			next:'#furnitureBrowser #next',
			offset:-30, //when scrolling to object, stop 105 before reaching it (from the left)
			start:1, //as we are centering it, start at the 2nd
			duration:800,
			force:true,
			stop:true,
			lock:false,
			cycle:false, //don't pull back once you reach the end			
		});
	}
);
	
		
function init(){			
	 $("#all").hide();
	 $("#choose").hide();	
}	


function categoryClicked(element){
	document.getElementById("menu-furniture").innerHTML = element.innerHTML;
}

/**
 * string s: the room (room1, room2...)
 */
function chooseNewRoom(name){	
	var url = "url(../static/preview/" + name + ".png)"
	document.getElementById("roomMesh").style.backgroundImage = url;
	$("#roomMesh").attr("name", name);  
	$("#overlay").show();  
}
/**
 * string title: the title of the room
 */
function createNewRoom(title){
	//TODO create a new entry in room and owns table
	var name = $("#roomMesh").attr("name");
	var url="../static/meshes/" + name + ".xml3d";
	connect($('#server-address').val(), url, $('#username').val());
}

function register(username, pwd, pwdRep){
	if(username == null || pwd == null || pwdRep == null){
		alert("Fill in username and password and confirm password!")
		return;
	}
	if(pwd != pwdRep){
		alert("Password does not match confirmation!");
		return;
	}
	database.transaction(
		function(tx){
			tx.executeSql("INSERT INTO user ('username', 'password') VALUES (?, ?)", 
					[username, pwd],
					//on succes do
					function(result){
						$('#index').hide(); 
						$('#choose').show();
					},
					//in case of error do
					function(tx, error){
						alert(error);
					})
		}
	);	
}
