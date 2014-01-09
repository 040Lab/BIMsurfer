"use strict"
BIMSURFER.Project = BIMSURFER.Class({
	CLASS: 'BIMSURFER.Project',
	SYSTEM: null,

	events: null,
	server: null,
	scene: null,
	ifcTypes: null,
	loadedTypes: null,
	loadedRevisionId: null,

	__construct: function(system, serverProject, server) {
		this.SYSTEM = system;

		if(typeof server.CLASS == 'undefined' || server.CLASS !== 'BIMSURFER.Server') {
			console.error('BIMSURFER.Project: No server given');
			return
		}

		if(typeof serverProject.lastRevisionId == 'undefined') {
			console.error('BIMSURFER.Project: No project lastRevisionId given');
			return;
		}
		this.server = server;
		var _this = this;
		this.server.server.call("Bimsie1ServiceInterface", "getAllRevisionsOfProject", {
			poid : serverProject.oid,
			async: false
		}, function(revisions) {
			_this.revisions = revisions;
		});

		this.loadedTypes = new Array();

		delete serverProject.revisions;
		jQuery.extend(this, serverProject);

		this.events = new BIMSURFER.Events(this.SYSTEM, this);
	},

	load: function(revisionId) {
		if(this.scene != null) {
			return this.types;
		}
		if(typeof revisionId == 'undefined') {
			revisionId = this.lastRevisionId;
		}
		else
		{
			var revisionFound = false;
			for(var i = 0; i < this.revisions.length; i++) {
				if(this.revisions[i].oid == revisionId) {
					revisionFound = true;
					break;
				}
			}
			if(!revisionFound) {
				console.error('BIMSURFER.Project.looad: This revision ID does not exist in this project');
				return;
			}
		}

		var _this = this;

		var step = function(params, state, progressLoader) {
			_this.SYSTEM.events.trigger('progressChanged', state.progress);
		};
		var done = function(params, state, progressLoader) {
			progressLoader.unregister();

			_this.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Marquee);

			var url = _this.server.server.generateRevisionDownloadUrl({
				serializerOid : _this.server.getSerializer('org.bimserver.geometry.jsonshell.SceneJs3ShellSerializerPlugin').oid,
				laid : params.laid
			});

			$.ajax({
				url: url,
				dataType: 'json',
				success: function(scene) {
					_this.scene = scene;
					_this.ifcTypes = _this.scene.data.ifcTypes;
					_this.ifcTypes.sort();
					_this.scene.data.ifcTypes = new Array();
					_this.events.trigger('projectLoaded');
					_this.loadedRevisionId = revisionId;
					_this.SYSTEM.events.trigger('progressDone');
				},
				error: function(a,b,c,d,e) {
					console.debug('Todo: Error');
					console.debug('ERROR');
					console.debug(a,b,c,d,e);
				}
			});

			return _this.scene;

		}

		this.server.server.call("Bimsie1ServiceInterface", "download", {
			roid : revisionId,
			serializerOid : this.server.getSerializer('org.bimserver.geometry.jsonshell.SceneJs3ShellSerializerPlugin').oid,
			showOwn : true,
			sync: false
		}, function(laid) {
			if(!BIMSURFER.Util.isset(laid)) {
				console.error('Error loading project:', _this.oid, revisionId);
				return;
			}
			_this.SYSTEM.events.trigger('progressStarted', 'Preparing project');
			new BIMSURFER.ProgressLoader(_this.SYSTEM, _this.server.server, laid, step, done, {laid: laid}, false);
		});
	}
});