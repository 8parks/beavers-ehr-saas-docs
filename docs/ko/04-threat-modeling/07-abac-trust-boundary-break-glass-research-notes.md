---
title: ABAC / Trust Boundary / Break-glass 자료조사 메모
outline: [2, 3]
---

# ABAC / Trust Boundary / Break-glass 자료조사 메모

## 메모 목적

- 우리 프로젝트 자료 안에서 `ABAC`, `trust boundary`, `break-glass`와 직접 연결되는 내용을 모아두는 용도
- 완성된 가이드라인 문체보다는, 자료를 읽고 정리한 조사 메모에 가깝게 작성
- 출처는 주로 `README.md`, Lambda 코드, 위협 모델링 문서, ADR 문서 기준

## 조사 기준 자료

- 로컬 프로젝트 자료
  - `architecture-final/README.md`
  - `architecture-final/lambda_functions/ehr-get-patient/lambda_function.py`
  - `architecture-final/lambda_functions/ehr-create-record/lambda_function.py`
- 문서화 자료
  - `docs/ko/03-adr/adr-003-jwt-tenant-context.md`
  - `docs/ko/04-threat-modeling/04-trust-boundaries.md`
  - `docs/ko/04-threat-modeling/05-threat-scenarios/t-001-cross-tenant-access.md`
  - `docs/ko/04-threat-modeling/05-threat-scenarios/t-009-break-glass-misuse.md`
  - `docs/ko/04-threat-modeling/06-mitigations.md`

---

## ABAC

### 확인한 내용

#### Cognito에 role 외 속성이 들어감

`README.md` 기준으로 다음 속성이 정의되어 있음.

- `custom:tenant_id`
- `custom:user_role`
- `custom:tenant_type`
- `custom:staff_id`
- `custom:department`

즉 단순히 `doctor`, `nurse` 같은 역할만 보고 끝내는 구조는 아님. 처음부터 tenant, 기관 유형, 직원 정보까지 토큰에 실어 보내는 방향으로 잡혀 있음.

#### API Gateway 단계에서도 action 단위 구분이 있음

scope는 다음처럼 나뉘어 있음.

- `patient.read`
- `record.read`
- `record.write`
- `dataset.request`
- `dataset.approve`
- `dataset.generate`

이건 세밀한 속성 기반 인가라기보다는, 우선 "어떤 종류의 행위인가"를 1차로 나누는 coarse-grained control로 보임.

#### Lambda에서 claim을 다시 봄

환자 조회/진료기록 작성 Lambda 설명 기준으로 공통적으로 보이는 흐름:

1. JWT에서 `custom:tenant_id`, `custom:user_role`, `custom:tenant_type`, `cognito:groups` 추출
2. 허용된 role인지 확인
3. role과 group의 일치 여부 확인
4. `tenant_type` 확인
5. `tenant_registry`에서 해당 tenant의 상태 조회
6. `status=ACTIVE`인지 확인
7. `schema_name`, `clinical_file_prefix` 같은 값을 서버 측 allowlist에서 읽음

자료만 놓고 보면, 이 프로젝트는 "토큰에 tenant_id가 들어있으니 바로 믿는다"가 아니라, Lambda에서 tenant 상태와 mapping 정보를 한 번 더 확인하는 구조로 보임.

#### DB까지 tenant context를 내려보냄

`README.md`에는 Aurora 연결 뒤 다음 컨텍스트를 세팅한다고 적혀 있음.

- `app.tenant_id`
- `app.user_id`
- `app.role`

그리고 `set_config('app.tenant_id', ..., true)`를 사용한다고 명시돼 있음. 이 부분은 ABAC라기보다는 tenant-aware data access를 위한 컨텍스트 전파 장치로 보는 게 맞아 보임.

### 해석 메모

현재 자료에서 읽히는 건 `완전한 ABAC`보다는 아래에 가까움.

- `RBAC`
  - doctor / nurse / hospital-admin / researcher / irb / saas-operator
- `tenant context`
  - `tenant_id`, `tenant_type`, `tenant_registry.status`
- `일부 attribute check`
  - `group-role coherence`
  - `schema_name` / `clinical_file_prefix` allowlist

즉 속성을 사용하고 있다는 점은 분명하지만, 아직 patient-level이나 purpose-level까지 내려간 ABAC 문서라고 보긴 어려움.

### 추가 확인 필요

- 동일 테넌트 내부에서 `담당 환자`, `care-team`, `진료 관계`, `부서` 기준 차트 접근 제한이 실제 구현됐는지
- 연구 데이터셋 쪽에서 `목적 기반 접근`, `필드 최소화`, `반복 추출에 따른 재식별 위험`을 ABAC 관점으로 어디까지 다루는지
- `hospital-admin` 권한이 실제로 어디까지 허용되는지와 기획 의도 간 차이

### 메모

- 우리 프로젝트 자료에서 ABAC라는 말을 쓸 근거는 있음.
- 다만 현재 상태를 정확히 적으면 `RBAC + tenant context + 일부 속성 검증` 정도가 더 안전한 표현으로 보임.
- 가이드라인에 넣을 때는 "현재 구현된 것"과 "지향하는 통제 모델"을 분리해서 쓰는 편이 나을 것 같음.

---

## Trust Boundary

### 확인한 내용

위협 모델링 문서에는 trust boundary를 꽤 명확하게 분리해 둠.

#### TB-01. 인터넷 ↔ CloudFront / WAF / API Gateway

- 외부 사용자의 첫 진입점
- 로그인 요청, API 요청, access token 등이 넘어감
- 위조 요청, 웹 공격, 토큰 탈취 같은 위협을 상정

#### TB-02. Cognito ↔ API Gateway / Lambda

- JWT claim과 scope, group, tenant context가 넘어가는 경계
- 문서에서는 "JWT가 있으면 신뢰"가 아니라 claim coherence 검증이 필요하다고 봄

#### TB-03. Lambda ↔ tenant_registry

- `tenant_id`, `schema_name`, `clinical_file_prefix`, `status`가 넘어감
- 자료상 `tenant_registry`는 단순 설정 저장소가 아니라 격리 기준 데이터로 취급됨

#### TB-04. Lambda ↔ RDS Proxy ↔ Aurora

- SQL, tenant context, query result가 오가는 경계
- RDS Proxy나 커넥션 재사용 환경에서 tenant context 혼용 위험을 중요하게 봄

#### TB-05. Lambda ↔ S3 / DynamoDB / Secrets / KMS

- object key, dataset state, secret, key operation이 넘어감
- 특히 prefix 우회, secret exposure, key privilege abuse를 여기 묶어 놓음

#### TB-06. 병원 테넌트 ↔ 연구기관 테넌트

- dataset request, approval state, dataset artifact가 넘어감
- 병원 내부 진료 데이터 경로와 연구용 제공 경로를 분리해서 봄

#### TB-07. 운영 평면 ↔ 데이터 평면

- SSM session, admin action, break-glass credential이 넘어감
- 운영자 예외 접근을 일반 업무 경로와 별도 경계로 분리함

#### TB-08. 연구기관 클라이언트 ↔ dataset delivery path

- presigned URL, dataset object, 만료 정보가 넘어감
- 승인 상태와 실제 다운로드를 별도 사건으로 봄

#### TB-09. 운영자 단말 ↔ SSM tunnel ↔ admin bastion ↔ Aurora

- 세션 시작 이벤트, port forwarding, DB admin command가 이어지는 경계
- 네트워크 경계이기도 하지만 증적 연결 경계로도 보는 느낌이 강함

### 해석 메모

이 프로젝트에서 trust boundary는 네트워크 경계만 뜻하지 않는 것 같음. 오히려 아래 세 가지를 같이 묶어서 보는 개념에 가까움.

- 인증 정보가 넘어가며 재검증이 필요한 지점
- tenant context가 해석되는 지점
- 운영자 예외 경로처럼 일반 사용자 흐름과 다른 통제가 필요한 지점

특히 눈에 띄는 건 `tenant_registry`를 별도 boundary로 둔다는 점임. 보통 단순 설정 저장소로 넘어갈 수 있는데, 이 프로젝트에서는 schema / prefix / status가 여기서 결정되므로 격리의 기준선처럼 다루고 있음.

또 하나는 `dataset delivery path`와 `SSM tunnel`을 독립된 경계로 본다는 점. 이건 단순 API 설계 문서보다 위협 모델링 문서에 가까운 시각으로 보임.

### 가이드라인에 쓸 때 쓸만한 포인트

- 이 프로젝트의 trust boundary는 `JWT 경계`, `tenant mapping 경계`, `DB session context 경계`, `dataset 외부 제공 경계`, `운영자 비상 접근 경계` 정도로 요약 가능
- 멀티테넌트 격리를 "DB 한 군데에서만 해결한다"가 아니라, 여러 boundary에서 반복 검증하는 구조로 설명할 수 있음

### 추가 확인 필요

- 실제 그림/다이어그램에서 TB-01 ~ TB-09를 어디까지 반영할지
- `app audit log` 경계를 별도 trust boundary로 분리할지 여부
- dataset download 시점 재검증이 실제 구현인지, 아니면 위협 모델링 문서 수준의 요구사항인지

---

## Break-glass

### 확인한 내용

#### 운영 접근 기본 방향

`README.md`에는 운영 권장 방식이 다음처럼 적혀 있음.

- Aurora는 private DB subnet에 둠
- public access는 사용하지 않음
- 임시 admin EC2도 private subnet에 둠
- public IP 없이 운용
- SSH 22를 열지 않음
- 로컬 PC의 `psql`은 `SSM Session Manager port forwarding`으로 Aurora에 붙음

즉 자료상 운영자 비상 접근 경로는 아래처럼 읽힘.

`운영자 로컬 단말 → SSM Session Manager → private admin EC2 → Aurora`

#### SSM endpoint도 운영 경로 일부로 봄

README에는 다음도 같이 나옴.

- `ssm`
- `ssmmessages`
- `ec2messages`

설명도 "NAT 없이 private EC2가 SSM에 연결"되는 구조로 되어 있어서, break-glass는 단순 사람 절차가 아니라 네트워크 구조까지 포함된 운영 경로로 잡혀 있음.

#### 위협 모델링 문서에서는 break-glass를 별도 위협으로 다룸

`T-09 Break-glass 남용` 시나리오에서 확인되는 포인트:

- 2인 승인 없이 SSM 세션 또는 admin EC2 접근이 가능하면 안 됨
- standing privilege 또는 장기 비밀정보가 남아 있으면 안 됨
- 세션 시작, port forwarding, DB 질의, secret 조회, key 사용 기록이 서로 연결돼야 함
- 사용 종료 후 권한 자동 회수와 사후 검토가 있어야 함

즉 break-glass를 "운영자가 필요하면 들어가는 경로"가 아니라, 매우 짧게 열리고 전부 흔적이 남아야 하는 예외 절차로 봄.

### 해석 메모

우리 프로젝트 자료에서 break-glass는 아래 두 층이 같이 섞여 있음.

#### 1) 네트워크 / 접속 경로 관점

- DB를 public으로 열지 않음
- bastion을 인터넷에 노출하지 않음
- SSH key 기반 접근 대신 SSM 경로 사용
- VPC endpoint를 통해 private하게 운영

#### 2) 운영 통제 / 감사 관점

- 2인 승인
- JIT access
- 세션 로그
- CloudTrail `StartSession`
- 사후 검토

즉 break-glass는 단순히 "운영자가 비상시에 DB 보는 것"이 아니라, `private access path + 승인 절차 + 세션 증적 + 사후 검토`를 묶은 개념으로 보는 게 맞아 보임.

### 가이드라인에 쓸 때 쓸만한 포인트

- 운영자가 기본적으로 PHI에 직접 접근하지 못하도록 설계하고, 예외적으로만 열리는 경로라는 점
- DB를 public하게 열지 않는 네트워크 구조와, 그 위에 붙는 승인/감사 절차를 함께 설명해야 한다는 점
- break-glass는 "장애 대응 편의 기능"이 아니라 "최소 권한 원칙이 깨지는 예외 상황을 관리하는 통제"라는 점

### 추가 확인 필요

- 실제로 2인 승인 절차가 구현/문서화돼 있는지
- Session Manager 세션 로그 저장 위치와 보존 정책이 어디까지 정리돼 있는지
- DB 레벨 작업 증적이 CloudTrail/SSM 로그와 어떻게 연결되는지
- break-glass 사용 후 권한 자동 회수 절차가 실제 운영 문서까지 내려와 있는지

---

## 짧은 정리 메모

- `ABAC`
  - 프로젝트 자료에서 속성 기반 인가의 단서는 충분히 보임
  - 다만 현재 상태를 엄밀히 쓰면 full ABAC보다는 `RBAC + tenant context + 일부 속성 검증`에 가까워 보임

- `Trust Boundary`
  - 이 프로젝트에서는 단순 네트워크 경계보다 넓은 개념으로 쓰임
  - JWT, tenant mapping, DB context, dataset delivery, 운영자 예외 접근을 각각 다른 boundary로 잡는 게 특징적

- `Break-glass`
  - 운영자 예외 접근을 별도 보안 주제로 명시하고 있음
  - SSM 기반 private 운영 경로와 승인/감사 절차를 함께 봐야 함
