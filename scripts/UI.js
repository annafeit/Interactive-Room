var user;

var imgURLs = new Array();
var imgs = new Array();

function initIndex(){
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
					$('#overlayRegister').hide();
					user = username;
					alert(data);
				})
	});
	$("#flogin").submit(function(event){
		/* stop form from submitting normally */
	    event.preventDefault(); 
		this.username = $("#username").val();
	    var password = $("#password").val();
	    this.serverAddress = $("#server-address").val();
		if(this.username == "" ||password == "" ||this.serverAddress == "" ){
			alert("Fill in username, password and server address!");
			return;
		}
		//TODO check username and password in Database
		 document.location.href='mainMenu.xhtml';
	});
			
}
function initMainMenu(){
	/*****	Room Navigation Menu	*****/
	$("#chooseRoom").click(function(){
		if ($("#chooseRoom").hasClass("squareButtonClicked")){
			$("#chooseRoom").removeClass("squareButtonClicked");
		}
		else{
			$("#chooseRoom").addClass("squareButtonClicked");			
			$("#newRoom").removeClass("squareButtonClicked");
			$("#friendRoom").removeClass("squareButtonClicked");
		}
	});
	
	$("#newRoom").click(function(){
		if ($("#newRoom").hasClass("squareButtonClicked")){
			$("#newRoom").removeClass("squareButtonClicked");
			$("#chooseNewRoom").hide();
		}
		else{
			$("#newRoom").addClass("squareButtonClicked");			
			$("#chooseRoom").removeClass("squareButtonClicked");				
			$("#friendRoom").removeClass("squareButtonClicked");
			$("#chooseNewRoom").show();				
		}
	});
	
	$("#friendRoom").click(function(){
		if ($("#friendRoom").hasClass("squareButtonClicked")){
			$("#friendRoom").removeClass("squareButtonClicked");
		}
		else{
			$("#friendRoom").addClass("squareButtonClicked");				
			$("#newRoom").removeClass("squareButtonClicked");
			$("#chooseRoom").removeClass("squareButtonClicked");
		}
	});
}
function initRoom(){

	$("#menu-type").accordion({
		autoHeight: false,
		navigation: true
	});				
	
	/*var l = "1040px";
	document.getElementById("furnitureContentList").style.width = l;
	for (i=0;i<8;i++){
		$("#furnitureContentList").append("<li> <div class = 'browserContent furniture'/> </li>	");
	}*/
	
	
	
	
	
	$("#furnitureBrowser").hide();
	
	$("#homeButton").click(function(){
		//TODO save room configuration
		
	});
	
	$("#logoutButton").click(function(){
		//TODO save room configuration		
	});
}

$(document).ready(		
	function() {	
		/**preload images**/
		//urls for images to preload
		imgURLs[0] = "../static/icons/cam.png";
		imgURLs[1] = "../static/icons/camActive.png";
		imgURLs[2] = "../static/icons/home.png";
		imgURLs[3] = "../static/icons/homeActive.png";
		imgURLs[4] = "../static/icons/list.png";
		imgURLs[5] = "../static/icons/listActive.png";
		imgURLs[6] = "../static/icons/logout.png";
		imgURLs[7] = "../static/icons/logoutActive.png";
		imgURLs[8] = "../static/icons/next.png";
		imgURLs[9] = "../static/icons/nextActive.png";
		imgURLs[10] = "../static/icons/prev.png";
		imgURLs[11] = "../static/icons/prevActive.png";

		//preload images
		for (i = 0; i<imgURLs.length; i++){
			imgs[i] = new Image();
			imgs[i].src = imgURLs[i];
		}
		
	}
);
	


var clickedCategory;
//size of one item in furniture browser
const liSize = 130;

function categoryClicked(element){
	//style
	if (clickedCategory){
		clickedCategory.style.color = "#460000";
	}
	element.style.color="#c93c00";
	clickedCategory = element;
	
	//functionality: "id" of parent-div + attribute "table" defines the furniture group in the database
	var p1 = element.parentElement.id;
	var p2 = element.getAttribute("table");
	var group = p1 + p2;
	//returns the preview url of the furnitures in "group"
	$.post('scripts/loadFurniture.php', {name:group}, 
			function(data, jqxhr){	
				//fill furniture browser with previews
				var l = (data.length * liSize)+"px";
				
				document.getElementById("furnitureContentList").style.width = l;
				for (i in data){
					$("#furnitureContentList").append("<li> <div class = 'browserContent furniture'/> </li>	");
				}
				var furniture = document.getElementsByClassName("furniture");
				
				for (i=0; i<furniture.length;i++){
					var url = "url(../static/preview/"+data[i]+")";
					furniture[i].style.backgroundImage = url;
				}
								
				$('#furnitureContent').serialScroll({
					items:'li',
					prev:'#furnitureBrowser #prev',
					next:'#furnitureBrowser #next',
					offset:-30, //when scrolling to object, stop 30 before reaching it (from the left)
					//start:1, //as we are centering it, start at the 2nd
					duration:1200,
					step: 2, //scroll 2 elements each time
					force:true,
					stop:true,
					lock:false,
					cycle:false, //don't pull back once you reach the end
					exclude:5 //to prevent scrolling further than to the last element
				});
				
				$("#furnitureBrowser").show();
				
				if(data.length<7){
					$("#prev").hide();
					$("#next").hide();
				}
				else{
					$("#prev").show();
					$("#next").show();
				}
				
			},'json')
	
	
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
	//TODO create a new entry in 'room' and 'owns' table
	var name = $("#roomMesh").attr("name");
	var url="../static/meshes/" + name + ".xml3d";
	document.location.href='room.xhtml';
	connect(this.serverAddress, url, this.username);
}


