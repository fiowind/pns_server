
var ua_log = require('ualib').ua_log;
global.conf = require('./config');
global.log = new ua_log(conf.logLevel, conf.processName);

var os = require('os');
var net = require('net');
var cluster = require('cluster');
var numCPUs = parseInt(process.argv[2], 10) || require('os').cpus().length;

var mysql = require('mysql');

if (cluster.isMaster) {

	try {
		var total = 0;
		var workerCnt = 0;
		var db = mysql.createConnection(conf.database.mysql);

		for (var i = 0; i < numCPUs; i++) {
			cluster.fork();
			workerCnt++;
		}

		cluster.on('exit', function(worker, code, signal) {
			log.error('[exit] : worker = [' + worker.process.pid + '] exit.');
			//cluster.fork();
			var sessionIDLike = os.hostname() + '|' + conf.server.port + '|' + worker.process.pid + '%';
	
			//conf.status.db = false;
			_updateDeviceConnection_all(sessionIDLike, function(err) {
				if (err) throw err;
				workerCnt--;
			}); 
		});

		/*
		Object.keys(cluster.workers).forEach(function(id) {
			cluster.workers[id].on('message', function(msg) {
				total += msg;
			});
		});

		setInterval(function() {
			log.info('[cnt ] : ' + total + ' sockets.');
		}, 5000);
		*/

		// kill -2
		process.on('SIGINT', function() {
			Object.keys(cluster.workers).forEach(function(id) {
				cluster.workers[id].kill('SIGINT');
			});

			setInterval(function() {
				if (workerCnt === 0) {
					db.end();
					log.info('process exit.');
					process.exit(0);
				}
			}, 1000);
		});

		// kill -15
		process.on('SIGTERM', function() {
			Object.keys(cluster.workers).forEach(function(id) {
				cluster.workers[id].kill('SIGTERM');
			});

			setInterval(function() {
				if (workerCnt === 0) {
					db.end();
					log.info('process exit.');
					process.exit(0);
				}
			}, 1000);
		});
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
			var sessionID = '';
	
			socket.deviceID = '';
			
			socket.setMaxListeners(0);
			//process.send(1); 
	
			socket.on('connection', function() {
				// skip
			});
	
			socket.on('end', function() {
	
				//process.send(-1);
				log.info('['+socket.deviceID+'] : client disconnected.');
				_updateDeviceConnection(socket.deviceID, 'false', null);

				delete sockets[socket.deviceID];

				if (socket.deviceID) {
					socket.deviceID = false;
					socket.end();
				}
	
				// session status delete
				//store.srem(socket.deviceID);
	
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

					var sql = 'select * from device_connection where device_id = ?';
					var arg = [ socket.deviceID ];
					db.query(sql, arg, function(err, rows) {
						
						if (rows.length) {
							/*
							if (rows[0].is_connected === 'true') {
								log.info('['+socket.deviceID+'] : already conneted. force disconnect.');
								socket.deviceID = false;
								socket.end();
							}
							else {
							*/
								sockets[socket.deviceID] = socket;
						 		log.info('['+socket.deviceID+'] : client conneted.');

								sessionID = os.hostname() + '|' + conf.server.port + '|' + process.pid + '|' + Date.now();

								sendStr = '1::' + sessionID;
								ret = _sendToSocket(socket, sendStr);
								if (!ret) {
									return;
								}
								//store.sadd(socket.deviceID);

								// is_connected = true
								_updateDeviceConnection(socket.deviceID, 'true', sessionID);

								// offline message resend
								_selectPushDirect(socket);
							/*
							}
							*/
						}
						else {
							//process.send(-1)
							socket.end();
						}

					})
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
						_updatePushDirect(socket.deviceID, ack.tid, 'success');
					}
					else {
						_updatePushDirect(socket.deviceID, ack.tid, 'retrying');
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
	
				sendStr = '5:::{"name":"push", "args":["server", ' + JSON.stringify(sendData) + ']}';
				ret = _sendToSocket(socket, sendStr);
				if (!ret) {
					// error 
				}
			});
	
			socket.on('error', function(err) {
				log.error('[erro] : socket.on error : ' + err);
				if (err.code === 'ECONNRESET') {
					//process.send(-1);
					log.info('['+socket.deviceID+'] : client disconneted.');
	
					// session status delete
					//store.srem(socket.deviceID);
	
					delete sockets[socket.deviceID];
	
					if (socket.deviceID) {
						_updateDeviceConnection(socket.deviceID, 'false', null);
						socket.deviceID = false;
						socket.end();
					}
				}
			});
		});
	
		server.listen(conf.server.port, function() {
			log.info('server listen : [' + conf.server.port + ']');
		});

		setInterval(function() {
			server.getConnections(function(err, count) {
				log.info('worker process.pid = [' + process.pid + '], sockets = [' + count + ']');
			});
		}, 5000);

		process.on('uncaughtException', function(err) {
			log.info('Caught exception: ' + err);
		});
		
		// kill -2
		process.on('SIGINT', function() {
			setTimeout(function() {
					db.end();
					process.exit(0);
			}, 1000);
		}); 
	
		// kill -15
		process.on('SIGTERM', function() {
			setTimeout(function() {
					db.end();
					process.exit(0);
			}, 1000);
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

/*
function _selectDeviceConnection(deviceID, callback) {
	try {
		var sql = 'select * from device_connection where device_id = ?';
		var arg = [ socket.deviceID ];
		db.query(sql, arg, function(err, rows) {
			callback(err, rows);
		})
	}
	catch (err) {
		throw err;
	}
}
*/

function _updateDeviceConnection(deviceID, is_connected, sessionID) {
	try {
		var sql = 'update device_connection set is_connected = ?, session_id = ? ' +
										 'where device_id = ?';
		var arg = [ is_connected, sessionID, deviceID ];
		db.query(sql, arg, function(err, result) {
        	if (err) {
           		log.error('['+deviceID+'] _updateDeviceConnection error device_connection.device_id = [' + is_connected + '] : ' + err);
        	}
           //log.debug('['+deviceID+'] _updateDeviceConnection sucess push_gcm.device_id = [' + is_connected + '] : ' + JSON.stringify(result));

			db.commit(function(err) {
				if (err) {
					db.rollback(function() {
						throw err;
					});
				}
			});
		});
	}
	catch (err) {
		throw err;
	}
}

function _updateDeviceConnection_all(sessionID, callback) {
	try {
		var sql = 'update device_connection set is_connected = ?, session_id = ? ' +
										 'where session_id like ?';
		var arg = [ 'false', null, sessionID ];
		db.query(sql, arg, function(err, result) {
        	if (err) {
           		log.error('['+sessionID+'] _updateDeviceConnection_all error device_connection.is_sonnected = [false] : ' + err);
				callback(err);
        	}
           log.debug(JSON.stringify(result));

			db.commit(function(err) {
				if (err) {
					db.rollback(function() {
						callback(err);
					});
				}
				log.debug('ok');
				callback(null);
			});
		});
	}
	catch (err) {
		throw err;
	}
}

function _updatePushDirect(deviceID, tid, resStatus) {
	try {
		var now = (Date.now()).toString().slice(0,10);
		var sql = 'update push_direct set status = ?, sent_at = ?, attempted_retry_cnt = attempted_retry_cnt + 1, last_attempted_at = ? ' +
								   'where tid = ?';
		var arg = [ resStatus, now, now, tid ];
		db.query(sql, arg, function(err, result) {
        	if (err) {
           		log.error('['+deviceID+'] _updatePushDirect error push_direct.tid = [' + tid + '] : ' + err);
               	throw err;
        	}
           //log.debug('['+deviceID+'] _updatePushDirect sucess push_direct.tid = [' + tid + '] : ' + JSON.stringify(result));
           
			db.commit(function(err) {
				if (err) {
					db.rollback(function() {
						throw err;
					});
				}
			});
		});
	}
	catch (err) {
		throw err;
	}
}

function _selectPushDirect(socket) {

	try {
		//db.beginTransaction(function(err) {
			//if (err) throw err;

			var sql = 'select * from push_direct ' + 
						  'where device_id = ? ' + 
							'and status = ? ';
			var arg = [ socket.deviceID, 'offline' ];
			db.query(sql, arg, function(err, rows) {
				if (err) throw err;

				log.info('['+socket.deviceID+'] select rows.length = ['+rows.length+']');
				for (var i = 0; i < rows.length; i++) {
					// do send 
					socket.emit('push', JSON.stringify(rows[i]));

					sql = 'update push_direct set status = ? where tid = ?';
					if (rows[i].status === 'requesting') 
						arg = [ 'requested', rows[i].tid, socket, rows[i] ];
					else
						arg = [ 'retried', rows[i].tid, socket, rows[i] ];

					db.query(sql, arg, function(err, result) {
						if (err) {
							db.rollback(function() {
								throw err;
							});
						};
						db.commit(function(err) {
							if (err) {
								db.rollback(function() {
									throw err;
								});
							}
							log.debug('update success!');
						}); // end commit
					}); // end update
				} // end for
			}); // end select
		//}); // end transaction
	}
	catch (err) {
		throw err;
	}
}

