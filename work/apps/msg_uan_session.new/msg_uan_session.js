
global.conf = require('./config/conf');
var ua_log = require('ualib').ua_log;
global.log = new ua_log(conf.logLevel, conf.processName);
global.mysqlPool = false;
global.redisSub = false;

var domain = require('domain');
var main = domain.create();

var mysql = require('mysql');
var redis = require('redis');

var async = require('async');
var os = require('os');
var net = require('net');
var cluster = require('cluster');
var numCPUs = parseInt(process.argv[2], 10) || os.cpus().length;

var workerProcess = require('./lib/workerProcess');

function _updateDeviceConnection_all(workerPid, callback) {

	var sql = '';
	var sessionIdLike = '';

	sessionIdLike = os.hostname() + '|' + conf.server.port + '|' + workerPid + '%';
	sql = "update device_connection set is_connected = 'false', session_id = null" +
								" where session_id like '" + sessionIdLike + "'";

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

function _signalHandler() {
	process.on('SIGINT', function() {
		log.info('process catch signal : SIGINT');
		_endProcess(0);
	});

	process.on('SIGTERM', function() {
		log.info('process catch signal : SIGTERM');
		_endProcess(0);
	});
}

function _doConnectMysqlPool(callback) {

	mysqlPool = mysql.createPool(conf.database.mysql);
	
	// connect Check
	_connectCheck(callback);

	/// connect Check 30 Min
	setInterval(function() {
		log.info('MySQL connect check start...[1000 * 1800] sec');
		_connectCheck(null);
	}, 1000 * 1800);

	function _connectCheck(callback) {
		mysqlPool.getConnection(function(err, conn) {
			if (err) {
				log.error('_doConnectMysqlPool() : mysqlPool.getConnection() error : ' + err.stack);

				conf.database.mysql.status = false;
				mysqlPool.end();

				setTimeout(function() {
					_doConnectMysqlPool(callback);
				}, 2000);
			}
			else {
				log.info('MySQL connect check ok...');
				conn.release();
				conf.database.mysql.status = true;
				if (typeof callback === 'function') {
					callback(null, conf.database.mysql.status);
				}
				else {
					return;
				}
			}
		});
	}
}

function _doConnectRedis(callback) {

	// auto reconnect
	redisSub = redis.createClient();

	redisSub.on('error', function(err) {
		conf.database.redis.status = false;
		log.error(err);
	});

	redisSub.on('connect', function() {
		conf.database.redis.status = true;
		callback(null, conf.database.redis.status);
	});

	redisSub.on('end', function() {
		conf.database.redis.status = false;
		log.error('redis disconnected');
	});
}

function _initProcess(callback) {

	if (global.conf) {
		global.conf = require('./config/conf');
	}

	if (global.log) {
		ua_log = require('ualib').ua_log;
		global.log = new ua_log(conf.logLevel, conf.processName);
	}

	// signal Handler
	_signalHandler();

	// database Connect
	async.series([
		function(cb) {
			global.mysqlPool = false;
			_doConnectMysqlPool(function(err, status) {
				cb(err, status);
			});
		},
		function(cb) {
			global.redisSub = false;
			_doConnectRedis(function(err, status) {
				cb(err, status);
			});
		}
	],
	function(err, results) {
		if (err) callback(err);
		else {
			if (results[0] && results[1]) {
				callback(null);
			}
			else {
				callback(new Error('database connect fail. mysql = [' + results[0] + '], redis = [' + results[1] + ']'));
			}
		}
	});
}

function _doProcess(callback) {

	var workerCnt = 0;

	if (cluster.isMaster) {
		for (var i = 0; i < numCPUs; i++) {
			cluster.fork();
			workerCnt++;
		}

		cluster.on('exit', function(worker, code, signal) {
			workerCnt--;

			if (worker.suicide === true) {
				// skip
				log.info('[exit] : worker.pid = [' + worker.process.pid + '] exit. worker.suicide exit.');
			}
			else {
				log.error('[exit] : worker.pid = [' + worker.process.pid + '] exit. reforked');

				_updateDeviceConnection_all(worker.process.pid, function(err, result) {
					if (err) log.error('_updateDeviceConnection_all error : ' + err);
				});

				cluster.fork();
				workerCnt++;
			}
		});
	}
	else {
		workerProcess.start();
	}
}

function _endProcess(code) {

	log.debug('_endProcess : [' + process.pid + '] code = ' + code); 

	if (cluster.isMaster) {
		// skip
	}
	else {
		_updateDeviceConnection_all(process.pid, function(err, result) {
			if (err) log.error('_updateDeviceConnection_all error : ' + err);
		});
	}

	setTimeout(function() {
		if (mysqlPool) mysqlPool.end();
		if (redisSub) redisSub.end();
		process.exit(code);
	}, 1000);
}

main.on('error', function(err) {
	log.error(err.stack);

	try {
		_endProcess(-1);
	}
	catch (catchErr) {
		log.error('main.on catchErr : ' + err);
	}
});

main.run(function() {

	_initProcess(function(err) {
		if (err) throw err;

		_doProcess(function(err) {
			if (err) throw err;
		});
	});
});
