
var ua_log = require('ualib').ua_log;
global.config = require('./config');
global.log = new ua_log(config.logLevel, config.processName);

var server = require('./server');
var router = require('./router');
var handler = require('./handler');

var handle = {};
handle['SMS'] 	= handler.smsSender;
handle['MMS'] 	= handler.mmsSender;
handle['GCM'] 	= handler.gcmSender;
handle['APNS'] 	= handler.apnsSender;
handle['UAN'] 	= handler.uanSender;

server.start(router.route, handle);
