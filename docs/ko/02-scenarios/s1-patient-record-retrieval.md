---
title: "S1. 환자 정보 조회"
---
# S1. 환자 정보 조회

의료진이 동일 Tenant 내 환자의 기본 정보를 조회하는 흐름입니다. 서비스 내에서 환자 데이터 접근이 시작되는 첫 번째 지점이며, IDOR 및 Cross-Tenant 접근이 발생하기 가장 쉬운 경계입니다. patient_id만 변조해 타 Tenant 환자를 조회하는 시도를 DB 레이어까지 포함한 다중 방어로 차단하는 것이 핵심입니다.

| 항목 | 내용 |
|---|---|
| 주 사용 역할 | 의사, 간호사 |
| 핵심 데이터 | 이름, 생년월일, 성별, 나이, 주민등록번호, 환자 식별자(patient_id), 연락처 |


## 1. 비즈니스 흐름

의사와 간호사는 자신이 속한 Tenant 내 환자의 기본 정보를 조회할 수 있으며, 역할에 따라 반환되는 데이터 범위가 다릅니다. 환자 조회 시 JWT에서 추출한 `tenant_id`가 DB 조회 조건에 강제 적용되며, 이 조건이 누락되면 Cross-Tenant 접근이 가능해지므로 주요 공격 포인트로 간주하여 로그를 통해 모니터링합니다.

**서비스 흐름**

의사/간호사 Cognito 로그인 → 대시보드 접속 → Tenant 기반 자동 필터링 → 환자 리스트 조회 → 환자 선택 → 환자 정보 조회 (PK: `tenant_id` + `patient_id` 조합)

**세부 설명**

- 의사와 간호사는 자신이 속한 Tenant 내 환자의 기본 정보를 조회할 수 있으며, 역할에 따라 반환되는 데이터 범위가 다름
- 환자 조회 시 JWT에서 추출한 tenant_id가 DB 조회 조건에 강제 적용되며, 이 조건이 누락되면 Cross-Tenant 접근이 가능해지므로 주요 공격 포인트로 간주되어 로그를 통해 모니터링 됨
- 환자 정보 조회:
    - 사용자 요청 → API Gateway JWT 검증 → tenant_id, role 추출 → Lambda role 확인 → Aurora 조회 시 tenant_id 조건 강제 적용 → 역할별 필드 필터링 → 결과 반환
    - patient_id만 변조하여 타 Tenant 환자를 조회하는 IDOR 시도는 DB 레이어(RLS)에서 차단
- 조회 이력 이중 기록:
    - API 레벨 (CloudTrail): 누가, 언제, 어떤 엔드포인트를 호출했는지 기록
    - 애플리케이션 레벨 감사로그: 어떤 patient_id를 조회했는지 비즈니스 레벨 기록

<!-- 작성 예정: 아키텍처 흐름 다이어그램 -->


## 2. 보안 목표

- 동일 Tenant 내 환자 데이터에만 접근 가능
- 원본 데이터는 병원 내부에서만 조회 가능
- 역할별 반환 필드 제한 (간호사는 진단, 처방 정보 비노출)
- patient_id 직접 노출 금지, 내부 매핑을 통한 IDOR 방지
- DB 레이어에서 tenant_id 강제 필터링 (RLS 정책)
- 모든 조회 이력 감사 로그 기록
- 단시간 다수 조회 등 이상 접근 패턴 모니터링


## 3. 보안 설계

**인증**

Amazon Cognito User Pool을 기반으로 로그인을 처리하며, 인증 성공 시 JWT(Access Token + ID Token)를 발급합니다. Pre-token Lambda Trigger를 통해 JWT 발급 시점에 `custom:tenant_id`, `role`, `cognito:groups` 클레임을 주입하며, 모든 API 요청 헤더에 JWT가 포함되어야 합니다. API Gateway에서 `iss`, `aud`, `exp`, `token_use` 항목을 검증하여 위변조된 토큰을 차단합니다.

**네트워크 경계 보안**

Route 53 → CloudFront → WAF 순으로 인터넷 트래픽을 수신하며, WAF에서 악성 요청을 필터링하고 Shield Advanced로 DDoS를 방어합니다. 애플리케이션 레이어는 Private App Subnet, DB 레이어는 Private DB Subnet에 배치하며, 각 서브넷에 NACL과 Security Group을 이중 적용합니다. RDS Proxy를 통해 DB 연결을 제한하여 Lambda에서 Aurora로의 직접 연결을 차단합니다.

**자격증명 및 암호화 관리**

Lambda는 DB 접속 정보를 코드에 하드코딩하지 않고 Secrets Manager Interface Endpoint를 통해 런타임에 조회합니다. Aurora 저장 데이터는 KMS CMK(고객 관리 키)로 암호화하며, CMK는 주기적으로 교체합니다. KMS 접근은 KMS Interface Endpoint를 통해 VPC 내부에서만 이루어지며 인터넷 경유를 차단합니다.

**테넌트 격리**

JWT의 `custom:tenant_id` claim으로 해당 Tenant에만 접근 가능하도록 API 레이어에서 1차 검증합니다. Aurora의 Schema-per-Tenant 방식으로 Tenant A Schema / Tenant B Schema를 물리적으로 분리하여 DB 레이어에서 2중 방어를 구성합니다. Lambda에서 `SET LOCAL app.current_tenant` 및 `search_path`를 설정하고, RLS 정책(`app.tenant_id = row.tenant_id`)을 적용하여 애플리케이션 레이어 우회 시에도 DB 계층에서 격리를 강제합니다. Tenant mismatch 발생 시 `TENANT_MISMATCH` 이벤트를 CloudWatch Metric Filter로 자동 탐지합니다.

**최소 권한 원칙**

Tenant와 Role을 통해 최소 권한 원칙을 만족시킵니다. 의사는 자신의 Tenant 내 환자 정보 조회와 진료 기록 작성이 가능하나(`patient_id` + `tenant_id` 조합 조회), 간호사는 환자 정보 조회만 가능하고 진료기록 작성 권한은 없습니다. Cognito 그룹(doctor, hospital_admin, researcher 등)을 통해 사용자 유형별 접근 범위를 제한합니다. Lambda 함수에는 IAM 최소 권한 정책을 적용하여 필요한 RDS/Secrets Manager/KMS 리소스에만 접근합니다.

**감사 로그 무결성**

CloudWatch와 CloudTrail로 수집된 로그는 S3 Gateway Endpoint를 통해 로그 전용 S3 버킷에 Tenant별 Prefix(Tenant A Prefix / Tenant B Prefix)로 분리 저장합니다. S3 Object Lock Compliance Mode를 적용하여 보존 기간 내 로그 삭제 및 변조를 방지합니다.


## 4. 보안 통제 및 규제
<!-- 작성 예정: 규제에 링크 연결 -->

| 통제 항목 | 수단 | 규제 |
|---|---|---|
| 인증 | Amazon Cognito User Pool + JWT |  |
| 권한부여 | RBAC: Cognito 그룹 doctor/hospital_admin |  |
| 테넌트 격리 | JWT Claim `custom:tenant_id` + Aurora PostgreSQL Schema-per-Tenant + RLS |  |
| 로깅 | Cross-Tenant 접근 시도 로그(CloudWatch Metrics + CloudWatch Alarm), CloudTrail(AWS API 호출 기록) |  |
| 이상 행위 탐지 | GuardDuty(이상 인증 패턴 탐지) |  |


## 5. 보안 체크리스트

- [ ] JWT에 `custom:tenant_id`, `role`, `cognito:groups` 클레임이 주입되어 있습니다.
- [ ] API Gateway에서 `iss`·`aud`·`exp`·`token_use` 항목을 검증합니다.
- [ ] Aurora 조회 시 `tenant_id` 조건이 강제 적용됩니다.
- [ ] Aurora Schema-per-Tenant + RLS 정책(`app.tenant_id = row.tenant_id`)이 적용되어 있습니다.
- [ ] `patient_id`가 직접 노출되지 않고 내부 매핑을 통해 IDOR를 방지합니다.
- [ ] 역할별 반환 필드가 제한되어 있습니다(간호사: 진단·처방 비노출).
- [ ] API 레벨(CloudTrail)과 애플리케이션 레벨(CloudWatch) 감사 로그가 이중 기록됩니다.
- [ ] Tenant mismatch 발생 시 `TENANT_MISMATCH` 이벤트가 자동 탐지됩니다.
- [ ] 단시간 다수 조회 등 이상 접근 패턴을 모니터링합니다.
- [ ] 감사 로그가 S3 Object Lock Compliance Mode로 보호됩니다.