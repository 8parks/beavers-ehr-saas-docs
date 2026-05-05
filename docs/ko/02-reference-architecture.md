---
title: 레퍼런스 아키텍처
---

# 레퍼런스 아키텍처

> 통합 AWS 아키텍처와 주요 구성 요소가 어떻게 함께 작동하는지 설명합니다.

## 고수준 아키텍처

<!-- 작성 예정: 통합 AWS 아키텍처 다이어그램 -->

> 다이어그램 자리표시자: 통합 AWS 아키텍처 다이어그램 (작성 예정)

## 계정 및 네트워크 구조

이 설계는 두 가지 주요 AWS 계정 환경으로 구분됩니다.

### 관리 계정 (Administrator Account)

중앙화된 보안 서비스 및 자동화 구성 요소를 포함합니다.

| 구성 요소 | 역할 |
|-----------|------|
| AWS Config | 리소스 구성 상태 지속 평가 |
| AWS Security Hub | 보안 이상 탐지 결과 집계 |
| Amazon EventBridge | 이벤트 라우팅 및 자동화 트리거 |
| Amazon SQS | 이벤트 큐잉 |
| AWS Lambda | 전처리 및 대응 로직 |
| Amazon DynamoDB | 이력/상태 저장 |
| Amazon SNS | 알림 및 티켓 생성 |
| AWS CloudWatch | 대시보드, 알람, 로그 |
| AWS CloudTrail | API 감사 로그 |
| Amazon S3 | 로그 및 이력 보관 |
| IAM 역할 | 오케스트레이션 및 대응 역할 |

### 멤버 계정 (Member Account)

애플리케이션 또는 고객 리소스 환경을 나타냅니다.

| 구성 요소 | 역할 |
|-----------|------|
| 고객 리소스 | EHR SaaS 애플리케이션 리소스 |
| SSM Automation 문서 | 대응 런북 |
| IAM 역할 | 대응 실행 역할 |
| AWS KMS | 대응/서명용 키 |
| AWS CloudTrail | 계정 수준 감사 로그 |
| Amazon S3 버킷 | 로그 및 PHI 문서 저장 |
| 이벤트 프로세서 Lambda | 이벤트 수신 및 처리 |

### VPC 및 네트워크 설계

<!-- 작성 예정: VPC 설계, 서브넷 전략, VPC 엔드포인트 전략 -->

- 프라이빗 서브넷 전략
- VPC 엔드포인트 전략
- 보안 그룹 설계

## 핵심 애플리케이션 흐름

<!-- 작성 예정: 핵심 요청 흐름 다이어그램 -->

애플리케이션 아키텍처 주요 구성 요소:

| AWS 서비스 | 역할 |
|-----------|------|
| Amazon CloudFront | 정적 콘텐츠 전달 |
| Amazon S3 | 정적 웹 호스팅, 문서 저장 |
| AWS WAF | 웹 애플리케이션 방화벽 |
| Amazon Cognito | 사용자 인증 |
| Amazon API Gateway / ALB | API 진입점 |
| AWS Lambda | 비즈니스 로직 및 테넌트 검증 |
| Amazon RDS / Aurora PostgreSQL | EHR 데이터 저장 |
| AWS KMS | 암호화 및 디지털 서명 |
| AWS Secrets Manager | 데이터베이스 자격증명 관리 |
| VPC 엔드포인트 | 프라이빗 AWS 서비스 접근 |
| CloudWatch Logs / CloudTrail | 모니터링 및 감사 |

## 보안 자동화 흐름

<!-- 작성 예정: 보안 자동화 및 대응 흐름 다이어그램 -->

```
AWS Config → Security Hub → EventBridge → Lambda → SSM Automation Runbook
                                                ↓
                               CloudTrail + CloudWatch (기록)
                                                ↓
                               보안 운영자 알림 (대시보드/알람/티켓)
```

### 자동화 흐름 상세

1. AWS Config가 비준수 리소스 탐지
2. AWS Security Hub가 이상 탐지 결과 집계
3. EventBridge가 이벤트 라우팅
4. Lambda가 전처리 또는 대응 예약
5. SSM Automation Runbook이 대응 실행
6. CloudTrail과 CloudWatch가 활동 기록
7. 보안 운영자에게 알림 전달

## 공유 보안 컨트롤

<!-- 작성 예정: 공유 보안 컨트롤 상세 -->

| 컨트롤 | AWS 서비스 | 목적 |
|--------|-----------|------|
| 신원 및 접근 관리 | IAM, Cognito | 인증/인가 |
| 키 관리 | AWS KMS | 암호화, 서명, 키 교체 |
| API 감사 | AWS CloudTrail | 모든 API 호출 기록 |
| 애플리케이션 로그 | Amazon CloudWatch | 애플리케이션 이벤트 모니터링 |
| 웹 보호 | AWS WAF | 웹 공격 방어 |
| 구성 모니터링 | AWS Config | 구성 드리프트 탐지 |
| 이상 탐지 집계 | AWS Security Hub | 보안 결과 중앙화 |
| 로그 불변성 | S3 Object Lock | 감사 로그 변조 방지 |

> 다이어그램 자리표시자: 계정 분리 다이어그램 (작성 예정)
