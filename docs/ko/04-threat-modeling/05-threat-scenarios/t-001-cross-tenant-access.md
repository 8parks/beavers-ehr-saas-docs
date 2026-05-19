---
title: T-01 Cross-Tenant Access
outline: [2, 4]
---

# T-01 Cross-Tenant Access

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S1`, `S2`, `S3` |
| 관련 자산 | `A-01`, `A-02`, `A-03`, `A-04`, `A-06` |
| 관련 경계 | `TB-02`, `TB-03`, `TB-04`, `TB-05` |
| 대표 행위자 | 악의적 Tenant 사용자, 잘못 구성된 애플리케이션 경로, 운영 실수 |

Cross-Tenant Access는 본 프로젝트에서 가장 중요한 금지 시나리오다. 한 테넌트의 정상 사용자가 다른 테넌트의 PHI, 첨부파일, 연구 산출물에 접근할 수 있으면 설계는 실패한 것으로 본다.

본 아키텍처에서 이 위협은 단일 결함으로만 발생하지 않는다. 대개 `identity plane`, `tenant context plane`, `database plane`, `object storage plane` 중 두 계층 이상에서 검증이 동시에 약해질 때 성립한다.

## 검토 대상 구현

- 환자 조회 API와 환자 조회 애플리케이션 함수
- 진료 기록 조회 API와 진료 기록 조회 애플리케이션 함수
- 진료 기록 생성 API와 진료 기록 생성 애플리케이션 함수
- 데이터셋 생성 API와 데이터셋 생성 파이프라인 진입 함수
- tenant registry 데이터 저장소와 애플리케이션의 tenant lookup 로직
- Aurora 접근 시 tenant context를 설정하는 DB 세션 초기화 경로
- 임상 파일 버킷과 연구 데이터셋 버킷의 tenant-bound object key 규칙

## 아키텍처상 주요 실패 지점

| 계층 | 주요 실패 지점 | 본 구조에서의 구체 예시 |
|------|---------------|--------------------------|
| Identity plane | 잘못된 claim 신뢰 | tenant claim만 보고 tenant type, group, scope를 재검증하지 않음 |
| Tenant context plane | 잘못된 매핑 신뢰 | `tenant_registry` 대신 요청값으로 schema 또는 prefix를 구성함 |
| Database plane | 세션 컨텍스트 혼용 | `set_config('app.tenant_id', ..., true)`가 요청마다 재설정되지 않음 |
| Object storage plane | prefix 구속 실패 | 첨부파일 또는 dataset object key가 tenant-bound 형식으로 고정되지 않음 |

## 공격 성립 조건

- 애플리케이션 함수가 tenant claim과 tenant registry 결과를 함께 검증하지 않는다.
- schema 또는 S3 object key를 서버 측 allowlist가 아니라 사용자 입력에서 조합한다.
- RDS Proxy 또는 DB 세션 재사용 환경에서 tenant context가 매 요청마다 재설정되지 않는다.
- RLS 정책이 존재하더라도 `current_setting` 값이 잘못 설정되거나 누락된다.

## 위협 전개

1. 공격자는 자신의 테넌트에서 정상 발급된 JWT를 사용한다.
2. 환자 ID, record ID, dataset ID, object key 등 식별자를 추측하거나 획득한다.
3. 애플리케이션이 tenant 검증을 느슨하게 수행하면, 요청이 다른 테넌트 schema 또는 prefix로 전달된다.
4. 응답 본문, presigned URL, S3 객체, dataset object 중 하나라도 반환되면 cross-tenant 사고가 성립한다.

## 필수 예방 통제

- 모든 데이터 평면 요청은 `tenant_registry` 기반 allowlist를 통해 schema와 prefix를 해석해야 한다.
- Lambda는 Cognito claim의 `tenant_id`, `tenant_type`, `role`, `group`, `scope` 일관성을 재검증해야 한다.
- DB 접근은 트랜잭션 단위 tenant context 재설정과 RLS를 함께 사용해야 한다.
- S3 object key는 tenant-bound 형식으로 고정하고, 요청 본문에서 테넌트 경계를 변경할 수 없어야 한다.

구현 관점에서 최소한 다음 두 조건이 충족되어야 한다.

- schema 이름과 prefix는 사용자 입력에서 파생하지 않고, `tenant_registry`의 검증된 값만 사용한다.
- RDS Proxy 또는 커넥션 재사용 환경에서는 매 트랜잭션 시작 시 tenant context를 다시 설정하고, 이 값 없이는 쿼리가 성공하지 않도록 해야 한다.

## 필수 탐지 통제

- cross-tenant 음성 테스트를 CI 또는 배포 전 검증 절차에 포함한다.
- 다른 테넌트 리소스에 대한 403 이벤트를 별도 분류해 반복 시도를 탐지한다.
- 데이터셋, 첨부파일, 차트 조회 로그에 tenant ID와 actor ID를 함께 남긴다.

## 대응 요구사항

- 의심 세션과 관련 token을 즉시 무효화한다.
- 접근된 자산 유형과 영향 tenant 범위를 산정한다.
- `tenant_registry`, DB context, S3 key validation, RLS 적용 상태를 역추적한다.
- 규제 보고 및 고객 통지 기준에 따라 사고 분류 절차를 개시한다.

## 검증 기준

- tenant A 토큰으로 tenant B의 `patient`, `record`, `attachment`, `dataset` 조회가 모두 거부되어야 한다.
- failover, cold start, connection reuse 조건에서도 동일 검증 결과가 유지되어야 한다.
- 운영자 비상 경로를 제외한 모든 평상시 경로에서 cross-tenant 예외가 없어야 한다.

검증은 단순 API 호출 수준에 머무르면 안 된다. 최소한 다음 세 층위에서 음성 테스트가 필요하다.

- API 계층: 잘못된 token과 path parameter 조합
- DB 계층: 잘못된 tenant context 또는 누락된 context 상태
- 객체 계층: 다른 tenant prefix에 대한 업로드 및 다운로드 시도

## 요구 증빙 및 검증 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| cross-tenant 음성 테스트 | tenant A 토큰으로 tenant B의 patient, record, attachment, dataset 접근을 시도한 결과 | 매 릴리스 |
| `tenant_registry` 검토 기록 | `tenant_id`, `schema_name`, `clinical_file_prefix`, `status` 정합성 점검 결과 | 주간 |
| DB 격리 증빙 | RLS 정책 정의와 tenant context 재설정 경로 검토 기록 | 매 릴리스, DR 후 즉시 |
| 객체 경계 증빙 | clinical file bucket과 dataset bucket의 tenant-bound key 규칙 및 음성 테스트 결과 | 매 릴리스 |

## 배포 차단 조건

- 다른 테넌트의 단일 환자, 단일 record, 단일 객체라도 조회되거나 다운로드되면 배포를 중단한다.
- RLS가 정의되어 있어도 애플리케이션 레이어 음성 테스트가 없으면 배포를 승인하지 않는다.
