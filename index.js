const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const config = require('./config');

const frivillig = require('./models/frivillig');
const request = require('request');
var ObjectId = require('mongodb').ObjectID;
const service = require('./models/service');
// Initialize WebHooks module.
var WebHooks = require('node-webhooks');
var urlGetDistricts = "";

// Initial webhook module from on-disk database
var webhooks = new WebHooks({
    db: './webHooksDB.json', // json file that store webhook URLs
    httpSuccessCodes: [200, 201, 202, 203, 204], // optional success http status codes
});

// Alternatively, initialize webhooks module with object; changes will only be
// made in-memory

webHooks = new WebHooks({
    db: {"addPost": ["http://localhost:9100/posts"]} //just an example
});

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



/* 
getdata = function(){
    var options = {
        method: 'GET',
        url: 'https://dibaservicestest.rodekors.no/webapi/api/district',
        headers: {
            'Content-Type': 'application/json',
            'crmaccesstoken': 'mup38/AiZfjFJTcy4FoqAg=='
        }
      };
      
      request(options, function (err, res, body) {
        if (err) {
          console.log('Error :', err);
          return;
        }
        console.log(' Body :', body);
      
      });
};
 */
//getdata();


// 1. Get a change from enrollment collection, extract org id
// 2. check webhooks collection for org id
// 3. extract org details
// 4. Get org districts - https://dibaservicestest.rodekors.no/webapi/api/district
// 5. check if any org district matches org->address->muncipality. Get a districtNumber
// 6. Find unionid from district no
// 7. Get all union disticts https://dibaservicestest.rodekors.no/webapi/api/union/getallunionindistrict/{district no}
//


MongoClient.connect(connstr,{ useNewUrlParser: true })
    .then(client => {
        console.log("Connected correctly to server");

        const db = client.db(config.db_name);
        const listen_collection = db.collection(config.listen_collection);
        console.log("collection name is " + config.listen_collection);
        
        const changeStream = listen_collection.watch(pipeline);
        // start listen to changes
        changeStream.on("change", function(change) {
            frivillig.UserInfo = new Object();
            var url = ''; 
        
            console.log(change.documentKey._id);
            //check for webhook collection i.e. see if there´s any webhook registered for current organisation, if not return
            db.collection("enrollment").findOne({"_id" : ObjectId(change.documentKey._id)}, function(err, enrollment) {
                if (err) throw err;
                if (enrollment){ 
                    currentWebhooks = [];
                    currentOrgs = [];
                   
                        //important : while creating webhooks from UI, also insert org district and name in webhook table, simplies querying
                        //565477e3e4b07a3d8fb1068a
                        db.collection("webhook").find({"organizationId" : ObjectId(enrollment.organizationId)}, function(err, webhooks) {
                            if (err) throw err;
                            if (webhooks){
                                webhooks.forEach(function(entry) {
                                    console.log("Current webhook : " + entry);
                                    currentWebhooks.push(entry);
                                }); 
                            }
                           
                            //{"organizationId":ObjectId("565477e3e4b07a3d8fb1068a")}
                            //if webhooks configured for given org
                            if(currentWebhooks.length > -1){
                                var municpality = "";
                                console.log("org id:" + enrollment.organizationId);
                                db.collection("organization").findOne({"_id" : ObjectId(enrollment.organizationId)}, function(err, org) {
                                    if (err) throw err;
                                  
                                    if (org && org.address && org.address.municipality){
                                       
                                        municipality = org.address.municipality;
                                        if(!municipality){
                                            console.log("Organization not found !!");
                                            return;
                                        }
                                   
                                    
                                        frivillig.UserInfo.FirstName = enrollment.name;
                                        frivillig.UserInfo.Email = enrollment.email;
                                        frivillig.UserInfo.MobilePhone = enrollment.phoneNumber;
                                        frivillig.UserInfo.AddressLine1 = enrollment.location.street + " " +  enrollment.location.postNumber + " " + enrollment.location.county;
                                        frivillig.UserInfo.LastName = "";
                                        frivillig.UserInfo.AddressLine2 = "";
                                        //this will return organisation districts. So we need to find actual org by comparing current org name 
                                        //with district org 
                                        var options = {
                                            method: 'GET',
                                            url: 'https://dibaservicestest.rodekors.no/webapi/api/district',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'crmaccesstoken': 'mup38/AiZfjFJTcy4FoqAg=='
                                            }
                                        };
                                        request(options, function (err, res, orgs) {
                                            if (err) {
                                                console.log('Error :', err);
                                                return;
                                            }

                                            var objs = JSON.parse(orgs);

                                            if (objs){
                                                objs.forEach(function(entry) {
                                                    currentOrgs.push(entry);
                                                }); 
                                            }
        
                                            console.log(currentOrgs);
                                            //extract org name from id compare it to current org, if match is found, use current crm id 
                                            if(currentOrgs.length > -1){
                                               
                                                var orgDistrict = currentOrgs.find(o => o.Name.includes(municipality));
                                                
                                                if(orgDistrict != null){
                                                    console.log("mission id found : " + enrollment.missionId);
                                                            db.collection("mission").findOne({"_id" : ObjectId(enrollment.missionId)}, function(err, mission) {
                                                                if (err) throw err;
                                                              
                                                                console.log("mission" + mission);
                                                                if (mission){ 
                                                                    console.log("mission id:" + mission._id);
                                                                    frivillig.UserInfo.MissionName = mission.title;
                                                                    console.log("mission:" + frivillig.MissionName );
                                                                    
                                                                    var districtNo = orgDistrict.Number;
                                                                    console.log('districtNo :', districtNo);
                                                                    var options = {
                                                                        method: 'GET',
                                                                        url: 'https://dibaservicestest.rodekors.no/webapi/api/union/getallunionindistrict/' + districtNo,
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'crmaccesstoken': 'mup38/AiZfjFJTcy4FoqAg=='
                                                                        }
                                                                    };
                                                                    localOrgs = [];
                                                                    request(options, function (err, res, result) {
                                                                        if (err) {
                                                                            console.log('Error :', err);
                                                                            return;
                                                                        }
                                                                        var remoteOrg = JSON.parse(result);
                                                

                                                                        if(remoteOrg.length > 0){
                                                                  
                                                                            frivillig.Comments = "";
                                                                            frivillig.AccountNumber = districtNo;
                                                                            frivillig.CaseTypeCode = "2";
                                                                            frivillig.CaseOrigin = "2";
                                                                            console.log(municipality);
                                                                            console.log(remoteOrg);
                                                                            var districts = remoteOrg.find(o => o.Name.includes(municipality));
                                                                            console.log(districts);
                                                                            if(districts){
                                                   
                                                                                frivillig.UnionId = districts.CrmId;
                                                                                frivillig.UserInfo.CrmId = "";
                                                                                
                                                                                var objectToPost = JSON.stringify(frivillig);
                                                                                postdata(objectToPost);
                                                                            }  
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                    
                                                        }
                            
                                                    } 
                                                });

                                            }
                                    
                                        });
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

        request.post({
            uri: 'https://dibaservicestest.rodekors.no/webapi/api/incident',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

    };


    