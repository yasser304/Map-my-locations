var GoogleMapView = Backbone.View.extend({}, 
{
  center: new google.maps.LatLng(23, 0),
  render: function(locations_data){
    this.locations = locations_data;
    this.locations.on('remove', this.recenter, this);
    this.locations.on('add', this.recenter, this);
    var that = this;
    var map;

    var MY_MAPTYPE_ID = 'custom_style';

      var featureOpts = [
        {

          stylers: [
            { hue: '#890000' },
            { visibility: 'simplified' },
            { gamma: 0.5 },
            { weight: 0.5 }
          ]
        },
        {
          elementType: 'labels',
          stylers: [
            { visibility: 'off' }
          ]
        },
        {
          featureType: 'all',
          stylers: [
            { color: '#4B4B4A' }
          ]
        },
        {
          featureType: 'water',
          stylers: [
            { color: '#27231F' }
          ]
        },
        {
          featureType: 'road',
          stylers: [
            { color: '#9B9B9B'}
          ]
        },
        {
          featureType: 'road',
          elementType:'labels',
          stylers: [
            { visibility: 'off'}
          ]
        },
        {
          featureType: 'administrative',
          elementType:'labels',
          stylers: [
            { visibility: 'on'},
            {color: '#CCCCCC'}
          ]
        },
        {
          featureType: 'administrative.neighborhood',
          elementType:'labels',
          stylers: [
            { visibility: 'off'}
          ]
        },
        {
          featureType: 'road.local',
          elementType:'labels',
          stylers: [
            { visibility: 'on'}
          ]
        },
        {
          featureType: 'road.local',
          elementType:'labels.icon',
          stylers: [
            { visibility: 'off'}
          ]
        }
      ];


      var mapOptions = {
        mapTypeControl: false,
        streetViewControl: false,
        panControl: true,
        panControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.LARGE,
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        scrollwheel: false,
        zoom: 3,
        maxZoom: 16,
        center: this.center,
        mapTypeControlOptions: {
          mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
        },
        mapTypeId: MY_MAPTYPE_ID
      };

      this.map = new google.maps.Map(document.getElementById('map-canvas'),
          mapOptions);

      if(locations_data.models.length > 0){
        var latlngbounds = new google.maps.LatLngBounds();
        _.each(locations_data.models, function(loc){
          var thislatlng = new google.maps.LatLng(loc.get("lat"), loc.get("lng"));
          latlngbounds.extend(thislatlng);
        });
        this.map.setCenter(latlngbounds.getCenter());
        this.map.fitBounds(latlngbounds);

      }
      var styledMapOptions = {
        name: 'Custom Style'
      };

      var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

      this.map.mapTypes.set(MY_MAPTYPE_ID, customMapType);

      _.each(locations_data.models, function(loc){
        that.plot(loc);
      });
  },
  plot: function(loc){
    var infoContent = "<strong>"+loc.get("name")+"</strong></br>"+loc.get("lat")+" , "+loc.get("lng");
    var infowindow = new google.maps.InfoWindow({
      content: infoContent
    });
    var myLatlng = new google.maps.LatLng(loc.get("lat"), loc.get("lng"));
    var marker = new google.maps.Marker({
            position: myLatlng,
            animation: google.maps.Animation.DROP,
            title: loc.get("name")
    });
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(this.map,marker);
      setTimeout(function() { infowindow.close(); }, 10000);
    });
        loc.set("marker", marker);
        this.locations.add(loc);
        marker.setMap(this.map);
  },
  recenter: function(){
    if(this.locations.models.length > 0){
        var latlngbounds = new google.maps.LatLngBounds();
        _.each(this.locations.models, function(loc){
          var thislatlng = new google.maps.LatLng(loc.get("lat"), loc.get("lng"));
          latlngbounds.extend(thislatlng);
        });
        this.map.setCenter(latlngbounds.getCenter());
        this.map.fitBounds(latlngbounds);
        google.maps.event.trigger(this.map, 'resize');
      }else{
        this.map.setCenter(this.center);
        this.map.setZoom(3);
        google.maps.event.trigger(this.map, 'resize');
      }
  }
});