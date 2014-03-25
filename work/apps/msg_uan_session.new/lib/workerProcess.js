var os = require('os');
var net = require('net');
var async = require('async');

function start() {

	var sockets = {};
	var workerChannel = os.hostname() + '|' + conf.server.port + '|' + process.pid;
	var server = false;

	log.debug('worker [' + process.pid + '] started.!!!');

	// listener unlimited
	redisSub.setMaxListeners(0);
	redisSub.subscribe(workerChannel);
	redisSub.on('message', function(channel, data) {
		var temp = '';

		if (channel !== workerChannel) return;

		temp = JSON.parse(data);
		if (sockets[temp.device_id]) {
			sockets[temp.device_id].emit('push', data);
		}
	});

	server = net.createServer(function(socket) {
		socket.setMaxListeners(0);

		socket.on('connection', function() {
			log.debug('socket.on [connection] : client connected. : ' + process.pid);
		});

		socket.on('end', function() {
			if (socket.deviceId) {
				log.debug('[' + socket.deviceId + '] : client disconnected. : ' + process.pid);	
		
				delete sockets[socket.deviceId];	
				_updateDeviceConnection(socket.deviceId, 'false', null, function(err, result) {
					if (err) {
						log.error('_updateDeviceConnection error device_id = [' + socket.deviceId + '] : ' + err);
					}
				});
				
				socket.deviceId = false;
				socket.end();
			}
			else {
				socket.end();
			}
		});

		socket.on('data', function(chunk) {

			var recvLen = 0;
			var recvStr = '';

			if (!chunk) return;
			log.debug('[data] : ' + chunk);

			recvLen = chunk.readInt32BE(0);
			recvStr = chunk.toString('utf8', 4, 4 + recvLen);

			log.debug('[data] : recvLen = [' + recvLen + ', recvStr = [' + recvStr + ']');

			switch(recvStr[0]) {
				case '1':
					var temp = '';
					var sessionId = '';

					socket.deviceId = false;
					temp = recvStr.split(':');
					socket.deviceId = temp[2];

					_selectDeviceConnection(socket.deviceId, function(err, rows) {
						if (err) {
							log.error('_selectDeviceConnection error device_id = [' + socket.deviceId + '] : ' + err);
						}
						else {
							if (rows.length) {

								sockets[socket.deviceId] = socket;
								sessionId = workerChannel + '|' + Date.now();

								log.info('[' + socket.deviceId + '] : client connected. sessionId = [' + sessionId + ']');

								_updateDeviceConnection(socket.deviceId, 'true', sessionId, function(err, result) {
									if (err) {
										log.error('_updateDeviceConnection error device_id = [' + socket.deviceId + '] : ' + err);
									}
									else {	
										sendStr = '1::' + sessionId;
										_sendToSocket(socket, sendStr, function(err) {
											if (err) log.error('_sendToSocket error : ' + err);
											else {
												_doSendOfflineMsg(socket);
											}
										});
									}
								});
							}
							else {
								log.warning('unknown user connected. force disconnected');
								socket.deviceId = false;
								socket.end();
							}
						}
					});
					break;
				case '2':
					var sendStr = '2::';
					log.debug('[' + socket.deviceId + '] : heartbeat recv.');

					_sendToSocket(socket, sendStr, function(err) {
						if (err) log.error('_sendToSocket error : ' + err);
					});
					break;
				case '5':
					//'5:::{"name": "poll", "args": ["client", {"device_id": "459106046051829"}]';
            		var a = recvStr.indexOf('{');
            		var b = JSON.parse(recvStr.slice(a));
            		socket.deviceId = b.args[1].device_id;	

					log.debug('[' + socket.deviceId + '] : event recv. [' + JSON.stringify(b) + ']');

					_getQueueMsg(socket);

					socket.deviceId = false;
					socket.end();

					break;
				case '6':
					var temp = '';
					var temp2 = '';
					var ack = {};

					log.debug('[' + socket.deviceId + '] : ack recv.');

					temp  = recvStr.split(':');
					temp2 = temp[3].split('+');

					ack.tid = temp2[0];
					ack.errCode = temp2[1];

					log.info('ack.tid = [' + ack.tid + '], ack.errCode = [' + ack.errCode + ']');

					if (parseInt(ack.errCode, 10) === 0) {
						_updatePushDirect(socket.deviceId, ack.tid, 'success', function(err, result) {
							if (err) log.error('_updatePushDirect error : ' + err);	
						});
					}
					else {
						_updatePushDirect(socket.deviceId, ack.tid, 'failed', function(err, result) {
							if (err) log.error('_updatePushDirect error : ' + err);	
						});
					}

					break;
				case '0':
				case '3':
				case '4':
				case '7':
				case '8':
				default:
					var sendStr = '7::9999+unknown protocol';
					_sendToSocket(socket, sendStr, function(err) {
						if (err) log.error('_sendToSocket error : ' + err);
					});
					break;
			}
		});

		socket.on('push', function(data) {
			var temp = JSON.parse(data);
			var sendData = {};
			var sendStr = '';

			sendData.tid = temp.tid;
			sendData.app_id = temp.app_id;
			sendData.text = JSON.parse(temp.text);
			sendData.url = temp.url;

			sendStr = '5:::{"name": "push", "args": ["server", ' + JSON.stringify(sendData) + ']}';
			_sendToSocket(socket, sendStr, function(err) {
				if (err) log.error('_sendToSocket error : ' + err);
			});
		});

		socket.on('poll', function(data) {
			sendStr = '5:::{"name": "poll", "args": ' + JSON.stringify(data) + '}';
			_sendToSocket(socket, sendStr, function(err) {
				if (err) log.error('_sendToSocket error : ' + err);
			});
		});

		socket.on('error', function(err) {
			log.error('socket.on error : ' + err);
			log.error('socket.on error : [' + socket.deviceId + '] client disconnected.');

			delete sockets[socket.deviceId];

			if (socket.deviceId) {
				_updateDeviceConnection(socket.deviceId, 'false', null, function(err, result) {
					if (err) {
						log.error('socket.on error : _updateDeviceConnection error device_id = [' + socket.deviceId + '] : ' + err);
					}
					socket.deviceId = false;
					socket.end();
				});
			}
		});
	});

	server.listen(conf.server.port, function() {
		log.info('server listen : [' + conf.server.port + ']'); 	
	});

	setInterval(function() {
		server.getConnections(function(err, count) {
			if (count > 0) log.info('worker process.pid = [' + process.pid + '], sockets = [' + count + ']');
		});
	}, 5000);
}
exports.start = start;

function _sendToSocket(socket, msg, callback) {

	try {
		var temp = new Buffer(msg);
		var buf = new Buffer(4 + temp.length);
		buf.fill();
		buf.writeInt32BE(temp.length, 0);
		buf.write(temp.toString(), 4, temp.length);

		log.debug('['+socket.deviceId+'] : _sendToSocket : ' + temp.length + ' [' + msg + ']');

		socket.write(buf);
		callback(null);
	}
	catch (catchErr) {
		callback(catchErr);
	}
}

function _selectDeviceConnection(deviceId, callback) {
	var sql = '';

	sql = "select * from device_connection where device_id = '" + deviceId + "'";

	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
		else {
			conn.query(sql, function(err, rows) {
				conn.release();
				callback(err, rows);
			});
		}
	});
}

function _updateDeviceConnection(deviceId, isConnected, sessionId, callback) {

	var sql = '';
	var sessionIdLike = '';

	if (sessionId) { 
		sql = "update device_connection set is_connected = '" + isConnected + "', session_id = '" + sessionId + "'" +
									" where device_id = '" + deviceId + "'";
	}
	else {
		sql = "update device_connection set is_connected = '" + isConnected + "', session_id = " + sessionId + 
									" where device_id = '" + deviceId + "'";
	}

	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
		else {
			conn.query(sql, function(err, result) {
				if (err) {
					conn.rollback(function() {
						conn.release();
						callback(err);
					});
				}
				else {
					conn.commit(function(err) {
						if (err) {	
							conn.rollback(function() {
								conn.release();
								callback(err);
							});
						}
						else {
							conn.release();
							callback(err, result);
						}
					});
				}
			});
		}
	});
}

function _updatePushDirect(deviceId, tid, status, callback) {

	var sql = '';

	sql = "update push_direct set status = '" + status + "'" + 
							   ", sent_at = " + (Date.now()).toString().slice(0,10) + 
							   ", attempted_retry_cnt = attempted_retry_cnt + 1 " +
							   ", last_attempted_at = " + (Date.now()).toString().slice(0,10) +
						  " where tid = " + tid;

	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
		else {
			conn.query(sql, function(err, result) {
				if (err) {
					conn.rollback(function() {
						conn.release();
						callback(err);
					});
				}
				else {
					conn.commit(function(err) {
						if (err) {	
							conn.rollback(function() {
								conn.release();
								callback(err);
							});
						}
						else {
							conn.release();
							callback(err, result);
						}
					});
				}
			});
		}
	});
}

function _doSendOfflineMsg(socket) {

	async.waterfall([
		function selectQueueOfflineMsg(callback) {
			_selectQueueOfflineMsg(socket.deviceId, function(err, rows) {
				callback(err, rows);
			}); 
		},
		function updateQueueOfflineMsg(rows, callback) {
			if (rows.length === 0) {
				callback(null, null);
			}
			else {
				log.debug('[' + socket.deviceId + '] _selectQueueOfflineMsg rows.length = ' + rows.length);

				for (var i = 0; i < rows.length; i++) {
					(function(row) {
						_updateQueueOfflineMsg(row, function(err, result) {
							callback(err, row);
						});
					})(rows[i]);
				}
			}
		}
	],
	function(err, row) {
		if (err) {
			log.error('_doSendOfflineMsg error : ' + err);
		}
		else {
			if (row) {
				socket.emit('push', JSON.stringify(row));
			}
		}
	});
}

function _selectQueueOfflineMsg(deviceId, callback) {
	var sql = '';
	sql = "select * from push_direct " +
				 " where device_id = '" + deviceId + "'" +
				 "   and status = 'offline'";

	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
		else {
			conn.query(sql, function(err, rows) {
				conn.release();
				callback(err, rows);
			});
		}
	});
}

function _updateQueueOfflineMsg(row, callback) {
	var sql = '';
	var status = row.status; 

	if (status === 'requesting') status = 'requested';
	else status = 'retried';

	sql = "update push_direct set status = '" + status + "'" +
						  " where tid = " + row.tid;

	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
		else {
			conn.query(sql, function(err, result) {
				if (err) {
					conn.rollback(function() {
						conn.release();
						callback(err);
					});
				}
				else {
					conn.commit(function(err) {
						if (err) {	
							conn.rollback(function() {
								conn.release();
								callback(err);
							});
						}
						else {
							conn.release();
							callback(err, result);
						}
					});
				}
			});
		}
	});
}

function _getQueueMsg(socket) {

	async.waterfall([
		function selectQueueMsg(callback) {
			_selectQueueMsg(socket.deviceId, function(err, rows) {
				callback(err, rows);
			}); 
		},
		function updateQueueMsg(rows, callback) {

			var arr = [];
			var temp = '';

			if (rows.length === 0) {
				callback(null, null);
			}
			else {
				log.debug('[' + socket.deviceId + '] _selectQueueMsg rows.length = ' + rows.length);
				arr.push('server');

				for (var i = 0; i < rows.length; i++) {
					(function(temp, i, len) {
						_updateQueueMsg(temp, function(err, row) {
							var sendData = {};
							sendData.tid = row.tid;
							sendData.app_id = row.app_id;
							if (row.text) sendData.text = JSON.parse(row.text);
							if (row.url) sendData.url = row.url;
							arr.push(sendData);

							if (len === (i+1)) {
								callback(err, arr);
							}
						});
					})(rows[i], i, rows.length);
				}
			}
		}
	],
	function(err, arr) {
		if (err) {
			log.error('_getQueueMsg error : ' + err);
		}
		else {
			if (arr) {
				log.debug(JSON.stringify(arr));
				socket.emit('poll', arr);
			}
		}
	});
}

function _selectQueueMsg(deviceId, callback) {
	var sql = '';
	sql = "select * from push_direct " +
				 " where device_id = '" + deviceId + "'" +
				 "   and status = 'offline'";

	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
		else {
			conn.query(sql, function(err, rows) {
				conn.release();
				callback(err, rows);
			});
		}
	});
}

function _updateQueueMsg(row, callback) {
	var sql = '';
	var status = row.status; 

	if (status === 'requesting') status = 'success';
	else status = 'success';

	sql = "update push_direct set status = '" + status + "'" +
						  " where tid = " + row.tid;

	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
		else {
			conn.query(sql, function(err, result) {
				if (err) {
					conn.rollback(function() {
						conn.release();
						callback(err);
					});
				}
				else {
					conn.commit(function(err) {
						if (err) {	
							conn.rollback(function() {
								conn.release();
								callback(err);
							});
						}
						else {
							conn.release();
							callback(err, row);
						}
					});
				}
			});
		}
	});
}

