---
title: 아키텍처 결정 기록 (ADR)
---

# 아키텍처 결정 기록 (ADR)

> 주요 아키텍처 결정과 트레이드오프를 문서화합니다.

각 ADR은 다음 구조를 따릅니다: 상태 → 컨텍스트 → 결정 → 대안 → 근거 → 보안 함의 → 컴플라이언스 매핑 → 미해결 질문

## ADR 목록

| ADR | 제목 | 상태 |
|-----|------|------|
| [ADR-001](./adr-001-tenant-isolation) | 테넌트 격리 전략 | 제안됨 |
| [ADR-002](./adr-002-account-separation) | 계정 분리 전략 | 제안됨 |
| [ADR-003](./adr-003-jwt-tenant-context) | JWT 기반 테넌트 컨텍스트 및 인가 | 제안됨 |
| [ADR-004](./adr-004-schema-per-tenant-vs-rls) | Schema-per-Tenant vs Row-Level Security | 제안됨 |
| [ADR-005](./adr-005-audit-log-integrity) | 감사 로그 보존 및 무결성 | 제안됨 |
| [ADR-006](./adr-006-kms-signing) | KMS 기반 서명 및 암호화 전략 | 제안됨 |
| [ADR-007](./adr-007-security-automation) | AWS Config, Security Hub, SSM 보안 자동화 | 제안됨 |
| [ADR-008](./adr-008-vpc-endpoints) | 프라이빗 연결 및 VPC 엔드포인트 | 제안됨 |
| [ADR-009](./adr-009-pseudonymization) | 연구 데이터셋 생성 및 가명처리 | 제안됨 |
| [ADR-010](./adr-010-account-separation) | 관리 계정과 애플리케이션 계정 분리 | 제안됨 |

## ADR 템플릿

```markdown
# ADR-XXX. 제목

## 상태
제안됨 / 채택됨 / 검토 필요

## 컨텍스트
문제와 이 결정이 필요한 이유를 설명합니다.

## 결정
선택된 설계 결정을 설명합니다.

## 고려된 대안
대안 설계 목록을 나열합니다.

## 근거
이 결정을 선택한 이유를 설명합니다.

## 보안 함의
이 결정이 보안에 미치는 영향을 설명합니다.

## 컴플라이언스 매핑
이 결정이 지원하는 컴플라이언스/보안 요구사항을 설명합니다.

## 미해결 질문
해결되지 않은 기술적, 법적, 운영적 질문을 나열합니다.
```
