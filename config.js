var config = {};


config.repleSet_name = 'mongo-repl'; // set repleSet name
config.host_name = ['test-shard-00-02-dhvxy.gcp.mongodb.net:27017','test-shard-00-01-dhvxy.gcp.mongodb.net:27017','test-shard-00-00-dhvxy.gcp.mongodb.net:27017']; // set host names of repleSet
config.db_name = 'friport'; // set database name to listen mongodb change stream 
config.auth_db_name = 'admin';
config.listen_collection =  'enrollment'; // set collection name to listen mongodb change stream 
config.webhook_collection = 'webhooks'; // set collection name to listen mongodb change stream
config.user_name = 'admin'; // set user name of reple Set
config.pass =  'IOWPwz6I03kbFegzbhY4lHSjMcgvXiksvYahnHFf7aXBJcII6lJsEmOPrt6z6N61'; // set user password of reple Set
config.webhook_api_path = '/api/webhook/';

module.exports = config;