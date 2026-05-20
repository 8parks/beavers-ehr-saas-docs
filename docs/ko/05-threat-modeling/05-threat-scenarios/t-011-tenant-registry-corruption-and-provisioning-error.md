---
title: T-11 tenant_registry 오염 및 온보딩 오류
outline: [2, 4]
---

# T-11 `tenant_registry` 오염 및 온보딩 오류

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S4`, `S1`, `S2`, `S3` |
| 관련 자산 | `A-04`, `A-06`, `A-09` |
| 관련 경계 | `TB-03` |
| 대표 행위자 | 온보딩 운영자, provisioning 자동화, 잘못된 변경 절차 |

`tenant_registry`는 schema, prefix, tenant 상태를 결정하는 기준 데이터입니다. 이 값이 잘못 생성되거나 무단 변경되면 개별 요청이 아니라 구조 전체의 격리가 실패합니다.

## 검토 대상

- tenant registry 데이터 저장소
- 모든 애플리케이션 함수의 tenant registry 조회 경로
- 온보딩 및 변경 자동화 스크립트, 수동 변경 절차, 승인 절차
- `tenant_id`, `schema_name`, `clinical_file_prefix`, `tenant_type`, `status` uniqueness와 상태 전이 규칙

## 공격 성립 조건

- schema, prefix, tenant type, status 변경에 2인 검토가 없습니다.
- 동일 schema 또는 동일 prefix 중복을 막는 검증이 없습니다.
- 상태 전이가 `ACTIVE`, `SUSPENDED`, `OFFBOARDED` 간에 느슨하게 관리됩니다.
- registry 변경 이력이 감사되지 않습니다.

## 위협 전개

1. 신규 tenant 온보딩 또는 기존 tenant 변경이 수행됩니다.
2. 잘못된 schema 또는 prefix가 저장되거나 상태가 오염됩니다.
3. Lambda는 이를 신뢰하고 DB schema, S3 prefix, dataset 경로를 선택합니다.
4. 이후 요청은 구조적으로 잘못된 대상에 접근하게 됩니다.

## 필수 예방 통제

- `tenant_registry`는 source of truth로 관리합니다.
- 조건부 쓰기, uniqueness 검증, 상태 전이 규칙을 구현합니다.
- 온보딩과 변경 절차에 승인과 변경 이력 보존을 포함합니다.
- registry 값을 캐시하더라도 갱신 정책과 무효화 정책을 명시합니다.

## 필수 탐지 통제

- registry 변경 이벤트를 별도 감사 대상으로 분류합니다.
- schema/prefix 충돌, 비활성 tenant 접근, 상태 전이 이상을 탐지합니다.
- 정합성 배치 검사를 통해 DB schema, S3 prefix, registry 값 일치를 주기적으로 확인합니다.

## 대응 요구사항

- 잘못된 매핑을 즉시 롤백하거나 tenant를 일시 중지합니다.
- 영향 tenant와 영향 요청 범위를 역추적합니다.
- 변경 절차와 자동화 스크립트를 수정하고 재승인합니다.

## 검증 기준

- 신규 tenant 등록 시 schema와 prefix의 중복이 허용되지 않아야 합니다.
- `OFFBOARDED` tenant가 다시 `ACTIVE`가 되려면 별도 승인 절차가 필요해야 합니다.
- registry 변경은 CloudTrail data event 또는 app audit에 남아야 합니다.

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| 변경 승인 기록 | 신규 생성, 변경, 상태 전이별 승인자와 변경 사유 | 변경 시마다 |
| uniqueness 검증 결과 | `schema_name`, `clinical_file_prefix`, `tenant_id` 중복 검사 결과 | 변경 시마다 |
| 정합성 점검 결과 | registry 값과 실제 Aurora schema, S3 prefix, tenant 상태 일치 여부 | 주간 |
| data event 표본 | tenant registry 변경에 대한 CloudTrail 또는 app audit 표본 | 월간 |

## 배포 차단 조건

- `tenant_registry` 변경에 대한 승인과 감사 절차가 없으면 배포를 중단합니다.
- schema 또는 prefix 충돌 검출이 없으면 배포를 승인하지 않습니다.
