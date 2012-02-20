var User={};

Kata.require([
	'katajs/oh/GraphicsScript.js',
	kata_base_offset + 'scripts/Utils.js',
	kata_base_offset + 'scripts/behavior/visit/Visit.js',
	kata_base_offset + 'scripts/behavior/chat/Chat.js',
	kata_base_offset + 'scripts/behavior/Camera.js'
], function() {
	/**
	* Simulate inheritance from GraphicsScript by defining a super variable
	* This is the first Object in the OH and therefore inherits from
	* GraphicsScript and not from Script!
	*/
	var SUPER = Kata.GraphicsScript.prototype;
	var space;
	/**
	* Constructor
	*/
	User = function(channel, args){
		//save the xml3d element
		var t = document.getElementsByTagName("xml3d");
		this.xml3d = t[0];		
		//save arguments
		this.username = args.username;
		this.space=args.space;
		this.roomId=args.roomId;
		this.roomMesh = args.world;		
		
		/**"camera" mode: moving camera by drag 
		 * "furniture" mode: moving furniture by drag and drop
		 */
		this.mode = "camera";
				
		//to store all furniture of the room
		this.furniture = new Array();
		this.furnitureLock = new Array();
		this.activeFurniture;
		this.loadedFurnitures = new Array();
		//the initiator of the current (furniture) mode
		this.initiator = null;
		
		this.shoppingListVisible = false;
		
		//call parent constructor
		SUPER.constructor.call(this, channel, args, function(){});
		
		//for sending messages
		this.visitBehavior = 
			new Kata.Behavior.Visit(
				this, "owner", this.cb	
			);
		
		this.mChatBehavior =
            new Kata.Behavior.Chat(
                args.name, this,
                Kata.bind(this.chatEnterEvent, this),
                Kata.bind(this.chatExitEvent, this),
                Kata.bind(this.chatMessageEvent, this)
            );
		
		//connect to the spaceServer with method 'connect' of parent's parent class
		//last argument must always be a callback (->Kata.bind), a method that's invoked upon completion
		this.connect(args, null, Kata.bind(this.connected, this));
	};
	/**
	* Simulate inheritance from GraphicsScript by extending the User class with the methods of the parent(SUPER) class
	*/
	Kata.extend(User, SUPER);
	
	
	/**
	* I think: This registers the "near" objects in this.mRemotePresences (with it's presence).
	* Then the script can use the presences to send messages to the hostedObjects via presence._sendHostedObjectMessage
	*/
    User.prototype.proxEvent = function(remote, added) {
        if (added){
        	Kata.warn("Camera Discover object.");
	        this.presence.subscribe(remote.id());
	        this.mOther = remote;
        }
        else{
        	Kata.warn("Camera wiped object");
        }
    };
     
    
	/**
	* Callback that is triggered when object is connected to the space
	*/
	User.prototype.connected = function(presence, space, reason){
		//handle connection failure
		if (presence == null){
		Kata.error('Failed to connect viewer to '+ space+'. Reason: ' + reason);
		throw reason;
		}
		
		//save world presence
		this.presence = presence;
		
		//display the object
		this.enableGraphicsViewport(presence,0);
		
		this.presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        this.presence.setQuery(0);
        
        //save the activeView
        var id = this.xml3d.activeView;
        this.camera = document.getElementById(id);
		        
		//create Room of user
		this.createRoom();
		
		var thus = this;
		//attach a handler for the click-event of all current AND future elements with class furniture
		$(".furniture").live("click",function(){thus.createFurniture(this, false)});
		$("#listButton").click(function(){			
			if(this.shopppingListVisible){
				this.shopppingListVisible = false;
				$("#shoppingList").hide();
				$("#shoppingList").empty();
			}
			else{
				for (var i = 0; i<thus.furniture.length; i++){
					var pic;
					var price;
					var name;
					$.post('scripts/getFurnitureInfo.php', {id: thus.furniture[i].furnitureId}, function(data, jqxhr){
						pic = data[0].preview;
						price = data[0].price;
						name  = data[0].name;
						$("#shoppingList").append("<div class='shoppingListEntry'> " +
								"					<div class='shoppingListPreview' style='background-image: url("+pic+");'/> " +
								"					<a class='shoppingListName'>" + name + "</a>" +
								"					<a class='shoppingListPrice'>" + price +"€"+ "</a>" +
								"				  </div>");
						 
					},'json');
				}
				this.shopppingListVisible = true;
				$("#shoppingList").show();
			}
		});
				
				
		
		document.userScript = this;				
	};
	
    /**
	* Creates the room, the user wants to login to
	*/
    User.prototype.createRoom = function(){
	    this.createObject(kata_base_offset + "scripts/RoomScript.js",
							"Room",
							{ space:this.space,
					    	  visual:{mesh:this.roomMesh},
					    	  roomId: this.roomId,
					    	  loc:{scale: "1.0"} //just to match the code..
							});	    
	    
	    
    }
    
    User.prototype.furnitureCreated = function(obj){    	
    	//only if object isn't already in DB (and now was recreated) 
	    if(!obj.inDB){
	    	//if object was not placed correctly from beginning, it's active and the application is in furniture-mode
	    	if(obj.active && (!obj.visitorControl)){
	    		this.changeMode(obj);
	    	}
	    	else{ if(obj.visitor && obj.active){
	    			this.handleChangeMode({mode:"furniture", groupId: obj.group.id}, this.visitBehavior.getVisitorFromId(obj.visitor));
	    		}
	    	
		    	//if it was placed correctly, it's not active and we can write it in the DB
		    	else{
					//get furniture position and orientation
					var pos = obj.getPosition();
					var or = obj.getOrientation();
					$.post('scripts/createFurniture.php', {furnitureId: obj.furnitureId, roomId: this.roomId, position: pos, orientation: or}, 
							function(data, jqxhr){
								obj.dbID = data[0];
							},'json');
				}
	    	}
	    }
    	
    }
        
    User.prototype.createFurniture = function(obj, inDB){ 
	    if(this.mode == "camera"){
	    	var prev = obj.getAttribute("preview");
	    	var id = obj.getAttribute("id");  
	    	var type = obj.getAttribute("type");   
	    	var name = obj.getAttribute("name");  
	    	var thus = this;
	    	$.post('scripts/getMeshFromFurniturePreview.php', {preview: prev}, 
	    			function(data, jqxhr){     				
	    				var url = kata_base_offset + data[0];
	    				//create new object in world   
	    		    	thus.createObject(kata_base_offset + "scripts/FurnitureScript.js",
	    		    			"Furniture",
	    		    			{ space:thus.space,    		    		
	    		    			  center: thus.center,
	    		    			  id:id,
	    		    			  visual:{mesh: url},
	    		    			  inDB:inDB,
	    		    			  type:type,
	    		    			  name:name,
	    		    			  loc:{scale: "1.0"} //just to match the code..
	    		    			});    		    	
	    			},'json');
	    }
    } 
    
    User.prototype.destroyFurniture = function(){
    	//TODO
    }
    
    /**
     * checks the database for furniture that are already in that room
     */
    User.prototype.fillRoom = function(){
    	var thus = this;
    	$.post('scripts/fillRoom.php', {roomId: this.roomId}, 
    			function(data, jqxhr){
    				console.log(data);
    				for (var i = 0;i<data.length;i++){
    					var obj = data[i];
    					var name = obj.name;
    					var url = kata_base_offset + obj.mesh;
    					var id = obj.id;
    					var type = obj.type;
    					var dbID = obj.entryId;
    					
    					var pos = obj.position.split(" ");
    					pos[0] = parseInt(pos[0]);
    					pos[1] = parseInt(pos[1]);
    					pos[2] = parseInt(pos[2]);
    					var or = obj.orientation.split(" ");
    					var orient = new Array();
    					orient[0] = parseInt(or[0]);
    					orient[1] = parseInt(or[1]);
    					orient[2] = parseInt(or[2]);
    					orient[3] = parseInt(or[3]);
    					
    					thus.createObject(kata_base_offset + "scripts/FurnitureScript.js",
        		    			"Furniture",
        		    			{ space:thus.space,
    							  position: pos,
    							  orientation: or,
        		    			  id:id,
        		    			  type: type,
        		    			  name:name,
        		    			  visual:{mesh: url},
        		    			  inDB: true,
        		    			  dbID: dbID,
        		    			  loc:{scale: "1.0"} //just to match the code..
        		    			});
    				}
    			},'json');    	
    }	
	

	
	

	/****
	 * 
	 * CHAT STUFF
	 * 
	 ****/
	User.prototype.createChatEvent = function(action, name, msg) {
        var evt = {
            action : action,
            name : name
        };
        if (msg)
            evt.msg = msg;
        return new Kata.ScriptProtocol.FromScript.GUIMessage("chat", evt);
    };
    User.prototype.chatEnterEvent = function(remote, name) {
        this._sendHostedObjectMessage(this.createChatEvent('enter', name));
        var remote_pres = this.getRemotePresence(remote);
        if (remote_pres) this.updateGFX(remote_pres);
    };
    User.prototype.chatExitEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('exit', name, msg));
    };
    User.prototype.chatMessageEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('say', name, msg));
    };
    
    User.prototype.handleChatGUIMessage = function(msg) {
        var revt = msg.event;
        this.mChatBehavior.chat(revt);
    };

	


	var lastClick = -Number.MAX_VALUE;
	var lastDragEvent;
	
		
	//Handle messages from GUI
	User.prototype._handleGUIMessage = function (channel, msg) {
		if (msg.msg == 'chat')
	            this.handleChatGUIMessage(msg);
		if(msg.msg=="loaded"){
			if (msg.mesh==this.roomMesh){
				//behavior for navigating the camera
				this.cameraBehavior = 
					new Kata.Behavior.Camera(
						this, this.camera, this.xml3d	
					);
				
				this.fillRoom();
			}
			else{
				for(var i = 0; i<this.furniture.length; i++){
					var furn = this.furniture[i];
					if(furn.presence){
						if(furn.presence.mID == msg.id){
							furn.meshLoaded();							
						}
					}						
					else {
						this.loadedFurnitures.push(msg.id);
					}
				}
			}
			
			
		}
		if(msg.msg=="click"){	
			if (msg.event.timeStamp -200 < lastClick ){
				msg.msg = "doubleclick";
				lastClick = msg.event.timeStamp;
			}
			else{
				lastClick = msg.event.timeStamp;
				
					var furn = null;
					var mesh = this.xml3d.getElementByPoint(msg.x, msg.y);
					if(mesh){										
						var obj = Helper.getFurnitureGroup(mesh);
						furn = this.furnitureFromXML3D(obj);
					}
					
					if (furn && this.mode == "camera"){							
						if(this.requestFurn(furn)){
							this.changeMode(furn);
						}						
					}
					else{ 
						if(this.mode == "furniture"){
							this.changeMode(furn);
						}
					}
			}			
		}
		
		if(msg.msg =="mousemove"){
			if(this.mode == "furniture")
				this.activeFurniture.moveFurnitureToMouse(msg.x, msg.y);			
		}
		if(msg.msg == "drag" && this.mode == "furniture"){
			if(Math.abs(msg.dx)>2 && Math.abs(msg.dy)>2){
				this.activeFurniture.rotate(msg.dx, msg.dy);
			}
		}
		/** camera Navigation **/
		if(msg.msg == "doubleclick"){
			this.cameraBehavior.centerToObject(msg);
		}
		if(msg.msg == "wheel"){
			this.cameraBehavior.zoomTo(this.cameraBehavior.camCenterDistance + (msg.dy*(-0.1)));			
		}		
		if(msg.msg == "drag" && this.mode == "camera"){
			this.cameraBehavior.turnByDrag(msg);
		}
		if(msg.msg == "drop" && this.mode == "camera"){
			this.cameraBehavior.drop();
		}
		if(msg.msg == "keyup"){
			this.cameraBehavior.keyup(msg);
		}
		
		if (msg.msg == "keydown"){
			this.cameraBehavior.keydown(msg);
		}
	
		this.updateGFX(this.presence);
	
	};
	
	/*
	 * Helper functions for placing. 
	 * 
	 */
	/**
	 * obj: xml3d element
	 * returns the corresponding Furniture object
	 */
	User.prototype.furnitureFromXML3D = function (obj){
		if (obj){
			if (obj.getAttribute("type").substr(0,2) == "on"){ 
				//if it's a furniture object (types "onwall", "onfloor" or "onceiling")										
				for (var i = 0; i<this.furniture.length;i++) {
		            var furn = this.furniture[i];
		            if (furn.presence.mID == obj.parentElement.id ){
		            	return furn;		            	
		            }		                
		        }
			}
		}
	}
	
	User.prototype.requestFurn = function(furn){
		if (this.furnitureLock[furn.presence.mID]){
			return false;
		}
		else{
			this.furnitureLock[furn.presence.mID] = true;
			return true;
		}
	}
	
	User.prototype.releaseFurn = function(furn, color){		
		if((this.activeFurniture && this.activeFurniture.shader == "red") || color == "red"){
			return false;
		}
		else{
			furn.setActive(false);											
			furn.changeShader("normal");
			this.furnitureLock[furn.presence.mID] = false;
			if(this.activeFurniture == furn){
				this.activeFurniture = null;
			}
			return true;
		}
	}
	
	/**
	 * changes mode and activeFurniture in userscript, changes active state and shader of furniture
	 * furn: the furniture that was clicked on
	 * mode: the new mode
	 */
	User.prototype.changeMode = function (furn){					
		//from 'camera' to 'furniture'
		if (this.mode == "camera"){
			this.mode = "furniture";
			this.activeFurniture = furn;
			this.activeFurniture.setActive(true);
			this.activeFurniture.visitorControl = false;
			//change shader
			if (this.activeFurniture.shader == "normal"){				
				this.activeFurniture.changeShader("green");
			} 
			   
		}
		else if(this.releaseFurn(this.activeFurniture)){
				this.mode = "camera";
		}
	}
	
	/**
	 * sends a message to all visitors, that the shader of a furniture has changed
	 * is only called by FurnitureScript
	 */
	User.prototype.shaderChanged = function(group, color){
		var args = {
			groupId: group.id,
			color: color
			};
		this.visitBehavior.sendMessage("shader", args);
	}
	
	
	/*
	 * Methods to handle incoming messages from visitors:
	 * changeMode:	mode = "furniture" for requesting the lock on a furnitue
	 * 				checks if the lock is free. If not do nothing.
	 * 				If free, lock object, change shader of requested object, send permit msg.
	 * 				mode = "camera" for releasing a furniture.
	 * 				release the furniture.
	 * 
	 * move:		moves the activeFurniture to the given position
	 * rotate: 		rotates the activeFurniture by the given coordinates
	 * create:		creates a new object with the given parameters.
	 * 				Does also save the initiator in case the object isn't placed initially right and has to be moved.
	 * destroy: 	destroys the given object 
	 * 	
	 */	
	User.prototype.handleChangeMode = function(msg, dest){
		var obj = document.getElementById(msg.groupId);		
		var furn = this.furnitureFromXML3D(obj);
		if (msg.mode == "furniture"){
			if (this.requestFurn(furn)){
				furn.setActive(true);
				furn.changeShader("yellow");
				furn.visitorControl = true;
				var args = {
						mode: "furniture",
						groupId: msg.groupId,
				}
				this.visitBehavior.sendMessageTo("mode", args, dest);
			}
		}
		if (msg.mode == "camera"){
			//mode changes automatically in visitorscript if shader changes to normal
			this.releaseFurn(furn, msg.color)
		}
	} 
	
	User.prototype.handleMove = function(msg){
		var obj = document.getElementById(msg.groupId);		
		var furn = this.furnitureFromXML3D(obj);
		if(furn){
			var coord = msg.hitPoint.split(" ");
			var x = parseInt(coord[0]);
			var y = parseInt(coord[1]);
			var z = parseInt(coord[2]);
			furn.moveFurnitureToMouse(null, null, {x:x, y:y, z:z} );
		}
	}
	
	User.prototype.handleRotate = function(msg){
		var obj = document.getElementById(msg.groupId);		
		var furn = this.furnitureFromXML3D(obj);
		if(furn){
			var coord = msg.rotate.split(" ");
			var x = parseInt(coord[0]);
			var y = parseInt(coord[1]);
			furn.rotate(x, y);
		}
	}
	
	User.prototype.handleCreate = function(msg){		
		this.createObject(kata_base_offset + "scripts/FurnitureScript.js",
    			"Furniture",
    			{ space:this.space,    		    		
    			  center: msg.center,
    			  id:msg.id,
    			  visual:{mesh: msg.mesh},
    			  inDB:msg.inDB,
    			  type:msg.type,
    			  name:msg.name,
    			  visitor:msg.initiator,
    			  visitorControl: true,
    			  loc:{scale: "1.0"} //just to match the code..    			  
    			});
	}
	
	User.prototype.handleDestroy = function(msg){
		//TODO
	}
		
	/**
	 * send mode, activeFurniture and color of activeFurniture
	 */
	User.prototype.sendRoomConfiguration = function(dest){		
		
		for (var i = 0;i<this.furniture.length;i++){			
			var furn = this.furniture[i];
			var transform = document.getElementById(furn.group.transform);
			
			var args = {
				groupId:furn.group.id,
				x:transform.translation.x,
				y:transform.translation.y,
				z:transform.translation.z,
			};				
			this.visitBehavior.sendMessageTo("furnitureInfo", args, dest);
			
			if(furn.shader != "normal"){
				var args2 = {
					groupId: furn.groupId,
					color: furn.shader
				}
				this.visitBehavior.sendMessageTo("shader", args, dest);
			}
		}
	}
	
	User.prototype.transformationChanged = function(group, x,y,z){
		var args3 = {
				groupId:group,
				x:x,
				y:y,
				z:z,
			};				
			this.visitBehavior.sendMessage("furnitureInfo", args3);
	}
	
	User.prototype.handleAccessConfirmation = function(msg, dest){
		$("#modalDialogOwner").empty();
		$("#modalDialogOwner").append("<p> Is the user: " + msg.visitor + " allowed to access your room? </p>")
		var thus = this;
		$( "#modalDialogOwner" ).dialog( "option", "buttons", [
                           {
                        	   text: "Yes",
                        	   click: function() { thus.accessConfirmation(true, dest); $(this).dialog("close");},                        	 
                           },
                           {
                        	   text: "No",
                        	   click: function() { thus.accessConfirmation(false, dest); $(this).dialog("close"); }
                           }
                           ] );
		$("#modalDialogOwner").dialog("open");		
	}
	
	User.prototype.accessConfirmation = function (confirm, dest){
		var args = {confirmation: confirm};
		this.visitBehavior.sendMessageTo("confirmAccess", args, dest);
		if(confirm){
	        this.sendRoomConfiguration(dest);
		}
	}
	
	


}, kata_base_offset + "scripts/UserScript.js");

