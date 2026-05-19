---
title: "S7. 데이터베이스 장애 및 복구"
---
# S7. 데이터베이스 장애 및 복구

운영 DB 장애 발생 시 데이터 손실 없이 서비스를 복구하는 흐름입니다. 복구 과정에서 Tenant 간 데이터 혼입이 발생하지 않도록 보장하고, 복구 후 무결성을 검증하는 것이 핵심 보안 요구사항입니다. 복구 완료 후 무결성 검증을 수행하고, RTO/RPO 목표값을 사전에 정의하여 정기 복구 훈련(DR Drill)을 통해 달성 가능 여부를 검증합니다. 복구 과정 전체는 감사 로그로 기록되며, Break-glass 접근이 필요한 경우 S6 절차를 따릅니다.

| 항목 | 내용 |
|---|---|
| 주 사용 역할 | SaaS 운영자 |
| 핵심 데이터 | Aurora automated backup·snapshot, 운영 DB 데이터, 복구 이력, 무결성 검증 결과 |

## 1. 비즈니스 흐름

운영 DB 장애 발생 시 데이터 손실 없이 서비스를 복구하되, 복구 과정에서 Tenant 간 데이터 혼입이 발생하지 않도록 보장하는 것이 핵심입니다. Aurora automated backup 보존 기간 및 S3 Object Lock retention 정책은 서비스 정책에 명시하며, 실제 완전 삭제 시점은 정책에 따릅니다.

**서비스 흐름**

장애 감지 알림 수신 → 영향 범위 파악 → Tenant 장애 알림 발송 → 백업 스냅샷 선택 → 복구 실행 → 무결성 검증 → 서비스 재개 → 사후 보고서 제출

**세부 설명**

- 복구 흐름: 장애 감지(모니터링 알림) → 영향 받는 Tenant 범위 파악 → 해당 Tenant에 서비스 장애 알림 → RPO 기준에 맞는 백업 스냅샷 선택 → 복구 대상 Tenant 스키마만 선택적 복구 → 복구 완료 후 데이터 무결성 검증 → 서비스 재개 → 사후 보고(장애 원인, 복구 과정, 영향 범위 기록)
- 무결성 검증 항목:
  - 복구된 데이터의 `tenant_id` 일치 여부
  - 기록 수 및 체크섬 비교
  - 복구 시점 이후 누락된 트랜잭션 범위 확인(RPO 기준 비교)
- 정기 복구 훈련: 실제 장애 상황을 가정한 DR Drill을 정기적으로 수행하고, RTO/RPO 목표값 달성 여부를 훈련 결과로 검증하며 미비점 개선

<!-- 작성 예정: 아키텍처 흐름 다이어그램 -->


## 2. 보안 목표

- 백업 데이터는 저장 시 암호화 상태 유지(KMS CMK 기반)
- 복구 후 `tenant_id` 일치 여부 검증으로 Tenant 간 데이터 혼입 방지
- 복구 시작, 완료, 검증 결과 전 과정 감사 로그 기록
- RTO/RPO 목표값 사전 정의 및 정기 복구 훈련(DR Drill) 수행
- 복구 과정에서 다른 정상 Tenant 서비스에 영향 없음 보장
- S3 Object Lock, Aurora automated backup 보존 기간 정책 준수
- 복구 작업이 Break-glass 수준의 접근을 요구하는 경우 S6 절차 연계


## 3. 보안 설계

**백업 암호화 및 무결성**

Aurora automated backup과 snapshot은 KMS CMK로 암호화된 상태로 저장합니다. 복구 시에도 권한 있는 운영자만 복호화할 수 있도록 KMS 키 정책을 관리하며, CMK는 주기적으로 교체합니다. Aurora automated backup, S3 Object Lock, CloudTrail 등 보존 정책이 적용된 리소스의 실제 완전 삭제 시점은 서비스 정책에 명시합니다.

**복구 중 접근 차단**

복구 작업 시작과 동시에 영향 받는 Tenant의 `ehr-tenant-registry` status를 `SUSPENDED`로 임시 변경하여, 복구 중 해당 Tenant에 대한 API 접근을 차단합니다. 복구 완료 및 무결성 검증 통과 후 `ACTIVE`로 복원합니다.

**Tenant 간 데이터 혼입 방지**

복구 시 영향 받는 Tenant 스키마만 선택적으로 복원합니다. 복구 완료 후 `tenant_id` 일치 여부, 레코드 수, 체크섬, RLS policy 정상 작동 여부를 검증하여 Tenant 간 데이터 혼입이 발생하지 않았음을 확인합니다.

**복구 과정 감사**

복구 시작, snapshot 선택, 복구 완료, 무결성 검증 결과를 CloudTrail과 CloudWatch Logs에 기록하고, S3 Object Lock Compliance Mode가 적용된 로그 S3에 보존합니다. 복구 작업이 Break-glass 수준의 접근을 요구하는 경우 S6 절차를 따릅니다.

**정기 DR Drill**

RTO(목표 복구 시간)와 RPO(목표 복구 시점)를 사전에 정의하고, 정기 복구 훈련을 통해 달성 가능 여부를 검증합니다. 훈련 결과를 문서화하고 미비점을 개선합니다.


## 4. 보안 통제 및 규제
<!-- 작성 예정: 링크 추가 예정-->

| 통제 항목 | 수단 | 규제 |
|---|---|---|
| 백업 암호화 | Aurora automated backup·snapshot KMS CMK 암호화, KMS Interface Endpoint(VPC 내부 접근) | |
| 복구 중 접근 차단 | `ehr-tenant-registry` status `SUSPENDED` 임시 변경, API 접근 차단 | |
| 장애 탐지 | CloudWatch Alarm, 알림(병원 관리자) | |
| 선택적 복구 | 영향 Tenant 스키마만 복원, 다른 Tenant 영향 없음 사전 검증 | |
| 무결성 검증 | `tenant_id` 일치·레코드 수·체크섬·RLS policy 정상 작동 확인 | |
| 보존 정책 | Aurora automated backup 보존 기간, S3 Object Lock retention, CloudTrail retention 서비스 정책 명시 | |
| 감사 로그 | CloudTrail + CloudWatch Logs(복구 이력 전 과정), S3 Object Lock Compliance Mode(로그 위변조 방지) | |
| 지속적 모니터링 | AWS Config(백업 정책 준수 여부), Security Hub(이상 탐지 집계) | |


## 5. 보안 체크리스트

- [ ] Aurora automated backup과 snapshot이 KMS CMK로 암호화된 상태로 저장됩니다.
- [ ] 복구 작업 시작과 동시에 영향 받는 Tenant의 `ehr-tenant-registry` status가 `SUSPENDED`로 변경됩니다.
- [ ] 영향 받는 Tenant 스키마만 선택적으로 복구됩니다(다른 Tenant 영향 없음 사전 검증).
- [ ] 복구 완료 후 `tenant_id` 일치·레코드 수·체크섬·RLS policy 정상 작동 여부를 검증합니다.
- [ ] 무결성 검증 통과 후에만 `ACTIVE`로 복원됩니다.
- [ ] RTO/RPO 목표값이 사전에 정의되어 있습니다.
- [ ] 정기 DR Drill을 수행하고 결과를 문서화합니다.
- [ ] 복구 이력 전 과정이 CloudTrail과 CloudWatch Logs에 기록됩니다.
- [ ] 복구 감사 로그에 S3 Object Lock Compliance Mode가 적용됩니다.
- [ ] 복구 작업이 Break-glass 수준의 접근을 요구하는 경우 S6 절차를 따릅니다.