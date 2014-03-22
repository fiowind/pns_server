
var queue = require('./queue');

function start(route, handle) {

	console.log('service start. ok.');

	setInterval(function() {
		if (conf.database.mysql.status) {
			queue.getQueueRoute(route, handle, 'SMS', 'push_sms');
			queue.getQueueRoute(route, handle, 'MMS', 'push_sms');
			queue.getQueueRoute(route, handle, 'GCM', 'push_gcm');
			queue.getQueueRoute(route, handle, 'APNS', 'push_gcm');
			if (conf.database.redis.status) {
				queue.getQueueRoute(route, handle, 'UAPNS', 'push_direct');
			}
			else {
				console.log('warning!!! : redis.status = false');
			}
		}	
		else {
			console.log('warning!!! : mysql.status = false');
		}
	}, 1000);

}
exports.start = start;
