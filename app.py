#!flask/bin/python
import os
import datetime
from flask import Flask, jsonify, abort, make_response, request, url_for, render_template

#----------------------------------------
# configuration
#----------------------------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = '\x11E\xa3\xdf`"\x07\x91\xd0\xe6AE\xe6\x8d\x90\x99wx\xb97\r\xf1Cr'

#----------------------------------------
# database
#----------------------------------------
from mongoengine import *
from flask.ext.mongoengine import MongoEngine

DB_NAME = "ubercc"
DB_USERNAME = "ubercc"
DB_PASSWORD = "pro098!"
DB_HOST_ADDRESS = "ds029630.mongolab.com:29630/ubercc"

app.config["MONGODB_DB"] = DB_NAME
connect(DB_NAME, host='mongodb://' + DB_USERNAME + ':' + DB_PASSWORD + '@' + DB_HOST_ADDRESS)
db = MongoEngine(app)

#----------------------------------------
# schema
#----------------------------------------
class Location(Document):
	lat = StringField()
	lng = StringField()
	address = StringField(max_length=200, required=True)
	name = StringField(max_length=50, required=True)
	created = DateTimeField(default=datetime.datetime.now, required=True)
	uri = StringField()

	meta = {'collection':'uber_locations',
	'indexes':['-created'],
	'ordering':['-created']}

#----------------------------------------
# routes
#----------------------------------------
@app.errorhandler(400)
def not_found(error):
    return make_response(jsonify( { 'error': 'Bad request' } ), 400)

@app.errorhandler(404)
def not_found(error):
	return make_response(jsonify({'error': 'Not found'}), 404)

def create_response(query):
	response = []
	for loc in query:
		response.append(create_id(loc))
	return response

def create_id(location):
	dictionary = to_dict(location)
	dictionary['id'] = str(location.id)
	return dictionary

def to_dict(doc, include_id=True):
    filter_out = ['MultipleObjectsReturned', 'objects', 'DoesNotExist', 'id']
    if not include_id:
        filter_out.remove('id')
    attrs = [s for s in set(dir(doc)) - set(dir(Document)) if not
             s.startswith('_') and s not in filter_out]
    return dict((key, doc[key]) for key in attrs)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/uber-cc/api/v1.0/locations', methods = ['GET'])
def get_locations():
	query = Location.objects.limit(10)
	response = create_response(query)
	return jsonify({"locations": response})

@app.route('/uber-cc/api/v1.0/locations/<string:location_id>', methods = ['GET'])
def get_location(location_id):
	query = Location.objects(id=location_id)
	if len(query) == 0:
			abort(404)
	response = create_response(query)
	return jsonify({"locations": response})

@app.route('/uber-cc/api/v1.0/locations', methods = ['POST'])
def create_location():
	if not request.json or not 'address' in request.json:
		abort(400)
	if not request.json or not 'name' in request.json:
		abort(400)
	location = Location(lat=request.json.get('lat',""),lng=request.json.get('lng',""),address=request.json['address'],name=request.json['name'])
	location.save()
	location.uri = url_for('get_location', location_id = location.id, _external = True)
	location.save()
	return jsonify({"locations": create_id(location)}), 201

@app.route('/uber-cc/api/v1.0/locations/<string:location_id>', methods = ['PUT'])
def update_location(location_id):
	location = Location.objects(id=location_id)
	if len(location) == 0:
		abort(400)
	if not request.json:
		abort(400)
	if 'lat' in request.json and type(request.json['lat']) != unicode:
		abort(400)
	if 'lng' in request.json and type(request.json['lng']) != unicode:
		abort(400)
	if 'address' in request.json and type(request.json['address']) != unicode:
		abort(400)
	if 'name' in request.json and type(request.json['name']) != unicode:
		abort(400)
	returnLocation = []
	for loc in location:
		loc.lat = request.json.get('lat', loc.lat)
		loc.lng = request.json.get('lng', loc.lng)
		loc.address = request.json.get('address', loc.address)
		loc.name = request.json.get('name', loc.name)
		loc.save()
		returnLocation = loc
	return jsonify({"locations": create_id(returnLocation)})

@app.route('/uber-cc/api/v1.0/locations/<string:location_id>', methods = ['DELETE'])
def delete_task(location_id):
	location = Location.objects(id=location_id)
	if len(location) == 0:
		abort(404)

	location.delete()
	return jsonify({'result' : True})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
