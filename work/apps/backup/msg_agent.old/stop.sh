#!/bin/csh

set uaxprocess = `ps -ef | grep "node msg_agent.js" | grep -v grep | grep -v 'vi ' | grep -v 'vim ' | awk '{print $2}'`

echo " "
echo " "
echo "*** try to stop 'node msg_agent.js' ***"

if ( $uaxprocess ) then
	kill -15 $uaxprocess
	echo "    $uaxprocess killed success."
else
	echo "    Cannot find node 'msg_agent.js' process. Please check."
endif

echo "*** 'node msg_agent.js' STOPPED **** "

exit

