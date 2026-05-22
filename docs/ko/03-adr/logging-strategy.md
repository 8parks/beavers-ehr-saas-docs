---
title: 로깅 및 감사 전략
---

# 로깅 및 감사 전략

의료 시스템에서는 "무슨 일이 있었는지"를 나중에 증명할 수 있어야 합니다. 로그를 어떻게 수집하고, 얼마나 보존하며, 변조를 어떻게 막을 것인지에 대한 결정입니다.


## 1. 캐시·로그·임시파일 Tenant 분리

### 설계 원칙

멀티테넌트 격리는 DB에서만 끝나지 않는다. 실제 운영 환경에서는 캐시, 로그, 임시 파일, export 파일, 분석 결과, 알림 메시지에도 tenant 정보가 포함될 수 있다. 이 영역에서 tenant 분리가 누락되면 DB가 안전해도 데이터가 우회적으로 노출될 수 있다.

### 결정

**S3 prefix, 캐시 key, CloudWatch Logs 필드에 tenant_id를 포함하여 모든 저장 경로에서 테넌트 경계를 유지한다. 로그에는 PHI 원문을 기록하지 않는다.**

### AWS 구현

**S3 prefix 전략**
```
s3://ehr-documents/tenants/{tenant_id}/records/{record_id}.pdf
s3://ehr-exports/tenants/{tenant_id}/exports/{export_id}.zip
s3://ehr-audit-logs/tenants/{tenant_id}/logs/{date}/...
```

**캐시 key 설계 (ElastiCache / Redis)**
```
{tenant_id}:patient:{patient_id}
{tenant_id}:session:{session_id}
```

**CloudWatch Logs 필드 표준**
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

**보안 원칙**
- CloudWatch Logs에는 PHI 원문이 아닌 식별자(`record_id`, `patient_id`) 중심으로 기록
- S3 lifecycle policy로 임시 export 파일 자동 만료
- KMS encryption context에 `tenant_id` 포함 검토


## 2. 감사 로그 무결성

### 설계 원칙

의료 데이터 접근 이력은 법적 증거로 사용될 수 있으므로, 로그는 저장된 이후 변조되거나 삭제되면 안 된다. 로그 무결성은 S3 Object Lock과 KMS 암호화로 보장한다.

### 결정

**감사 로그는 S3 Compliance Mode Object Lock이 적용된 전용 버킷에 보관하며, KMS CMK로 암호화한다. CloudTrail과 CloudWatch Logs를 이중으로 수집한다.**

### 구현

| 통제 | 방법 |
|------|------|
| 변조 방지 | S3 Object Lock — Compliance Mode (보존 기간 내 삭제·덮어쓰기 불가) |
| 암호화 | KMS CMK (`ehr-logs-cmk`) — audit-log-lambda role만 접근 허용 |
| API 호출 기록 | AWS CloudTrail — 계정 내 모든 API 호출 자동 기록 |
| 애플리케이션 이벤트 | CloudWatch Logs — 비즈니스 레벨 행위 기록 |
| 로그 전송 경로 | S3 Gateway Endpoint 경유, 인터넷 미경유 |
| 무결성 검증 | CloudTrail 로그 파일 검증 활성화 |

### 보안 함의

- SaaS 운영자도 Object Lock이 설정된 로그를 삭제할 수 없음
- 감사 로그 버킷은 S3 Public Access Block 필수 적용
- CloudTrail 로그 파일 검증 기능으로 위변조 여부 확인 가능


## 3. 로그 보존 정책

### 설계 원칙

의료법과 규제에서 정한 보존 기간을 충족하면서, 보존 기간이 지난 로그는 비용 절감을 위해 자동으로 전환 또는 삭제한다.

### 결정

**의료법 기준 보존 기간을 기본으로 하되, S3 Intelligent-Tiering과 Glacier로 단계적 전환한다.**

| 로그 유형 | 보존 기간 | 근거 |
|-----------|----------|------|
| 진료 기록 접근 로그 | 10년 | 의료법 제22조 |
| 접속 기록 | 3년 | 의료법 제23조 제4항 |
| AWS API 감사 로그 (CloudTrail) | 1년 (Hot) + 장기 보관 | 보안 운영 기준 |
| 보안 이벤트 (TENANT_MISMATCH 등) | 3년 | 보안 사고 대응 |

**S3 Lifecycle 전환 예시**
```
0~90일   → S3 Standard (Hot)
91~365일 → S3 Intelligent-Tiering
366일 이후 → S3 Glacier Instant Retrieval
보존 기간 만료 → 자동 삭제 (Object Lock 해제 후)
```


## 4. 통합 감사 체계 (로깅 항목)

### 설계 원칙

두 가지 레이어에서 이중으로 기록한다. CloudTrail은 AWS API 호출 레벨, CloudWatch Logs는 비즈니스 행위 레벨을 담당한다.

| 레이어 | 수단 | 기록 내용 |
|--------|------|----------|
| AWS API | CloudTrail | 누가, 언제, 어떤 AWS API를 호출했는지 |
| 애플리케이션 | CloudWatch Logs | 누가, 어떤 환자의, 어떤 데이터에, 어떤 행위를 했는지 |

### 필수 기록 이벤트

| 이벤트 유형 | 예시 |
|------------|------|
| 환자 데이터 조회 | `READ_PATIENT_RECORD`, `SEARCH_PATIENT` |
| 진료 기록 작성·수정 | `CREATE_MEDICAL_RECORD`, `UPDATE_MEDICAL_RECORD` |
| 전자서명 | `SIGN_RECORD_REQUESTED`, `SIGN_RECORD_COMPLETED` |
| 인가 실패 | `ACCESS_DENIED`, `TENANT_MISMATCH` |
| Break-glass 접근 | `BREAK_GLASS_ACTIVATED`, `BREAK_GLASS_ACCESS` |
| 연구 데이터셋 생성 | `DATASET_EXPORT_REQUESTED`, `PSEUDONYMIZATION_APPLIED` |
| Tenant 라이프사이클 | `TENANT_PROVISIONED`, `TENANT_SUSPENDED`, `TENANT_OFFBOARDED` |

### Cross-tenant 접근 탐지

tenant mismatch 이벤트는 별도 보안 이벤트로 기록하고 임계치 초과 시 즉시 알림을 발생시킨다. 구체적인 탐지 및 대응 흐름은 [멀티테넌트 전략: Cross-tenant 접근 탐지](./multitenant-strategy#4-cross-tenant-접근-시도-탐지-및-대응)를 참고한다.

> 각 이벤트가 어떤 규제 요구사항과 매핑되는지는 [컴플라이언스: 감사 로그](../04-compliance#감사-로그)를 참고합니다.


## 추가 고민할 지점

- CloudWatch Logs Insights 쿼리 비용 최적화 방안
- 보존 기간 만료 후 완전 삭제 vs. 비식별화 후 보관 정책
- 로그 암호화 키 교체 주기와 복호화 권한 관리


## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 접속 기록 보관 | CloudTrail + CloudWatch, S3 Object Lock |
| 로그 무결성 | Compliance Mode Object Lock, KMS 암호화 |
| 보존 기간 준수 | S3 Lifecycle — 의료법 기준 |
| PHI 로그 유출 방지 | 식별자 중심 기록, PHI 원문 로깅 금지 |
| 감사 추적성 | 이중 로깅 (AWS API + 비즈니스 행위) |
