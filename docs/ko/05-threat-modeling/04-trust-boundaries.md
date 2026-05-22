---
title: 신뢰 경계
outline: [2, 3]
pageClass: tm-page--trust-boundaries
---

# 신뢰 경계

## 신뢰 경계 정의

신뢰 경계는 동일한 인증 상태 또는 동일한 정책 집합이 더 이상 보장되지 않는 지점을 의미합니다. 본 가이드라인은 멀티테넌트 구조와 운영자 예외 경로를 동시에 가지므로, 신뢰 경계를 명시적으로 식별하지 않으면 통제 누락이 발생하기 쉽습니다.

## 신뢰 경계 목록

| 경계 ID | 신뢰 경계 | 경계를 넘는 데이터 | 주요 위협 | 필수 통제 |
|--------|----------|-------------------|----------|----------|
| `TB-01` | 인터넷 ↔ CloudFront/WAF/API Gateway | 로그인 요청, API 요청, access token | 위조 요청, 웹 공격, token 탈취 | TLS, WAF, rate limit, authorizer |
| `TB-02` | Cognito ↔ API Gateway/Lambda | JWT claim, scope, group, tenant context | claim 불일치, 잘못된 token 신뢰, 세션 재사용 | scope 검증, claim coherence 검증, tenant type 검증 |
| `TB-03` | Lambda ↔ `tenant_registry` | `tenant_id`, `schema_name`, `clinical_file_prefix`, status | 잘못된 테넌트 매핑, 비활성 tenant 우회 | allowlist 조회, status 확인, 조건부 변경 |
| `TB-04` | Lambda ↔ RDS Proxy ↔ Aurora | SQL, tenant context, query result | 세션 혼용, RLS 우회, 잘못된 schema 선택 | explicit schema binding, transaction-scoped context, RLS |
| `TB-05` | Lambda ↔ S3 / DynamoDB / Secrets / KMS | object key, dataset state, secret, key operation | prefix 우회, secret 유출, key 권한 남용, VPC endpoint 정책 드리프트 | least privilege IAM, VPC endpoint, endpoint policy, key policy 제한 |
| `TB-06` | 병원 테넌트 ↔ 연구기관 테넌트 | dataset request, approval state, dataset artifact | 재식별, 과다 제공, 승인 우회 | 목적 기반 승인, field allowlist, short-lived delivery |
| `TB-07` | 운영 평면 ↔ 데이터 평면 | SSM session, admin action, break-glass credential | 운영자 남용, 조사 불능, standing privilege | 2인 승인, JIT access, 전체 감사 기록 |
| `TB-08` | 연구기관 클라이언트 ↔ 데이터셋 전달 경로 | dataset ID, dataset object metadata, 전달 승인 상태 | 전달 권한 재사용, 외부 공유, 승인 취소 후 다운로드 | 전달 상태 재검증, 객체 경로 제한, 전달 이력 |
| `TB-09` | 운영자 단말 ↔ SSM tunnel ↔ admin bastion ↔ Aurora | 세션 시작 이벤트, port forwarding, DB admin command | 승인 우회, 수동 질의, 증적 단절 | session log, ticket linkage, command evidence |

## 경계별 해석

### `TB-01` 인터넷 경계

인터넷에서 들어오는 요청은 tenant context가 아직 신뢰 가능한 상태로 정리되기 전 단계입니다. 따라서 이 경계에서는 사용자 신원, 요청 무결성, 요청 빈도를 모두 불신하는 전제를 두고, 위조 요청과 탈취 토큰 재사용 시도를 최대한 초기에 차단해야 합니다.

### `TB-02` 인증 경계

JWT의 존재 여부만으로 요청을 신뢰할 수 없습니다. 토큰의 `scope`, tenant claim, role claim, tenant type claim, group claim이 서로 일관되는지 확인해야 하며, 인증 직후의 claim이 실제 서비스 권한과 같은 의미를 가지는지도 함께 검토해야 합니다.

### `TB-03` Tenant 컨텍스트 경계

`tenant_registry`는 격리 정책의 기준 데이터입니다. schema 이름이나 S3 prefix를 사용자 입력으로 파생해서는 안 되며, 반드시 서버 측 allowlist에서 가져와야 합니다. 이 경계가 손상되면 개별 API 결함이 아니라 tenant 분리 기준 자체가 오염됩니다.

### `TB-04` 데이터베이스 경계

RDS Proxy 또는 커넥션 재사용이 존재하는 환경에서는 이전 세션의 tenant context가 남지 않도록 모든 트랜잭션에서 context를 재설정해야 합니다. 복구나 failover 이후에도 동일한 검증이 유지되어야 하며, 애플리케이션 계층의 실수가 DB 계층에서 최종 차단되는 구조여야 합니다.

### `TB-05` 내부 서비스 접근 경계

Lambda가 S3, DynamoDB, Secrets Manager, KMS에 접근하는 순간 object key, 상태값, secret, key operation마다 서로 다른 정책 집합이 적용됩니다. 이 경계에서는 IAM 권한만이 아니라 VPC Endpoint, endpoint policy, key policy까지 함께 제한되어야 데이터 평면 우회가 발생하지 않습니다.

### `TB-06` 외부 제공 경계

연구용 데이터셋 제공은 병원 내부 진료 흐름과 별도 경계로 취급해야 합니다. 승인 상태, 제공 범위, 재식별 저감, 만료 시점이 모두 명시되어야 하며, 내부 진료 시스템의 신뢰 수준을 외부 제공 경로에 그대로 전이해서는 안 됩니다.

### `TB-07` 운영 경계

운영자 비상 접근은 업무 경로보다 느슨해서는 안 됩니다. 정상 업무 사용자는 접근할 수 없는 데이터 평면을 예외적으로 여는 경로이므로, 더 엄격한 승인과 더 강한 추적성이 필요합니다. 이 경계에서는 편의보다 추적 가능성과 권한 회수 가능성이 우선되어야 합니다.

### `TB-08` 외부 반출 경계

데이터셋 제공은 애플리케이션 내부 승인 상태와 실제 다운로드 행위가 분리되는 지점입니다. 따라서 다운로드 요청을 처리하는 시점마다 승인 상태, 전달 가능 상태, 대상 객체 매핑을 재검증할 수 있어야 합니다. 전달 경로가 한 번 열렸다는 이유만으로 승인 취소 이후에도 계속 사용되면 외부 반출 통제는 성립하지 않습니다.

### `TB-09` 운영자 터널 경계

SSM 기반 포트 포워딩은 네트워크적으로는 안전한 선택이지만, 논리적으로는 운영자 단말에서 데이터 평면으로 직접 이어지는 경로입니다. 세션 승인, 세션 로그, 대상 인스턴스, 이후 DB 작업 기록이 하나의 체인으로 연결되지 않으면 운영자 행위의 사후 입증이 어렵습니다.

## 경계 검증 요구사항

- 모든 신뢰 경계는 해당 경계에서 검증되는 입력값과 금지되는 입력값이 정의되어야 합니다.
- 경계별로 성공 로그와 실패 로그 모두를 남겨야 합니다.
- 경계별 차단 테스트는 배포 파이프라인 또는 정기 검증 절차에 포함되어야 합니다.
