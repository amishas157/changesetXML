'use strict';
var fs = require('fs');
var request = require('request');
var parseString = require('xml2js').parseString;
var csvWriter = require('csv-write-stream');
var writer = csvWriter();

fs.readFile('reverts.txt', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }

var jsonObjects = data.split("\n");
writer.pipe(fs.createWriteStream('out.csv'));
  for (var i in jsonObjects) {
    var x = JSON.parse(jsonObjects[i]);
    for (var prop in x) {
        var values = x[prop];
        for(var j in values) {
            if( x[prop] != x[prop][j]) {
                request('http://www.openstreetmap.org/api/0.6/changeset/' + x[prop][j], function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        parseString(body, function (err, result) {
                            var changeset, username, userid, created_at, bbox, editor;
                            changeset = result['osm']['changeset'][0]['$']['id'];
                            userid = result['osm']['changeset'][0]['$']['uid'];
                            username = result['osm']['changeset'][0]['$']['user'];
                            created_at = result['osm']['changeset'][0]['$']['created_at'];
                            bbox = [result['osm']['changeset'][0]['$']['min_lat'],
                                        result['osm']['changeset'][0]['$']['min_lon'],
                                        result['osm']['changeset'][0]['$']['max_lat'],
                                        result['osm']['changeset'][0]['$']['max_lon']];
                            var tagArray = result['osm']['changeset'][0]['tag'];
                            editor ='';
                            for (var k in tagArray) {
                                var y = tagArray[k];
                                if (y['$']['k'] === 'created_by') {
                                    editor = y['$']['v'];
                                }
                            }
                            writer.write({changeset: changeset, user_id: userid, user_name: username, created_at: created_at, bbox: bbox, editor: editor});
                        });
                    }
                })
            }
        }
    }
  }
});