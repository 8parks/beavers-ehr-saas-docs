---
title: ADR-007. AWS Config, Security Hub, SSM 보안 자동화
---

# ADR-007. AWS Config, Security Hub, SSM 보안 자동화

## 상태

제안됨

## 컨텍스트

클라우드 환경에서 보안 구성 드리프트, 비준수 리소스, 보안 이상을 지속적으로 탐지하고 자동으로 대응하는 메커니즘이 필요합니다. AWS 네이티브 서비스를 조합하여 보안 자동화 파이프라인을 어떻게 설계할지 결정해야 합니다.

<!-- 작성 예정: 보안 자동화 파이프라인 설계 상세 -->

## 결정

<!-- 작성 예정: 선택된 보안 자동화 전략 -->

**초안:** AWS Config → Security Hub → EventBridge → Lambda → SSM Automation Runbook 파이프라인으로 보안 이상 탐지 및 자동 대응을 구현합니다.

## 고려된 대안

| 대안 | 설명 |
|------|------|
| 수동 대응 | 보안 운영자가 직접 대응 |
| Lambda + EventBridge 단독 | SSM Automation 없이 Lambda로 모든 대응 처리 |
| AWS Config + Security Hub + SSM (권장) | 역할 분리, 감사 가능한 자동화 |
| 외부 SOAR 플랫폼 | 서드파티 의존성 |

## 근거

<!-- 작성 예정: 근거 상세 -->

## 보안 함의

- SSM Automation Runbook은 최소 권한 IAM 역할로 실행
- 자동 대응 전 사람 승인(human approval) 단계 추가 여부 결정 필요
- 대응 활동은 CloudTrail로 완전히 감사 가능해야 함
- 잘못된 자동 대응이 서비스 가용성에 영향을 미칠 위험 관리

## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 보안 모니터링 | AWS Config, Security Hub 지속 평가 |
| 사고 대응 | EventBridge + SSM 자동화 대응 |
| 감사 추적성 | CloudTrail 대응 활동 기록 |

## 미해결 질문

- 어떤 유형의 이상 탐지 결과를 자동 대응 vs 수동 검토로 분류할 것인가?
- 자동 대응의 롤백 메커니즘 설계 방법
- 보안 운영자 알림 채널 (SNS, 티켓 시스템 등) 결정
- 테넌트 환경의 대응 IAM 역할 최소 권한 경계 설정
