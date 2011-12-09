if (typeof(Visit)=="undefined") {Visit = {};}
if (typeof(Visit.Protocol)=="undefined") {Visit.Protocol = {};}
Visit.Protocol._PBJ_Internal="pbj-0.0.3";

Visit.Protocol.Intro = PROTO.Message("Visit.Protocol.Intro",{
	visitor: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.bool;},
		id: 1
	}});
Visit.Protocol.Create = PROTO.Message("Visit.Protocol.Create",{
	center: {
		options: {packed:true},
		multiplicity: PROTO.required,
		type: function(){return PBJ.vector3d;},
		id: 1
	},
	id: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.int32;},
		id: 2
	},
	mesh: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 3
	},
	inDB: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.bool;},
		id: 4
	},
	type: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 5
	},
	name: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 6
	},
	initiator: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 7
	}});
Visit.Protocol.Destroy = PROTO.Message("Visit.Protocol.Destroy",{
	groupId: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 1
	}});
Visit.Protocol.Mode = PROTO.Message("Visit.Protocol.Mode",{
	mode: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.string;},
		id: 1
	},
	groupId: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.string;},
		id: 2
	},
	initiator: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.string;},
		id: 3
	}});
Visit.Protocol.Move = PROTO.Message("Visit.Protocol.Move",{
	hitPoint: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 1
	}});
Visit.Protocol.Rotate = PROTO.Message("Visit.Protocol.Rotate",{
	rotate: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 1
	}});
Visit.Protocol.Shader = PROTO.Message("Visit.Protocol.Shader",{
	groupId: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 1
	},
	color: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 2
	}});
Visit.Protocol.FurnitureInfo = PROTO.Message("Visit.Protocol.FurnitureInfo",{
	groupId: {
		options: {},
		multiplicity: PROTO.required,
		type: function(){return PROTO.string;},
		id: 1
	}});
Visit.Protocol.Container = PROTO.Message("Visit.Protocol.Container",{
	intro: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.Intro;},
		id: 1
	},
	create: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.Create;},
		id: 2
	},
	destroy: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.Destroy;},
		id: 3
	},
	mode: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.Mode;},
		id: 4
	},
	move: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.Move;},
		id: 5
	},
	rotate: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.Rotate;},
		id: 6
	},
	shader: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.Shader;},
		id: 7
	},
	furnitureInfo: {
		options: {},
		multiplicity: PROTO.optional,
		type: function(){return Visit.Protocol.FurnitureInfo;},
		id: 8
	}});
