---
title: 멀티테넌트 설계 전략
---

# 멀티테넌트 설계 전략

본 섹션은 멀티 테넌트 환경의 아키텍처를 설계하는 데 있어 고려했던 각 설계 영역별 핵심 결정 사항과 그 근거를 정리합니다.

## 설계 전략 목록

| 섹션 | 다루는 내용 |
|------|-----------|
| [멀티테넌트 전략](./multitenant-strategy) | Schema-per-Tenant, RLS, 테넌트 컨텍스트 전파 |
| [인증 / 인가 전략](./auth-strategy) | JWT Claim, RBAC/ABAC, Trust Boundary |
| [데이터 및 스토리지 전략](./data-storage-strategy) | 테넌트 데이터 분리, 연구 데이터셋, 가명처리 |
| [로깅 및 감사 전략](./logging-strategy) | 로그 무결성, 보존 정책, 통합 감사 |
| [운영 및 라이프사이클 전략](./operations-strategy) | 프로비저닝, 데이터 파기, Break-glass |
