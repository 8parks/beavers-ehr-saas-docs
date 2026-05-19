---
title: 5. 위협 모델링
outline: [2, 3]
---

# 5. 위협 모델링

> 본 섹션은 멀티테넌트 EHR SaaS 아키텍처의 배포 적합성을 판단하기 위한 위협 모델과 통제 기준을 정의한다.

## 목적

본 섹션은 설계 검토, 구현 검토, 배포 승인, 운영 변경 심사에 공통 적용하는 통제 기준서다. 따라서 본 섹션에 수록되는 위협은 자산, 신뢰 경계, 권한 모델, 운영 절차를 기준으로 실제 워크로드에서 성립 가능하거나 명시적으로 배제되어야 하는 실패 모드로 한정한다.

본 섹션이 답하려는 질문은 다음과 같다.

- 어떤 자산이 의료 서비스 관점에서 핵심 보호 대상인가
- 어떤 경계에서 인증, 인가, 격리, 감사의 신뢰가 다시 검증되어야 하는가
- 어떤 공격 또는 운영 실패가 환자 정보 노출, 진료 기록 무결성 훼손, 재식별, 사고 대응 실패로 이어지는가
- 해당 위협을 배포 가능한 수준으로 낮추기 위해 어떤 설계 통제와 운영 통제가 필요한가
- 어떤 결함은 보완 계획이 아니라 즉시 배포 차단 사유로 취급해야 하는가

## 적용 범위

범위는 다음 워크로드를 포함한다.

- `S1` 환자 정보 조회
- `S2` 환자 진료 기록 작성 및 조회
- `S3` 연구기관용 데이터셋 생성 및 제공
- `S4` Tenant 온보딩
- `S5` Tenant 오프보딩
- `S6` 운영자 비상 접근(Break-glass)
- `S7` 데이터베이스 장애 및 복구

이 범위에는 애플리케이션 데이터 평면뿐 아니라 관리 평면과 예외 경로가 포함된다. 구체적으로는 Cognito 기반 인증, API Gateway 진입점, Lambda 인가 로직, `tenant_registry`, RDS Proxy, Aurora, S3, DynamoDB, KMS, CloudTrail, SSM 운영 경로를 모두 분석 대상으로 본다.

## 작성 기준

본 섹션은 다음 공식 레퍼런스를 기준으로 구성하였다.

- [OWASP Threat Modeling Process](https://owasp.org/www-community/Threat_Modeling_Process)
- [OWASP Threat Modeling Overview](https://owasp.org/www-community/Threat_Modeling)
- [AWS Well-Architected SEC01-BP07](https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/sec_securely_operate_threat_model.html)
- [AWS Prescriptive Guidance for Presigned URLs](https://docs.aws.amazon.com/prescriptive-guidance/latest/presigned-url-best-practices/introduction.html)
- [Microsoft STRIDE guidance](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)

본 섹션은 위 레퍼런스를 일반 원칙으로 삼되, EHR SaaS, 멀티테넌트 격리, 연구 데이터셋 제공, 비상 접근, 규제 보고라는 본 가이드라인의 워크로드와 운영 모델에 맞추어 위협 진술과 통제 기준을 재구성하였다.

## 문서 구성

- [보안 목표](/ko/05-threat-modeling/01-security-objectives)
- [위협 모델링 방법론](/ko/05-threat-modeling/02-methodology)
- [자산 식별](/ko/05-threat-modeling/03-assets)
- [신뢰 경계](/ko/05-threat-modeling/04-trust-boundaries)
- [위협 시나리오 카탈로그](/ko/05-threat-modeling/05-threat-scenarios/)
- [위협별 대응 전략](/ko/05-threat-modeling/06-mitigations)

## 운영 원칙

위협 모델은 일회성 산출물이 아니라 유지되는 등록부로 운영한다. 다음 변경은 모두 위협 모델 재검토 사유다.

- 신규 Tenant 유형 또는 사용자 역할 추가
- 데이터셋 생성 방식 또는 가명처리 로직 변경
- 인증, 인가, 키 관리, 감사 구조 변경
- 규제 요구사항 또는 계약상 보호 범위 변경

또한 다음 중 하나라도 발생하면 해당 위협 시나리오를 재평가해야 한다.

- 고객 또는 내부 감사에서 통제 미흡이 지적된 경우
- 모의훈련, 침투 테스트, DR drill에서 기존 가정이 깨진 경우
- 사고 대응 과정에서 문서화되지 않은 예외 경로가 사용된 경우
