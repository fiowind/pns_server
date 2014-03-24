
function start() {

	var sockets = {};
	var workerChannel = os.hostname() + '|' + conf.server.port + '|' + process.pid;
	var temp = '';
	var server = false;

	log.debug('worker [' + proces.pid + '] started.!!!');

	// listener unlimited
	redisSub.setMaxListeners(0);
	redisSub.subscribe(workerChannel);
	redisSub.on('message', function(channel, data) {
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
			if (!chunk) return;
			log.debug('[data] : ' + chunk);

			recvLen = chunk.readInt32BE(0);
			recvStr = chunk.toString('utf8', 4, 4 + recvLen);

			log.debug('[data] : recvLen = [' + recvLen + ', recvStr = [' + recvStr + ']');

			switch(recvStr[0]) {
				case '1':
					socket.deviceId = false;
					temp = recvStr.split(':');
					socket.deviceId = temp[2];

					_selectDeviceConnection(socket.deviceId, function(err, rows) {
						if (err) {
							log.error('_selectDeviceConnection error device_id = [' + socket.deviceId + '] : ' + err);
						}
						else {
							if (rows.length) {
								log.info('[' + socket.deivceId + '] : client connected. process.pid = [' + process.pid + ']');

								sockets[socket.deviceId] = socket;
								sessionId = os.hostname() + '|' + conf.server.port + '|' + process.pid + '|' + Date.now();

								_updateDeviceConnection(socket.deviceId, 'true', sessionId, function(err, result) {
									if (err) {
										log.error('_updateDeviceConnection error device_id = [' + socket.deviceId + '] : ' + err);
									}
									else {	
										sendStr = '1::' + sessionId;
										_sendDataToSocket(socket, sendStr, function(err) {
											if (err) log.error('_sendDataToSocket error : ' + err);
										});
									}
								});
							}
							else {
								socket.deviceId = false;
								socket.end();
							}
						}
					});
					break;
				case '2':
					log.debug('[' + socket.deviceId + '] : heartbeat recv.');
					sendStr = '2::';
					_sendDataToSocket(socket, sendStr, function(err) {
						if (err) log.error('_sendDataToSocket error : ' + err);
					});
					break;
				case '5':
					log.debug('[' + socket.deviceId + '] : event recv.');

					break;
				case '6':
					log.debug('[' + socket.deviceId + '] : ack recv.');

					temp  = recvStr.split(':');
					temp2 = temp[3].split('+');

					ack.tid = temp2[0];
					ack.errCode = temp2[1];

					if (parseInt(ack.errCode, 10) === 0)
						_updatePushDirect(socket.deviceId, ack.tid, 'success');
					else
						_updatePushDirect(socket.deviceId, ack.tid, 'failed');

					break;
				case '0':
				case '3':
				case '4':
				case '7':
				case '8':
				default:
					sendStr = '7::9999+unknown protocol';
					_sendDataToSocket(socket, sendStr, function(err) {
						if (err) log.error('_sendDataToSocket error : ' + err);
					});
					break;
			}
		});

		socket.on('push', function(data) {
			temp = JSON.parese(dadta);

			sendData.tid = temp.tid;
			sendData.app_id = temp.app_id;
			sendData.text = escape(temp.text);
			sendData.url = escape(temp.url);

			sendStr = '5:::{"name": "push", "args": ["server", ' + JSON.stringify(sendData) + ']}';
			_sendDataToSocket(socket, sendStr, function(err) {
				if (err) log.error('_sendDataToSocket error : ' + err);
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
		var buf = new Bufffer(4 + msg.length);
		buf.fill();
		buf.writeInt32BE(msg.length, 0);
		buf.write(msg, 4, msg.length);

		log.debug('['+socket.deviceId+'] : _sendToSocket : ' + msg.length + ' [' + msg + ']');

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

	sql = "update device_connection set is_connected = '" + isConnected + "', session_id = '" + sessionId + "'" +
									" where device_id = '" + deviceId + "'";

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

function _updatePushDirect(deviceId, tid, status) {

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

function _getQueuePushDirect(socket) {

	async.waterfall([
		function selectQueuePushDirect(callback) {
			_selectQueuePushDirect(socket.deviceId, function(err, rows) {
				callback(err, rows);
			}); 
		},
		function updateQueuePushDirect(rows, callback) {
			if (rows.length === 0) {
				callback(null, null);
			}
			else {
				log.debug('[' + socket.deviceId + '] push_direct rows.length = ' + rows.length);

				for (var i = 0; i < rows.length; i++) {
					(function(row) {
						_updateQueuePushDirect(row, function(err, result) {
							callback(err, row);
						});
					})(rows[i]);
				}
			}
		}
	],
	function(err, row) {

}

function _selectQueuePushDirect(deviceId, callback) {
	var sql = '';
	sql = "select * from push_direct " +
				 " where deivce_id = '" + deviceId + "'" +
				 "   and (status = 'offline' or status = 'requesting' or status = 'retrying')";

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

function _updateQueuePushDirect(row, callback) {
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




