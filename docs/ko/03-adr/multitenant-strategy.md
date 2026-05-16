---
title: 3.2 멀티테넌트 전략
---

# 멀티테넌트 전략

여러 병원이 같은 플랫폼을 쓰면서도 서로의 데이터에 접근할 수 없도록 하는 게 이 설계의 핵심입니다. 여기서는 데이터베이스 격리 방식과 테넌트 컨텍스트 전파 방식에 대한 결정을 정리합니다.

## Schema-per-Tenant 채택

<!-- 작성 예정 -->

관련 ADR: [ADR-001](./adr-001-tenant-isolation), [ADR-004](./adr-004-schema-per-tenant-vs-rls)

## Row-Level Security 적용

<!-- 작성 예정 -->

관련 ADR: [ADR-004](./adr-004-schema-per-tenant-vs-rls)

## Tenant Context 전파 방식

<!-- 작성 예정 -->

관련 ADR: [ADR-003](./adr-003-jwt-tenant-context)
