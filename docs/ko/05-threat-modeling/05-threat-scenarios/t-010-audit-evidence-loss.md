---
title: T-10 감사 증적 상실
outline: [2, 4]
---

# T-10 감사 증적 상실

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 중간 |
| 관련 워크로드 | `S1`, `S2`, `S3`, `S6`, `S7` |
| 관련 자산 | `A-09` |
| 관련 경계 | `TB-05`, `TB-07`, `TB-08`, `TB-09` |
| 대표 행위자 | 모든 사용자와 운영 경로, 로깅 오구성, 사고 대응 과정 |

감사 증적 상실은 직접적인 데이터 유출이 없어도 사고 대응 능력을 상실하게 만듭니다. 의료 환경에서는 “누가 무엇을 했는지 알 수 없음” 자체가 고위험 상태입니다.

## 검토 대상

- CloudTrail management events와 data events 설정
- 임상 파일 버킷, 연구 데이터셋 버킷, 감사 로그 버킷
- tenant registry 저장소와 dataset request 저장소에 대한 data event
- 감사 로그 암호화용 KMS 키
- PHI 감사 이벤트를 기록하는 애플리케이션 감사 경로와 correlation ID 규칙
- SSM 세션 로그와 세션 시작 이벤트 상관관계

## 공격 성립 조건

- application audit가 존재하지 않거나 PHI 이벤트를 충분히 기록하지 않습니다.
- CloudTrail data events 범위에서 clinical S3, dataset S3, `tenant_registry`, `dataset_requests`가 빠져 있습니다.
- request ID, actor ID, tenant ID, request status 같은 correlation field가 없습니다.
- 로그 보존 정책, validation, delivery failure monitoring이 없습니다.

## 위협 전개

1. 누군가 PHI를 조회, 수정, 승인, 다운로드, 비상 접근합니다.
2. 일부 로그는 남지만 다른 로그와 연결되지 않습니다.
3. 조사자는 영향 환자, 영향 tenant, 영향 데이터 범위를 특정하지 못합니다.
4. 규제 보고와 고객 통지가 지연되거나 부정확해집니다.

## 필수 예방 통제

- PHI 관련 애플리케이션 이벤트는 별도 app audit로 남깁니다.
- CloudTrail management event와 필요한 data event를 모두 활성화합니다.
- 로그에는 actor, tenant, resource, action, outcome, correlation ID가 포함되어야 합니다.
- 감사 로그 보존은 변조 방지 정책과 함께 운영합니다.

## 필수 탐지 통제

- trail 비활성화, log delivery 실패, 감사 이벤트 누락을 경보화합니다.
- app audit와 CloudTrail 간 이벤트 수 차이를 주기적으로 점검합니다.
- 비정상 로그 공백, 필드 누락, 상관관계 실패를 모니터링합니다.

## 대응 요구사항

- 우선 로깅 상태를 복구하고 현재 조사 가능 범위를 명시합니다.
- 보완 증적을 수집해 조사 범위를 최대한 좁힙니다.
- 누락 원인이 정책, 구현, 운영 중 어디에 있는지 분류해 재발 방지 항목을 등록합니다.

## 검증 기준

- PHI 조회, 수정, 다운로드, 승인, break-glass 이벤트가 공통 correlation field로 연결 가능해야 합니다.
- CloudTrail과 app audit 중 하나라도 중단되면 즉시 운영자가 인지할 수 있어야 합니다.
- 로그 보존과 검증 실패가 정기 점검 항목으로 관리되어야 합니다.

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| trail 설정 스냅샷 | management/data event 범위, 대상 버킷, 대상 테이블, KMS 설정 | 월간 |
| app audit 표본 | actor, tenant, resource, action, result, correlation ID가 포함된 PHI 이벤트 표본 | 월간 |
| delivery failure 테스트 | CloudTrail 또는 app audit delivery failure 알람 시험 결과 | 분기별 |
| 보존 정책 증빙 | Object Lock, 보존 기간, 삭제 제한 정책 검토 결과 | 반기별 |

## 배포 차단 조건

- PHI 관련 app audit가 없으면 배포를 중단합니다.
- CloudTrail 또는 감사 로그 보존 정책이 비활성 상태면 배포를 승인하지 않습니다.
