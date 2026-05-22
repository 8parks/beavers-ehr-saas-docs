---
title: 위협별 대응 전략
outline: [2, 4]
---

# 위협별 대응 전략

## 위협-통제 매트릭스

본 절은 개별 위협 시나리오에 대해 어떤 통제가 반드시 준비되어야 하는지 정리합니다.

통제는 다음 세 층으로 해석합니다.

- 예방 통제: 위협이 성립하지 않도록 설계를 제한하는 통제
- 탐지 통제: 성립 시도 또는 통제 실패를 조기에 식별하는 통제
- 대응 통제: 사고 범위 축소, 복구, 보고, 재발방지를 가능하게 하는 통제

| 위협 ID | 위협 | 예방 통제 | 탐지 통제 | 대응 통제 |
|---------|------|----------|----------|----------|
| `T-01` | Cross-Tenant Access | `tenant_registry` allowlist, explicit schema binding, RLS, tenant-bound object key | cross-tenant 차단 테스트, 403 패턴 탐지 | 세션 무효화, 영향 tenant 범위 산정, 사고 조사 |
| `T-02` | 동일 테넌트 내부 권한 상승 | 역할 매트릭스, patient-level ABAC, tenant type 분리 | 비정상 차트 접근, 승인 우회 호출 탐지 | 계정 비활성화, 권한 재설계, 접근 이력 조사 |
| `T-03` | 의료 기록 무단 수정 및 전자서명 우회 | canonical payload 서명, immutable change log, attachment hash/version binding | 서명 검증 실패, 비정상 write 탐지 | 영향 record 복구, 법적 보존, 원인 분석 |
| `T-04` | 데이터 전달 경로 및 객체 경로 오남용 | 전달 상태 재검증, tenant-bound object key, VPC endpoint 정책 제한, 파일 검증 | CloudTrail data event, 이상 다운로드 탐지, endpoint 정책 변경 탐지 | 전달 경로 차단, 객체 격리, 반출 범위 산정 |
| `T-05` | 인증 토큰 재사용 및 Claim 불일치 | access token 검증, claim coherence 검증, 세션 폐기 | 철회 token 재사용, 이상 위치 접근 탐지 | 세션 무효화, 재인증, 영향 범위 조사 |
| `T-06` | 재식별 공격 | field allowlist, threshold, suppression, 반복 추출 위험 평가 | 작은 코호트 및 반복 요청 탐지 | dataset 폐기, 재가명처리, 제공 중단 |
| `T-07` | 비밀정보 및 자격증명 노출 | Secrets Manager, 최소 권한 IAM, rotation 정책 | `GetSecretValue` 이상 탐지, 누출 스캔 | secret 회전, 세션 폐기, 원인 추적 |
| `T-08` | KMS 권한 남용 | key admin/user 분리, key 분리, key policy 최소화 | 비정상 Decrypt/Sign 이벤트 탐지 | key policy 수정, 역할 정지, 재암호화 검토 |
| `T-09` | Break-glass 남용 | 2인 승인, JIT access, 세션 로깅, standing privilege 제거 | 세션 시작 이벤트, port forwarding 탐지 | 세션 종료, 임시 권한 폐기, 사후 검토 |
| `T-10` | 감사 증적 상실 | app audit, CloudTrail data event, immutable retention | trail 중단, log delivery 실패 탐지 | 로깅 복구, 보완 증적 확보, 조사 범위 명시 |
| `T-11` | `tenant_registry` 오염 및 온보딩 오류 | 조건부 쓰기, uniqueness 검증, 상태 전이 통제 | registry 변경 알림, 정합성 검사 | 잘못된 매핑 롤백, 영향 tenant 재검증 |
| `T-12` | 오프보딩 실패 및 잔존 접근 | artifact inventory, 세션 폐기, 파기 증적 | 비활성 tenant 접근, 잔존 객체 탐지 | 잔존 artifact 삭제, 파기 재검증 |
| `T-13` | 데이터베이스 장애 및 복구 시 격리 붕괴 | DR runbook, restore 후 보안 검증, encrypted backup | failover 실패, drift 탐지 | 제한 모드 복구, isolation 재검증, 포렌식 보존 |
| `T-14` | PHI 유출 사고 대응 실패 | 사고 대응 runbook, 책임 분리, 통지 기준 정의 | 이상 다운로드, 조사 지연 탐지 | 추가 반출 차단, 통지, 회전, 사후 개선 |

## 증빙 관점의 요구사항

통제는 “존재한다”는 주장만으로 충분하지 않습니다. 설계 검토 또는 배포 승인 시 최소한 다음 유형의 증빙이 확인되어야 합니다.

- 정책 증빙: 역할 매트릭스, break-glass 절차, 오프보딩 절차, 데이터셋 승인 기준
- 구현 증빙: IAM policy, KMS key policy, Lambda 인가 로직, RLS 정책, S3 bucket policy
- 운영 증빙: CloudTrail 설정, app audit 예시, session logging 예시, DR drill 결과
- 검증 증빙: cross-tenant 차단 테스트, role matrix 테스트, dataset approval 흐름 테스트

## 위협별 필수 증빙과 검증 주기

| 위협 ID | 1차 소유자 | 필수 증빙 | 최소 검증 주기 |
|---------|-----------|----------|----------------|
| `T-01` | 애플리케이션 보안 설계 책임자 | cross-tenant 차단 테스트 결과, `tenant_registry` 매핑 검토 기록, RLS 적용 증빙 | 매 릴리스, DR 후 즉시 |
| `T-02` | IAM/애플리케이션 인가 책임자 | 역할 매트릭스, route-scope 매핑, role change 회귀 테스트 | 매 릴리스 |
| `T-03` | 임상 데이터 무결성 책임자 | canonical payload 정의서, KMS 서명 검증 결과, 변경 이력 표본 | 매 릴리스, 월간 표본 점검 |
| `T-04` | 스토리지 보안 책임자 | 데이터셋 전달 상태 검증 규칙, object key 규칙, S3/VPC endpoint 정책 검토 기록, data event 로그 표본 | 매 릴리스, 월간 로그 점검 |
| `T-05` | 인증 체계 책임자 | token TTL 설정, 계정 비활성화·역할 변경 회귀 테스트, 세션 회수 절차 | 매 릴리스 |
| `T-06` | 데이터 거버넌스 책임자 | field allowlist, cohort threshold 기준, 반복 추출 검토 기록, 산출물 표본 검토 | 요청 유형 변경 시, 월간 |
| `T-07` | 비밀정보 관리 책임자 | secret inventory, IAM read policy 검토, rotation 실행 기록 | 월간, 회전 시마다 |
| `T-08` | KMS 관리자와 보안 검토자 분리 | key policy export, principal별 key usage 로그, 예외 권한 승인 기록 | 월간, 정책 변경 시마다 |
| `T-09` | 운영 보안 책임자 | break-glass 승인 기록, SSM 세션 로그, 만료 확인 기록 | 사용 시마다, 월간 종합 검토 |
| `T-10` | 감사 체계 책임자 | CloudTrail 설정 스냅샷, app audit 표본, delivery failure 알람 테스트 | 월간 |
| `T-11` | Tenant 프로비저닝 책임자 | registry 변경 승인 기록, uniqueness 검증 결과, 정합성 점검 결과 | 변경 시마다, 주간 정합성 점검 |
| `T-12` | 서비스 오프보딩 책임자 | 오프보딩 체크리스트, 파기 기록, post-offboarding 차단 테스트 결과 | 오프보딩 시마다 |
| `T-13` | DR 책임자 | DR drill 결과, restore 후 isolation 테스트, 복구 중 로그 연속성 검토 기록 | 반기별 drill, 실제 복구 후 즉시 |
| `T-14` | 사고 대응 책임자 | tabletop 결과, 기록 확보 체크리스트, 사고 지휘 체계 문서, 개선 조치 추적표 | 분기별 훈련, 사고 후 즉시 개정 |

## 워크로드별 필수 대응 전략

### `S1. 환자 정보 조회`

- Lambda는 Cognito authorizer 결과만 신뢰하지 않고 `tenant_id`, `tenant_type`, `role`, `group` 일관성을 다시 확인해야 합니다.
- 환자 조회는 `patient_id + tenant_id`만으로 충분하지 않으며, 실제 운영 배포에서는 patient-level 정책이 추가되어야 합니다.
- 성공 로그와 거부 로그 모두를 PHI 감사 이벤트로 남겨야 합니다.

### `S2. 환자 진료 기록 작성 및 조회`

- 기록 생성은 인가된 의료진만 수행할 수 있어야 하며, 병원 관리자는 기본적으로 차트 생성 권한을 갖지 않아야 합니다.
- record 본문과 attachment metadata는 동일한 무결성 모델로 보호되어야 합니다.
- 첨부파일 저장 및 조회 경로는 파일 무결성과 tenant-bound 경로 통제를 함께 가져야 합니다.

### `S3. 연구용 데이터셋 생성 및 제공`

- 연구자는 원본 DB 또는 clinical file bucket에 직접 접근해서는 안 됩니다.
- dataset 생성은 승인 후 내부 파이프라인에서만 실행되어야 하며, 승인 전 객체가 생성되어서는 안 됩니다.
- 직접 식별자 제거 외에 generalization, suppression, 반복 추출 위험 검토가 필요합니다.
- `APPROVED`에서 `READY`로 전환되는 구간은 단순 배치 처리 단계가 아니라 통제 단계로 취급해야 합니다.

### `S4. Tenant 온보딩`

- 온보딩은 보안 경계 복제 작업이므로 변경 승인, uniqueness 검증, 상태 이력 보존이 필요합니다.
- `tenant_registry` 값은 향후 오프보딩, 감사, 사고 조사 기준이 되므로 별도 보호 대상입니다.

### `S5. Tenant 오프보딩`

- 계정 비활성화와 데이터 파기를 동일 단계로 처리해서는 안 됩니다.
- DB schema, S3 객체, generated dataset, 데이터셋 전달 권한, cache, backup 식별 정보까지 범위에 포함해야 합니다.
- 파기 증적과 예외 승인 절차를 함께 남겨야 합니다.

### `S6. 운영자 비상 접근`

- break-glass는 일반 운영 절차를 대체하는 수단이 되어서는 안 됩니다.
- 세션 시작부터 종료까지의 모든 행위는 승인 기록과 함께 연결 가능해야 합니다.

### `S7. 데이터베이스 장애 및 복구`

- 복구 목표는 서비스 재개가 아니라 보안 속성을 유지한 상태의 재개입니다.
- DR drill은 가용성 검증과 함께 cross-tenant 차단 테스트를 포함해야 합니다.

## 프로덕션 배포 차단 기준

다음 항목 중 하나라도 충족하면 이 아키텍처는 프로덕션 배포 대상이 아닙니다.

- tenant A 토큰으로 tenant B 데이터가 한 건이라도 조회됩니다.
- 병원 관리자 기본 권한으로 상세 진료 기록 조회 또는 작성이 가능합니다.
- 연구자가 원본 PHI 저장소 또는 `dataset.generate` 내부 경로를 직접 호출할 수 있습니다.
- 승인되지 않은 dataset object가 생성되거나 다운로드될 수 있습니다.
- 가명처리 기준이 정의되지 않았거나 placeholder 처리만으로 dataset이 생성됩니다.
- SaaS 운영자 또는 일반 운영 role에 PHI 관련 KMS `Decrypt` 권한이 있습니다.
- `tenant_registry` 변경이 승인과 감사 없이 수행됩니다.
- 오프보딩된 tenant의 세션, 데이터셋 전달 권한, dataset artifact가 남아 있습니다.
- PHI 조회, 수정, 다운로드 이벤트가 애플리케이션 감사 로그에 남지 않습니다.
- CloudTrail 또는 app audit가 중단되어 사고 후 증적 확보가 불가능합니다.
- break-glass 접근이 승인, 세션 로깅, 자격증명 만료 없이 상시 가능합니다.

위 항목은 개별 결함 목록이 아니라, 보안 속성의 붕괴를 뜻하는 징후입니다. 하나라도 충족하면 부분 보완 후 추후 개선 대상으로 남길 수 없으며, 재검증 전까지 배포를 보류해야 합니다.

## 잔여 위험

모든 통제를 적용해도 다음 잔여 위험은 남습니다.

- 정상 계정과 정상 단말을 가진 내부자의 업무상 오남용을 완전히 제거할 수는 없습니다.
- 연구 데이터셋은 외부 데이터와 결합될 때 재식별 위험이 다시 커질 수 있습니다.
- 병원별 운영 성숙도 차이로 인해 동일 아키텍처라도 실제 보안 수준이 달라질 수 있습니다.
- 대규모 장애 상황에서는 예외 경로 사용이 증가해 평시보다 높은 운영 위험이 일시적으로 발생할 수 있습니다.

잔여 위험은 문서화, 정기 점검, 모의훈련, 침투 테스트, DR drill, 감사 로그 검토를 통해 지속적으로 관리해야 합니다.
