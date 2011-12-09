Kata.require([
    ['externals/protojs/protobuf.js',
     'externals/protojs/pbj.js',
     kata_base_offset +'scripts/behavior/visit/VisitProtocol.pbj.js']
], function() {

    if (typeof(Kata.Behavior) == "undefined")
        Kata.Behavior = {};

    /** 
	 * behavior to send and handle messages to and from the owner of the room
	 *
     *
     *  @constructor
     *  @param parent {Kata.Script} the parent Script for this behavior
     *  @param type 	visitor or owner
     */
    Kata.Behavior.Visit = function(parent, type) {
        this.parent = parent;
        this.parent.addBehavior(this);

        this.ports = {};

        this.visitors = {};
        this.owner = {};
        
        this.type = type;
    };

    Kata.Behavior.Visit.prototype.ProtocolPort = 12;

    Kata.Behavior.Visit.prototype._serializeMessage = function(msg) {
        var serialized = new PROTO.ByteArrayStream();
        msg.SerializeToStream(serialized);
        return serialized.getArray();
    };

    Kata.Behavior.Visit.prototype._getPort = function(pres) {
        var id = pres;
        if (pres.presenceID)
            id = pres.presenceID();
        var odp_port = this.ports[id];
        if (!odp_port && pres.bindODPPort) {
            odp_port = pres.bindODPPort(this.ProtocolPort);
            odp_port.receive(Kata.bind(this._handleMessage, this, pres));
            this.ports[id] = odp_port;
        }
        return odp_port;
    };

    /**
     * handles an intro message: initializes the owner attribute with the presence of the owner
     */
    Kata.Behavior.Visit.prototype._handleIntroVisitor = function(presence, remoteID) {
	    if(this.type == "owner"){
	    	if (this.visitors[remoteID]) {
	            Kata.warn("Overwriting existing visitor info due to duplicate intro.");
	        }
	        this.visitors[remoteID] = {
	            presence : presence,
	            dest : new Kata.ODP.Endpoint(remoteID, this.ProtocolPort)
	        };
	        this.parent.sendRoomConfiguration(this.visitors[remoteID]);
	    }  
    };

    
    
    Kata.Behavior.Visit.prototype._handleIntroOwner = function(presence, remoteID) {
    	if(this.type == "visitor"){
	    	if (!(this.owner.id)){	//don't want to overwrite the owner presence        	
	            this.owner = {
	            	id: remoteID.mObject,
	                presence : presence,
	                dest : new Kata.ODP.Endpoint(remoteID, this.ProtocolPort)
	            };
	        }
    	}
    }
    
    /**
     * if a visitor disappears, delete him from the list
     */
    Kata.Behavior.Visit.prototype._handleExit = function(remoteID, msg) {
    	if(this.owner.id == remoteID){
    		//If the owner disappears, the visitors can't stay in the room
    	    document.location.href="mainMenu.xhtml";    	    
    	}
	    else{
	        if (this.visitors[remoteID]) {	            
	            delete this.visitors[remoteID];
	        }
	    }
    }; 

    /**
     * When we get a presence, we just set up a listener for
     * messages. The rest is triggered by prox events.
     */
    Kata.Behavior.Visit.prototype.newPresence = function(pres) {        
        var odp_port = this._getPort(pres);
    };

    Kata.Behavior.Visit.prototype.presenceInvalidated = function(pres) {
        var odp_port = this._getPort(pres);
        if (odp_port) {
            odp_port.close();
            delete this.ports[pres.presenceID()];
        }
    };

    /** 
     * If a new presence is detected, this sends an intro message to it
     */
    Kata.Behavior.Visit.prototype.remotePresence = function(presence, remote, added) {
        if (added) {            
            var intro_msg = new Visit.Protocol.Intro();
            if(this.type == "owner")
            	intro_msg.visitor = false;	//this is the owner of the room
            else
            	intro_msg.visitor = true;	//this is a visitor of the room
            var container_msg = new Visit.Protocol.Container();
            container_msg.intro = intro_msg;

            var odp_port = this._getPort(presence);
            odp_port.send(remote.endpoint(this.ProtocolPort), this._serializeMessage(container_msg));
        }
        else {            
            this._handleExit(remote.presenceID());
        }
    };



    /**
     * Passes the incoming messages to the right handler
     */
    Kata.Behavior.Visit.prototype._handleMessage = function(presence, src, dest, payload) {
        var container_msg = new Visit.Protocol.Container();
        container_msg.ParseFromStream(new PROTO.ByteArrayStream(payload));

        if (container_msg.HasField("intro")) {
        	if(container_msg.intro.visitor){
        		this._handleIntroVisitor(presence, src.presenceID());
        	}
        	else{
        		this._handleIntroOwner(presence, src.presenceID());
        	}
            
        }
        if (container_msg.HasField("create")) {
        	if(this.parent.handleCreate)
        		this.parent.handleCreate(container_msg.create);
        }
        if (container_msg.HasField("destroy")) {
        	if(this.parent.handleDestroy)
        		this.parent.handleDestroy(container_msg.destroy);
        }
        if (container_msg.HasField("mode")) {
        	if(this.parent.handleChangeMode)
        		this.parent.handleChangeMode(container_msg.mode);
        }
        if (container_msg.HasField("move")) {
        	if(this.parent.handleMove)
        		this.parent.handleMove(container_msg.move);
        }
        if (container_msg.HasField("rotate")) {
        	if(this.parent.handleRotate)
        		this.parent.handleRotate(container_msg.rotate);
        }
        if (container_msg.HasField("shader")) {
        	if(this.parent.handleChangeShader)
        		this.parent.handleChangeShader(container_msg.shader);
        }
        if (container_msg.HasField("furnitureInfo")) {
        	if(this.parent.handleFurnitureInfo)
        		this.parent.handleFurnitureInfo(container_msg.furnitureInfo, this.visitors[src.presenceID()]);
        }
    };
    
    /**
     * sends a message to all visitors / to the owner (depending on this.type)
     * @param: type 	the type of the message. 
     * 					the owner of the room can only send two different type of messages:
     * 						"mode": to tell the visitors that the mode changed
     * 						"shader": to tell the visitors that the shader of an object changed
     * 					a visitor can send the following type of request messages:
     * 						"mode": to change the mode
     *  					"move": to move an object
     *  					"rotate": to rotate an object
     *  					"create": to create an object
     *  					"destroy": to delete an object
     * @param args		the arguments that are required for the type of message
     */
    Kata.Behavior.Visit.prototype.sendMessage = function(type, args){
    	if (this.type == "owner"){
    		//create message
    		var msg;
    		var container_msg = new Visit.Protocol.Container();
    		switch (type){
    			case "mode":
    				msg = new Visit.Protocol.Mode();
					msg.mode = args.mode;
					msg.groupId = args.groupId;
					msg.initiator = args.initiator;  	            
    	            container_msg.mode = msg;
    	            break;
    			case "shader":
    				msg = new Visit.Protocol.Shader();
    				msg.groupId = args.groupId;
    				msg.color = args.color;    				
    				container_msg.shader = msg;
    				break;    			
    		}
    		//send message to all visitors
    		for(var remote_key in this.visitors) {
              var visitor = this.visitors[remote_key];
              var odp_port = this._getPort(visitor.presence);
              odp_port.send(visitor.dest, this._serializeMessage(container_msg));
          }
    	}
    	else{
    		//create message
    		var msg;
    		var container_msg = new Visit.Protocol.Container();
    		switch (type){
				case "mode":
					msg = new Visit.Protocol.Mode();
					msg.mode = args.mode;
					msg.groupId = args.groupId;
					msg.initiator = args.initiator;
	    	        container_msg.mode = msg;
	    	        break;
				case "move":
					msg = new Visit.Protocol.Move();
					msg.hitPoint = args.hitPoint;				//of form "x y z"
					container_msg.move = msg;
					break;
				case "rotate":
					msg = new Visit.Protocol.Rotate();
					msg.rotate = args.rotate;			//of form "dx dy"
					container_msg.rotate = msg;
					break;
				case "create":
					msg = new Visit.Protocol.Create();
					msg.center = args.center;
					msg.id = args.id;
					msg.mesh = args.mesh;
					msg.inDB = false;
					msg.type = args.type;
					msg.name = args.name;
					msg.initiator = args.initiator;
					container_msg.create = msg;
					break;
				case "destroy":
					msg = new Visit.Protocol.Destroy();
					msg.groupId = args.groupId; 
					container_msg.destroy = msg;
					break;				
    		}
    		//send message to owner
    		var owner = this.owner;
            var odp_port = this._getPort(owner.presence);
            odp_port.send(owner.dest, this._serializeMessage(container_msg));
    	}
    		
    }
    
    //currently only used by owner
    Kata.Behavior.Visit.prototype.sendMessageTo = function(type, args, visitor){
    	//create message
		var msg;
		var container_msg = new Visit.Protocol.Container();
		switch (type){
			case "mode":
				msg = new Visit.Protocol.Mode();
				msg.mode = args.mode;
				msg.mesh = args.mesh;
				msg.initiator = args.initiator;  	            
	            container_msg.mode = msg;
	            break;
			case "shader":
				msg = new Visit.Protocol.Shader();
				msg.groupId = args.groupId;
				msg.color = args.color;    				
				container_msg.shader = msg;
				break;
			case "furnitureInfo":
				msg = new Visit.Protocol.FurnitureInfo();
				msg.groupId = args.groupId;   				
				container_msg.furnitureInfo = msg;
		}
		//send message to all visitors
		var odp_port = this._getPort(visitor.presence);
		odp_port.send(visitor.dest, this._serializeMessage(container_msg));     
    }

}, '../../scripts/behavior/visit/Visit.js');
 
