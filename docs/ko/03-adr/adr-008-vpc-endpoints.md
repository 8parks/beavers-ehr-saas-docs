---
title: ADR-008. 프라이빗 연결 및 VPC 엔드포인트
---

# ADR-008. 프라이빗 연결 및 VPC 엔드포인트

## 상태

제안됨

## 컨텍스트

Lambda, RDS, KMS, S3, Secrets Manager, SSM 등 AWS 서비스 간 통신이 인터넷을 경유하지 않고 AWS 내부 네트워크를 통해 이루어지도록 설계해야 합니다. VPC 엔드포인트 전략과 프라이빗 서브넷 설계를 어떻게 구성할지 결정해야 합니다.

<!-- 작성 예정: VPC 엔드포인트 유형(Interface vs Gateway), 비용 고려사항 -->

## 결정

<!-- 작성 예정: 선택된 VPC 엔드포인트 전략 -->

**초안:** 핵심 AWS 서비스(KMS, Secrets Manager, SSM, S3, CloudWatch)에 대해 VPC Interface Endpoint를 구성하고, Lambda를 VPC 내 프라이빗 서브넷에 배치합니다.

## 고려된 대안

| 대안 | 설명 |
|------|------|
| NAT Gateway 경유 | 모든 AWS API 호출이 인터넷 경유 |
| VPC Interface Endpoints | AWS 내부 네트워크 경유, 프라이빗 연결 |
| VPC Gateway Endpoints (S3, DynamoDB) | 무료, 라우팅 테이블 기반 |

## 근거

<!-- 작성 예정: 근거 상세 -->

## 보안 함의

- VPC Endpoint Policy로 엔드포인트 수준 접근 제어 추가 가능
- Lambda → RDS 연결은 VPC 내 프라이빗 서브넷에서만 허용
- 보안 그룹으로 서비스 간 최소 필요 포트만 허용
- VPC Flow Logs 활성화로 네트워크 트래픽 가시성 확보

## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 네트워크 보안 | VPC 프라이빗 연결, 엔드포인트 정책 |
| 데이터 전송 보호 | AWS 내부 네트워크 경유로 전송 노출 최소화 |

## 미해결 질문

- VPC Interface Endpoint 비용이 소규모 환경에서 적절한지 평가
- Multi-AZ 환경에서 VPC Endpoint 고가용성 설계
- VPC Endpoint Policy와 IAM 정책 간의 조합 설계
