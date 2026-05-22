---
title: 멀티테넌트 전략
---

# 핵심 멀티테넌트 전략

여러 병원이 같은 플랫폼을 쓰면서도 서로의 데이터에 접근할 수 없도록 하는 것이 이 설계의 핵심입니다. 애플리케이션 레이어의 tenant 검증만으로는 충분하지 않으며, DB 계층·캐시·로그·파일 저장 등 모든 데이터 접근 경로에서 tenant 격리를 강제해야 합니다.

> JWT 기반 tenant 클레임 검증과 인가 전략은 [인증/인가 전략](./auth-strategy)에서, Tenant Provisioning·Lifecycle 관리는 [운영 및 라이프사이클 전략](./operations-strategy)에서 다룹니다.


## 1. DB 계층 격리 — Schema-per-Tenant + RLS

### 격리 모델: Bridge

이 설계는 **Bridge 모델**을 기반으로 합니다. 각 테넌트마다 독립된 PostgreSQL 스키마를 두고, 트랜잭션 시작 시점에 `SET LOCAL search_path`를 통해 테넌트 컨텍스트를 명시적으로 설정합니다.

권한 관리는 테넌트별 DB role을 기반으로 합니다. 각 스키마에 대한 GRANT는 해당 테넌트의 DB 사용자에게만 부여되며, 불필요한 권한은 REVOKE로 즉시 회수합니다. 결과적으로 A 테넌트의 DB 사용자는 B 테넌트 스키마에 물리적으로 접근 자체가 불가능합니다.

Aurora 특성상 Writer에서 설정된 권한이 Reader에도 자동으로 반영되므로, 읽기 트래픽에서도 동일한 격리가 보장됩니다.

### 결정

**Schema-per-Tenant를 기본 격리 전략으로 채택하고, RLS를 심층 방어 메커니즘으로 추가 적용합니다.**

### 고려된 대안

| 대안 | 격리 수준 | 운영 복잡도 | 비용 |
|------|-----------|------------|------|
| 완전 공유 테이블 (`tenant_id` 컬럼만) | 낮음 | 낮음 | 낮음 |
| RLS 단독 | 중간 | 중간 | 낮음 |
| Schema-per-Tenant | 중간-높음 | 중간 | 낮음-중간 |
| **Schema-per-Tenant + RLS (채택)** | **높음** | **중간-높음** | **낮음-중간** |
| Database-per-Tenant | 높음 | 높음 | 높음 |

### Bridge 모델인데 왜 RLS를 도입했는가

스키마 격리와 권한 분리만으로도 테넌트 isolation은 보장됩니다. 그럼에도 RLS를 추가로 도입한 이유는 두 가지입니다.

**PHI를 다루는 환경에서는 단일 방어선으로 충분하지 않습니다.** HIPAA minimum necessary 원칙은 다층 방어를 요구합니다. 환자 진료 정보라는 데이터 성격상, 스키마 격리 하나만으로 설계를 마무리하는 것은 적절하지 않다고 판단했습니다.

**애플리케이션 로직 실수에 대한 방어선이 필요합니다.** 예를 들어 `SET LOCAL search_path` 호출이 누락되거나 잘못된 테넌트 ID가 전달되는 버그가 생긴 경우, RLS가 DB 레벨에서 한 번 더 차단해 줍니다.

RLS 적용 범위는 Bridge 모델의 특성에 맞게 구분합니다. **공유 테이블**에는 RLS를 1차 격리 수단으로 적용하고, **임상 테이블**에는 스키마 격리 위에 RLS를 중복 적용해 보조합니다.

### 기술적 요구사항

- 테넌트별 schema 분리 (`hospital_a`, `hospital_b` 등)
- 테넌트별 DB role 기반 GRANT/REVOKE 관리
- cross-schema query 제한
- migration 및 운영자 계정 권한 최소화
- pgaudit으로 cross-schema 접근 시도 기록

### AWS / PostgreSQL 구현

Aurora PostgreSQL을 사용합니다. Writer에서 설정된 권한은 Aurora 복제 메커니즘에 의해 Reader에 자동으로 반영됩니다. 운영자 계정과 애플리케이션 계정은 분리합니다.

```sql
CREATE SCHEMA hospital_a;
CREATE SCHEMA hospital_b;

REVOKE ALL ON SCHEMA hospital_a FROM PUBLIC;
REVOKE ALL ON SCHEMA hospital_b FROM PUBLIC;

GRANT USAGE ON SCHEMA hospital_a TO app_role_hospital_a;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA hospital_a TO app_role_hospital_a;
```


## 2. Connection-level Tenant Context 설정

### 설계 원칙

Lambda는 Aurora에 직접 접근하지 않고 RDS Proxy를 경유합니다. RDS Proxy를 통해 Aurora 부하를 줄이는 동시에, DB 접속 정보는 Secrets Manager Interface Endpoint를 통해 VPC 외부로 트래픽을 노출하지 않고 조회합니다. 이때 테넌트별로 발급된 DB 자격증명을 통해서만 연결이 성립하도록 설계했습니다.

connection pool을 사용할 경우, 이전 요청의 tenant context가 다음 요청에 남아 있으면 cross-tenant leakage가 발생할 수 있습니다. 따라서 매 요청마다 DB connection에 tenant context를 명시적으로 설정해야 합니다.

### 결정

**Lambda handler 시작 시 JWT에서 검증된 `tenant_id`를 추출하여 DB connection에 transaction-local context로 설정하고, RLS policy가 이 값을 참조하도록 합니다.**

### 기술적 요구사항

- 요청 단위 tenant context 설정
- DB connection 재사용 시 tenant context 초기화
- ORM 또는 DB middleware에서 tenant 조건 자동 주입
- 요청 종료 후 context reset
- connection pool 사용 시 tenant contamination 방지

### AWS / PostgreSQL 구현

```sql
-- 요청 처리 시작
BEGIN;
SET LOCAL search_path = hospital_a;
SET LOCAL app.current_tenant = 'hospital_a';

SELECT * FROM patient_records
WHERE tenant_id = current_setting('app.current_tenant');

COMMIT;
-- transaction 종료 시 SET LOCAL 값은 모두 자동 해제됨
-- search_path도 트랜잭션 로컬이므로 RDS Proxy connection 반환 후 오염 없음
```

RLS 정책 예시:

```sql
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy
  ON patient_records
  USING (tenant_id = current_setting('app.current_tenant'));
```


## 3. 캐시·로그·임시 파일 Tenant 분리

### 설계 원칙

멀티테넌트 격리는 DB에서만 끝나지 않습니다. 실제 운영 환경에서는 캐시, 로그, 임시 파일, export 파일, 분석 결과에도 tenant 정보가 포함될 수 있습니다. 이 영역에서 tenant 분리가 누락되면 DB가 안전해도 데이터가 우회적으로 노출될 수 있습니다.

### 결정

**캐시 key prefix, S3 prefix, CloudWatch 로그 필드에 `tenant_id`를 포함하고, KMS encryption context에도 `tenant_id`를 적용합니다. 로그에는 PHI 원문을 기록하지 않습니다.**

### 기술적 요구사항

- 캐시 key에 tenant prefix 적용
- S3 object prefix를 tenant별로 분리
- 로그 필드에 `tenant_id` 필수 포함
- 임시 파일 및 export 파일 만료 정책 적용
- KMS encryption context에 `tenant_id` 포함 검토
- 로그에 PHI 원문(이름, 주민번호 등) 기록 금지

### AWS 구현

**캐시 (Redis / ElastiCache)**
```
{tenant_id}:patient:{record_id}
```

**S3 prefix**
```
s3://ehr-documents/tenants/hospital_a/records/{record_id}.pdf
s3://ehr-exports/tenants/hospital_a/exports/{export_id}.zip
```

S3 bucket policy에서 prefix 기반 접근을 제한하고, S3 lifecycle policy로 export 파일을 자동 만료합니다.

**CloudWatch Logs 로그 필드 예시**
```json
{
  "tenant_id": "hospital_a",
  "user_id": "doctor_123",
  "record_id": "record_789",
  "action": "READ_PATIENT_RECORD",
  "source_ip": "203.0.113.10",
  "timestamp": "2026-04-28T10:30:00Z"
}
```

PHI 원문은 포함하지 않고 식별자 중심으로 기록합니다.


## 4. Cross-tenant 접근 시도 탐지 및 대응

### 설계 원칙

보안 설계에서는 접근 차단뿐 아니라, 차단된 접근 시도를 탐지하고 대응하는 것이 중요합니다. JWT의 `tenant_id`와 요청 대상 리소스의 `tenant_id`가 다를 경우 단순 오류일 수도 있지만, 권한 우회 시도일 가능성도 있습니다.

Cross-tenant access attempt는 별도의 보안 이벤트로 기록하고, 반복 발생하거나 민감 API에서 발생하면 즉시 알림을 발생시킵니다.

### 결정

**애플리케이션에서 tenant mismatch를 structured log로 기록하고, CloudWatch Metric Filter + Alarm으로 임계치 초과 시 SNS를 통해 알림을 발생시킵니다.**

### 기술적 요구사항

- tenant mismatch 이벤트 structured log 기록
- CloudWatch Metric Filter로 `TENANT_MISMATCH` 이벤트 카운트
- 반복 시도 탐지 및 임계치 알람
- 관리자 알림 (SNS → Slack 등)
- 사용자 계정 잠금 또는 세션 무효화 검토
- 사고 대응 Runbook과 연결 (→ [S6. 운영자 비상 접근](../02-scenarios/s6-break-glass))

### AWS 구현

**이벤트 로그 예시**
```json
{
  "event_type": "TENANT_MISMATCH",
  "jwt_tenant_id": "hospital_a",
  "requested_tenant_id": "hospital_b",
  "user_id": "doctor_123",
  "api": "GET /patients/{patient_id}",
  "source_ip": "203.0.113.10",
  "severity": "HIGH",
  "timestamp": "2026-04-28T10:35:00Z"
}
```

**CloudWatch Metric Filter + Alarm**
```
filter pattern:  { $.event_type = "TENANT_MISMATCH" }
metric name:     TenantMismatchCount
namespace:       EHR/Security
alarm condition: TenantMismatchCount >= 3 within 5 minutes
action:          SNS → Slack security channel
```

GuardDuty는 AWS 계정·네트워크 수준 이상행위 탐지에 활용하며, tenant mismatch는 custom CloudWatch metric으로 탐지합니다. 반복 발생 시 Cognito global sign-out 또는 계정 임시 비활성화를 검토합니다.


## 추가 고민할 지점

- **RLS 성능**: 복잡한 JOIN 쿼리에서 RLS policy 적용이 성능에 미치는 영향
- **대규모 테넌트 확장**: 수십~수백 개 tenant schema 운영 시 schema 관리 자동화 방법

> Break-glass 상황에서의 tenant 격리 원칙은 [운영 및 라이프사이클 전략 — Break-glass 비상 접근](./operations-strategy#4-break-glass-비상-접근)에서 다룹니다.


## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 접근 제어 | Schema-per-Tenant, RLS, connection-level context |
| 데이터 보호 | PHI 격리, cross-tenant 접근 방지, KMS encryption context |
| 감사 추적성 | tenant_id 포함 structured log, cross-tenant 탐지 알람 |
