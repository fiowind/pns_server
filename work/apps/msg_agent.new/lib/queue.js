
var async = require('async');

function getQueueRoute(route, handle, msgType, table) {

	if (_getSendCnt(msgType) >= _getTps(msgType)) {
		log.warning(msgType + ' tps over!! send [' + _getSendCnt(msgType) + '>=' + _getTps(msgType) + '] tps');
		return;
	}

	if (_getSendCnt(msgType) !== 0) {
		log.warning(msgType + ' is busy!!! now sendCnt = [' + _getSendCnt(msgType) + ']');
		return;
	}

	async.waterfall([
		function selectQueueTable(callback) {
			mysqlPool.getConnection(function(err, conn) {
				if (err) callback(err);
				else {
					_selectQueueTable(conn, table, msgType, _getTps(msgType), function(err, rows) {
						conn.release();
						callback(err, rows);	
					});
				}
			});
		},
		function updateQueueTable(rows, callback) {

			if (rows.length === 0) {
				callback(null, null);
			}
			else {
				log.info('rows.length = ' + rows.length);
				_setSendCnt(msgType, rows.length);

            	for (var i = 0; i < rows.length; i++) {
                	(function(temp) {
                    	mysqlPool.getConnection(function(err, conn) {
                        	if (err) callback(err);
                        	else {
                            	_updateQueueTable(conn, table, temp, function(err, row) {
                                	conn.release();
                                	callback(err, row);
                            	});
                        	}
                    	});
                	})(rows[i]);
            	}
			}
		}
	],
	function(err, row) {
		if (err) throw err;

		if (row) {
			_setSendCnt(msgType, -1);
			route(handle, msgType, row);
		}
	});

	return;
}
exports.getQueueRoute = getQueueRoute;

function _selectQueueTable(conn, table, msgType, count, callback) {

	var sql = '';

	if (msgType.toLowerCase() === 'uapns') {
		sql = "select * from " + table + 
					 " where (status is null or status = 'requesting' or status = 'retrying')" +
					 " 	 and maximum_retry_cnt > attempted_retry_cnt" +
					 " limit " + count;

	}
	else {
		sql = "select * from " + table + 
					 " where (status is null or status = 'requesting' or status = 'retrying')" +
					 " 	 and maximum_retry_cnt > attempted_retry_cnt" +
					 " 	 and target = '" + msgType + "'" + 
					 " limit " + count;
	}

	conn.query(sql, function(err, rows) {
		callback(err, rows);
	});	
}

function _updateQueueTable(conn, table, row,  callback) {

	var status = row.status;
	if 	 	(status === 'requesting') status = 'requested';
	else if (status === 'retrying'	) status = 'retried';
	else 							  status = 'failed';

	var sql = "update " + table + "   set status = '" + status + "'" +
			   					  " where tid = " + row.tid;	

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
					callback(null, row);
				}
			});
		}
	});
}

function _getSendCnt(msgType) {
	switch (msgType) {
		case 'SMS':
			return conf.sms.sendCnt;
		case 'MMS':
			return conf.mms.sendCnt;
		case 'GCM':
			return conf.gcm.sendCnt;
		case 'APNS':
			return conf.apns.sendCnt;
		case 'UAPNS':
			return conf.uapns.sendCnt;
		default:
			throw new Error('_getSendCnt Error...unknown msgType = [' + msgType + ']');
			return;
	}
}

function _getTps(msgType) {
	switch (msgType) {
		case 'SMS':
			return conf.sms.tps;
		case 'MMS':
			return conf.mms.tps;
		case 'GCM':
			return conf.gcm.tps;
		case 'APNS':
			return conf.apns.tps;
		case 'UAPNS':
			return conf.uapns.tps;
		default:
			throw new Error('_getTps Error...unknown msgType = [' + msgType + ']');
			return;
	}
}

function _setSendCnt(msgType, count) {
	switch (msgType) {
		case 'SMS':
			return conf.sms.sendCnt = conf.sms.sendCnt + count;
		case 'MMS':
			return conf.mms.sendCnt = conf.mms.sendCnt + count;
		case 'GCM':
			return conf.gcm.sendCnt = conf.gcm.sendCnt + count;
		case 'APNS':
			return conf.apns.sendCnt = conf.apns.sendCnt + count;
		case 'UAPNS':
			return conf.uapns.sendCnt = conf.uapns.sendCnt + count;
		default:
			throw new Error('_setSendCnt Error...unknown msgType = [' + msgType + ']');
			return;
	}
}
