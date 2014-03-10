
var ua_log = require('ualib').ua_log;
global.config = require('./config');
global.log = new ua_log(config.logLevel, config.processName);

var net = require('net');
var cluster = require('cluster');
var numCPUs = parseInt(process.argv[2], 10) || require('os').cpus().length;

var mysql = require('mysql');

if (cluster.isMaster) {
	var total = 0;
	/*
	var db = mysql.createConnection({
		host: config.db.host,
		port: config.db.port,
		user: config.db.user,
		password: config.db.password,
		database: config.db.database
	});
	*/

	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', function(worker, code, signal) {
		log.error('[exit] : worker = [' + worker.process.pid + '] exit.');
	});

	Object.keys(cluster.workers).forEach(function(id) {
		cluster.workers[id].on('message', function(msg) {
			total += msg;
		});
	});

	setInterval(function() {
		log.info('[cnt ] : ' + total + ' sockets.');
	}, 5000);
}
else {

	var sockets = {};

	var redis = require('redis');
	var store = redis.createClient();
	store.setMaxListeners(0);
	var sub = redis.createClient();
	sub.setMaxListeners(0);

	/*
	var db = mysql.createConnection({
		host: config.db.host,
		port: config.db.port,
		user: config.db.user,
		password: config.db.password,
		database: config.db.database
	});
	*/

	sub.subscribe('direct');

	sub.on('message', function(channel, data) {

		if (channel !== 'direct') return;
		log.debug('[sub-] : sub.on message : ' + data);

		try {
			temp = JSON.parse(data);
			if (sockets[temp.sender]) {
				sockets[temp.sender].emit('push', data);
			}
		}
		catch (err) {
			log.error('[sub-] : sub.on error : ' + err);
		}
	});

	var server = net.createServer(function(socket) {

		var ret = false;
		var recvLen = 0;
		var recvStr = '';
		var sendLen = 0;
		var	sendStr = '7::9999+아직 개발 안됐어요ㅠㅠ';
		var temp = false;
		var date = new Date();
		var sessionID = '';

		socket.deviceID = '';
		
		socket.setMaxListeners(0);
		process.send(1); 

		socket.on('connection', function() {
			// skip
		});

		socket.on('end', function() {

			process.send(-1);
			log.info('['+socket.deviceID+'] : client disconneted.');

			// session status delete
			//store.srem(socket.deviceID);

			delete sockets[socket.deviceID];
			socket.end();

			if (socket.deviceID) {
				socket.deviceID = false;
			}
		});

		socket.on('data', function(buf) {
			log.debug('[data] : ' + buf);

			if (!buf) return;

			recvLen = buf.readInt32BE(0);
			recvStr = buf.toString('utf8', 4, 4 + recvLen);

			log.debug('[data] : recvLen = ' + recvLen + ', recvStr = ' + recvStr);

			if ( recvStr[0] === '1') {
				socket.deviceID = false;

				temp = recvStr.split(':');
				socket.deviceID = temp[2];  
				sockets[socket.deviceID] = socket;

				// session status insert
				//store.sadd(socket.deviceID);

				log.info('['+socket.deviceID+'] : cleint conneted.');
				
				// insert status code

				sessionID = process.pid + '|' + date.getTime();

				sendStr = '1::' + process.pid + '|' + date.getTime(); 
				ret = sendToSocket(socket, sendStr);
				if (!ret) {
					return;
				}

			}
			else if (recvStr[0] === '2') {
				log.debug('['+socket.deviceID+'] : heartbeat recv.');

				sendStr = '2::'
				ret = sendToSocket(socket, data);
				if (!ret) {
					return;
				}
			}
			else {
				ret = sendToSocket(socket, sendStr);
				if (!ret) {
					return;
				}
			}
		});

		socket.on('push', function(data) {
			temp = JSON.parse(data);
			sendStr = '5:::{"name":"push", "args":["server", "' + escape(temp.message) + '"]}';
			ret = sendToSocket(socket, sendStr);
			if (!ret) {
				// error 
			}
		});

		socket.on('error', function(err) {
			log.error('[erro] : socket.on error : ' + err);
		});
	});

	server.listen(config.server.port, function() {
		log.info('server listen : [' + config.server.port + ']');
	});
}

function sendToSocket(socket, msg) {

	try {

		var buf = new Buffer(4 + msg.length);
		buf.fill();
		buf.writeInt32BE(msg.length, 0);
		buf.write(msg, 4, msg.length);

		log.debug('['+socket.deviceID+'] : sendToSocket : [' + buf + ']');

		socket.write(buf);
		return true;
	}
	catch (err) {
		log.error('['+socket.deviceID+'] : sendToSocket error : ' + err);
		return false;
	}
}
