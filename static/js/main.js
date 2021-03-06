(function($){

	Backbone.View.prototype.close = function () {
		if (this.beforeClose) {
			this.beforeClose();
		}
		this.remove();
		this.unbind();
	};

	function showAlert(m, t, a){
		var message = m;
		var warning = new AlertView().render(m,t, a).el;
		$("#error-area").html(warning);
		setTimeout(function() { warning.remove(); }, 3000);
	}

	/*-------------Models---------------------*/
	var Location = Backbone.Model.extend({
		urlRoot: "/uber-cc/api/v1.0/locations",
		defaults: function(){
			return {
				"lat": 0,
				"lng": 0,
				"address": "-Not Available-",
				"uri": "-Not Available-",
				"name": "-Not Available-",
				"created": "Unknown"
			}
		}
	});

	/*-------------Collections---------------------*/
	var Locations = Backbone.Collection.extend({
		model: Location,
		url: '/uber-cc/api/v1.0/locations',
		parse: function(data){
			return data.locations;
		}

	});

	/*-------------Views---------------------*/
	var LocationsItemView = Backbone.View.extend({
		initialize: function(){
			_.bind(this.edit, this.render);
			_.bind(this.close, this.render);
		},
		events:{
			"click .edit-btn": "edit",
			"click .delete-btn": "delete",
			"click .save-btn": "save",
			"click .cancel-btn": "revert"
		},
		edit: function(){
			var that =this;
			var template = _.template($("#add_locations_template").html(), {location: this.model});
			this.$el.html(template);
			this.$("#location-name").val(this.model.get("name"));
			this.$("#location-address").val(this.model.get("address"));
			$(".add-button").on("click", function(){
				that.revert();
			});
		},
		delete: function(){
			var that = this;
			this.$el.slideUp(650, function(){
				that.model.destroy({
					wait: true,
					success: function(model, response){
						GoogleMapView.locations.remove(model);
						model.get("marker").setMap(null);
						showAlert("That location will surely be missed...", "success", "Alas! ");
						that.close();
					},
					error: function(){
						showAlert("Oops...something went wrong. Please try again", "danger", "Error! ");
					}
				});
			});
			
		},
		render: function(){
			var template = _.template($("#locations_template").html(), {location: this.model});
			this.$el.html(template);
			return this;
		},
		save: function(){
			var that = this;
			var name = $("#location-name").val();
			var address = $("#location-address").val();
			if( name === "" || address === ""){
				showAlert("Please enter both fields!", "warning", "Sorry! ");
				return;
			}
			var current_location = this.model;
			if(current_location.get("name") === name && current_location.get("address") === address){
				that.revert();
				return;
			}else{
				var jqXHR = $.ajax({
					type: "GET",
					async: false,
					url: "http://maps.googleapis.com/maps/api/geocode/json",
					data: {address: address, sensor: false},
					dataType: "application/json; charset=utf-8",
					dataType: "json",
					success: function (data) {
					if(data.results.length > 1){
							showAlert("Your will have to be a bit more specific!", "warning", "Sorry! ");
					}else{
						current_location.set("name", name);
						current_location.set("address", data.results[0].formatted_address);
						current_location.set("lat", data.results[0].geometry.location.lat.toString());
						current_location.set("lng",data.results[0].geometry.location.lng.toString());
						current_location.get("marker").setMap(null);
						current_location.unset("marker");
						current_location.save(null, {
							success: function(model, response){
								that.model = model;
								that.render();
								GoogleMapView.plot(that.model);
								GoogleMapView.recenter();
								showAlert("That location has been updated", "success", "Done! ");
							},
							error: function(model, response){
								showAlert("Oops...something went wrong. Please try again", "danger", "Error! ");
							}
						});
					}
				},
				error: function (data) {
					showAlert("Oops...something went wrong. Please try again", "danger", "Error! ");	
				}
			});
			}
		},
		revert: function(){
			this.render();
		}

	});

var LocationsView = Backbone.View.extend({

	el: ".locations",
	render: function(){
		var that = this;
		var locations = new Locations();

		locations.fetch({
			type: "GET",
			success: function(locations_data){
				GoogleMapView.render(locations_data);
				_.each(locations_data.models, function(location_data){
					var locations_item = new LocationsItemView({model: location_data}).render().el;
					that.$el.append(locations_item);
				});

			},
			error: function(){
				showAlert("Oops...something went wrong. Please try again", "danger", "Error! ");
			}
		});

		return this;
	}

});


var LocationsAddView = Backbone.View.extend({
	el: ".add-button",
	events: {
		"click .save-btn": "save",
		"click .cancel-btn": "destroy"

	},
	render: function(el){
		var that = this;
		var template = _.template($("#add_locations_template").html());
		$(el).append(template);

		return this;
	},

	destroy: function(){
		$(".add-location-dialog").slideUp(650, function(){
			$(".add-location-dialog").remove();
		});
		
		$('.add-location').attr("disabled", false);
	},

	save: function(){
		var that = this;
		var name = $("#location-name").val();
		var address = $("#location-address").val();
		if( name === "" || address === ""){
			showAlert("Please enter both fields!", "warning", "Sorry! ");
			return;
		}
		var jqXHR = $.ajax({
			type: "GET",
			async: false,
			url: "http://maps.googleapis.com/maps/api/geocode/json",
			data: {address: address, sensor: false},
			dataType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (data) {
				if(data.results.length > 1){
					if(data.status === "ZERO_RESULTS"){
						showAlert("Thats not a valid address", "warning", "Sorry! ");
					}else{
						showAlert("Your will have to be a bit more specific!", "warning", "Sorry! ");
					}
					}else{
						var add_location = new Location();
						add_location.set("lat" , data.results[0].geometry.location.lat.toString());
						add_location.set("lng" , data.results[0].geometry.location.lng.toString());
						add_location.set("address", data.results[0].formatted_address);
						add_location.set("name" , name);
						add_location.save(null, {
							success: function (model, response) {
								$(".add-location-dialog").slideUp(650, function(){
									$(".add-location-dialog").remove();
								});
								add_location.set("uri", response.locations.uri);
								add_location.set("created", response.locations.created) ;
								add_location.set("id", response.locations.id);
								var locations_item = new LocationsItemView({model: add_location}).render().el;
								$(".locations").prepend(locations_item);
								GoogleMapView.plot(add_location);
								$('.add-location').attr("disabled", false);
								showAlert("You just added a new location!", "success", "Awesome! ");
							},
							error: function (model, response) {
									showAlert("Oops...something went wrong. Please try again", "danger", "Error! ");
								}
							});
					}

				},
				error: function (data) {
					showAlert("Oops...something went wrong. Please try again", "danger", "Error! ");
				}
			});

}
},{
	getInstance: function () {
			if (this._instance === undefined) {
				this._instance = new this();
			}
			return this._instance;
		}
});


var AlertView =  Backbone.View.extend({
	events:{
		"click .close": "close"
	},
	render: function(message, type, alert){
		var template = _.template($("#error_template").html(), {alert: alert ,message: message});
		this.$el.html(template);
		this.$(".alert").addClass("alert-"+type);
		return this;
	}
});


var AppView = Backbone.View.extend({
	render: function(){
		var locations_view = new LocationsView();
		locations_view.render();
		$(".add-location").on("click", this.add_locations_view);
		return this;
	},

	add_locations_view: function(){
		$('html,body').animate({scrollTop: $(".add-button").offset().top},'slow');
		var inst = LocationsAddView.getInstance();
		inst.render(".add-button");
		$(this).attr("disabled", true);
	}
});



$(document).ready(function(){
	var app = new AppView();
	app.render();
});

})(jQuery);
