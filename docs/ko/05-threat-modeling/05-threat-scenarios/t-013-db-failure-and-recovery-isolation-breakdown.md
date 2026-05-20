---
title: T-13 데이터베이스 장애 및 복구 시 격리 붕괴
outline: [2, 4]
---

# T-13 데이터베이스 장애 및 복구 시 격리 붕괴

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S7` |
| 관련 자산 | `A-01`, `A-08`, `A-09` |
| 관련 경계 | `TB-04`, `TB-07` |
| 대표 행위자 | 장애 대응자, 복구 자동화, failover 경로 |

가용성 사고는 단순 중단 문제에 그치지 않습니다. 복구 과정에서 RLS, schema binding, key access, 감사 로깅이 깨지면 복구 이후 더 심각한 보안 사고가 발생할 수 있습니다.

## 검토 대상

- 환자 정보용 Aurora cluster, 진료 기록용 Aurora cluster, reader instance
- RDS Proxy 연결 경로와 애플리케이션 재연결 절차
- 데이터베이스 암호화용 KMS 키
- DR runbook, snapshot restore 절차, failover rehearsal 결과
- 복구 후 RLS, schema binding, app audit, CloudTrail 연속성 검증 절차

## 공격 성립 조건

- DR runbook이 가용성 복구만 다루고 tenant isolation 검증을 포함하지 않습니다.
- snapshot restore 후 schema, RLS, parameter drift 검증이 없습니다.
- 장애 대응 중 임시 권한이 과도하게 부여됩니다.
- failover 시 writer/reader 전환과 애플리케이션 재연결 검증이 없습니다.

## 위협 전개

1. Aurora writer 장애 또는 restore 이벤트가 발생합니다.
2. 애플리케이션은 복구를 위해 우회 경로나 수동 접근을 사용합니다.
3. 복구된 DB에서 RLS, schema mapping, 감사 로깅 중 일부가 누락되면 정상 트래픽이 보안 결함 상태로 재개됩니다.

## 필수 예방 통제

- DR runbook에 tenant isolation, RLS, schema, key access, 감사 로깅 검증 항목을 포함합니다.
- 복구용 권한과 평상시 권한을 분리합니다.
- failover와 restore 절차를 정기적으로 리허설합니다.
- 백업은 암호화되고, 복구 권한은 최소화되어야 합니다.

## 필수 탐지 통제

- failover 실패, restore drift, 복구 후 cross-tenant 테스트 실패를 경보화합니다.
- 복구 과정에서 임시 권한 부여 이벤트를 추적합니다.
- 복구 직후 app audit와 CloudTrail의 연속성을 확인합니다.

## 대응 요구사항

- 복구된 환경을 즉시 제한 모드로 두고 tenant isolation 검증을 수행합니다.
- 잘못된 권한이나 설정 drift를 수정한 뒤에만 정상 트래픽을 재개합니다.
- 복구 과정 전체를 포렌식 보존 대상으로 취급합니다.

## 검증 기준

- DR drill에는 가용성 검증 외에 cross-tenant 음성 테스트가 포함되어야 합니다.
- restore 후 RLS와 schema binding이 유지되는지 증명할 수 있어야 합니다.
- 복구 중 감사 로그 공백이 발생하지 않아야 합니다.

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| DR runbook | failover, restore, 제한 모드 전환, 보안 재검증 단계 | 반기별 검토 |
| drill 결과 | failover 시간, restore 성공 여부, cross-tenant 음성 테스트 결과 | 반기별 |
| 복구 후 보안 검증 기록 | RLS, schema binding, key access, logging continuity 점검 결과 | 실제 복구 후 즉시 |
| 임시 권한 사용 기록 | 복구 중 부여된 예외 권한과 회수 결과 | drill 및 실제 복구 시마다 |

## 배포 차단 조건

- DR runbook에 tenant isolation 검증이 없으면 배포를 중단합니다.
- restore 후 보안 설정 drift를 자동 또는 수동으로 확인할 수 없으면 배포를 승인하지 않습니다.
