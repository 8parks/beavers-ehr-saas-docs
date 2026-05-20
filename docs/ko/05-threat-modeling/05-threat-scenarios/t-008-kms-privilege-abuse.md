---
title: T-08 KMS 권한 남용
outline: [2, 4]
---

# T-08 KMS 권한 남용

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S2`, `S3`, `S6`, `S7` |
| 관련 자산 | `A-08`, `A-09`, `A-10` |
| 관련 경계 | `TB-05`, `TB-07` |
| 대표 행위자 | 과도 권한 운영자, 잘못된 Lambda 역할, 잘못 설계된 key policy |

KMS는 암호화와 전자서명의 신뢰 기반입니다. 따라서 key admin과 key user가 혼재하거나, dataset 경로 권한이 원본 PHI 복호화 권한으로 확장되면 전체 통제가 무력화됩니다.

## 검토 대상

- 데이터베이스 암호화용 KMS 키, 임상 파일 암호화용 KMS 키, 연구 데이터셋 암호화용 KMS 키, 기록 서명용 KMS 키, 감사 로그 암호화용 KMS 키
- 진료 기록 조회, 진료 기록 생성, dataset 생성 함수에 연결된 실행 역할
- KMS 관리 역할, KMS 프로비저닝 역할, 일반 운영 역할의 key usage 범위
- key policy, grant, `kms:ViaService`, encryption context, 조건부 principal 제한

## 공격 성립 조건

- key admin과 key user 역할이 분리되지 않습니다.
- clinical file key, dataset key, signing key가 동일하거나 policy 범위가 과도합니다.
- `kms:ViaService`, encryption context, resource tag 조건이 없습니다.
- key usage에 대한 기대 principal 목록과 경보 기준이 정의되지 않습니다.

## 위협 전개

1. 공격자는 KMS 사용 권한을 가진 역할을 획득하거나 assume role 합니다.
2. 과도한 `Decrypt`, `Sign`, `GenerateDataKey` 권한을 사용해 원본 데이터를 복호화하거나 가짜 서명을 생성합니다.
3. key usage는 남더라도 정상 사용과 구분되지 않으면 이상 징후를 놓칩니다.

## 필수 예방 통제

- key admin과 key user 역할을 분리합니다.
- 데이터 등급별로 key를 분리하고, 원본 PHI와 연구 dataset의 key를 공유하지 않습니다.
- `kms:ViaService`와 필요한 조건 키를 사용해 서비스 경로를 제한합니다.
- 운영자 일반 역할에는 PHI 관련 `Decrypt` 권한을 부여하지 않습니다.

## 필수 탐지 통제

- 기대하지 않은 principal의 `Decrypt` 또는 `Sign` 이벤트를 경보화합니다.
- key usage를 alias 단위로 분리해 모니터링합니다.
- 장애 대응 중 임시 부여된 key usage 권한이 회수되었는지 점검합니다.

## 대응 요구사항

- 오남용된 역할을 정지하고 key policy를 수정합니다.
- 필요 시 영향 범위에 대해 재암호화 또는 서명 검증 재수행을 검토합니다.
- key usage 로그와 관련 데이터 접근 로그를 결합해 범위를 산정합니다.

## 검증 기준

- dataset 생성 역할은 dataset 저장에 필요한 key와 원본 읽기에 필요한 최소 key만 가져야 합니다.
- signing key는 record 생성 경로 외의 일반 조회 경로에서 사용되지 않아야 합니다.
- key admin이 직접 `Decrypt` 또는 `Sign`를 수행할 수 없어야 합니다.

기록 서명용 KMS 키와 연구 데이터셋 암호화용 KMS 키는 기능상 분리되어야 하며, 운영자 일반 역할에는 PHI 저장소 또는 원본 record 관련 `Decrypt` 권한이 없어야 합니다. key 분리가 존재하더라도 policy 범위가 넓으면 같은 위협이 성립합니다.

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| key policy export | 각 alias별 허용 principal, 허용 action, 조건 키 정의 | 정책 변경 시마다 |
| principal별 key usage 로그 | `Decrypt`, `Sign`, `GenerateDataKey`, `Verify` 사용 주체와 빈도 | 월간 |
| 역할-키 매핑 검토 | Lambda 역할 및 운영 역할별 필요한 key만 허용되었는지 검토한 기록 | 매 릴리스 |
| 예외 권한 승인 기록 | 장애 대응 중 임시 key usage 권한 부여와 회수 결과 | 사용 시마다 |

## 배포 차단 조건

- 일반 운영 role에 PHI 관련 `Decrypt` 권한이 있으면 배포를 중단합니다.
- 원본 PHI용 key와 dataset용 key가 구분되지 않으면 배포를 승인하지 않습니다.
