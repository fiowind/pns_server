
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
	var urlStr = '';
	var urlObj = '';
	var option = {};
	var req = false;

	if (!data) return;
	log.debug('[SMS] data : ' + JSON.stringify(data));

	urlStr = conf.sms.url + '?' +
			 'id=Svc' + '&' +
			 'op=sendsms' + '&' +
			 'smdn=' + data.sender_mdn + '&' +
			 'rmdn=' + data.receiver_mdn + '&' +
			 'call=' + data.callback_mdn + '&' +
			 'msg=' + escape(U2E.convert(data.sms_text).toString('binary'));

	urlObj = url.parse(urlStr);

	option = {
		hostname: urlObj.hostname,
		port: urlObj.port,
		path: urlObj.path,
		method: 'GET'
	};

	req = http.request(option, function(res) {
		log.debug('[SMS] STATUS : ' + res.statusCode);
		log.debug('[SMS] HEADER : ' + JSON.stringify(res.headers));
		
		res.setEncoding('utf8');

		if (parseInt(res.statusCode, 10) !== 200) {
			if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
				_updateResultQueueTable('SMS', data.tid, 'failed');
			else
				_updateResultQueueTable('SMS', data.tid, 'retrying');

			return;
		}

		res.on('data', function(chunk) {
			log.debug('[SMS] BODY : ' + chunk);
			
			if (chunk.toString() === 'RESULT=OK\n') {
				_updateResultQueueTable('SMS', data.tid, 'success');
			}
			else {
				if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
					_updateResultQueueTable('SMS', data.tid, 'failed');
				else
					_updateResultQueueTable('SMS', data.tid, 'retrying');
			}
		});
	});

	req.on('error', function(err) {
		log.error('[SMS] request error: ' + err);
	});

	req.end();
	return;
}
exports.smsSender = smsSender;

function mmsSender(data) {

	if (!data) return;
	log.debug('[MMS] data : ' + JSON.stringify(data));
	return;
}
exports.mmsSender = mmsSender;

function gcmSender(data) {

	var message = false;
	var sender = false;
	var regid = [];

	if (!data) return;
	log.debug('[GCM] data : ' + JSON.stringify(data));

	message = new gcm.Message();
	sender = new gcm.Sender(data.api_key);

	if (data.text) message.addDataWithKeyValue('text', data.text);
	if (data.url)  message.addDataWithKeyValue('url', data.url);

	//message.collapseKey = Math.random() % 100 + 1;
	message.collapseKey = 'collapsKey';
	message.delayWhileIdle = true;
	message.timeToLive = 3;

	regid.push(data.push_token);

	// sender.send(message, regid, 4, function(err, result)
	sender.sendNoRetry(message, regid, function(err, result) {
		if (err) {
			log.error('[GCM] sender error : ' + err);
			if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
				_updateResultQueueTable('GCM', data.tid, 'failed');
			else
				_updateResultQueueTable('GCM', data.tid, 'retrying');

			return;
		}

		if (result) {
			log.info('[GCM] sender result : ' + JSON.stringify(result));
			_updateResultQueueTable('GCM', data.tid, 'success');
		}
		else {
			log.error('[GCM] sender result : ' + JSON.stringify(result));

			if (data.maximum_retry_cnt === (data.attempted_retry_cnt + 1))
				_updateResultQueueTable('GCM', data.tid, 'failed');
			else
				_updateResultQueueTable('GCM', data.tid, 'retrying');
		}			
	});

	return;
}
exports.gcmSender = gcmSender;

function apnsSender(data) {
	if (!data) return;
	log.debug('[APNS] data : ' + JSON.stringify(data));
	return;
}
exports.apnsSender = apnsSender;

function uapnsSender(data) {

	var sessionId = '';

	if (!data) return;
	log.debug('[UAPNS] data : ' + JSON.stringify(data));

	_selectDeviceConnection(data.device_id, function(err, rows) {
		if (err) {
			log.error('_selectDeviceConnection Error : ' + err);
			throw err;
		}

		if (rows.length <= 0) {
			_updateResultQueueTable('UAPNS', data.tid, 'unknown');
		}
		else {
			if (rows[0].is_connected === 'true') {
				sessionId = rows[0].session_id.split('|');
				redisPub.publish(sessionId[0] + '|' + sessionId[1] + '|' + sessionId[2], JSON.stringify(data));
			}
			else {
				_updateResultQueueTable('UAPNS', data.tid, 'offline');
			}
		}
	});
}
exports.uapnsSender = uapnsSender;

function _updateResultQueueTable(msgType, tid, status) {

	var sql = '';
	var table = '';	

	switch (msgType) {
		case 'SMS':
			table = 'push_sms';
			break;
		case 'MMS':
			table = 'push_sms';
			break;
		case 'GCM':
			table = 'push_gcm';
			break;
		case 'APNS':
			table = 'push_gcm';
			break;
		case 'UAPNS':
			table = 'push_direct';
			break;
		default:
			throw new Error('_updateResultQueueTable error..  unknown msgType = [' + msgType + ']');
			return;
	}


	sql = "update " + table + " set status = '" + status + "'" + 
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
						log.error('_updateResultQueueTable error : ' + err);
					});
				}
				else {
					conn.commit(function(err) {
						if (err) {
							conn.rollback(function() {
								conn.release();
								log.error('_updateResultQueueTable error : ' + err);
							});
						}
						else {
							conn.release();
							log.debug('_updateResultQueueTable ok : ' + table + ', tid = ' + tid);
						}
					});
				}
			});
		}
	});
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
