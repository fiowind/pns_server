
var async = require('async');

function getQueueRoute(route, handle, msgType, table) {

	if (conf[msgType.toLowerCase()].sendCnt >= conf[msgType.toLowerCase()].tps) {
		console.log(msgType + ' tps over!! send [' + conf[msgType.toLowerCase()].sendCnt + '>=' + conf[msgType.toLowerCase()].tps + '] tps');
		return;
	}

	if (conf[msgType.toLowerCase()].sendCnt !== 0) {
		console.log(msgType + ' is busy!!! now sendCnt = [' + conf[msgType.toLowerCase()].sendCnt + ']');
		return;
	}

	async.waterfall([
		function selectQueueTable(callback) {
			mysqlPool.getConnection(function(err, conn) {
				if (err) callback(err);
				else {
					_selectQueueTable(conn, table, msgType, conf[msgType.toLowerCase()].tps, function(err, rows) {
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
				console.log('rows.length = ' + rows.length);
				conf[msgType.toLowerCase()].sendCnt = rows.length;

				for (var i = 0; i < rows.length; i++) {
					mysqlPool.getConnection(function(err, conn) {
						if (err) callback(err);
						else {
							_updateQueueTable(conn, table, rows[i], function(err, row) {
								conn.release();
								callback(err, row);
							});
						}
					});
				}
			}
		}
	],
	function(err, row) {
		if (err) throw err;

		if (row) {
			conf[msgType.toLowerCase()].sendCnt--;
			route(handle, row.target, row);
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

	var sql = "update " + table + "   set status = " + status + 
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
