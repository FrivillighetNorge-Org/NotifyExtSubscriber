const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const config = require('./config');
const frivillig = require('./models/frivillig');
const request = require('request');
var ObjectId = require('mongodb').ObjectID;
// Initialize WebHooks module.
var WebHooks = require('node-webhooks');

// Initial webhook module from on-disk database
var webhooks = new WebHooks({
    db: './webHooksDB.json', // json file that store webhook URLs
    httpSuccessCodes: [200, 201, 202, 203, 204], // optional success http status codes
})

// Alternatively, initialize webhooks module with object; changes will only be
// made in-memory

webHooks = new WebHooks({
    db: {"addPost": ["http://localhost:9100/posts"]}, //just an example
})

// sync instantation - add a new webhook called 'shorname1'

const pipeline = [{
    $project: { documentKey: true }
}];

var connstr = "mongodb://" 
+ config.user_name + ":" 
+ config.pass + "@" 
+ config.host_name[0] +","


+ config.host_name[1] +","


+ config.host_name[2] 

//    + config.host_name[1] + ","
//   + config.host_name[2] + "/" 
+"/"+ config.auth_db_name 
+"?replicaSet=test-shard-0&readPreference=primary&ssl=true"
//   + "?replicaSet=" 
//   + config.repleSet_name
;


MongoClient.connect(connstr,{ useNewUrlParser: true })
    .then(client => {
        console.log("Connected correctly to server");

        const db = client.db(config.db_name);
        const listen_collection = db.collection(config.listen_collection);
        console.log("collection name is " + config.listen_collection);
        
        const changeStream = listen_collection.watch(pipeline);
        // start listen to changes
        changeStream.on("change", function(change) {
           
            var url = ''; 
        
            console.log(change.documentKey._id);
            //check for webhook collection i.e. see if there´s any webhook registered for current organisation, if not return
            db.collection("enrollment").findOne({"_id" : ObjectId('5c19127440307c4a180fc838')}, function(err, enrollment) {
                if (err) throw err;
                if (enrollment){ 
                    currentWebhooks = [];
                    //lookup webhook collection and see if enrollment.orgId matches any of the 
                    db.collection("webhook").find({"organizationId" : ObjectId(enrollment.organizationId)}, function(err, webhooks) {
                        if (err) throw err;
                        if (webhooks){
                            webhooks.forEach(function(entry) {
                                currentWebhooks.push(entry)
                            }); 
                        }
                        //if webhooks configured for given org
                        if(currentWebhooks.length > -1){
                            frivillig.FirstName = enrollment.name;
                            frivillig.Email = enrollment.email;
                            frivillig.MobilePhone = enrollment.phoneNumber;
                            frivillig.AddressLine1 = enrollment.location.street + " " +  enrollment.location.postNumber + " " + enrollment.location.county;
                            db.collection("mission").findOne({"_id" : ObjectId(enrollment.missionId)}, function(err, mission) {
                                if (err) throw err;
                                if (mission){ 
                                    console.log(mission.missionId);
                                    frivillig.MissionName = mission.title;
                                }
                            });

                            var objectToPost = JSON.stringify(frivillig);
                            postdata(objectToPost);
                        }
                    });
   
                }
                
            });

        });
    })
    .catch(err => {
        console.error(err);
    });


    postdata = function(data){
        var options = {
            method: 'POST',
            body: data, // Javascript object
            json: true, // Use,If you are sending JSON data
            url: 'https://dibaservicestest.rodekors.no/webapi/api/incident',
            headers: {
                'Content-Type': 'application/json',
                'crmaccesstoken': 'mup38/AiZfjFJTcy4FoqAg=='
            }
          }
          
          request(options, function (err, res, body) {
            if (err) {
              console.log('Error :', err)
              return
            }
            console.log(' Body :', body)
          
          });
    }

    