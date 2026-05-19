---
title: "S4. Tenant 온보딩"
---
# S4. Tenant 온보딩

새로운 병원이 SaaS에 가입하여 Tenant가 생성되고, 초기 관리자 계정이 발급되어 서비스 이용이 시작되기까지의 전 과정입니다. 이 시점부터 모든 데이터가 `tenant_id` 단위로 구분되므로, 프로비저닝 과정의 설정 오류는 이후 전체 데이터 보안에 직접적인 영향을 줍니다. DB schema, RLS policy, S3 prefix, Cognito 사용자 속성, tenant registry가 서로 불일치하면 cross-tenant 접근 위험이 생기기 때문에, 이 모든 요소를 하나의 표준화된 절차 안에서 함께 구성하고 검증 통과 후에만 `ACTIVE`로 전환합니다.

| 항목 | 내용 |
|---|---|
| 주 사용 역할 | SaaS 운영자, 신규 병원 관리자 |
| 핵심 데이터 | tenant_id, 초기 관리자 계정 정보, 인증 정보, DB 스키마 설정값, S3 Prefix 설정값 |


## 1. 비즈니스 흐름

병원 관리자가 서비스에 가입하면 Tenant가 생성되고 초기 관리자 계정이 생성됩니다. 이 시점부터 모든 데이터는 `tenant_id` 단위로 구분되며, 이후 모든 요청은 Tenant 기준으로 처리됩니다.

**서비스 흐름**

SaaS 운영자 가입 승인 → `tenant_id` 발급 → Tenant 레지스트리 등록 → Aurora 스키마, RLS policy, grant 생성 → S3 Prefix 규칙 등록 → Cognito 그룹 및 custom attribute 설정 → cross-tenant 차단 테스트 수행 → 검증 통과 후 `ACTIVE` 전환 → 초기 관리자 계정 발급 → 병원 관리자 최초 로그인 → 비밀번호 강제 변경 + MFA 설정

**세부 설명**

- 신규 Tenant 생성 절차:
  1. `ehr-tenant-registry`에 `PROVISIONING` 상태로 등록
  2. Aurora tenant schema, table, index, RLS policy, grant 생성
  3. S3 prefix 규칙 등록(`clinical_file_prefix`, `dataset_prefix`)
  4. Cognito 사용자 custom attribute 설정(`custom:tenant_id`, `role`)
  5. cross-tenant 차단 테스트 수행
  6. 검증 통과 후 `ACTIVE`로 변경
- Lambda 처리 기준: JWT `custom:tenant_id` 추출 → `ehr-tenant-registry` 조회 → `status == ACTIVE` 확인 → `schema_name` allowlist 확인 → transaction-local `app.tenant_id` 설정 → DB/S3/DynamoDB 작업 수행
- 계정 인계 이후: 병원 관리자는 최초 로그인 시 비밀번호를 강제 변경하고 MFA를 설정함. 이후 의사·간호사 계정 생성 및 역할 부여는 병원 관리자 권한으로 수행

<!-- 작성 예정: 아키텍처 흐름 다이어그램 -->


## 2. 보안 목표

- `tenant_id`는 예측 불가능한 UUID를 사용하며 순차 ID 사용 금지
- Tenant당 병원 관리자 계정은 최대 3개로 제한
- 초기 임시 비밀번호는 일회성 발급, 최초 로그인 시 강제 변경
- 병원 관리자 계정에 MFA 설정 강제 적용
- `status`가 `ACTIVE`가 아닌 Tenant의 요청은 모두 거부
- Aurora schema, table, index, RLS policy, grant, S3 prefix, Cognito custom attribute를 함께 구성
- 신규 Tenant 생성 후 cross-tenant 차단 테스트 수행
- 온보딩 전 과정 감사 로그 기록


## 3. 보안 설계

**Registry 기반 Tenant 상태 관리**

모든 API 요청은 `ehr-tenant-registry`의 status를 확인하여 `ACTIVE`인 경우에만 처리합니다. Lambda는 JWT의 `custom:tenant_id`를 직접 schema명으로 사용하지 않고, registry에서 `schema_name`을 조회하고 allowlist를 확인한 후 `app.tenant_id`를 설정합니다. 이를 통해 JWT 위변조나 존재하지 않는 `tenant_id`를 통한 접근을 차단합니다.

**구성 요소 일관성 보장**

Aurora schema, RLS policy, grant, S3 prefix, Cognito custom attribute를 하나의 프로비저닝 절차 안에서 함께 구성합니다. 구성 요소 간 불일치는 cross-tenant 접근 위험의 직접적인 원인이 되므로, CI/CD 파이프라인에 보안 검증 단계를 포함합니다.

**검증 후 ACTIVE 전환**

프로비저닝 완료 후 cross-tenant 차단 테스트를 수행하고, 테스트 통과 시에만 `ACTIVE`로 전환합니다. `PROVISIONING` 상태에서는 일반 API 요청이 거부됩니다.

**초기 계정 보안**

병원 관리자 계정은 최대 3개로 제한합니다. 임시 비밀번호는 Secrets Manager에 저장하며, Cognito `FORCE_CHANGE_PASSWORD` 상태를 통해 최초 로그인 시 강제 변경을 적용합니다. MFA는 병원 관리자 계정에 권고 또는 강제 적용합니다.

**감사 로그**

온보딩 전 과정(`tenant_id` 발급, 스키마 생성, RLS 설정, 계정 생성, `ACTIVE` 전환)을 CloudTrail과 CloudWatch Logs에 기록합니다.


## 4. 보안 통제 및 규제
<!-- 작성 예정: 규제 링크 연결 -->

| 통제 항목 | 수단 | 규제 |
|---|---|---|
| Tenant 레지스트리 관리 | DynamoDB `ehr-tenant-registry`(`tenant_id`, `schema_name`, `status`: PROVISIONING→ACTIVE, S3 Prefix 등록) | |
| 스키마 자동 프로비저닝 | IaC/Terraform 기반 Aurora schema, table, index, RLS policy, grant 생성 | |
| Registry 기반 접근 통제 | `status == ACTIVE` 확인, `schema_name` allowlist 확인, `app.tenant_id` transaction-local 설정 | |
| 인증·계정 관리 | Cognito User Pool 그룹 + custom attribute 설정, `FORCE_CHANGE_PASSWORD`, MFA 적용, 초기 계정 3개 제한 | |
| 자격증명 관리 | Secrets Manager(초기 자격증명 + DB 접속 정보 저장) | |
| 검증 | cross-tenant 차단 테스트 수행 후 `ACTIVE` 전환 | |
| 감사 로그 | CloudTrail + CloudWatch Logs(온보딩 이벤트 전 과정 기록) | |


## 5. 보안 체크리스트

- [ ] `tenant_id`가 예측 불가능한 UUID로 발급됩니다(순차 ID 사용 금지).
- [ ] `ehr-tenant-registry`에 `PROVISIONING` 상태로 먼저 등록됩니다.
- [ ] Aurora schema, table, index, RLS policy, grant가 함께 생성됩니다.
- [ ] S3 prefix 규칙이 등록됩니다(`clinical_file_prefix`, `dataset_prefix`).
- [ ] Cognito custom attribute(`custom:tenant_id`, `role`)가 올바르게 설정됩니다.
- [ ] cross-tenant 차단 테스트를 통과한 후에만 `ACTIVE`로 전환됩니다.
- [ ] 임시 비밀번호가 일회성으로 발급되고 최초 로그인 시 강제 변경됩니다.
- [ ] 병원 관리자 계정에 MFA가 적용됩니다.
- [ ] 병원 관리자 계정이 최대 3개로 제한됩니다.
- [ ] 온보딩 이벤트 전 과정이 CloudTrail과 CloudWatch Logs에 기록됩니다.