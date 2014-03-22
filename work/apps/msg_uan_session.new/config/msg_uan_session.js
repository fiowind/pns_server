
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

var workerProcess = require('./lib/workerProcess');

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
			if (results[0] && result[1]) {
				callback(null);
			}
			else {
				callback(new Error('database connect fail. mysql = [' + result[0] + '], redis = [' + result[1] + ']'));
			}
		}
	});
}

function _doProcess(callback) {

	workerProcess.start();
}

function _endProcess(code) {

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
