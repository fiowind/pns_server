
var server = require('./server');
var router = require('./router');
var handler = require('./handler');

var handle = {};
handle['SMS'] 	= handler.smsSender;
handle['MMS'] 	= handler.mmsSender;
handle['GCM'] 	= handler.gcmSender;
handle['APNS'] 	= handler.apnsSender;
handle['MAIL'] 	= handler.mailSender;
handle['UAN'] 	= handler.uanSender;

server.start(router.route, handle);
