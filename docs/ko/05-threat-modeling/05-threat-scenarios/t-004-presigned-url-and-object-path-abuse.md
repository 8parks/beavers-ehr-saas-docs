---
title: T-04 Presigned URL 및 객체 경로 남용
outline: [2, 4]
---

# T-04 Presigned URL 및 객체 경로 남용

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S2`, `S3` |
| 관련 자산 | `A-02`, `A-03`, `A-05`, `A-09` |
| 관련 경계 | `TB-05`, `TB-06`, `TB-08` |
| 대표 행위자 | 정상 사용자, 연구기관 사용자, 외부 공유 수신자 |

Presigned URL은 필요한 기능이지만, URL 발급 조건과 object key 구속이 느슨하면 원본 PHI 또는 연구 데이터셋의 우회 반출 경로가 된다.

## 검토 대상

- 임상 파일 버킷에 대한 direct upload 또는 download presign 발급 로직
- 연구 데이터셋 버킷에 대한 dataset delivery 경로와 presign 발급 로직
- 진료 기록 생성 함수의 attachment `object_key` 검증 경로
- dataset 생성 함수 및 dataset 다운로드 경로의 request status 재검증 로직
- CloudTrail data events와 S3 access pattern 분석 규칙

## 공격 성립 조건

- URL 발급 시 tenant, patient, request status를 재검증하지 않는다.
- URL TTL이 과도하게 길거나 재사용 제한이 없다.
- object key가 tenant-bound 형식으로 고정되지 않는다.
- dataset `READY` 상태와 다운로드 허용 시점이 분리되어 있다.

## 위협 전개

1. 공격자는 정상 사용자로 presigned URL을 발급받는다.
2. 발급된 URL을 다른 사용자와 공유하거나, object key를 변형하거나, 만료 전 반복 사용한다.
3. URL이 승인 취소 후에도 유효하면 데이터 반출이 계속된다.
4. 업로드 경로에서는 악성 파일이나 잘못된 tenant 경로의 파일이 유입될 수 있다.

## 필수 예방 통제

- presigned URL은 짧은 TTL과 단일 목적을 가져야 한다.
- object key는 `tenant/patient/record` 또는 `tenant/approved/request_id` 규칙으로 강제해야 한다.
- dataset 다운로드 URL 발급 전후에 request 상태를 재검증해야 한다.
- content type, size, hash, 필요 시 악성 파일 검사 절차를 포함해야 한다.

## 필수 탐지 통제

- S3 access logs 또는 CloudTrail data events에서 `X-Amz-Expires` 기반 presigned 요청 패턴을 식별한다.
- 동일 URL 또는 동일 object에 대한 비정상 반복 다운로드를 탐지한다.
- URL 발급 actor와 실제 다운로드 패턴 간 불일치를 탐지한다.

## 대응 요구사항

- 문제가 된 URL을 즉시 폐기하거나 관련 객체 접근을 차단한다.
- 이미 반출된 객체 범위와 수신 대상을 조사한다.
- 승인 상태, object path, 발급 로직, 다운로드 로직을 함께 재검토한다.

## 검증 기준

- tenant 경계를 벗어난 object key로는 URL 발급이 거부되어야 한다.
- 승인 전, 승인 취소 후, 만료 후에는 dataset 다운로드가 거부되어야 한다.
- 동일 URL 재사용과 다른 user agent 사용 패턴이 감사 로그에 식별 가능해야 한다.

presigned URL 검증은 발급 시점만으로 충분하지 않다. dataset 제공 경로는 최소한 `APPROVED`, `READY`, 만료 여부를 다시 확인할 수 있어야 하며, 승인 취소 또는 incident containment 이후 이미 발급된 URL이 계속 사용되지 않도록 설계해야 한다.

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| URL 정책 정의서 | TTL, 단일 목적 사용, object key 규칙, 만료 후 처리 기준 | 설계 변경 시마다 |
| object path 음성 테스트 | 다른 tenant prefix, 다른 patient 경로, 승인 전 dataset 경로 시도 결과 | 매 릴리스 |
| data event 로그 표본 | presigned URL 사용 시 actor, object, 만료 정보, result가 식별 가능한 표본 | 월간 |
| 비정상 다운로드 탐지 규칙 | 반복 다운로드, 다른 user agent, 운영 시간 외 사용 경보 규칙 | 월간 |

## 배포 차단 조건

- presigned URL이 tenant-bound object key 없이 임의 경로를 허용하면 배포를 중단한다.
- URL 사용 이력을 CloudTrail data events 또는 S3 access logs로 식별할 수 없으면 배포를 승인하지 않는다.
