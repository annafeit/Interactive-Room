
	
//offset from the externals/katajs/ back to the root dir
var kata_base_offset = "../../"; 
Kata.WEB_WORKERS_ENABLED = false;		

var driver="XML3D";
var avatarScale= 1;
var avatarURL = "static/meshes/avatar.xml3d";
//use as initial mesh for the world when connecting to server
var world = "static/meshes/staticWorld.xml3d";
var address;
var username;
var SpaceURL = "sirikata://" + window.location.hostname + ":7777"; //TODO do I need that??

function init(){			
	 $("#all").hide();	 	 						
};

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
function connect(address, mesh, name){          	            	
	if (name != null && address != null && name != ""){ 
		
		
		this.address= address;
		this.username = name;
		
		$("#loginButton").attr("disabled", true);
		
	  	Kata.require([
	  		   		'katajs/oh/MainThread.js',	//need that to create MainThread object
	  		   		'katajs/oh/plugins/sirikata/SirikataSpaceConnection.js',	//to use the sirikata://... protocol
	  		   		'katajs/oh/GraphicsSimulation.js',
	  		   		'katajs/gfx/xml3dgfx.js'
	    ], function(){
	  		loadGFX();
	  		$("#all").show();
	  		$("#connection").hide();
	  		}
	  	);
	}	
	else{
		alert("Fill in server-address and username!")
	}
} 

function graphicsReady() {
	var scriptArgs ={
			space: SpaceURL,
			username: this.username,
			//loc: {scale:[0,0,0,this.avatarScale]},
			visual: {mesh:avatarURL},			
			//level: this.world,
			//avatar: this.avatarURL
	}	
	
	try{     
   	
   		window.kata = new Kata.MainThread(
   			kata_base_offset + "scripts/UserScript.js", 
   			"User.UserScript", scriptArgs
   		);			   			
			graphics = new Kata.GraphicsSimulation(driver, window.kata.getChannel(), document.getElementById("room"));                         		   		 	
   }
   catch(err){
   	alert(err);
   	$("#loginButton").attr("disabled", false)
   }   
}

function loadGFX(){
	Kata.GraphicsSimulation.initializeDriver(driver,null, graphicsReady);	//null -> es wird am Anfang keine "Welt" geladen, die nicht in einem OH ist sondern nur angezeigt wird. 		  
}




