---
title: T-04 데이터 전달 경로 및 객체 경로 오남용
outline: [2, 4]
---

# T-04 데이터 전달 경로 및 객체 경로 오남용

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S2`, `S3` |
| 관련 자산 | `A-02`, `A-03`, `A-05`, `A-09` |
| 관련 경계 | `TB-05`, `TB-06`, `TB-08` |
| 대표 행위자 | 정상 사용자, 연구기관 사용자, 외부 공유 수신자 |

데이터 전달 경로는 원본 PHI 저장소와 연구 데이터셋 제공 지점을 잇는 마지막 관문입니다. 이 경로에서 전달 상태 검증, object key 구속, 사설 경로 제한이 느슨하면 원본 PHI 또는 연구 데이터셋의 우회 반출 경로가 됩니다.

## 검토 대상

- 임상 파일 버킷에 대한 저장·조회 경로와 object key 검증 로직
- 연구 데이터셋 버킷에 대한 dataset delivery 경로와 다운로드 허용 상태 검증 로직
- 진료 기록 생성 함수의 attachment `object_key` 검증 경로
- dataset 생성 함수 및 dataset 다운로드 경로의 request status 재검증 로직
- S3, KMS, DynamoDB, Secrets 접근에 대한 VPC endpoint 정책과 CloudTrail data events 분석 규칙

## 공격 성립 조건

- 다운로드 요청 시 tenant, patient, request status를 재검증하지 않습니다.
- 데이터셋 전달 권한이 승인 취소 이후에도 남습니다.
- object key가 tenant-bound 형식으로 고정되지 않습니다.
- S3, KMS, DynamoDB 접근이 VPC endpoint 정책 없이 과도하게 열려 있습니다.
- dataset `READY` 상태와 다운로드 허용 시점이 분리되어 있습니다.

## 위협 전개

1. 공격자는 정상 사용자로 데이터셋 다운로드 또는 첨부파일 조회를 시도합니다.
2. 전달 경로가 승인 상태를 다시 확인하지 않으면, 이미 취소되었거나 범위를 벗어난 요청도 계속 처리됩니다.
3. object key 검증이 느슨하면 다른 tenant 경로나 다른 환자 경로의 객체를 참조하게 됩니다.
4. 내부 서비스 접근이 VPC endpoint 정책으로 제한되지 않으면 사설 경로를 가장한 과도한 객체 접근이 허용될 수 있습니다.

## 필수 예방 통제

- 데이터 전달 경로는 요청 시점마다 승인 상태와 전달 가능 상태를 다시 확인해야 합니다.
- object key는 `tenant/patient/record` 또는 `tenant/approved/request_id` 규칙으로 강제해야 합니다.
- dataset 다운로드 처리 전후에 request 상태를 재검증해야 합니다.
- S3, KMS, DynamoDB 접근은 VPC endpoint와 endpoint policy를 통해 사설 경로로 제한해야 합니다.
- content type, size, hash, 필요 시 악성 파일 검사 절차를 포함해야 합니다.

## 필수 탐지 통제

- CloudTrail data events와 S3 access pattern에서 동일 object에 대한 비정상 반복 다운로드를 탐지합니다.
- 승인 취소 이후에도 계속되는 dataset 다운로드 시도를 탐지합니다.
- VPC endpoint 정책 변경 또는 우회 시도를 탐지합니다.

## 대응 요구사항

- 문제가 된 전달 경로를 즉시 차단하거나 관련 객체 접근을 차단합니다.
- 이미 반출된 객체 범위와 수신 대상을 조사합니다.
- 승인 상태, object path, endpoint 정책, 다운로드 로직을 함께 재검토합니다.

## 검증 기준

- tenant 경계를 벗어난 object key로는 다운로드 또는 저장 처리가 거부되어야 합니다.
- 승인 전, 승인 취소 후, 만료 후에는 dataset 다운로드가 거부되어야 합니다.
- 동일 object에 대한 반복 다운로드와 endpoint 정책 변경 이력이 감사 로그에 식별 가능해야 합니다.

데이터 전달 경로 검증은 최초 승인 시점만으로 충분하지 않습니다. dataset 제공 경로는 최소한 `APPROVED`, `READY`, 만료 여부를 다시 확인할 수 있어야 하며, 승인 취소 또는 incident containment 이후 기존 전달 권한이 계속 사용되지 않도록 설계해야 합니다.

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| 전달 경로 정책 정의서 | 승인 상태 검증, object key 규칙, 전달 종료 조건, 차단 절차 | 설계 변경 시마다 |
| object path 음성 테스트 | 다른 tenant prefix, 다른 patient 경로, 승인 전 dataset 경로 시도 결과 | 매 릴리스 |
| data event 로그 표본 | 다운로드 actor, object, 승인 상태, result가 식별 가능한 표본 | 월간 |
| 비정상 다운로드 탐지 규칙 | 반복 다운로드, 승인 취소 후 다운로드, endpoint 정책 변경 경보 규칙 | 월간 |

## 배포 차단 조건

- 데이터 전달 경로가 tenant-bound object key 없이 임의 경로를 허용하면 배포를 중단합니다.
- 전달 경로 사용 이력을 CloudTrail data events 또는 S3 access logs로 식별할 수 없으면 배포를 승인하지 않습니다.
