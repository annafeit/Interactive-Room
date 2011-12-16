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
					alert(data);
					$('#overlayRegister').hide();
					//show newly registered user name in login window
					$("#username").val(username);
					//clear input fields
					$("#newUsername").val("");
					$("#newPassword").val("");
					$("#newPasswordConf").val("");
				})
	});
	$("#flogin").submit(function(event){
		/* stop form from submitting normally */
	    event.preventDefault();
	    
		var username = $("#username").val();
	    var password = $("#password").val();	    
	    var serverAddress = $("#server-address").val();
	    
		if(this.username == "" ||password == "" ||this.serverAddress == "" ){
			alert("Fill in username, password and server address!");
			return;
		}
		$.post('scripts/login.php', {username: username, password: password}, 
				function(data, jqxhr){	
					if (data[0]){
						$.post('scripts/updateOnlineStatus.php', {username: username, online: "1"}, 
								function(){	
								});
						//preserve username and server address
						window.name= serverAddress  + " " + username;
						document.location.href='mainMenu.xhtml';						
					}
					else{
						alert("wrong username or password");						
					}					
				},'json');
	});
			
}
function initMainMenu(){
	
	$("#logoutButton").click(function(){
		$.post('scripts/updateOnlineStatus.php', {username: username, online: "0"}, 
				function(){
					window.name="";
					document.location.href='index.xhtml';					
				});
	});
	
	/*****	Room Navigation Menu	*****/
	$("#chooseRoom").click(function(){
		if ($("#chooseRoom").hasClass("squareButtonClicked")){
			$("#chooseRoom").removeClass("squareButtonClicked");
			$("#editRoom").hide();
			$("#previewAndButton").hide();	
		}
		else{
			$("#chooseRoom").addClass("squareButtonClicked");			
			$("#newRoom").removeClass("squareButtonClicked");
			$("#friendRoom").removeClass("squareButtonClicked");
			$("#chooseNewRoom").hide();
			$("#editSharedRooms").hide();
			$("#editRoom").show();
			$("#previewAndButton").hide();
			
			//fill my-rooms- table
			$.post('scripts/fillRoomTable.php', {username:username}, 
					function(data, jqxhr){	
						//replace table body by empty body
						var body = $("#roomTable tbody")[0];
						var newBody = $("<tbody> </tbody>")[0];
						$(body).replaceWith(newBody);
						
						for (var i=0;i<data.length;i++){
							var o = data[i];
							var a = $("<tr class='row' onclick='roomTableRowClicked(this)' ><td>"+o.title+"</td> <td>"+o.lastUpdate+"</td></tr>")[0];
							$("#roomTable tbody").append(a);
							a.setAttribute("preview", data[i].preview);
							a.setAttribute("id", data[i].id);
							a.setAttribute("mesh", data[i].mesh);					
						}				
					},'json');			
		}
	});
	
	$("#friendRoom").click(function(){
		if ($("#friendRoom").hasClass("squareButtonClicked")){
			$("#friendRoom").removeClass("squareButtonClicked");	
			$("#editSharedRooms").hide();
			$("#previewAndButton").hide();
			$("#previewAndButtonSearch").hide();
		}
		else{
			$("#friendRoom").addClass("squareButtonClicked");				
			$("#newRoom").removeClass("squareButtonClicked");
			$("#chooseRoom").removeClass("squareButtonClicked");
			$("#chooseNewRoom").hide();
			$("#editRoom").hide();
			$("#editSharedRooms").show();
			$("#editSharedRoomsButtons").show("blind", 00);
			$("#previewAndButton").hide();	
			$("#previewAndButtonSearch").hide();	
		}
	});
	
	$("#newRoom").click(function(){
		if ($("#newRoom").hasClass("squareButtonClicked")){
			$("#newRoom").removeClass("squareButtonClicked");
			$("#chooseNewRoom").hide();
			$("#previewAndButton").hide();	
		}
		else{
			$("#newRoom").addClass("squareButtonClicked");			
			$("#chooseRoom").removeClass("squareButtonClicked");				
			$("#friendRoom").removeClass("squareButtonClicked");
			$("#chooseNewRoom").show();	
			$("#editSharedRooms").hide();
			$("#editRoom").hide();
			$("#previewAndButton").hide();
		}
	});
	/**navigation Menu of "shared Rooms"**/	
	$("#newOtherRoomsButton").click(function(){
		$("#myRooms").hide(); 
		$("#otherRooms").hide();
		$("#visitNewRoom").show();
		$("#previewAndButton").hide();
		$(this).addClass("sharedRoomsButtonActive");
		$("#myRoomsButton").removeClass("sharedRoomsButtonActive ");
		$("#otherRoomsButton").removeClass("sharedRoomsButtonActive");
	});
	

	var username = window.name.split(" ")[1];
	
	
	$("#myRoomsButton").click(function(){
		$("#myRooms").show(); 
		$("#otherRooms").hide();
		$("#visitNewRoom").hide();
		$("#previewAndButton").hide();
		$(this).addClass("sharedRoomsButtonActive");
		$("#otherRoomsButton").removeClass("sharedRoomsButtonActive");
		$("#newOtherRoomsButton").removeClass("sharedRoomsButtonActive");		
		
		//fill my-visitors-room-table
		$.post('scripts/fillMyVisitorsTable.php', {username:username}, 
				function(data, jqxhr){	
					//replace table body by empty body
					var body = $("#myRoomListTable tbody")[0];
					var newBody = $("<tbody> </tbody>")[0];
					$(body).replaceWith(newBody);
			
					for (var i=0;i<data.length;i++){
						var o = data[i];
						var button="permissionButton"+i;
						var a = $("<tr class='row' onclick='roomTableRowClicked(this)'>" +
										"<td>"+o.title+"</td>" +
										"<td>"+ o.visitor + "</td>" +
										"<td> <button id='"+button+"' class='permissionButton' onclick='changePermission(this);'> </button> </td>" +
									"</tr>")[0];
						$("#myRoomListTable tbody").append(a);
						a.setAttribute("preview", data[i].preview);
						a.setAttribute("id", data[i].id);
						a.setAttribute("mesh", data[i].mesh);
						a.setAttribute("visitor", data[i].visitor);					
						if(o.permission == 1){
							
							$("#"+button).addClass("permissionButtonTrue");
							$("#"+button).text("permission");
						}
						else{
							$("#"+button).addClass("permissionButtonFalse");
							$("#"+button).text("no permission");
						}
					}				
				},'json');
	});
	
	
	$("#otherRoomsButton").click(function(){
		$("#myRooms").hide(); 
		$("#otherRooms").show();
		$("#visitNewRoom").hide();
		$("#previewAndButton").hide();
		$("#searchMessage").text("");
		$("#userNotOnline").hide();
		$(this).addClass("sharedRoomsButtonActive");
		$("#myRoomsButton").removeClass("sharedRoomsButtonActive");
		$("#newOtherRoomsButton").removeClass("sharedRoomsButtonActive");		
	
		//fill rooms-I-visit-table
		$.post('scripts/fillVisitTable.php', {username:username}, 
				function(data, jqxhr){
					//replace table body by empty body
					var body = $("#otherRoomListTable tbody")[0];
					var newBody = $("<tbody> </tbody>")[0];
					$(body).replaceWith(newBody);
					
					for (var i=0;i<data.length;i++){
						var o = data[i];
						var perm;
						if (o.permission == 1) perm = "YES";
						else perm = "NO";
						var a = $("<tr class='row' onclick='roomTableRowClicked(this)'>" +
										"<td>"+o.owner+"</td>" +
										"<td>"+ o.title + "</td>" +
										"<td>"+ o.lastUpdate + "</td>" +
										"<td >"+ perm + "</td>" +
									"</tr>")[0];
						$("#otherRoomListTable tbody").append(a);
						a.setAttribute("preview", data[i].preview);
						a.setAttribute("id", data[i].id);
						a.setAttribute("mesh", data[i].mesh);
						a.setAttribute("owner", data[i].owner);
						a.setAttribute("permission", data[i].permission);						
					}				
				},'json');
	});
	
	
	//search for rooms of other users
	$("#fsearchRoom").submit(function(event){
		/* stop form from submitting normally */
	    event.preventDefault();
	    
		var owner = $("#usernameSearch").val();	    
		if(this.username == "" ){
			alert("Fill in a username");
			return;
		}
		$("#searchMessage").text("");
		$("#visitNewRoomListTable").hide();
		$("#previewAndButtonSearch").hide();
		
		$.post('scripts/searchRoomByUser.php', {owner: owner, username:username}, 
				function(data, jqxhr){	
					//replace body of table by empty body
					var body = $("#visitNewRoomListTable tbody")[0];
					var newBody = $("<tbody> </tbody>")[0];
					$(body).replaceWith(newBody);
					if (data[0]){
						for (var i=0;i<data.length;i++){
							var o = data[i];						
							var a = $("<tr class='row' onclick='searchRoomTableRowClicked(this)'>" +
											"<td>"+ o.title + "</td>" +
											"<td>"+ o.lastUpdate + "</td>" +
										"</tr>")[0];
							$("#visitNewRoomListTable tbody").append(a);
							a.setAttribute("preview", data[i].preview);
							a.setAttribute("id", data[i].id);
							a.setAttribute("owner", data[i].owner);
							a.setAttribute("mesh", data[i].mesh);														
						}
						$("#visitNewRoomListTable").show();
					}
					else{
						$("#searchMessage").text("This user has no rooms or you've already visited them all")
					}					
				},'json');
		
	});
	
	$("#askPermissionButton").click(function(){				
		var roomId = window.name.split(" ")[3]; 
		$.post('scripts/askPermission.php', {visitor: username, roomId: roomId},
				function(data){
					console.log(data);
					$("#usernameSearch").val("");  
					$("#visitNewRoomListTable").hide();
					$("#previewAndButtonSearch").hide();
					$("#otherRoomsButton").trigger("click");
				});
	})
	

}

function changePermission(obj){
	var newValue;
	if($(obj).hasClass("permissionButtonTrue")){
		$(obj).removeClass("permissionButtonTrue");
		$(obj).addClass("permissionButtonFalse");	
		$(obj).text("no permission");
		newValue = 0;
	}
	else{
		$(obj).addClass("permissionButtonTrue");
		$(obj).removeClass("permissionButtonFalse");
		$(obj).text("permission");
		newValue = 1;
	}
	var tr = $(obj).parent().parent();
	var id=tr.attr("id");
	var visitor=tr.attr("visitor");
	$.post('scripts/changePermission.php', {roomId:id, visitor:visitor,permission: newValue},
			function(data,jqxhr){
				
			});
					
}

function searchRoomTableRowClicked(obj){
	//change style
	var rows = document.getElementsByTagName("tr");
	for(var i=0;i<rows.length;i++){
		$(rows[i]).removeClass("rowActive");
	}
	$(obj).addClass("rowActive");
	
	//load preview
	$("#previewAndButtonSearch").show();
	document.getElementById("editRoomButton").style.visibility="visible";
	var url = "url(../"+obj.getAttribute("preview")+")";
	var div = document.getElementById("askRoomPreview");
	div.style.backgroundImage = url;
	
	var name = window.name.split(" ");
	window.name = name[0] + " "+ name[1] +" "+ obj.getAttribute("mesh") + " " + obj.getAttribute("id") + ' '+'owner';		
}

function roomTableRowClicked(obj){
	//change style
	var rows = document.getElementsByTagName("tr");
	for(var i=0;i<rows.length;i++){
		$(rows[i]).removeClass("rowActive");
	}
	$(obj).addClass("rowActive");
	
	//load preview
	$("#previewAndButton").show();
	document.getElementById("editRoomButton").style.visibility="visible";
	var url = "url(../"+obj.getAttribute("preview")+")";
	var div = document.getElementById("roomPreview");
	div.style.backgroundImage = url;
	
	var name = window.name.split(" ");
	window.name = name[0] + " "+ name[1] +" "+ obj.getAttribute("mesh") + " " + obj.getAttribute("id") + ' '+'owner';
	
	if(obj.hasAttribute("permission")){
		if(obj.getAttribute("permission") == "0"){
			document.getElementById("editRoomButton").style.visibility="hidden";
		}
		var user = obj.getAttribute("owner");
		$.post('scripts/checkOnlineStatus.php', {username:user},
				function(data,jqxhr){
					if (!(data[0]))
						document.getElementById("editRoomButton").style.visibility="hidden";
						$("#userNotOnline").show();
				},'json');
	}
	
	
}

	
function initRoom(){

	$("#menu-type").accordion({
		autoHeight: false,
		navigation: true
	});				
	
	
	$("#furnitureBrowser").hide();
	
	$("#homeButton").click(function(){
		document.location.href='mainMenu.xhtml';
		
	});
	
	$("#logoutButton").click(function(){
		$.post('scripts/updateOnlineStatus.php', {username: username, online: "0"}, 
				function(){
					window.name="";
					document.location.href='index.xhtml';					
				});
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
				//empty furniturebrowser
				var list = document.getElementById("furnitureContentList");
				var furniture = document.getElementsByClassName("furniture");
				var k = furniture.length;
				for (var i = 0; i<k;i++){
					var p =furniture[0].parentElement;
					list.removeChild(p);
				}
				//fill furniture browser with previews
				var l = (data.length * liSize)+"px";				
				document.getElementById("furnitureContentList").style.width = l;
				for (var i=0;i<data.length;i++){
					$("#furnitureContentList").append("<li> <div class = 'browserContent furniture'/> </li>	");
				}
				var furniture = document.getElementsByClassName("furniture");
				
				for (i=0; i<data.length;i++){
					var url = "url(../"+data[i].preview+")";
					furniture[i].style.backgroundImage = url;
					furniture[i].setAttribute("preview", data[i].preview);
					furniture[i].setAttribute("id", data[i].id);
					furniture[i].setAttribute("name", data[i].name);
					furniture[i].setAttribute("type", data[i].type);
				}
				//initialize browser				
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
				
			},'json');
		
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
	var args = window.name.split(" ");	
	var name = $("#roomMesh").attr("name");
	var mesh ="static/meshes/" + name + ".xml3d";
	var preview = "static/preview/" + name + ".png"
	var username = args[1];
	var space = args[0];
	var title =  $("#title").val();
	//create database entry for new room of current user
	$.post('scripts/createRoom.php', {mesh: mesh, preview: preview, title: title, username: username}, 
			function(data, jqxhr){
				console.log("room creation: "+ data);
				var roomId = data[0];
				window.name = space + " " + username + " " + mesh + " " + roomId + ' '+'owner';
				document.location.href='room.xhtml';
			},'json');		
}


