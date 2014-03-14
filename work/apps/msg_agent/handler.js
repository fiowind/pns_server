
var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');
var net = require('net');

var gcm = require('node-gcm');
var Iconv = require('iconv').Iconv;

var E2U = new Iconv('EUC-KR', 'UTF-8//TRANSLIT//IGNORE');
var U2E = new Iconv('UTF-8', 'EUC-KR//TRANSLIT//IGNORE');

function smsSender(data) {

	try {
		var urlStr = false;
		var urlObj= false;
		var option = false;
		var req = false;

		log.debug('[SMS] data : ' + JSON.stringify(data));

		urlStr = conf.sms.url + '?' +
				 'id=Svc' + '&' +
				 'op=sendsms' + '&' +
				 'smdn=' + data.sender_mdn + '&' +
				 'rmdn=' + data.receiver_mdn + '&' +
				 'call=' + data.callback_mdn + '&' +
				 'msg=' + escape(U2E.convert(data.text).toString('binary'));
	
		urlObj = url.parse(urlStr);
	
		option = {
			hostname: urlObj.hostname,
			port: urlObj.port,
			path: urlObj.path,
			method: 'GET'
		};
	
		req = http.request(option, function(res) {
			log.debug('[SMS] STATUS: ' + res.statusCode);
			log.debug('[SMS] HEADER: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
	
			if (parseInt(res.statusCode, 10) !== 200) {
				if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
					_updateResult('failed', data.tid);
				else 
					_updateResult('retrying', data.tid);
				return;
			}
	
			res.on('data', function(chunk) {
				log.debug('[SMS] BODY: ' + chunk);
				conf.sms.send--;
	
				if (chunk.toString() === 'RESULT=OK\n') {
					// update success
					_updateResult('success', data.tid);
				}
				else {
					// update fail
					if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
						_updateResult('failed', data.tid);
					else 
						_updateResult('retrying', data.tid);
				}
			});
		});
	
		req.on('error', function(err) {
			log.error('[SMS] request error: ' + err);
		});
	
		conf.sms.send++;
		req.end();
	
		function _updateResult(resStatus, tid) {
			var now = (Date.now()).toString().slice(0,10);
			var sql = 'update push_sms set status = ?, sent_at = ?, attempted_retry_cnt = attempted_retry_cnt + 1, last_attempted_at = ? ' +
									'where tid = ?';
			var arg = [ resStatus, now, now, tid ];
			db.query(sql, arg, function(err, result) {
				if (err) {
					log.error('[SMS] _updateResult error push_sms.tid = [' + tid + '] : ' + err);
					throw err;
				}
				log.info('[SMS] _updateResult sucess push_sms.tid = [' + tid + '] : ' + JSON.stringify(result));

				db.commit(function(err) {
					if (err) {
						db.rollback(function() {
							throw err;
						});
					}
				});
			});
		}
	}
	catch (err) {
		throw err;
	}
}
exports.smsSender = smsSender;

function mmsSender(data) {

	try {
		log.debug('[MMS] data : ' + JSON.stringify(data));
	}
	catch (err) {
		throw err;
	}
	return;
}
exports.mmsSender = mmsSender;

function gcmSender(data) {
	
	try {
		var message = false;
		var sender = false;
		var regid = [];

		log.debug('[GCM] data : ' + JSON.stringify(data));

		message = new gcm.Message();
		sender = new gcm.Sender(data.api_key);
	
		if (data.text) message.addDataWithKeyValue('text', data.text);
		if (data.url) message.addDataWithKeyValue('url', data.url);
	
		//private static String COLLAPSE_KEY = String.valueOf(Math.random() % 100 + 1);
		message.collapseKey = 'collapsKey';
		message.delayWhileIdle = true;
		message.timeToLive = 3;
	
		regid.push(data.push_token);
	
		// sender.send(message, regid, 4, function(err, result)
		sender.sendNoRetry(message, regid, function(err, result) {	
			if (err) {
				log.error('[GCM] sender error: ' + err);
				if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
					_updateResult('failed', data.tid);
				else 
					_updateResult('retrying', data.tid);
				throw err;
			}
	
			if (result) {
				log.info('[GCM] sender result: ' + JSON.stringify(result));
				_updateResult('success', data.tid);
			}
			else {
				log.error('[GCM] sender result: ' + JSON.stringify(result));
				if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
					_updateResult('failed', data.tid);
				else 
					_updateResult('retrying', data.tid);
			}
		});

		function _updateResult(resStatus, tid) {
			var now = (Date.now()).toString().slice(0,10);
			var sql = 'update push_gcm set status = ?, sent_at = ?, attempted_retry_cnt = attempted_retry_cnt + 1, last_attempted_at = ? ' +
									'where tid = ?';
			var arg = [ resStatus, now, now, tid ];
			db.query(sql, arg, function(err, result) {
				if (err) {
					log.error('[GCM] _updateResult error push_gcm.tid = [' + tid + '] : ' + err);
					throw err;
				}
				log.info('[GCM] _updateResult sucess push_gcm.tid = [' + tid + '] : ' + JSON.stringify(result));

				db.commit(function(err) {
					if (err) {
						db.rollback(function() {
							throw err;
						});
					}
				});
			});
		}
	}
	catch (err) {
		log.error('[GCM] gcmSender catch error : ' + err);
	}

}
exports.gcmSender = gcmSender;

function apnsSender(data) {
	return;
}
exports.apnsSender = apnsSender;

function uanSender(data) {

	try {
		var sql = '';	

		log.debug('[UAN] data : ' + JSON.stringify(data));

		// select table device_connection
		sql = 'select * from device_connection ' + 
					  'where device_id = ? ';
		arg = [ data.device_id ];
		db.query(sql, arg, function(err, rows) {
			if (err) throw err;

			if (rows.length <= 0) {
				_updateResult('unknown', data.tid);
			}
			else {
				if (rows[0].is_connected === 'true') {
					pub.publish('direct', JSON.stringify(data));
				}
				else {
					_updateResult('offline', data.tid);
				}
			}
		});

		function _updateResult(resStatus, tid) {
			var now = (Date.now()).toString().slice(0,10);
			var sql = 'update push_direct set status = ?, sent_at = ?, attempted_retry_cnt = attempted_retry_cnt + 1, last_attempted_at = ? ' +
									   'where tid = ?';
			var arg = [ resStatus, now, now, tid ];
			db.query(sql, arg, function(err, result) {
				if (err) {
					log.error('[UAN] _updateResult error push_direct.tid = [' + tid + '] : ' + err);
					throw err;
				}
				log.info('[UAN] _updateResult sucess push_direct.tid = [' + tid + '] : ' + JSON.stringify(result));

				db.commit(function(err) {
					if (err) {
						db.rollback(function() {
							throw err;
						});
					}
				});
			});
		}
	}
	catch (err) {
		log.error('_uanSender() catch error : ' + err);
	}
	
	return;
}
exports.uanSender = uanSender;

function mailSender(data) {
	return;

}
exports.mailSender = mailSender;
