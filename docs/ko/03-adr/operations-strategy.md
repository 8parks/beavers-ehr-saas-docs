---
title: 운영 및 라이프사이클 전략
---

# 운영 및 라이프사이클 전략

테넌트를 온보딩하고, 서비스 해지 시 데이터를 안전하게 파기하며, 비상 상황에서 접근 권한을 어떻게 다룰 것인지에 대한 전략입니다.


## 1. Tenant 레지스트리와 상태 관리

### 설계 원칙

멀티테넌트 SaaS에서 모든 API 요청은 해당 테넌트가 현재 어떤 상태인지를 먼저 확인해야 합니다. 테넌트 상태를 코드나 설정 파일이 아닌 런타임에 조회 가능한 중앙 레지스트리에서 관리하면, 온보딩·정지·오프보딩 상태 변화를 즉시 반영할 수 있습니다.

### 결정

**DynamoDB `ehr-tenant-registry` 테이블을 Tenant 상태의 단일 진실 공급원으로 사용하며, 모든 Lambda는 요청 처리 전 이 테이블에서 `status`를 확인합니다.**

### 상태 전이

```
PROVISIONING → ACTIVE → SUSPENDED → DECOMMISSIONING → ARCHIVED → DELETED
```

| 상태 | 설명 |
|------|------|
| `PROVISIONING` | 테넌트 생성 중. 일반 API 접근 거부 |
| `ACTIVE` | 정상 운영 중. 모든 API 허용 |
| `SUSPENDED` | 일시 정지(미납, 계약 위반 등). 일반 API 접근 차단, 데이터 보존 |
| `DECOMMISSIONING` | 해지 처리 중. 데이터 export 및 파기 절차 진행 |
| `ARCHIVED` | 보존 의무가 남은 데이터 장기 보관. 모든 API 접근 차단 |
| `DELETED` | 모든 데이터 파기 완료. 레코드 자체는 audit trail로 보존 |

### 레지스트리 구조

```
ehr-tenant-registry (DynamoDB)
├── tenant_id (PK)          -- 예측 불가능한 UUID
├── schema_name             -- Aurora schema명 (allowlist)
├── status                  -- 현재 Tenant 상태
├── clinical_file_prefix    -- S3 진료 파일 prefix
├── dataset_prefix          -- S3 연구 데이터셋 prefix
├── created_at
└── updated_at
```

### Lambda 요청 처리 기준

1. JWT `custom:tenant_id` 추출
2. `ehr-tenant-registry` 조회 → `status == ACTIVE` 확인
3. `schema_name` allowlist 확인 (JWT tenant_id를 직접 schema명으로 사용 금지)
4. transaction-local `app.tenant_id` 설정
5. DB / S3 / DynamoDB 작업 수행


## 2. Tenant 프로비저닝 (온보딩)

### 설계 원칙

온보딩 시점에 생성되는 Aurora schema, RLS policy, S3 prefix, Cognito custom attribute, tenant registry 항목이 서로 일치하지 않으면 이후 전체 데이터 격리가 깨집니다. 구성 요소를 표준화된 절차 안에서 함께 생성하고, 검증 통과 후에만 `ACTIVE`로 전환합니다.

### 결정

**IaC 기반 프로비저닝 파이프라인을 통해 모든 구성 요소를 원자적으로 생성하고, cross-tenant 차단 테스트 통과 후에만 `ACTIVE`로 전환합니다.**

### 프로비저닝 절차

1. `ehr-tenant-registry`에 `PROVISIONING` 상태로 등록 (`tenant_id` = 예측 불가능한 UUID)
2. Aurora tenant schema, table, index, RLS policy, grant 생성
3. S3 prefix 규칙 등록 (`clinical_file_prefix`, `dataset_prefix`)
4. Cognito 사용자 custom attribute 설정 (`custom:tenant_id`, `role`)
5. cross-tenant 차단 테스트 수행
6. 테스트 통과 후 `ACTIVE`로 전환
7. 초기 관리자 계정 발급 (Secrets Manager에 임시 자격증명 저장, `FORCE_CHANGE_PASSWORD`)
8. 병원 관리자 최초 로그인 → 비밀번호 강제 변경 + MFA 설정

### 보안 원칙

- `tenant_id`는 예측 불가능한 UUID 사용 (순차 ID 금지)
- 병원 관리자 계정은 최대 3개로 제한
- `PROVISIONING` 상태에서는 일반 API 요청 전부 거부
- 온보딩 전 과정 (`tenant_id` 발급, 스키마 생성, `ACTIVE` 전환)을 CloudTrail + CloudWatch Logs에 기록

### 온보딩 이벤트 로그

```json
{
  "event_type": "TENANT_PROVISIONED",
  "tenant_id": "hospital_a",
  "schema_name": "hospital_a",
  "initiated_by": "operator_001",
  "timestamp": "2026-04-28T09:00:00Z"
}
```

> 검증 항목, 역할 분리, 증빙 요건 등 구체적인 운영 절차는 [운영 가이드 — Tenant 온보딩](../06-runbook/01-tenant-lifecycle#tenant-onboarding)을 참고합니다.


## 3. Tenant 오프보딩 및 데이터 파기

### 설계 원칙

서비스 해지 시 즉시 물리 삭제가 아니라 단계적 처리를 원칙으로 합니다. 의료법상 보존 의무 기간이 남은 데이터는 `ARCHIVED` 상태로 전환하여 접근만 차단하고 즉시 파기하지 않습니다. 오프보딩 과정이 다른 테넌트의 서비스에 영향을 주어서는 안 됩니다.

### 결정

**레지스트리 기반 즉시 접근 차단 → 데이터 export 유예 기간 부여 → 보존 기간 확인 → 단계적 파기 순으로 처리합니다. 파기 이력은 파기 대상에서 제외하고 별도 보존합니다.**

### 오프보딩 절차

```
해지 요청 접수
  → status: ACTIVE → SUSPENDED (일반 API 즉시 차단)
  → Cognito 계정 비활성화 + refresh token 무효화
  → 데이터 export 유예 기간 제공
  → status: SUSPENDED → DECOMMISSIONING
  → Aurora schema DROP → S3 prefix 삭제 → DynamoDB 항목 삭제
  → 보존 의무 잔여 데이터: status → ARCHIVED
  → 보존 기간 만료 데이터: 파기 + 파기 확인서 발급
  → 모든 이력 감사 로그 별도 보존
```

### 데이터 파기 범위

| 대상 | 처리 방법 |
|------|----------|
| Aurora tenant schema | 보존 기간 확인 후 DROP |
| S3 진료 파일 prefix | 해당 Tenant prefix 경계 내에서만 삭제 |
| S3 연구 데이터셋 prefix | 해당 Tenant prefix 경계 내에서만 삭제 |
| DynamoDB Tenant 항목 | dataset-request-status 등 Tenant 관련 항목 삭제 |
| Cognito 계정 / 그룹 | 사용자 비활성화, 그룹 제거 |
| 백업 스냅샷 | Aurora automated backup 보존 기간 확인 후 처리 |
| 감사 로그 | 파기 대상 제외 — 별도 보존 |

### 보안 원칙

- Aurora 스키마 DROP 전 다른 테넌트 스키마 영향 없음 사전 검증 필수
- S3 Object Lock이 걸린 감사 로그는 retention 만료 전 삭제 불가
- 파기 이력 자체는 영구 보존 (파기 확인서 포함)

> 역할 분리, 잔존 자산 등록부, 증빙 요건 등 구체적인 운영 절차는 [운영 가이드 — Tenant 오프보딩](../06-runbook/01-tenant-lifecycle#tenant-offboarding)을 참고합니다.


## 4. Break-glass 비상 접근

### 설계 원칙

SaaS 운영자가 테넌트 내부 의료 데이터에 직접 접근하지 않는 것이 기본 원칙입니다. 이를 테넌트별 KMS CMK 기반 암호화와 CloudTrail 로그로 증빙합니다. 단, 응급 진료 지원·장애 대응·보안 사고 조사처럼 환자 안전 또는 서비스 연속성에 영향을 미치는 상황에서는 Break-glass 절차를 통해 제한적 접근을 허용합니다.

HIPAA Security Rule은 긴급 접근 절차 수립을 요구하며, 모든 접근은 기록·검토되어야 합니다.

### 결정

**MFA 재인증 + AWS STS 임시 자격증명(TTL) + Break-glass 전용 IAM Role을 조합하고, 접근 로그를 일반 감사 채널과 분리된 전용 Log Group에 기록합니다. 접근 발생 즉시 병원 관리자에게 알림을 발송하고 사후 보고서 작성을 의무화합니다.**

### 적용 상황

| 상황 | 설명 |
|------|------|
| 응급 진료 지원 | 장애로 인해 의료진이 시스템에 접근할 수 없는 경우 |
| 장애 대응 | 데이터 손상 또는 서비스 중단 복구 |
| 보안 사고 조사 | Cross-tenant 접근 시도, 데이터 유출 의심 사고 분석 |
| 규제 감사 대응 | 외부 감사기관 요청에 따른 데이터 접근 |

### 필수 통제

| 통제 항목 | 방법 |
|----------|------|
| 강한 인증 | MFA 재인증(Cognito), 접근 사유 입력 필수 |
| 임시 권한 | AWS STS 임시 자격증명 (TTL 설정), Break-glass 전용 IAM Role (최소 권한) |
| 별도 감사 채널 | Break-glass 전용 CloudWatch Log Group — 운영자 자신의 쓰기 권한 분리 |
| 로그 무결성 | S3 Object Lock Compliance Mode 적용 |
| 실시간 알림 | EventBridge → SNS → Slack / 이메일 (병원 관리자, 보안 담당자) |
| 이상 탐지 | CloudWatch Metric Filter (Break-glass 접근 빈도), GuardDuty (이상 인증 패턴) |
| 사후 리뷰 | 사후 보고서 의무화, 반복·부당 접근 시 징계·조사 절차 연계 |

### Break-glass 이벤트 로그

```json
{
  "event_type": "BREAK_GLASS_ACTIVATED",
  "operator_id": "operator_001",
  "tenant_id": "hospital_a",
  "reason": "DB 장애로 인한 진료 시스템 복구",
  "sts_session_id": "session_abc123",
  "ttl_expires_at": "2026-04-28T12:00:00Z",
  "timestamp": "2026-04-28T10:30:00Z"
}
```

### 보안 함의

- 평시에는 KMS CMK로 암호화된 PHI에 운영자가 접근할 수 없으며, 이를 CloudTrail로 증빙
- TTL 만료 즉시 자격증명 회수 — 수동 세션 종료도 가능
- Break-glass 로그는 운영자 자신도 수정·삭제 불가 (권한 분리 + Object Lock)

> 중요도 분류, 단계별 대응 절차, 복구 선언 기준 등 구체적인 사고 대응 절차는 [운영 가이드 — 사고 대응](../06-runbook/03-incident-response)을 참고합니다.


## 추가 고민할 지점

- Break-glass 접근 사전 승인 vs. 사후 보고 선택 기준 (상황별 적용 기준 구체화 필요)
- ARCHIVED 상태 데이터의 KMS 키 관리 — 키를 보존하면서도 접근을 차단하는 방법
- 오프보딩 시 DynamoDB TTL과 Aurora backup retention 만료 시점 불일치 처리 방안


## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 접근 제어 | Registry 기반 status 확인, ACTIVE 테넌트만 API 허용 |
| 긴급 접근 절차 | Break-glass — HIPAA Security Rule 164.312(a)(2)(ii) |
| 데이터 파기 | 단계적 파기, 보존 기간 준수, 파기 확인서 발급 |
| 감사 추적성 | 온보딩·오프보딩·Break-glass 전 과정 CloudTrail + CloudWatch 기록 |
| 내부자 위협 통제 | Break-glass 로그 권한 분리, 사후 리뷰 의무화 |
