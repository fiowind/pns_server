
var ua_log = require('ualib').ua_log;
global.conf = require('./config');
global.log = new ua_log(conf.logLevel, conf.processName);

var net = require('net');
var cluster = require('cluster');
var numCPUs = parseInt(process.argv[2], 10) || require('os').cpus().length;

var mysql = require('mysql');

if (cluster.isMaster) {

	try {
		var total = 0;
		/*
		var db = mysql.createConnection(conf.database.mysql);
		*/

		for (var i = 0; i < numCPUs; i++) {
			cluster.fork();
		}

		cluster.on('exit', function(worker, code, signal) {
			log.error('[exit] : worker = [' + worker.process.pid + '] exit.');
			cluster.fork();
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
	catch (err) {
		log.error('cluster.isMaster catch error : ' + err);
		throw err;
	}
}
else {

	try {
		var sockets = {};
		var temp = '';
	
		var db = mysql.createConnection(conf.database.mysql);
		var redis = require('redis');
		var store = redis.createClient();
		var sub = redis.createClient();
		store.setMaxListeners(0);
		sub.setMaxListeners(0);
	
		sub.subscribe('direct');
		sub.on('message', function(channel, data) {
			if (channel !== 'direct') return;
			try {
				temp = JSON.parse(data);
				if (sockets[temp.device_id]) {
					sockets[temp.device_id].emit('push', data);
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
			var	sendStr = '7::9999+unknown protocol';
			var temp = '';
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
					_updateDeviceConnection('false', function(err, result) {
						if (err) throw err;
					});
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
					ret = _sendToSocket(socket, sendStr);
					if (!ret) {
						return;
					}
	
					_selectDeviceConnection(socket.deviceID, function(err, rows) {
							if (err) throw err;
	
							if (rows.length) {
								if (rows[0].is_conneted === 'true') {
									log.info('['+socket.deviceID+'] : already conneted. force disconnect.');
									socket.emit('end');
								}
								else {
									_updateDeviceConnection('true', function(err, result) {
										if (err) throw err;
									});
								}
							}
					});
				}
				else if (recvStr[0] === '2') {
					log.debug('['+socket.deviceID+'] : heartbeat recv.');
	
					sendStr = '2::'
					ret = _sendToSocket(socket, sendStr);
					if (!ret) {
						return;
					}
				}
				else if (recvStr[0] === '6') {
					log.debug('['+socket.deviceID+'] : ack recv.');
					
					temp = recvStr.split(':');
					var temp2 = temp[3].split('+');;  
			
					var ack = {};
					ack.tid = temp2[0];
					ack.errCode = temp2[1];
	
					if (parseInt(ack.errCode, 10) === 0) {
						_updatePushDirect('success', function(err, result) {
							if (err) throw err;
						});
					}
					else {
						_updatePushDirect('fail', function(err, result) {
							if (err) throw err;
						});
					}
				}
				else {
					ret = _sendToSocket(socket, sendStr);
					if (!ret) {
						return;
					}
				}
			});
	
			socket.on('push', function(data) {
				temp = JSON.parse(data);
	
				var sendData = {};
				sendData.tid = temp.tid;
				sendData.app_id = temp.app_id;
				sendData.text = escape(temp.text);
				sendData.url = escape(temp.url);
	
				sendStr = '5:::{"name":"push", "args":["server", "' + JSON.stringify(sendData) + '"]}';
				ret = _sendToSocket(socket, sendStr);
				if (!ret) {
					// error 
				}
			});
	
			socket.on('error', function(err) {
				log.error('[erro] : socket.on error : ' + err);
			});
		});
	
		server.listen(conf.server.port, function() {
			log.info('server listen : [' + conf.server.port + ']');
		});
	}
	catch (err) {
		log.error('worker catch error : ' + err);
		throw err;
	}
}

function _sendToSocket(socket, msg) {

	try {
		var buf = new Buffer(4 + msg.length);
		buf.fill();
		buf.writeInt32BE(msg.length, 0);
		buf.write(msg, 4, msg.length);

		log.debug('['+socket.deviceID+'] : _sendToSocket : '+msg.length+' ['+msg+']');

		socket.write(buf);
		return true;
	}
	catch (err) {
		log.error('['+socket.deviceID+'] : _sendToSocket error : ' + err);
		return false;
	}
}

function _updateDeviceConnection(is_connected, callback) {
	try {
		var sql = 'update device_connection set is_connected = ? ' +
																		 'where device_id = ?';
		var arg = [ is_connected, socket.deviceID ];
		db.query(sql, arg, function(err, result) {
			callback(err, result);
		});
	}
	catch (err) {
		throw err;
	}
}

function _updatePushDirect(resStatus, callback) {
	try {
		var sql = 'update push_direct set status = ?, sent_at = ?, attempted_retry_cnt = + 1, last_attemped_at = ? ' +
															 'where tid = ?';
		var arg = [ resStatus, Date.now(), Date.now(), data.tid ];
		db.query(sql, arg, function(err, result) {
			callback(err, result);
		});
	}
	catch (err) {
		throw err;
	}
}
