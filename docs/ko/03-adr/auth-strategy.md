---
title: 인증 / 인가 전략
---

# 인증 / 인가 전략

누가, 어느 테넌트의, 어떤 데이터에 접근할 수 있는지를 어떻게 판단할 것인가에 대한 전략입니다. 인증은 Cognito가 담당하고, 인가는 JWT 클레임 기반으로 서비스 레이어에서 처리합니다. 자격증명과 암호화 키는 코드에 포함하지 않고 Secrets Manager와 KMS로 관리합니다.


## 1. JWT 기반 Tenant Claim 검증

### 설계 원칙

로그인 시 발급되는 JWT에 `tenant_id`를 포함하면 애플리케이션에서 사용자의 tenant를 식별할 수 있습니다. 그러나 JWT는 클라이언트가 전달하는 값이므로, 매 요청마다 반드시 서명 검증을 수행해야 합니다.

애플리케이션은 JWT payload의 `tenant_id`를 그대로 신뢰하는 것이 아니라, Cognito가 발급한 토큰인지 public key로 검증한 뒤에만 tenant 정보를 사용해야 합니다.

### 결정

**Amazon Cognito User Pool로 인증하고, JWT Custom Attribute로 `custom:tenant_id`와 Cognito Group으로 역할을 관리합니다. API Gateway Authorizer 또는 Lambda Authorizer에서 서명 검증 후 claim을 추출하며, Lambda 내부에서도 defense-in-depth로 재확인합니다.**

### 고려된 대안

| 대안 | 설명 | 문제점 |
|------|------|--------|
| 요청 헤더로 `tenant_id` 전달 | 클라이언트가 헤더에 직접 포함 | 위변조 가능, 신뢰할 수 없음 |
| **JWT Custom Claims (채택)** | Cognito 발급 JWT에 `tenant_id`, role 포함 | — |
| 별도 세션 서비스 | 세션 서버에서 컨텍스트 관리 | 추가 인프라 부담, 단일 장애점 |

### 기술적 요구사항

- Cognito에서 사용자 인증 및 JWT 발급
- Lambda Authorizer 또는 API Gateway Cognito Authorizer에서 JWT 검증
- JWT issuer, audience, expiration 검증
- Cognito JWKS endpoint의 public key로 signature 검증
- `custom:tenant_id`, `role`, `group` claim 검증
- 클라이언트가 임의로 변조한 `tenant_id` 거부

### AWS 구현

**Cognito 설정**
- Amazon Cognito User Pool 사용
- 사용자 속성에 `custom:tenant_id` custom attribute 추가
- Cognito Group으로 역할 관리: `doctor`, `nurse`, `hospital_admin`, `researcher`, `saas_operator`

**검증 항목 예시**
```
iss  == https://cognito-idp.{region}.amazonaws.com/{userPoolId}
aud  == {appClientId}
exp  > now()
token_use == "id" or "access"
custom:tenant_id 존재 및 비어 있지 않음
cognito:groups 에 허용된 역할 포함
```

**Lambda 내부 심층 방어(defense-in-depth) 검증 흐름**
```
API Gateway Authorizer → JWT 서명 검증 통과
  → Lambda 진입 시 claim 재확인
  → ehr-tenant-registry에서 tenant 상태(ACTIVE) 확인
  → DB connection에 tenant context 설정
  → 비즈니스 로직 실행
```

### 보안 함의

- 토큰 만료 시간은 짧게 설정하고, Refresh Token으로 갱신
- 토큰 취소(revocation) 필요 시 Cognito global sign-out 또는 계정 비활성화 사용
- 로그에 `tenant_id`는 포함하되 PHI 원문은 포함하지 않음


## 2. RBAC / ABAC — 역할 및 속성 기반 접근 제어

### 설계 원칙

역할(Role)만으로는 멀티테넌트 환경에서 충분하지 않습니다. "의사"라는 역할을 가졌더라도 다른 병원의 데이터에는 접근할 수 없어야 합니다. 따라서 역할 기반 접근 제어(RBAC)에 `tenant_id` 속성을 결합한 형태(ABAC)를 적용합니다.

즉, 모든 인가 판단은 **"어떤 역할인가" + "어느 테넌트 소속인가"** 두 가지를 동시에 확인합니다.

### 결정

**Cognito Group으로 역할을 관리하고, 서비스 레이어에서 role + tenant_id 조합으로 API 접근을 제어합니다.**

### 역할별 접근 매트릭스

| 역할 | 환자 기록 조회 | 진료 기록 작성 | 연구 데이터셋 | 사용자 관리 | 테넌트 설정 |
|------|------|------|------|------|------|
| 의사 (doctor) | 동일 테넌트만 | 담당 환자만 | — | — | — |
| 간호사 (nurse) | 제한적 조회 | — | — | — | — |
| 병원 관리자 (hospital_admin) | — | — | — | 동일 테넌트만 | O |
| 연구원 (researcher) | — | — | 가명처리 데이터만 | — | — |
| SaaS 운영자 (saas_operator) | — | — | — | 전체 테넌트 | O |

### 기술적 요구사항

- Lambda Authorizer 또는 서비스 레이어에서 role + tenant_id 동시 검증
- API 경로별 허용 역할 목록 관리
- 역할이 없거나 허용되지 않은 역할이면 403 반환
- 동일 tenant_id가 아닌 리소스 접근 시도는 [tenant mismatch 이벤트](./multitenant-strategy#4-cross-tenant-접근-시도-탐지-및-대응)로 기록

### 인가 흐름 예시

```
GET /patients/{patient_id}

1. JWT에서 role = "doctor", tenant_id = "hospital_a" 추출
2. /patients API → 허용 역할: [doctor] → 통과
3. patient_id가 속한 tenant = "hospital_a" 확인 → 일치 → 접근 허용

GET /research-datasets/{dataset_id}

1. JWT에서 role = "doctor", tenant_id = "hospital_a" 추출
2. /research-datasets API → 허용 역할: [researcher] → 403 반환
```


## 3. Trust Boundary — 서비스 계층 격리

### 설계 원칙

Lambda 함수가 모두 동일한 IAM role을 사용하면, 하나의 함수가 탈취됐을 때 전체 시스템에 영향이 미칩니다. 함수별로 최소 권한 IAM role을 부여하고, DB 자격증명은 Secrets Manager에서, 암호화 키는 KMS Customer Managed Key(CMK)를 통해 관리하면 각 함수가 자신의 역할 범위를 벗어날 수 없습니다.

### 결정

**Lambda 함수별로 최소 권한 IAM role을 부여합니다. DB 자격증명은 Secrets Manager에서 런타임에 조회하고, 암호화는 KMS CMK를 사용합니다.**

### Lambda 함수별 IAM Role 설계

| Lambda 함수 | 허용 권한 |
|-------------|----------|
| patient-record-lambda | RDS 특정 스키마 읽기/쓰기, Secrets Manager 특정 secret 읽기, KMS decrypt |
| research-dataset-lambda | S3 research prefix 읽기, KMS decrypt (연구용 CMK만) |
| admin-lambda | DynamoDB `ehr-tenant-registry` 읽기/쓰기, Cognito 사용자 관리 |
| audit-log-lambda | CloudWatch Logs 쓰기, S3 audit prefix 쓰기, KMS encrypt |

각 함수의 IAM role은 다른 함수의 권한 범위와 교차하지 않도록 설계합니다.

### Secrets Manager — DB 자격증명 관리

Lambda가 Aurora에 접속할 때 비밀번호를 코드나 환경변수에 하드코딩하지 않습니다. 대신 Secrets Manager에서 런타임에 조회합니다.

```
Lambda 시작
  → IAM role로 Secrets Manager GetSecretValue 호출
  → DB host, username, password 획득
  → Aurora 연결
  → 요청 처리
```

- secret은 Lambda별로 분리 (예: `ehr/patient-lambda/db-credentials`)
- IAM role에는 해당 secret ARN에 대한 `secretsmanager:GetSecretValue`만 허용
- Secrets Manager 자동 교체 정책 적용 가능

### KMS 고객 관리형 키(CMK) 설계

AWS managed key 대신 CMK를 사용하면 Key Policy로 접근 주체를 명시적으로 제어할 수 있고, CloudTrail에서 모든 키 사용 이력을 감사할 수 있습니다.

| 용도 | CMK | 접근 허용 주체 |
|------|-----|--------------|
| Aurora DB 암호화 | `ehr-aurora-cmk` | patient-record-lambda role, admin-lambda role |
| S3 PHI 문서 암호화 | `ehr-s3-phi-cmk` | patient-record-lambda role |
| S3 연구 데이터셋 암호화 | `ehr-s3-research-cmk` | research-dataset-lambda role |
| CloudWatch Logs 암호화 | `ehr-logs-cmk` | audit-log-lambda role, CloudWatch Logs service |
| Secrets Manager 암호화 | `ehr-secrets-cmk` | 각 Lambda role (secret별로 권한 분리) |

**CMK 정책 원칙**
- 각 CMK의 키 정책에 접근 허용 IAM role을 명시
- SaaS 운영자도 기본적으로 CMK로 암호화된 PHI에 직접 접근 불가
- 연간 자동 키 교체 활성화
- CloudTrail에서 `kms:Decrypt`, `kms:Encrypt` 호출 이력 감사

### 기술적 요구사항

- Lambda 함수별 IAM role 분리 (함수 간 권한 교차 없음)
- 환경변수 또는 코드에 자격증명 하드코딩 금지
- Secrets Manager에서 런타임 자격증명 조회
- Aurora, S3, CloudWatch Logs, Secrets Manager에 CMK 적용
- 키 정책으로 접근 주체 명시


## 추가 고민할 지점

- **Cognito Custom Attribute vs Group**: `custom:tenant_id`를 Custom Attribute로 관리할지, Group 이름에 인코딩할지 (현재는 Custom Attribute 방향)
- **JWT 토큰 만료 정책**: ID Token / Access Token 만료 시간과 리프레시 토큰 갱신 주기
- **토큰 취소(revocation)**: 즉시 접근 차단이 필요한 시나리오에서의 처리 방법
- **CMK 범위**: tenant별 CMK 분리 여부 (비용 vs 격리 수준 트레이드오프)
- **Lambda Authorizer 캐싱**: Authorizer 응답 캐시 TTL 설정과 취소된 토큰 감지 간의 트레이드오프


## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 인증 | Cognito 기반 JWT 발급, 서명 검증 |
| 접근 제어 | RBAC + tenant_id 속성 기반 인가 |
| 최소 권한 | Lambda 함수별 IAM role 분리 |
| 자격증명 보호 | Secrets Manager, 하드코딩 금지 |
| 암호화 키 관리 | KMS CMK, Key Policy, 자동 rotation |
| 감사 추적성 | CloudTrail KMS 사용 이력, tenant mismatch 이벤트 |
