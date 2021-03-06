//offset from the externals/katajs/ back to the root dir
var kata_base_offset = "../../"; 
Kata.WEB_WORKERS_ENABLED = false;		

var driver="XML3D";
var avatarScale= 1;
var avatarURL = "static/meshes/avatar.xml3d";
//use as initial mesh for the world when connecting to server
var address;
var username;
var world;
var db;
var SpaceURL = "sirikata://" + "localhost" + ":7777"; 



//To connect to the server we do:
//1. Create MainThread, which
//2. Creates ObjectHostWorker, which
//3. Starts ObjectHost, which
//4. Creates first HostedObject (invisible user(<avatar/>), which
//5. Loads it's script (UserScript.js), which
//6. Controls the application
//To send message to this script one should use 
//windows.kata.getChannel(), which is connected to the
//ObjectHost, which sends all messages to the first object's 
//script User.js). In this way, the core of the 
//application is the first object's script(the user).
function connect(address, mesh, name, roomId){          	            	


		this.address= SpaceURL;
		this.username = name;
		this.world = mesh;
		this.roomId = roomId;

		$("#loginButton").attr("disabled", true);

	  	Kata.require([
	  		   		'katajs/oh/MainThread.js',	//need that to create MainThread object
	  		   		'katajs/oh/plugins/sirikata/SirikataSpaceConnection.js',	//to use the sirikata://... protocol
	  		   		'katajs/oh/GraphicsSimulation.js',	//the first hosted object always communicates with graphics
	  		   		'katajs/gfx/xml3dgfx.js'
	    ], function(){
	  		loadGFX();
	  		}
	  	);
} 

function graphicsReady() {
	var scriptArgs ={
			space: this.address,
			username: this.username,	
			roomId: this.roomId,
			visual: {mesh:avatarURL},		
			world: this.world,
			loc:{scale: "1.0"},	//just to match the code..
	}	

	try{     
   	
   		window.kata = new Kata.MainThread(
   			kata_base_offset + "scripts/UserScript.js", 
   			"User", scriptArgs
   		);			   			
			graphics = new Kata.GraphicsSimulation(driver, window.kata.getChannel(), document.getElementById("room"));
			//chats = new ChatUI(window.kata.getChannel(), this.username, 300);
			//chats.create("Chat");
   }
   catch(err){
   	alert(err);
   	$("#loginButton").attr("disabled", false)
   }   
}

function loadGFX(){
	Kata.GraphicsSimulation.initializeDriver(driver,"static/meshes/scene.xml3d", graphicsReady); 		  
}

function connectVisitor(address, name, mesh){
	this.address = SpaceURL;
	this.username = name;
	this.world = mesh;

	$("#loginButton").attr("disabled", true);

  	Kata.require([
  		   		'katajs/oh/MainThread.js',	//need that to create MainThread object
  		   		'katajs/oh/plugins/sirikata/SirikataSpaceConnection.js',	//to use the sirikata://... protocol
  		   		'katajs/oh/GraphicsSimulation.js',	//the first hosted object always communicates with graphics
  		   		'katajs/gfx/xml3dgfx.js'  		   		
    ], function(){
  		loadGFXVisitor();
  		}
  	);
}

function graphicsReadyVisitor() {
	var scriptArgs ={
			space: this.address,
			username: this.username,
			world: this.world,
			visual: {mesh:avatarURL},					
			loc:{scale: "1.0"},	//just to match the code..

	}	

	try{     
   	
   		window.kata = new Kata.MainThread(
   			kata_base_offset + "scripts/VisitorScript.js", 
   			"Visitor", scriptArgs
   		);			   			
			graphics = new Kata.GraphicsSimulation(driver, window.kata.getChannel(), document.getElementById("room"));
			//chats = new ChatUI(window.kata.getChannel(), this.username, 300);
			//chats.create("Chat");
   }
   catch(err){
   	alert(err);
   	$("#loginButton").attr("disabled", false)
   }   
}

function loadGFXVisitor(){
	Kata.GraphicsSimulation.initializeDriver(driver, "static/meshes/scene.xml3d", graphicsReadyVisitor);	 		  
}

