---
title: 위협 시나리오 카탈로그
outline: [2, 3]
---

# 위협 시나리오 카탈로그

## 카탈로그 구성 원칙

개별 위협 시나리오는 단순 설명이 아니라 운영 가능한 가이드라인 단위로 작성한다. 각 위협 시나리오 문서는 다음 요소를 포함한다.

- 관련 워크로드, 자산, 신뢰 경계
- 위협이 성립하는 전제 조건
- 실제 공격 또는 실패 전개 순서
- 필수 예방, 탐지, 대응 통제
- 검증 기준과 배포 차단 조건

## 위협 시나리오 목록

| 위협 ID | 위협 시나리오 | 위험도 | 관련 워크로드 |
|---------|--------------|--------|--------------|
| [`T-01`](/ko/04-threat-modeling/05-threat-scenarios/t-001-cross-tenant-access) | Cross-Tenant Access | 높음 | `S1`, `S2`, `S3` |
| [`T-02`](/ko/04-threat-modeling/05-threat-scenarios/t-002-intra-tenant-privilege-escalation) | 동일 테넌트 내부 권한 상승 | 높음 | `S1`, `S2`, `S4`, `S6` |
| [`T-03`](/ko/04-threat-modeling/05-threat-scenarios/t-003-record-tampering-and-signature-bypass) | 의료 기록 무단 수정 및 전자서명 우회 | 높음 | `S2` |
| [`T-04`](/ko/04-threat-modeling/05-threat-scenarios/t-004-presigned-url-and-object-path-abuse) | Presigned URL 및 객체 경로 남용 | 높음 | `S2`, `S3` |
| [`T-05`](/ko/04-threat-modeling/05-threat-scenarios/t-005-token-reuse-and-claim-mismatch) | 인증 토큰 재사용 및 Claim 불일치 | 높음 | `S1`, `S2`, `S3`, `S6` |
| [`T-06`](/ko/04-threat-modeling/05-threat-scenarios/t-006-re-identification-attack) | 재식별 공격 | 높음 | `S3` |
| [`T-07`](/ko/04-threat-modeling/05-threat-scenarios/t-007-secret-and-credential-exposure) | 비밀정보 및 자격증명 노출 | 높음 | `S2`, `S3`, `S6`, `S7` |
| [`T-08`](/ko/04-threat-modeling/05-threat-scenarios/t-008-kms-privilege-abuse) | KMS 권한 남용 | 높음 | `S2`, `S3`, `S6`, `S7` |
| [`T-09`](/ko/04-threat-modeling/05-threat-scenarios/t-009-break-glass-misuse) | Break-glass 남용 | 높음 | `S6`, `S7` |
| [`T-10`](/ko/04-threat-modeling/05-threat-scenarios/t-010-audit-evidence-loss) | 감사 증적 상실 | 중간 | `S1`, `S2`, `S3`, `S6`, `S7` |
| [`T-11`](/ko/04-threat-modeling/05-threat-scenarios/t-011-tenant-registry-corruption-and-provisioning-error) | `tenant_registry` 오염 및 온보딩 오류 | 높음 | `S4`, `S1`, `S2`, `S3` |
| [`T-12`](/ko/04-threat-modeling/05-threat-scenarios/t-012-offboarding-failure-and-residual-access) | 오프보딩 실패 및 잔존 접근 | 중간 | `S5`, `S3`, `S6` |
| [`T-13`](/ko/04-threat-modeling/05-threat-scenarios/t-013-db-failure-and-recovery-isolation-breakdown) | 데이터베이스 장애 및 복구 시 격리 붕괴 | 높음 | `S7` |
| [`T-14`](/ko/04-threat-modeling/05-threat-scenarios/t-014-phi-incident-response-failure) | PHI 유출 사고 대응 실패 | 높음 | `S1`, `S2`, `S3`, `S6` |

## 사용 방법

설계 검토 단계에서는 모든 시나리오를 확인하되, 실제 구현 점검 시에는 다음 순서로 우선 검토한다.

1. `T-01`부터 `T-06`까지의 데이터 평면 위협
2. `T-07`부터 `T-10`까지의 운영 통제 및 증적 위협
3. `T-11`부터 `T-14`까지의 라이프사이클, 복구, 사고 대응 위협

위 위험도는 “기술적 심각도”만이 아니라, 해당 위협이 단독으로 사고를 유발하는지 또는 다른 사고의 탐지·복구를 어렵게 만드는지를 함께 반영한다. 예를 들어 `T-10`과 `T-12`는 즉시 대규모 PHI 노출로 이어지지 않을 수 있으나, 다른 결함과 결합될 때 사고 범위를 확대시키므로 중위험으로 분류한다.
