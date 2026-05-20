---
title: "S3. 연구용 데이터셋 생성 및 제공"
---
# S3. 연구용 데이터셋 생성 및 제공

병원 관리자가 연구 목적의 데이터셋 생성을 요청하고, 승인 절차를 거쳐 운영 DB와 분리된 별도 Analytics Zone에서 비식별 처리를 수행한 후 승인된 연구기관 연구원에게 데이터셋을 제공하는 흐름입니다. 연구원은 운영 DB에 직접 접근할 수 없으며, 승인된 데이터셋만 다운로드할 수 있습니다. 데이터셋 요청, 승인, 생성, 다운로드의 각 단계가 별도 Lambda로 분리되어 있으며, 요청 상태는 DynamoDB `dataset-request-status`에서 관리됩니다. 운영 DB 직접 접근 차단, 비식별 처리 파이프라인, 반출 승인 절차가 이 시나리오의 세 가지 핵심 통제입니다.

| 항목 | 내용 |
|---|---|
| 주 사용 역할 | 병원 관리자, 연구기관 연구원 |
| 핵심 데이터 | 진단 정보, 치료 이력, 검사 결과, 비식별 정보 |


## 1. 비즈니스 흐름

연구원은 데이터셋 요청(`request-dataset`)을 생성하며, 요청 목적과 필요 필드를 명시합니다. 병원 관리자는 요청을 검토하고 `approve-dataset` Lambda를 통해 승인 처리합니다. 승인 후 `generate-dataset` Lambda가 실행되어 운영 DB에서 데이터를 추출하고 비식별 처리를 수행합니다.

**서비스 흐름**

연구기관 연구원 로그인 → 데이터셋 요청 생성 → 병원 관리자에게 승인 요청 알림 → 병원 관리자 승인 → 데이터셋 생성 파이프라인 실행(비식별 처리) → 데이터셋 S3 저장 → 연구원 데이터셋 다운로드 → export 감사 로그 기록

**세부 설명**

- 요청 상태 관리:
  - `request-dataset` → `PENDING`
  - `approve-dataset` → `APPROVED`
  - `generate-dataset` 완료 → `READY`
  - TTL 만료 → `EXPIRED` (자동 접근 차단)
- 비식별 처리 과정: 직접 식별자 제거 → 가명 ID 치환 → 준식별자 범주화 → 재식별 위험 기준 확인
- 데이터 제공 흐름: 연구기관 요청 → 사전 승인 검증 → dataset 다운로드 또는 API 제공 → export log 기록
  - 연구기관은 운영 DB 접근 권한 없음 (네트워크 레벨 차단)

<!-- 작성 예정: 아키텍처 흐름 다이어그램 -->


## 2. 보안 목표

- 연구원은 운영 DB에 직접 접근 불가, 승인된 데이터셋만 제공
- 데이터셋 요청 시 `role = researcher/irb` 확인
- 병원 관리자의 승인 후에만 데이터셋 생성 가능
- 비식별 처리 파이프라인: 직접 식별자 제거, 가명 ID 치환, 준식별자 일반화, 재식별 위험 기준 확인
- 데이터 반출 시 승인 절차 및 목적 기반 접근 통제
- 요청 상태(PENDING/APPROVED/READY/EXPIRED)를 DynamoDB에서 관리하며 TTL로 자동 만료
- 진료 파일은 진료파일 버킷(Tenant A/B Prefix)에, 데이터셋은 데이터셋 버킷(Dataset A/B)에 분리 저장
- 모든 요청, 승인, 생성, 다운로드 이력 감사 로그 기록

## 3. 보안 설계

**인증 및 역할 기반 접근 통제**

Amazon Cognito User Pool 기반 로그인 처리 후, Pre-token Lambda Trigger를 통해 JWT에 `custom:tenant_id`, `role = researcher/irb` 클레임을 주입합니다. API Gateway에서 JWT를 검증하고 `role = researcher/irb` 여부를 확인합니다. 연구원은 `request-dataset`과 `download-dataset` Lambda에만 접근 가능하며, `approve-dataset`과 `generate-dataset`은 병원 관리자 권한으로만 실행됩니다.

**승인 기반 접근 통제**

`generate-dataset` Lambda는 `dataset-request-status` 테이블의 상태가 `APPROVED`인 경우에만 실행됩니다. 병원 관리자의 명시적 승인 없이는 데이터 추출 및 비식별 처리가 시작되지 않습니다. `download-dataset` Lambda는 상태가 `READY`이고 TTL이 유효한 요청에 한해서만 다운로드를 허용합니다. TTL 만료 시 `EXPIRED`로 자동 전환되어 접근이 차단됩니다.

**운영 DB 직접 접근 차단**

연구원은 운영 DB에 어떤 경로로도 직접 접근할 수 없습니다. 데이터 추출은 `generate-dataset` Lambda에서만 수행하며, RDS Proxy를 통해 Aurora Read Instance에 접근합니다. Aurora Read Instance는 Private DB Subnet에 배치되며 NACL과 Security Group으로 접근을 제한합니다.

**비식별 처리 파이프라인**

`generate-dataset` Lambda에서 직접 식별자 제거, 가명 ID 치환, 준식별자 일반화, 재식별 위험 기준 확인의 4단계 비식별 처리를 수행합니다. 재식별 위험 기준 미충족 시 데이터셋 생성을 중단하고 요청 상태를 `FAILED`로 변경합니다.

**테넌트 격리**

Aurora Read Instance에서 데이터 추출 시 Schema-per-Tenant(1차)와 RLS 정책(2차)을 적용하여 요청 Tenant의 데이터만 추출합니다. 생성된 데이터셋은 데이터셋 버킷 내 Dataset A / Dataset B로 분리 저장합니다.

**자격증명 및 암호화 관리**

Lambda는 DB 접속 정보를 Secrets Manager Interface Endpoint를 통해 런타임에 조회합니다. Aurora 및 S3 저장 데이터는 KMS CMK(고객 관리 키)로 암호화하며, CMK는 주기적으로 교체합니다. KMS 접근은 KMS Interface Endpoint를 통해 VPC 내부에서만 이루어집니다.

**네트워크 경계 보안**

모든 Lambda는 Private App Subnet에 배치하며 NACL과 Security Group을 이중 적용합니다. DynamoDB, S3, Secrets Manager, KMS 접근은 각각 Gateway Endpoint 또는 Interface Endpoint를 통해 VPC 내부에서만 이루어지며 인터넷을 경유하지 않습니다.

**감사 로그 무결성**

CloudWatch와 CloudTrail로 수집된 로그는 S3 Gateway Endpoint를 통해 로그 전용 S3 버킷에 Tenant별 Prefix(Tenant A Prefix / Tenant B Prefix)로 분리 저장합니다. 데이터셋 요청, 승인, 생성, 다운로드 이력을 포함한 모든 이벤트가 감사 로그 대상입니다.


## 4. 보안 통제 및 규제
<!-- 작성 예정: 규제에 링크 연결 --> 

| 통제 항목 | 수단 | 규제 |
|---|---|---|
| 인증 | Amazon Cognito User Pool + JWT | |
| 승인 기반 접근 통제 | DynamoDB `dataset-request-status`(상태 관리 + TTL 자동 만료), `approve-dataset` Lambda(병원 관리자 명시적 승인) | |
| 비식별 처리 파이프라인 | `generate-dataset` Lambda(직접 식별자 제거·가명 ID 치환·준식별자 일반화·재식별 위험 기준 확인) | |
| 테넌트 격리 | Aurora PostgreSQL Schema-per-Tenant + RLS, 데이터셋 버킷 Dataset A/B 분리 저장 | |
| DB 접근 통제 | RDS Proxy(직접 접근 차단), Private Subnet + NACL + Security Group | |
| 파일 저장 | 진료파일 버킷(Tenant별 Prefix), 데이터셋 버킷(Dataset A/B), S3 Gateway Endpoint(인터넷 미경유), KMS CMK 암호화 | |
| 자격증명 관리 | Secrets Manager(DB 접속 정보 런타임 조회), KMS CMK(주기적 교체), KMS Interface Endpoint | |
| 감사 로그 | CloudTrail(AWS API 호출 기록), CloudWatch Logs(요청·승인·생성·다운로드 이벤트), 로그 S3 Tenant별 Prefix 분리 저장 | |


## 5. 보안 체크리스트

- [ ] 연구원은 `request-dataset`과 `download-dataset` Lambda에만 접근이 가능합니다.
- [ ] `generate-dataset`은 상태가 `APPROVED`인 경우에만 실행됩니다.
- [ ] `download-dataset`은 상태가 `READY`이고 TTL이 유효한 경우에만 허용됩니다.
- [ ] 비식별 처리 4단계(직접 식별자 제거·가명 ID 치환·준식별자 일반화·재식별 위험 기준 확인)가 수행됩니다.
- [ ] 재식별 위험 기준 미충족 시 데이터셋 생성이 중단되고 상태가 `FAILED`로 변경됩니다.
- [ ] Aurora Read Instance에서 Schema-per-Tenant(1차)와 RLS(2차)가 적용됩니다.
- [ ] 데이터셋 버킷이 Dataset A/B로 분리 저장됩니다.
- [ ] 모든 요청·승인·생성·다운로드 이력이 감사 로그에 기록됩니다.
- [ ] DynamoDB·S3·Secrets Manager·KMS 접근이 VPC 내부 Endpoint를 통해서만 이루어집니다.
