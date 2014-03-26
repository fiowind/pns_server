
# 전송 모듈
---
전송 모듈은 전송 데몬과 세션데몬 2가지 데몬으로만 구성 되어있다.
차후 필요한 데몬은 추가 하기로 한다.

## 구성
---
> mysql
> redis 2.8.5
> node.js 0.10.25
> 그 외 node.js 모듈들... async 등등 (~/work/node_modules/*)

## 전송 데몬
---
SMS/MMS/GCM/APNS/UAPNS 요청에 대한 전송을 담당한다.

## 세션 데몬
---

