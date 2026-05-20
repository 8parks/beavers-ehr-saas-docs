---
title: 데이터 및 스토리지 전략
---

# 데이터 및 스토리지 전략

PHI를 어떻게 저장하고, 테넌트 간 데이터를 어떻게 분리하며, 연구 목적의 데이터는 어떤 파이프라인을 거쳐 제공할지에 대한 전략입니다.

---

## 1. Tenant별 데이터 분리

### 설계 원칙

멀티테넌트 SaaS에서 데이터 분리는 DB에서만 끝나지 않는다. Aurora DB, S3, ElastiCache(Redis), CloudWatch Logs 등 모든 저장 경로에서 테넌트 경계를 유지해야 한다. 하나의 레이어에서 격리가 누락되면, 다른 레이어가 안전해도 데이터가 우회적으로 노출될 수 있다.

### 결정

**DB 레이어는 Schema-per-Tenant + RLS를 기본 격리 전략으로 적용하고, 파일 저장(S3), 캐시(Redis), 로그(CloudWatch Logs) 모두 `tenant_id` 기반 경계를 적용한다.**

DB 격리 상세 설계 (Schema-per-Tenant, RLS, connection-level context 전파)는 [멀티테넌트 전략](./multitenant-strategy)에서 다룬다.

### 저장 경로별 분리 방식

| 저장소 | 분리 방법 | 예시 |
|--------|----------|------|
| Aurora PostgreSQL | Schema-per-Tenant + RLS | `CREATE SCHEMA hospital_a` |
| S3 (진료 파일) | prefix 분리 | `tenants/{tenant_id}/records/{record_id}.pdf` |
| S3 (연구 데이터셋) | prefix 분리 | `tenants/{tenant_id}/datasets/{dataset_id}.zip` |
| ElastiCache (Redis) | key prefix | `{tenant_id}:patient:{patient_id}` |
| CloudWatch Logs | 구조화 필드 | `"tenant_id": "hospital_a"` |
| DynamoDB | partition key에 tenant_id 포함 | `{tenant_id}#request#{request_id}` |

### S3 버킷 전략

진료 파일과 연구 데이터셋은 버킷을 분리하여 접근 정책 적용 범위를 명확하게 유지한다.

```
s3://ehr-clinical-files/tenants/{tenant_id}/records/{record_id}.pdf
s3://ehr-datasets/tenants/{tenant_id}/datasets/{dataset_id}.zip
s3://ehr-audit-logs/tenants/{tenant_id}/logs/{date}/...
```

S3 bucket policy에서 prefix 기반 접근을 제한하고, IAM 정책과 조합하여 테넌트 경계 밖의 접근을 차단한다.

---

## 2. PHI 저장 및 암호화

### 설계 원칙

PHI는 저장 중(at rest)과 전송 중(in transit) 모두 암호화되어야 한다. 암호화 키는 테넌트별로 분리하여, 키 노출 시 피해 범위를 단일 테넌트로 제한한다. 운영자도 PHI에 직접 접근할 수 없음을 KMS 기반 암호화로 기술적으로 증빙한다.

### 결정

**Aurora와 S3의 PHI 저장 데이터는 KMS 고객 관리 키(CMK)로 암호화한다. 테넌트별 CMK를 분리하는 것을 목표로 하되, 운영 복잡도와 비용을 고려하여 단계적으로 적용한다.**

### 암호화 적용

| 저장소 | 암호화 방식 | 키 관리 |
|--------|------------|--------|
| Aurora PostgreSQL | AWS KMS 통합 암호화 (TDE) | KMS CMK |
| S3 진료 파일 | SSE-KMS | KMS CMK |
| S3 연구 데이터셋 | SSE-KMS | KMS CMK |
| S3 감사 로그 | SSE-KMS | KMS CMK (`ehr-logs-cmk`) |
| DynamoDB | AWS 관리 키 또는 CMK | KMS CMK 검토 중 |
| 전송 중 | TLS 1.3 권장, 최소 TLS 1.2 | — |

### KMS Encryption Context

KMS encryption context에 `tenant_id`를 포함하면, 다른 테넌트의 키로 복호화를 시도할 때 요청이 실패한다.

```json
{
  "tenant_id": "hospital_a",
  "data_classification": "PHI"
}
```

### 보안 원칙

- 로그에는 PHI 원문(이름, 주민번호 등)을 기록하지 않는다 — 식별자(`patient_id`, `record_id`) 중심으로 기록
- 데이터셋 전달 경로는 승인 상태를 다시 확인하고 객체 경로를 테넌트 범위로 제한해 오남용을 방지한다
- KMS 접근은 KMS Interface Endpoint를 통해 VPC 내부에서만 이루어진다

---

## 3. 연구 데이터셋 처리 구조

### 설계 원칙

연구기관은 운영 DB에 직접 접근해서는 안 된다. 데이터셋은 별도 승인 절차를 거쳐 운영 DB와 분리된 Analytics Zone에서 생성되며, 비식별 처리 후에만 연구원에게 제공된다.

### 결정

**데이터셋 요청 → 병원 관리자 승인 → 비식별 처리 파이프라인 → S3 데이터셋 버킷 저장 → 다운로드 허용의 단방향 흐름으로 처리한다. 각 단계는 별도 Lambda로 분리하며, 상태는 DynamoDB `dataset-request-status`에서 관리한다.**

시나리오 상세는 [S3. 연구용 데이터셋 생성 및 제공](../02-scenarios/s3-research-dataset-generation)을 참고한다.

### 요청 상태 관리

| 상태 | 설명 |
|------|------|
| `PENDING` | 데이터셋 요청 접수, 승인 대기 |
| `APPROVED` | 병원 관리자 승인 완료, 생성 가능 |
| `READY` | 비식별 처리 완료, 다운로드 허용 |
| `EXPIRED` | TTL 만료, 다운로드 차단 |
| `FAILED` | 재식별 위험 기준 미충족 등으로 생성 중단 |

### 접근 제어

- `request-dataset` / `download-dataset` Lambda → 연구원만 접근 가능
- `approve-dataset` Lambda → 병원 관리자만 실행 가능
- `generate-dataset` Lambda → `APPROVED` 상태인 경우에만 실행
- `download-dataset` Lambda → `READY` 상태 + TTL 유효한 경우에만 허용
- 연구원은 Aurora에 어떤 경로로도 직접 접근 불가 (네트워크 레벨 차단)

### 감사 로그

데이터셋 요청·승인·생성·다운로드 이력 전체를 CloudTrail + CloudWatch Logs에 기록하고, S3 감사 로그 버킷에 테넌트별 prefix로 분리 저장한다.

---

## 4. 가명처리 파이프라인

### 설계 원칙

연구 목적으로 PHI를 제공할 때는 재식별 위험을 기준으로 비식별 처리가 충분한지 검증해야 한다. 재식별 위험 기준을 충족하지 못하면 데이터셋 생성을 중단한다.

### 결정

**`generate-dataset` Lambda에서 4단계 비식별 처리를 수행하고, 재식별 위험 기준 확인 결과를 기준으로 데이터셋 생성 여부를 결정한다.**

### 4단계 비식별 처리

| 단계 | 처리 내용 |
|------|----------|
| 1. 직접 식별자 제거 | 이름, 주민등록번호, 연락처, 주소 등 직접 식별 가능한 필드 삭제 |
| 2. 가명 ID 치환 | `patient_id` → 연구용 가명 ID로 교체 (원본 매핑 테이블은 별도 암호화 보관) |
| 3. 준식별자 일반화 | 나이 → 연령대, 날짜 → 연·월 단위 등으로 일반화 |
| 4. 재식별 위험 기준 확인 | k-익명성(k-anonymity) 등 기준으로 재식별 위험 검증 |

### 처리 결과 분기

```
재식별 위험 기준 충족
  → 상태: APPROVED → READY
  → 데이터셋 S3 저장 + 다운로드 허용

재식별 위험 기준 미충족
  → 데이터셋 생성 중단
  → 상태: → FAILED
  → 요청자에게 알림
```

### 보안 원칙

- 가명 ID 매핑 테이블은 원본 PHI와 별도 암호화 보관하며 연구원에게 제공하지 않는다
- 비식별 처리 결과는 데이터셋 버킷에 저장 후 즉시 접근 로그를 기록한다
- TTL 만료 시 `EXPIRED`로 자동 전환되어 다운로드가 차단된다

---

## 추가 고민할 지점

- 테넌트별 CMK 분리 적용 시 키 관리 운영 복잡도 — 비용 대비 효과 검토 필요
- 재식별 위험 기준의 구체적 임계값 (k-익명성 k값 등) 설정 방법
- 가명 ID 매핑 테이블의 장기 보존 및 파기 정책

---

## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 데이터 분리 | Schema-per-Tenant + RLS, S3 prefix, Redis key prefix |
| PHI 암호화 | KMS CMK (Aurora, S3), encryption context에 tenant_id 포함 |
| PHI 로그 유출 방지 | 식별자 중심 기록, PHI 원문 로깅 금지 |
| 연구 데이터 접근 통제 | 승인 절차, 상태 기반 접근 통제, TTL 자동 만료 |
| 비식별 처리 | 4단계 파이프라인, 재식별 위험 기준 확인 후 제공 |
| 감사 추적성 | 요청·승인·생성·다운로드 이력 전 과정 기록 |
