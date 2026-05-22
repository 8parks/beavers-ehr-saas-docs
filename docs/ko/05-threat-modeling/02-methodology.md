---
title: 위협 모델링 방법론
outline: [2, 4]
---

# 위협 모델링 방법론

## 적용 원칙

본 섹션은 단일 프레임워크를 기계적으로 적용하지 않습니다. 기본 절차는 OWASP 위협 모델링 프로세스를 따르되, 운영 유지관리 원칙은 AWS Well-Architected를 따릅니다. 본 가이드라인이 웹 애플리케이션 위협에 더해, 가명정보 제공과 재식별 가능성까지 동시에 다루기 때문에 분류 체계는 STRIDE와 LINDDUN을 병행합니다.

적용 순서는 다음과 같습니다.

1. 워크로드 범위를 정의합니다.
2. 보호 자산과 신뢰 경계를 식별합니다.
3. STRIDE와 LINDDUN으로 위협을 식별합니다.
4. 각 위협에 대해 예방, 탐지, 대응 통제를 정의합니다.
5. 검증 항목과 운영 점검 항목을 문서화합니다.
6. 운영 중 발생한 변경 사항과 사고 학습 결과를 반영해 갱신합니다.

개별 위협은 “무엇이 잘못될 수 있는가”를 설명하는 수준에 그치지 않고, 어떤 통제의 실패가 해당 위협을 성립시키는지까지 포함하여 서술합니다.

## OWASP 기반 절차 적용

[OWASP Threat Modeling Process](https://owasp.org/www-community/Threat_Modeling_Process)는 위협 모델링을 `범위 정의`, `위협 식별`, `대응책 정의`, `평가`의 네 단계로 설명합니다. 본 섹션은 이를 다음과 같이 적용합니다.

| OWASP 단계 | 본 가이드라인에서의 적용 방식 |
|-----------|---------------------------|
| Scope your work | `S1`부터 `S7`까지의 워크로드, 관련 자산, 관련 역할, 데이터 흐름 정의 |
| Determine threats | STRIDE와 LINDDUN을 이용한 cross-tenant 접근, 권한 상승, 재식별, 비상 접근 남용 등 위협 식별 |
| Determine countermeasures and mitigation | Cognito claim 검증, `tenant_registry` 정합성, RLS, S3 prefix 검증, KMS key 분리, CloudTrail, SSM 절차의 통제 항목 매핑 |
| Assess your work | 위협 우선순위, 검증 항목, 잔여 위험 명시 |

## STRIDE 적용

[Microsoft STRIDE guidance](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)는 위협을 `Spoofing`, `Tampering`, `Repudiation`, `Information Disclosure`, `Denial of Service`, `Elevation of Privilege`로 분류합니다. 본 가이드라인에서는 다음과 같이 해석합니다.

| 범주 | 본 가이드라인에서의 주요 검토 질문 |
|------|----------------------------|
| Spoofing | 잘못된 JWT claim, 탈취된 token, 비상용 자격증명에 의한 의료진 또는 운영자 사칭 가능 여부 |
| Tampering | 진료 기록, 승인 상태, 감사 로그, 가명처리 결과물의 무단 변경 가능 여부 |
| Repudiation | PHI 조회 또는 운영자 접근 이후 행위 부인 가능 여부 |
| Information Disclosure | 타 테넌트 데이터, 승인 전 데이터셋, 원본 PHI, secret 노출 가능 여부 |
| Denial of Service | DB 장애, KMS 오류, 인증 장애의 의료 워크로드 중단 유발 여부 |
| Elevation of Privilege | 병원 관리자, 연구자, 운영자, Lambda 역할의 권한 초과 가능 여부 |

## LINDDUN 적용

[LINDDUN](https://linddun.org/)은 Privacy 위협을 `Linkability`, `Identifiability`, `Detectability`, `Disclosure of Information`, `Unawareness`, `Non-compliance`로 분류합니다. 본 가이드라인에서는 연구용 데이터셋 제공, 승인 이력 관리, 반복 추출 과정에서 발생할 수 있는 재식별 및 목적 외 활용 위험을 평가하기 위해 이를 적용합니다.

| 범주 | 본 가이드라인에서의 주요 검토 질문 |
|------|----------------------------|
| Linkability | 서로 다른 dataset 또는 로그의 결합을 통한 동일 개인 또는 동일 사건 연결 가능 여부 |
| Identifiability | 직접 식별자 제거 이후 개인 식별 가능 여부 |
| Detectability | 특정 환자 또는 희귀 질환 환자 존재 여부 추정 가능 여부 |
| Disclosure of Information | 목적 외 데이터의 과도한 제공 여부 |
| Unawareness | 데이터 제공 목적, 범위, 승인 상태의 고지 미흡 여부 |
| Non-compliance | 승인 절차, 최소 제공 원칙, 보존 정책의 규제 요구 충돌 여부 |

## 위험도 산정 기준

본 섹션은 정량 점수 대신 `높음`, `중간`, `낮음`의 정성 등급을 사용합니다. 등급은 다음 요소를 함께 고려해 결정합니다.

- 기밀성, 무결성, 가용성, Privacy, Accountability 영향
- 환자 안전 및 진료 지속성 영향
- 규제 위반 가능성
- 공격 또는 실패 성립 가능성
- 탐지 난이도와 복구 난이도
- 예외 경로나 운영자 수작업에 의존하는 정도

위험도 해석은 다음과 같습니다.

| 위험도 | 해석 |
|--------|------|
| 높음 | 서비스 영향 가능성이 높아 우선 조치가 필요하며, 조치 전 배포를 제한함 |
| 중간 | 보완 통제와 운영 모니터링을 전제로 제한적으로 수용 가능 |
| 낮음 | 영향도는 낮으나 지속적인 점검 및 관리 필요 |

## 유지관리 원칙

[AWS Well-Architected SEC01-BP07](https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/sec_securely_operate_threat_model.html)은 위협 모델을 최신 상태의 등록부로 유지하고, 위협과 완화책을 우선순위화할 것을 요구합니다. 본 가이드라인은 다음 원칙을 따릅니다.

- 위협 모델은 일회성 보고서가 아니라 운영 중 유지되는 등록부로 관리합니다.
- 신규 Tenant 유형, 신규 연구 데이터셋 유형, 신규 운영 경로가 추가되면 즉시 갱신합니다.
- 사고 또는 모의훈련에서 확인된 실패 모드는 다음 개정판에 반영합니다.
- 배포 전 검증 항목은 위협 시나리오와 1:1로 연결합니다.
