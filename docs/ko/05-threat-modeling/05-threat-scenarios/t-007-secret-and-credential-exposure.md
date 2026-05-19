---
title: T-07 비밀정보 및 자격증명 노출
outline: [2, 4]
---

# T-07 비밀정보 및 자격증명 노출

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S2`, `S3`, `S6`, `S7` |
| 관련 자산 | `A-07`, `A-09`, `A-10` |
| 관련 경계 | `TB-05`, `TB-07` |
| 대표 행위자 | 운영자, 잘못된 Lambda 역할, 배포 파이프라인, 로깅 실수 |

DB 자격증명, break-glass credential, 애플리케이션 secret이 노출되면 데이터 평면 전체에 대한 비인가 접근이 가능해질 수 있다. 이 위협은 데이터 저장소 보호를 우회하는 가장 직접적인 경로 중 하나다.

## 검토 대상

- Secrets Manager에 저장된 환자 데이터베이스 접속 정보, 진료 기록 데이터베이스 접속 정보, dataset 생성 경로가 참조하는 secret
- 환자 조회, 진료 기록 조회, 진료 기록 생성, dataset 생성 함수에 연결된 실행 역할
- 운영자 SSM 접근 역할과 break-glass용 자격증명 보관 절차
- CI/CD, Lambda environment variable, 애플리케이션 로그, 배포 산출물의 secret 노출 여부

## 공격 성립 조건

- secret이 코드, 환경 변수, 로그, 배포 산출물에 직접 노출된다.
- 기능별로 분리되어야 할 secret이 공용 role에 열려 있다.
- break-glass credential이 장기 보관되며 사용 후 자동 회수되지 않는다.
- secret access에 대한 감사와 경보가 없다.

## 위협 전개

1. 공격자는 잘못 구성된 권한, 노출된 로그, 취약한 배포 경로를 통해 secret 값을 획득한다.
2. 획득한 secret으로 DB, dataset path, 운영자 예외 경로에 접근한다.
3. 정상 애플리케이션 인가를 거치지 않고 직접 데이터 평면에 도달한다.

## 필수 예방 통제

- secret은 Secrets Manager에 저장하고 코드 및 로그에 평문으로 남기지 않는다.
- 기능별 Lambda 역할에 필요한 secret만 읽기 권한을 부여한다.
- break-glass secret은 JIT 발급과 만료 정책을 가져야 한다.
- secret rotation 주기와 비상 회전 절차를 명시해야 한다.

## 필수 탐지 통제

- `GetSecretValue` 호출 패턴을 역할별로 모니터링한다.
- 정상 사용량을 초과하는 secret 조회 또는 운영 시간 외 조회를 탐지한다.
- 코드 저장소와 배포 산출물에서 secret 누출 스캔을 수행한다.

## 대응 요구사항

- 노출된 secret을 즉시 회전한다.
- 해당 secret을 사용하던 세션과 자격증명을 폐기한다.
- 관련 로그, 역할, 배포 경로, 운영 경로를 역추적해 노출 범위를 확인한다.

## 검증 기준

- 모든 데이터 평면 secret은 Secrets Manager에서만 조회되어야 한다.
- 운영자 또는 공용 role이 업무와 무관한 secret을 읽을 수 없어야 한다.
- secret rotation과 회수 절차가 runbook에 있어야 한다.

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| secret inventory | secret 이름, 사용 워크로드, 허용 principal, 회전 주기 | 월간 |
| IAM read policy 검토 | 각 Lambda 역할과 운영 역할의 `secretsmanager:GetSecretValue` 범위 | 매 릴리스 |
| rotation 실행 기록 | 정기 회전과 비상 회전 수행 결과, 실패 이력 | 회전 시마다 |
| 누출 스캔 결과 | 코드 저장소, 아티팩트, 로그에서의 secret 노출 스캔 결과 | 매 릴리스 |

## 배포 차단 조건

- DB 자격증명 또는 break-glass secret이 코드, 환경 변수, 문서 본문에 평문으로 존재하면 배포를 중단한다.
- secret access 이벤트를 감사할 수 없으면 배포를 승인하지 않는다.
