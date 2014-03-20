
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

	log.debug('[SMS] data : ' + JSON.stringify(data);

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
}
exports.smsSender = smsSender;

function mmsSender(data) {
}
exports.mmsSender = mmsSender;

function gcmSender(data) {
}
exports.gcmSender = gcmSender;

function apnsSender(data) {
}
exports.apnsSender = apnsSender;

function uapnsSender(data) {
}
exports.uapnsSender = uapnsSender;

function mailSender(data) {
}
exports.mailSender = mailSender;

function _updateResultQueueTable(msgType, tid, status) {

	var sql = '';
	var table = '';	

	switch (msgType.toLowerCase()) {
		case 'sms':
			table = 'push_sms';
			return;
		case 'mms':
			table = 'push_sms';
			return;
		case 'gcm':
			table = 'push_gcm';
			return;
		case 'apns':
			table = 'push_gcm';
			return;
		case 'uapns':
			table = 'push_direct';
			return;
	}


	sql = "update " + table + " set status = " + status + 
							 	 ", sent_at = " + (Date.now()).toString().slice(0,10) +
								 ", attempted_retry_cnt = attempted_retry_cnt + 1 " + 
								 ", last_attempted_at = " + (Date.now()).toString().slice(0,10) +
                             "where tid = " + tid;
	mysqlPool.getConnection(function(err, conn) {
		if (err) callback(err);
       	else {
			_selectQueueTable(conn, table, msgType, conf[msgType.toLowerCase()].tps, function(err, rows) {
				conn.release();
				callback(err, rows);
			});
		}
	});

	db.query(sql, function(err, result) {
		if (err) 







}
