---
title: ADR 개요 및 작성 원칙
---

# ADR 개요 및 작성 원칙

아키텍처 결정 기록(ADR)은 "왜 이렇게 설계했는가"를 남기는 문서입니다. 코드는 현재 상태를 보여주지만, ADR은 그 결정에 이르기까지의 고민과 트레이드오프를 설명합니다.

이 프로젝트에서는 개별 ADR 파일 대신, 주제별로 묶어서 결정을 정리합니다.

## 주제별 ADR 목록

| 섹션 | 다루는 내용 |
|------|-----------|
| [멀티테넌트 전략](./multitenant-strategy) | Schema-per-Tenant, RLS, 테넌트 컨텍스트 전파 |
| [인증 / 인가 전략](./auth-strategy) | JWT Claim, RBAC/ABAC, Trust Boundary |
| [데이터 및 스토리지 전략](./data-storage-strategy) | 테넌트 데이터 분리, 연구 데이터셋, 가명처리 |
| [로깅 및 감사 전략](./logging-strategy) | 로그 무결성, 보존 정책, 통합 감사 |
| [운영 및 라이프사이클 전략](./operations-strategy) | Provisioning, 데이터 파기, Break-glass |

## ADR 작성 원칙

각 결정은 다음 구조를 따릅니다.

- **상태** — 제안됨 / 채택됨 / 검토 필요
- **컨텍스트** — 왜 이 결정이 필요한가
- **결정** — 무엇을 선택했는가
- **고려된 대안** — 다른 선택지는 무엇이었는가
- **근거** — 왜 이것을 선택했는가
- **보안 함의** — 이 결정이 보안에 미치는 영향
- **컴플라이언스 매핑** — 어떤 규제 요구사항과 연결되는가
- **미해결 질문** — 아직 답이 없는 것들

## 개별 ADR 파일

더 세부적인 내용은 기존 개별 ADR 파일을 참고할 수 있습니다.

| ADR | 제목 |
|-----|------|
| [ADR-001](./adr-001-tenant-isolation) | 테넌트 격리 전략 |
| [ADR-002](./adr-002-account-separation) | 계정 분리 전략 |
| [ADR-003](./adr-003-jwt-tenant-context) | JWT 기반 테넌트 컨텍스트 |
| [ADR-004](./adr-004-schema-per-tenant-vs-rls) | Schema-per-Tenant vs RLS |
| [ADR-005](./adr-005-audit-log-integrity) | 감사 로그 보존 및 무결성 |
| [ADR-006](./adr-006-kms-signing) | KMS 서명 및 암호화 전략 |
| [ADR-007](./adr-007-security-automation) | 보안 자동화 |
| [ADR-008](./adr-008-vpc-endpoints) | VPC 엔드포인트 |
| [ADR-009](./adr-009-pseudonymization) | 연구 데이터셋 및 가명처리 |
| [ADR-010](./adr-010-account-separation) | 관리 계정 분리 |
