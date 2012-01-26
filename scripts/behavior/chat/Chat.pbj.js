if (typeof(Chat)=="undefined") {Chat = {};}
if (typeof(Chat.Protocol)=="undefined") {Chat.Protocol = {};}
Chat.Protocol._PBJ_Internal="pbj-0.0.3";

Chat.Protocol.Intro = PROTO.Message("Chat.Protocol.Intro",{
	name: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 1
	}});
Chat.Protocol.Chat = PROTO.Message("Chat.Protocol.Chat",{
	text: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 1
	}});
Chat.Protocol.Exit = PROTO.Message("Chat.Protocol.Exit",{
	text: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.string;},
		id: 1
	}});
Chat.Protocol.Container = PROTO.Message("Chat.Protocol.Container",{
	intro: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Chat.Protocol.Intro;},
		id: 1
	},
	chat: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Chat.Protocol.Chat;},
		id: 2
	},
	exit: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Chat.Protocol.Exit;},
		id: 3
	}});
