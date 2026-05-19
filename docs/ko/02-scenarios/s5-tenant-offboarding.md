---
title: "S5. Tenant 오프보딩"
---
# S5. Tenant 오프보딩

병원이 서비스 계약을 해지할 때, 데이터의 안전한 반출 또는 파기와 계정 및 환경 삭제가 순서에 맞게 이루어지는 과정입니다. 즉시 물리 삭제가 아니라 단계적 처리를 원칙으로 하며, Aurora automated backup, S3 Object Lock, CloudTrail 등 보존 정책이 적용된 리소스는 각 정책에 따른 실제 완전 삭제 시점을 서비스 정책에 명시합니다. 오프보딩 과정이 동일 환경 내 다른 Tenant의 서비스에 영향을 주지 않아야 하며, 모든 작업 이력은 감사 증빙으로 별도 보존합니다.

| 항목 | 내용 |
|---|---|
| 주 사용 역할 | SaaS 운영자, 병원 관리자 |
| 핵심 데이터 | 운영 DB 내 Tenant 스키마 데이터 전체, S3 Tenant Prefix 데이터(진료파일·데이터셋), 백업 스냅샷, 계정 정보, 파기 이력 |

## 1. 비즈니스 흐름

병원이 서비스 해지를 요청하면 데이터 반출 유예 기간이 부여되며, 이 기간 동안 병원은 자체 데이터를 내보낼 수 있습니다.

**서비스 흐름**

해지 요청 접수 → Tenant status `SUSPENDED` 처리로 일반 API 즉시 접근 차단 → 계정 전체 비활성화 → 데이터 export → 보존 기간 확인 → Tenant status `DECOMMISSIONING` 전환 → 데이터 파기(DB → S3 → 백업 순) → 모든 작업 이력 감사 로그 별도 보존 → 파기 확인서 발급

**세부 설명**

- Tenant 비활성화 및 오프보딩 절차:
  1. `ehr-tenant-registry` status를 `SUSPENDED` 또는 `DECOMMISSIONING`으로 변경하여 일반 API 접근 차단
  2. Cognito 사용자 비활성화, 그룹 제거, refresh token 무효화 수행
  3. 계약 또는 규제 요구사항에 따라 Aurora/S3/DynamoDB 데이터를 export
  4. Aurora automated backup, snapshot, S3 Object Lock, audit log retention 등 보존 기간 확인
  5. 보존 기간이 만료된 데이터는 승인 후 파기하고, 장기 보존 대상은 `ARCHIVED` 상태로 전환
  6. 비활성화, export, 권한 회수, 삭제, archive 전환 이력을 감사 로그로 별도 보존
- 데이터 파기 범위: Cognito 사용자 그룹, S3 prefix(진료파일, 데이터셋), DynamoDB, Aurora DB schema, dataset request 항목

<!-- 작성 예정: 아키텍처 흐름 다이어그램 -->

## 2. 보안 목표

- `ehr-tenant-registry` status를 `SUSPENDED` 또는 `DECOMMISSIONING`으로 즉시 변경하여 일반 API 접근 차단
- Cognito 사용자 비활성화, 그룹 제거, refresh token 무효화 수행
- 계약 또는 규제 요구사항에 따라 Aurora/S3/DynamoDB 데이터 export 수행
- Aurora automated backup, snapshot, S3 Object Lock, audit log retention 등 보존 기간 확인
- 보존 기간이 만료된 데이터는 승인 후 파기, 장기 보존 대상은 `ARCHIVED` 상태로 전환
- 비활성화, export, 권한 회수, 삭제, archive 전환 이력을 감사 로그로 별도 보존
- 오프보딩 과정이 다른 Tenant에 영향을 주지 않도록 사전 검증
- 파기 이력 기록 및 파기 확인서 발급

## 3. 보안 설계

**Registry 기반 즉시 접근 차단**

해지 요청 접수와 동시에 `ehr-tenant-registry` status를 `SUSPENDED`로 변경합니다. 이후 모든 Lambda에서 status를 확인하여 `ACTIVE`가 아닌 Tenant의 요청을 즉시 거부합니다. Cognito refresh token도 즉시 무효화하여 기존 세션을 통한 우회 접근을 차단합니다.

**단계적 처리 원칙**

즉시 물리 삭제가 아니라 접근 차단 → 데이터 export → 보존 기간 확인 → 리소스 정리 → archive 또는 파기 → 감사 로그 보존 순서로 진행합니다. Aurora automated backup, S3 Object Lock, CloudTrail 등 보존 정책이 적용된 리소스는 각 정책에 따른 실제 완전 삭제 시점을 서비스 정책에 명시합니다.

**보존 의무 기간 준수**

의료법상 진료기록 보존 기간(최소 5년, 종류에 따라 상이)을 확인한 후 파기를 진행합니다. 보존 의무가 남아 있는 데이터는 `ARCHIVED` 상태로 전환하여 접근만 차단하고 즉시 파기하지 않습니다.

**다른 Tenant 영향 없음 보장**

Aurora 스키마 DROP 전 다른 Tenant 스키마에 영향을 주지 않는지 사전 검증합니다. S3 Prefix 삭제 시 해당 Tenant의 Prefix 경로만 대상으로 처리합니다.

**감사 이력 별도 보존**

비활성화, export, 권한 회수, 삭제, archive 전환의 모든 작업 이력을 CloudTrail과 CloudWatch Logs에 기록하고 감사 증빙으로 별도 보존합니다. 파기 이력 자체는 파기 대상이 아닙니다.


## 4. 보안 통제 및 규제
<!-- 작성 예정: 규제 링크 연결 -->

| 통제 항목 | 수단 | 규제 |
|---|---|---|
| 즉시 접근 차단 | DynamoDB `ehr-tenant-registry` status: SUSPENDED/DECOMMISSIONING, Cognito 계정 비활성화·그룹 제거·refresh token 무효화 | |
| 단계적 파기 | Aurora 스키마 DROP, S3 Tenant Prefix 데이터 삭제(진료파일·데이터셋), DynamoDB Tenant 항목 삭제, 백업 스냅샷 보존 기간 확인 후 파기 | |
| 보존 정책 준수 | Aurora automated backup·snapshot 보존 기간, S3 Object Lock retention, CloudTrail·audit log retention 확인 | |
| 상태 관리 | `ACTIVE` → `SUSPENDED` → `DECOMMISSIONING` → `ARCHIVED` / `DELETED` 전이 | |
| 다른 Tenant 영향 검증 | Aurora 스키마 DROP 전 사전 검증, S3 Prefix 범위 제한 | |
| 감사 로그 | CloudTrail + CloudWatch Logs(비활성화·export·권한 회수·삭제·archive 전환 이력 전 과정 별도 보존), 파기 확인서 발급 | |

## 5. 보안 체크리스트

- [ ] 해지 요청 접수와 동시에 `ehr-tenant-registry` status가 `SUSPENDED`로 변경됩니다.
- [ ] Cognito refresh token이 즉시 무효화됩니다.
- [ ] 데이터 반출 유예 기간이 병원 측에 제공됩니다.
- [ ] Aurora automated backup·snapshot·S3 Object Lock·audit log retention 보존 기간을 확인합니다.
- [ ] 의료법상 보존 의무 기간이 남은 데이터는 즉시 파기하지 않고 `ARCHIVED` 처리됩니다.
- [ ] Aurora 스키마 DROP 전 다른 Tenant 스키마에 영향을 주지 않는지 사전 검증합니다.
- [ ] S3 Prefix 삭제 시 해당 Tenant의 Prefix 경로만 대상으로 처리됩니다.
- [ ] 파기 이력 자체는 파기 대상에서 제외됩니다.
- [ ] 파기 이력이 기록되고 파기 확인서가 발급됩니다.
- [ ] 오프보딩 전 과정이 CloudTrail과 CloudWatch Logs에 기록됩니다.