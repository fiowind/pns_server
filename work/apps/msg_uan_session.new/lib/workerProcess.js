
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

		socket.on('data', function(data) {

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
						callback(err);
					});
				}
				else {
					conn.commit(function(err) {
						if (err) {	
							conn.rollback(function() {
								callback(err);
							});
						}
						else {
							callback(err, result);
						}
					});
				}
			});
		}
	});
}


