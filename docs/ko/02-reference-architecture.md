---
title: 레퍼런스 아키텍처
---

# 레퍼런스 아키텍처

> 해당 섹션에서 통합 AWS 아키텍처와 전체 서비스의 주요 구성 요소가 어떻게 함께 작동하는지 설명합니다.

## 전체 아키텍처 다이어그램

![전체 아키텍처 다이어그램](/beavers-ehr-saas-docs/architecture-diagram.png)

> 본 다이어그램은 지속적으로 추가 검증하고 수정할 예정입니다.

**2026-05-22** — Lambda 단독 오케스트레이션에서 Step Functions 도입 검토 예정

## 계정 및 네트워크 구조

이 설계는 두 가지 주요 AWS 계정 환경으로 구분됩니다.

### 관리 계정

중앙화된 보안 서비스 및 자동화 구성 요소를 포함합니다.

| 구성 요소 | 역할 |
|-----------|------|
| AWS Config | 리소스 구성 상태 지속 평가 |
| AWS Security Hub | 보안 이상 탐지 결과 집계 |
| Amazon EventBridge | 이벤트 라우팅 및 자동화 트리거 |
| AWS Lambda | 전처리 및 대응 로직 |
| Amazon DynamoDB | 이력/상태 저장 |
| Amazon SNS | 알림 및 티켓 생성 |
| AWS CloudWatch | 대시보드, 알람, 로그 |
| AWS CloudTrail | API 감사 로그 |
| Amazon S3 | 로그 및 이력 보관 |
| IAM 역할 | 오케스트레이션 및 대응 역할 |

### 멤버 계정

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

#### Subnet 구조

멤버 계정 VPC는 두 단계의 프라이빗 서브넷으로 구성하며, 모든 레이어를 Multi-AZ로 배치합니다. API 진입점은 VPC 외부의 관리형 서비스(API Gateway)를 사용합니다. NAT Gateway는 외부 전자서명 솔루션 연동을 위한 아웃바운드 전용으로만 존재합니다.

```
Internet
    │                                    ↑ (전자서명 솔루션 아웃바운드 전용)
CloudFront → WAF → API Gateway      [Public Subnet] NAT Gateway
         (관리형, VPC 외부)               ↑
    │                                    │
[Private App Subnet]    Lambda (VPC-enabled), RDS Proxy
    │
[Private DB Subnet]     Aurora PostgreSQL (Multi-AZ)
```

- Lambda는 VPC에 연결하여 RDS Proxy 및 VPC 엔드포인트에만 접근하며 인터넷에 직접 노출되지 않습니다.
- Aurora는 프라이빗 DB 서브넷에만 배치하며 RDS Proxy를 통해서만 접근합니다.
- AWS 서비스(KMS, Secrets Manager 등) 접근은 모두 VPC 엔드포인트를 통해 VPC 내부에서 처리합니다.
- NAT Gateway는 외부 전자서명 솔루션 API 호출 시 아웃바운드 경로로만 사용하며, 인바운드 인터넷 트래픽은 허용하지 않습니다.

#### VPC 엔드포인트 전략

인터넷을 경유하지 않고 AWS 서비스에 접근하기 위해 VPC 엔드포인트를 사용합니다. PHI 관련 데이터와 자격증명이 VPC 외부로 노출되지 않도록 합니다.

| 서비스 | 엔드포인트 타입 | 용도 |
|--------|--------------|------|
| Amazon S3 | Gateway | 로그 저장, PHI 문서 저장 |
| Amazon DynamoDB | Gateway | 테넌트 상태 및 이력 저장 |
| AWS KMS | Interface | 암호화·복호화·서명 |
| AWS Secrets Manager | Interface | DB 자격증명 런타임 조회 |
| Amazon CloudWatch Logs | Interface | Lambda 로그 전송 |
| AWS SSM | Interface | Runbook 실행, 파라미터 조회 |
| AWS STS | Interface | IAM Role AssumeRole |
| AWS Lambda | Interface | Lambda → Lambda 내부 호출 |

::: tip
Gateway 엔드포인트(S3, DynamoDB)는 추가 비용 없이 사용할 수 있습니다. Interface 엔드포인트는 시간당 요금이 발생하지만, PHI 데이터가 인터넷을 경유하지 않도록 하는 보안 요구사항을 만족하기 위해 필수적으로 적용합니다.
:::

#### 보안 그룹 설계

최소 권한 원칙에 따라 각 레이어 간 트래픽을 명시적으로 허용합니다.

| 보안 그룹 | 인바운드 허용 | 아웃바운드 허용 |
|-----------|-------------|--------------|
| Lambda SG | API Gateway (관리형, VPC 외부) | RDS Proxy SG 5432, VPC Endpoint SG 443 |
| RDS Proxy SG | Lambda SG 5432 | Aurora SG 5432 |
| Aurora SG | RDS Proxy SG 5432 | 없음 |
| VPC Endpoint SG | Lambda SG 443 | 없음 |

#### NACL 설계

보안 그룹과 함께 NACL을 이중 방어선으로 적용합니다.

| 서브넷 | 인바운드 허용 | 아웃바운드 허용 |
|--------|-------------|--------------|
| Private App Subnet | VPC 내부 (API Gateway 트리거는 관리형) | VPC 내부, 임시 포트 |
| Private DB Subnet | Private App Subnet 5432만 | Private App Subnet 임시 포트 |

## 핵심 애플리케이션 흐름

애플리케이션 아키텍처의 주요 구성 요소는 다음과 같습니다. 

| AWS 서비스 | 역할 |
|-----------|------|
| Amazon CloudFront | 정적 콘텐츠 전달 |
| Amazon S3 | 정적 웹 호스팅, 문서 저장 |
| AWS WAF | 웹 애플리케이션 방화벽 |
| Amazon Cognito | 사용자 인증 |
| Amazon API Gateway | API 진입점 |
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
| DDoS 방어 | AWS Shield Advanced | CloudFront·API Gateway 레이어 DDoS 차단 |
| 구성 모니터링 | AWS Config | 구성 드리프트 탐지 |
| 이상 탐지 집계 | AWS Security Hub | 보안 결과 중앙화 |
| PHI 자동 탐지 | Amazon Macie | S3 내 민감 데이터 식별 및 분류 |
| 취약점 스캔 | AWS Inspector | Lambda 함수 및 패키지 취약점 자동 평가 |
| 백업 및 복구 | AWS Backup | Aurora·S3 백업 정책 중앙 관리, 복구 검증 |
| 로그 불변성 | S3 Object Lock | 감사 로그 변조 방지 |


<!-- 작성 예정: 보안 다이어그램 -->