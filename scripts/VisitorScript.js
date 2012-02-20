var Visitor={};

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
	Visitor = function(channel, args){		
		//save the xml3d element
		var t = document.getElementsByTagName("xml3d");
		this.xml3d = t[0];		
		//save arguments
		this.username = args.username;
		this.space=args.space;	
		this.roomMesh = args.world;	

		/*
		 * "camera" mode: moving camera by drag 
		 * "furniture" mode: moving furniture by drag and drop
		 */		
		this.mode="camera";
		this.activeFurniture = {id:0};

		//to save which key is pressed
		this.keyIsDown = {};
		//initialize
		this.keyIsDown[this.Keys.UP] = false;
		this.keyIsDown[this.Keys.DOWN] = false;
		this.keyIsDown[this.Keys.RIGHT] = false;
		this.keyIsDown[this.Keys.LEFT] = false;
		this.keyIsDown[this.Keys.W] = false;
		this.keyIsDown[this.Keys.A] = false;
		this.keyIsDown[this.Keys.S] = false;
		this.keyIsDown[this.Keys.D] = false;

		this.furnitureShaders = {red: null, green: null, normal: null, yellow: null};
		this.centerFurniture = new Array();
		this.activeFurnitureUpdates = new Array();
		this.activeFurnitureNormal = new Array();

		//call parent constructor
		SUPER.constructor.call(this, channel, args, function(){});



		//for sending messages
		this.visitBehavior = 
			new Kata.Behavior.Visit(
				this, "visitor"	
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
	* Simulate inheritance from GraphicsScript by extending the Visitor class with the methods of the parent(SUPER) class
	*/
	Kata.extend(Visitor, SUPER);


	/**
	* I think: This registers the "near" objects in this.mRemotePresences (with it's presence).
	* Then the script can use the presences to send messages to the hostedObjects via presence._sendHostedObjectMessage
	*/
    Visitor.prototype.proxEvent = function(remote, added) {
        if (added){
        	Kata.warn("Camera Discover object.");
	        this.presence.subscribe(remote.id());
	        this.mOther = remote;
        }
        else{
        	if (remote.mID == this.visitBehavior.owner.id){
        		Kata.warn("Owner left room");
        		alert("owner left the room");
        		document.location.href="mainMenu.xhtml";
        	}
        	else{
        		Kata.warn("Camera wiped object");
        	}
        }
    };
     
    
	/**
	* Callback that is triggered when object is connected to the space
	*/
	Visitor.prototype.connected = function(presence, space, reason){
		//handle connection failure
		if (presence == null){
		Kata.error('Failed to connect viewer to '+ space+'. Reason: ' + reason);
		throw "error";
		}		

		//save world presence
		this.presence = presence;

		this.presence.setQueryHandler(Kata.bind(this.proxEvent, this));
        this.presence.setQuery(0);   

		//display the object
		this.enableGraphicsViewport(this.presence,0);

        //save the activeView
        var id = this.xml3d.activeView;
        this.camera = document.getElementById(id);		

		var thus = this;
		//attach a handler for the click-event of all current AND future elements with class furniture
		$(".furniture").live("click",function(){thus.createFurniture(this)});
		$("#listButton").attr("disabled", "true");
	}

	Visitor.prototype.accessConfirmationRequest = function(){
		//send access confirmation request
		var args = {visitor: this.username, mode: null};
		this.visitBehavior.sendMessage("confirmAccess", args);
		//block content until access is allowed
		$("#modalDialogVisitor").append("<p>Please wait until the owner of the room authorizes your acces</p>");
		$("#modalDialogVisitor").dialog("open");
	}


	Visitor.prototype.createFurniture = function(obj){
		if(this.mode=="camera"){
			var prev = obj.getAttribute("preview");
			var id = obj.getAttribute("id");  
			var type = obj.getAttribute("type");   
			var name = obj.getAttribute("name");  
			var thus = this;
			$.post('scripts/getMeshFromFurniturePreview.php', {preview: prev}, 
					function(data, jqxhr){     				
						var url = kata_base_offset + data[0];
						//create new object in world      				
						var args = {    		    			    		    	
				    			center: thus.center,
				    			id:id,
				    			mesh: url,    		    			
				    			type:type,
				    			name:name, 
				    			initiator: thus.presence.mID
				    			};
						thus.visitBehavior.sendMessage("create", args);
					},'json');
		}
    } 

	Visitor.prototype.destroyFurniture = function (groupId){
		if(this.initiator){
			var args = {
					groupId: groupId
				};
			this.visitBehavior.sendMessage("destroy", args);
		}
	}

	/****
	 * 
	 * CHAT STUFF
	 * 
	 ****/
	Visitor.prototype.createChatEvent = function(action, name, msg) {
        var evt = {
            action : action,
            name : name
        };
        if (msg)
            evt.msg = msg;
        return new Kata.ScriptProtocol.FromScript.GUIMessage("chat", evt);
    };
    Visitor.prototype.chatEnterEvent = function(remote, name) {
        this._sendHostedObjectMessage(this.createChatEvent('enter', name));
        var remote_pres = this.getRemotePresence(remote);
        if (remote_pres) this.updateGFX(remote_pres);
    };
    Visitor.prototype.chatExitEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('exit', name, msg));
    };
    Visitor.prototype.chatMessageEvent = function(remote, name, msg) {
        this._sendHostedObjectMessage(this.createChatEvent('say', name, msg));
    };
    
    Visitor.prototype.handleChatGUIMessage = function(msg) {
        var revt = msg.event;
        this.mChatBehavior.chat(revt);
    };



	//Enum for Keycode
	Visitor.prototype.Keys = {
		UP : 38,
		DOWN : 40,
		LEFT : 37,
		RIGHT : 39,
		W : 87,
		A : 65,
		S : 83,
		D : 68
	};

	var lastClick = -Number.MAX_VALUE;
	var lastDragEvent;
	//the smaller the speed the faster the turning/moving/zooming
	//no mathematical foundation, just a  guess
	var turnSpeed = 15;	
	var zoomSpeed = 10;
	var moveSpeed = 10;

	//Handle messages from GUI
	Visitor.prototype._handleGUIMessage = function (channel, msg) {
		if (msg.msg == 'chat')
            this.handleChatGUIMessage(msg);
		if(msg.msg=="loaded"){
			if (msg.mesh==this.roomMesh){
				this.cameraBehavior = 
					new Kata.Behavior.Camera(
						this, this.camera, this.xml3d	
					);
			}			
			if(this.activeFurnitureUpdate){
				var obj = document.getElementById(this.activeFurnitureUpdate.groupId);
				if(obj){
					this.handleChangeShader(this.activeFurnitureUpdate);
				}
			}
			for (var i = 0; i<this.centerFurniture.length;i++){
				var msg = this.centerFurniture[i]
				var furn = msg.groupId;
				if (furn.indexOf(msg.id) != -1){
					this.centerFurniture.splice(i, 1);
					var obj = document.getElementById(furn);
					this.centerMesh(obj, msg.x, msg.y, msg.z);
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
				var args = null;
				if(this.mode == "camera"){
					//request object
					var mesh = this.xml3d.getElementByPoint(msg.x, msg.y);
					if(mesh){	
						var obj = Helper.getFurnitureGroup(mesh);
						if(obj){
							args = {
								mode:"furniture",
								groupId: obj.id
							}
						}
					}
				}
				else{
					//request object release
					if (this.activeFurniture)
					var color = this.getActiveFurnitureShader();
					args = {
							mode:"camera",
							groupId: this.activeFurniture.id,
							color: color
						}
					
				}
				if(args)
					this.visitBehavior.sendMessage("mode", args);
			}

		}
		
		if(msg.msg =="mousemove"){
			//send a move message to the owner
			if(this.mode == "furniture"){
				var furn = this.activeFurniture;
				var type = furn.getAttribute("type");
				var p = Helper.getHitPoint(msg.x,msg.y,type, this.hiddenWall);
				if (p){
					var coord = p.x + " " + p.y + " " + p.z;
					var args = {
							hitPoint: coord,
							groupId: this.activeFurniture.id
						};
					this.visitBehavior.sendMessage("move", args);
					if (furn.getAttribute("type")=="onWall"){
						this.centerMesh(furn);
					}
				}
			}

		}		
		if(msg.msg == "drag" && this.mode == "furniture"){
			if(Math.abs(msg.dx)>2 && Math.abs(msg.dy)>2){
				var coord = msg.dx + " " + msg.dy;
				var args = {
					rotate: coord,
					groupId: this.activeFurniture.id
					};
				this.visitBehavior.sendMessage("rotate", args);
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
	Visitor.prototype.furnitureFromXML3D = function (obj){
		if (obj){
			if (obj.getAttribute("type").substr(0,2) == "on"){ 
				//if it's a furniture object (types "onwall", "onfloor" or "onceiling")										
				for (i in this.mRemotePresences) {
					var furn = this.mRemotePresences[i];
		            if (furn){
		            	if (furn.mID == obj.parentElement.id ){
		            		return furn;
		            	}
		            }		                
		        }
			}
		}
	}
	
	Visitor.prototype.getActiveFurnitureShader = function(){
		var shader = this.activeFurniture.getAttribute("shader");
		if ("#"+ this.furnitureShaders["red"] == shader)
			return "red";		
		if ("#"+ this.furnitureShaders["green"] == shader)
			return "green";
		console.log("active Furniture has illegal Shader");
	}

	/*
	 * Methods to handle incoming messages from owner:
	 * handleChangeMode: updates the mode and activeFurniture and checks if it was the initiator of the furniture mode
	 * handleChangeShader: changes the shader of the given group (furniture) to msg.color.
	 */
	Visitor.prototype.handleChangeMode = function(msg){
		if (msg.mode = "furniture"){
			this.mode = msg.mode		
			this.activeFurniture = document.getElementById(msg.groupId);
			this.handleChangeShader( {groupId: this.activeFurniture.id, color:"green"});
		}
		//camera mode is handled when shader changes
	} 

	Visitor.prototype.handleChangeShader = function(msg){
		var group = document.getElementById(msg.groupId);
		var color = msg.color;

		if(group){
			if(color == "normal"){
				if(msg.groupId == this.activeFurniture.id){
					//change mode
					this.mode = "camera";
					this.activeFurniture = {id:0};
				}
				var parent = group.parentElement;
				$(group).remove();
				$(parent).append(this.activeFurnitureNormal[group.id]);
				this.activeFurnitureNormal[group.id] = null;
			}
			else{
				if(msg.color == "green" && this.activeFurniture.id != group.id){
					color = "yellow";
				}
				if(msg.color == "red" && this.activeFurniture.id != group.id){
					return;
				}
				if(msg.color == "yellow" && this.activeFurniture.id == group.id){
					color = "green";
				}
				if(!this.activeFurnitureNormal[group.id]){
					this.activeFurnitureNormal[group.id] = $(group).clone();
				}
				if (group.hasAttribute("shader")){
					group.setAttribute("shader", "#"+this.furnitureShaders[color] );
				}
				//change Material of all child-groups of the furniture group
				var children = group.getElementsByTagName("group");
				for(var i=0; i < children.length; i++){
					var child = children[i];
					if (child.hasAttribute("shader")){
						child.setAttribute("shader", "#"+this.furnitureShaders[color] );
					}
				}
			}

			this.xml3d.update();
		}
		else{			
			this.activeFurnitureUpdates.push(msg);
		}
	}

	Visitor.prototype.handleFurnitureInfo = function(msg){
		var mesh = document.getElementById(msg.groupId);
		if (mesh){
			this.centerMesh(mesh, msg.x, msg.y, msg.z);
		}
		else{
			this.centerFurniture.push(msg);
		}
	}


	Visitor.prototype.centerMesh = function(mesh, x, y, z){
		var transform = document.getElementById(mesh.transform);
		if(!transform){
			//TODO create new transformation and assign it
		}
		transform.translation.x = x;
		transform.translation.y = y;
		transform.translation.z = z;
	}


	Visitor.prototype.handleAccessConfirmation = function(msg){
		if(msg.confirmation){
			$("#modalDialogVisitor").dialog("close");

		}
		else{
			$("#modalDialogVisitor").empty();
			$( "#modalDialogVisitor" ).append("<p> The owner didn't allow you to access the room</p>" )
			$( "#modalDialogVisitor" ).dialog( "option", "buttons", [
                                   {
                                	   text: "Ok",
                                	   click: function() { document.location.href='mainMenu.xhtml'; }                                	 
                                   }
                                   ] );
		}
	}


	




}, kata_base_offset + "scripts/VisitorScript.js");
