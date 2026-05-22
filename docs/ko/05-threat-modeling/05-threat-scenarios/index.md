---
title: 위협 시나리오 카탈로그
outline: [2, 3]
---

# 위협 시나리오 카탈로그

## 카탈로그 구성 원칙

개별 위협 시나리오는 단순 설명이 아니라 운영 가능한 가이드라인 단위로 작성합니다. 각 위협 시나리오 문서는 다음 요소를 포함합니다.

- 관련 워크로드, 자산, 신뢰 경계
- 위협이 성립하는 전제 조건
- 실제 공격 또는 실패 전개 순서
- 필수 예방, 탐지, 대응 통제
- 검증 기준과 운영 점검 항목

## 위협 시나리오 목록

| 위협 ID | 위협 시나리오 | 위험도 | 관련 워크로드 |
|---------|--------------|--------|--------------|
| [`T-01`](/ko/05-threat-modeling/05-threat-scenarios/t-001-cross-tenant-access) | Cross-Tenant Access | 높음 | `S1`, `S2`, `S3` |
| [`T-02`](/ko/05-threat-modeling/05-threat-scenarios/t-002-intra-tenant-privilege-escalation) | 동일 테넌트 내부 권한 상승 | 높음 | `S1`, `S2`, `S4`, `S6` |
| [`T-03`](/ko/05-threat-modeling/05-threat-scenarios/t-003-record-tampering-and-signature-bypass) | 의료 기록 무단 수정 및 전자서명 우회 | 높음 | `S2` |
| [`T-04`](/ko/05-threat-modeling/05-threat-scenarios/t-004-data-delivery-and-object-path-abuse) | 데이터 전달 경로 및 객체 경로 오남용 | 높음 | `S2`, `S3` |
| [`T-05`](/ko/05-threat-modeling/05-threat-scenarios/t-005-token-reuse-and-claim-mismatch) | 인증 토큰 재사용 및 Claim 불일치 | 높음 | `S1`, `S2`, `S3`, `S6` |
| [`T-06`](/ko/05-threat-modeling/05-threat-scenarios/t-006-re-identification-attack) | 재식별 공격 | 높음 | `S3` |
| [`T-07`](/ko/05-threat-modeling/05-threat-scenarios/t-007-secret-and-credential-exposure) | 비밀정보 및 자격증명 노출 | 높음 | `S2`, `S3`, `S6`, `S7` |
| [`T-08`](/ko/05-threat-modeling/05-threat-scenarios/t-008-kms-privilege-abuse) | KMS 권한 남용 | 높음 | `S2`, `S3`, `S6`, `S7` |
| [`T-09`](/ko/05-threat-modeling/05-threat-scenarios/t-009-break-glass-misuse) | Break-glass 남용 | 높음 | `S6`, `S7` |
| [`T-10`](/ko/05-threat-modeling/05-threat-scenarios/t-010-audit-evidence-loss) | 감사 증적 상실 | 중간 | `S1`, `S2`, `S3`, `S6`, `S7` |
| [`T-11`](/ko/05-threat-modeling/05-threat-scenarios/t-011-tenant-registry-corruption-and-provisioning-error) | `tenant_registry` 오염 및 온보딩 오류 | 높음 | `S4`, `S1`, `S2`, `S3` |
| [`T-12`](/ko/05-threat-modeling/05-threat-scenarios/t-012-offboarding-failure-and-residual-access) | 오프보딩 실패 및 잔존 접근 | 중간 | `S5`, `S3`, `S6` |
| [`T-13`](/ko/05-threat-modeling/05-threat-scenarios/t-013-db-failure-and-recovery-isolation-breakdown) | 데이터베이스 장애 및 복구 시 격리 붕괴 | 높음 | `S7` |
| [`T-14`](/ko/05-threat-modeling/05-threat-scenarios/t-014-phi-incident-response-failure) | PHI 유출 사고 대응 실패 | 높음 | `S1`, `S2`, `S3`, `S6` |

## 시나리오별 요약

### [T-01 Cross-Tenant Access](/ko/05-threat-modeling/05-threat-scenarios/t-001-cross-tenant-access)

테넌트 격리 실패로 인해 다른 테넌트의 PHI, 첨부파일, 연구 산출물에 접근하는 시나리오를 다룹니다.

### [T-02 동일 테넌트 내부 권한 상승](/ko/05-threat-modeling/05-threat-scenarios/t-002-intra-tenant-privilege-escalation)

병원 관리자, 간호사, 연구자, 운영자의 역할 경계가 약해질 때 발생하는 동일 테넌트 내부 권한 오남용을 다룹니다.

### [T-03 의료 기록 무단 수정 및 전자서명 우회](/ko/05-threat-modeling/05-threat-scenarios/t-003-record-tampering-and-signature-bypass)

진료 기록과 첨부파일 메타데이터의 무결성이 손상되거나 전자서명 검증이 우회되는 시나리오를 다룹니다.

### [T-04 데이터 전달 경로 및 객체 경로 오남용](/ko/05-threat-modeling/05-threat-scenarios/t-004-data-delivery-and-object-path-abuse)

임상 파일과 연구 데이터셋의 전달 경로에서 전달 상태 검증과 object key 통제가 무너지는 시나리오를 다룹니다.

### [T-05 인증 토큰 재사용 및 Claim 불일치](/ko/05-threat-modeling/05-threat-scenarios/t-005-token-reuse-and-claim-mismatch)

계정 상태 변경 이후에도 기존 token이 남거나 claim 정합성이 깨져 권한 우회가 발생하는 시나리오를 다룹니다.

### [T-06 재식별 공격](/ko/05-threat-modeling/05-threat-scenarios/t-006-re-identification-attack)

가명처리된 데이터셋이 외부 데이터 또는 반복 추출과 결합되어 개인을 다시 식별하게 되는 시나리오를 다룹니다.

### [T-07 비밀정보 및 자격증명 노출](/ko/05-threat-modeling/05-threat-scenarios/t-007-secret-and-credential-exposure)

DB 접속 정보, 운영 비밀정보, break-glass 자격증명이 노출되어 데이터 평면이 직접 우회되는 시나리오를 다룹니다.

### [T-08 KMS 권한 남용](/ko/05-threat-modeling/05-threat-scenarios/t-008-kms-privilege-abuse)

암호화 및 서명용 KMS 키에 대한 과도한 사용 권한이 원본 PHI 복호화 또는 가짜 서명으로 이어지는 시나리오를 다룹니다.

### [T-09 Break-glass 남용](/ko/05-threat-modeling/05-threat-scenarios/t-009-break-glass-misuse)

운영자 예외 접근 경로가 상시 운영 경로처럼 사용되거나 승인·감사 없이 사용되는 시나리오를 다룹니다.

### [T-10 감사 증적 상실](/ko/05-threat-modeling/05-threat-scenarios/t-010-audit-evidence-loss)

PHI 접근과 운영자 행위를 조사할 수 있을 정도의 증적 체인이 남지 않는 시나리오를 다룹니다.

### [T-11 tenant_registry 오염 및 온보딩 오류](/ko/05-threat-modeling/05-threat-scenarios/t-011-tenant-registry-corruption-and-provisioning-error)

tenant registry의 매핑, 상태, prefix, schema 정보가 잘못 생성되거나 변경되는 구조적 격리 실패 시나리오를 다룹니다.

### [T-12 오프보딩 실패 및 잔존 접근](/ko/05-threat-modeling/05-threat-scenarios/t-012-offboarding-failure-and-residual-access)

계약 종료 후에도 세션, 데이터셋 전달 권한, dataset artifact, backup 식별 정보가 남아 접근이 지속되는 시나리오를 다룹니다.

### [T-13 데이터베이스 장애 및 복구 시 격리 붕괴](/ko/05-threat-modeling/05-threat-scenarios/t-013-db-failure-and-recovery-isolation-breakdown)

복구 과정에서 RLS, schema binding, key access, 감사 로깅이 깨져 보안 속성이 손상되는 시나리오를 다룹니다.

### [T-14 PHI 유출 사고 대응 실패](/ko/05-threat-modeling/05-threat-scenarios/t-014-phi-incident-response-failure)

PHI 유출 의심 상황에서 차단, 조사, 통지, 재발방지가 지연되거나 누락되는 운영 실패 시나리오를 다룹니다.

## 사용 방법

설계 검토 단계에서는 모든 시나리오를 확인하되, 실제 구현 점검 시에는 다음 순서로 우선 검토합니다.

1. `T-01`부터 `T-06`까지의 데이터 평면 위협
2. `T-07`부터 `T-10`까지의 운영 통제 및 증적 위협
3. `T-11`부터 `T-14`까지의 라이프사이클, 복구, 사고 대응 위협

위 위험도는 “기술적 심각도”만이 아니라, 해당 위협이 단독으로 사고를 유발하는지 또는 다른 사고의 탐지·복구를 어렵게 만드는지를 함께 반영합니다. 예를 들어 `T-10`과 `T-12`는 즉시 대규모 PHI 노출로 이어지지 않을 수 있으나, 다른 결함과 결합될 때 사고 범위를 확대시키므로 중위험으로 분류합니다.
