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
    Kata.Behavior.Visit = function(parent, type, cb) {
        this.parent = parent;
        this.parent.addBehavior(this);

        this.ports = {};

        //TODO add some callbacks  here

        this.visitors = {};
        this.owner = {};
        this.cb = cb;
        
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
    Kata.Behavior.Visit.prototype._handleIntroOwner = function(presence, remoteID, introMsg) {
    	if (this.visitors[remoteID]) {
            Kata.warn("Overwriting existing visitor info due to duplicate intro.");
        }
        this.visitors[remoteID] = {
            presence : presence,
            dest : new Kata.ODP.Endpoint(remoteID, this.ProtocolPort)
        };
        this.cb();
        // Always send an initial update TODO update for shaders, mode and activeFurniture
        //this._sendUpdate();
    };

    
    
    Kata.Behavior.Visit.prototype._handleIntroVistor = function(presence, remoteID, introMsg) {
    	if (!(this.owner)){	//don't want to overwrite the owner presence
        	if(!(introMsg.visitor))
            this.owner = {
                presence : presence,
                dest : new Kata.ODP.Endpoint(remoteID, this.ProtocolPort)
            };
        }
    }
    
    /**
     * if a visitor disappears, delete him from the list
     */
    Kata.Behavior.Visit.prototype._handleExit = function(remoteID, msg) {
    	if(this.owner.presence){
    		//If the owner disappears, the visitors can't stay in the room
    	    Visitor.prototype._handleExit = function(remoteID, msg) {
    	    	document.location.href="mainMenu.xhtml";
    	    };
    	}
	    else{
	        if (this.visitors[remoteID]) {
	            var objdata = this.visitors[remoteID];
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
            	intro_msg.visitor = false;	//this is a visitor of the room
            var container_msg = new Visit.Protocol.Container();
            container_msg.intro = intro_msg;

            var odp_port = this._getPort(presence);
            odp_port.send(remote.endpoint(this.ProtocolPort), this._serializeMessage(container_msg));
        }
        else {            
            this._handleExit(remote.presenceID());
        }
    };

//    Kata.Behavior.Visit.prototype._sendUpdate = function(state) {
//        // Simply iterate over everyone we know about and try to get the message to them.
//        for(var remote_key in this.mTrackedObjects) {
//            var animate_msg = new Visit.Protocol.SetState();
//            animate_msg.idle = state.idle;
//            animate_msg.forward = state.forward;
//            var container_msg = new Visit.Protocol.Container();
//            container_msg.state = animate_msg;
//
//            var objdata = this.mTrackedObjects[remote_key];
//            var odp_port = this._getPort(objdata.presence);
//            odp_port.send(objdata.dest, this._serializeMessage(container_msg));
//        }
//    };

    /**
     * Passes the incoming messages to the right handler
     */
    Kata.Behavior.Visit.prototype._handleMessage = function(presence, src, dest, payload) {
        var container_msg = new Visit.Protocol.Container();
        container_msg.ParseFromStream(new PROTO.ByteArrayStream(payload));

        if (container_msg.HasField("intro")) {
        	if(this.type == "owner"){
        		this._handleIntroOwner(presence, src.presenceID(), container_msg.intro);
        	}
        	else{
        		this._handleIntroVisitor(presence, src.presenceID(), container_msg.intro);
        	}
            
        }

        if (container_msg.HasField("create")) {
            //TODO
        }
        //TODO ...
    };

}, '../../scripts/behavior/visit/Visit.js');
 
