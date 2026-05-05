---
title: ADR-004. Schema-per-Tenant vs Row-Level Security
---

# ADR-004. Schema-per-Tenant vs Row-Level Security

## 상태

제안됨

## 컨텍스트

데이터베이스 레이어에서 테넌트 격리를 구현하는 방법으로 여러 전략이 있습니다. 특히 Amazon Aurora PostgreSQL 환경에서 Schema-per-Tenant 모델과 Row-Level Security(RLS) 중 어떤 접근법을 기본 격리 전략으로 채택할지, 그리고 두 가지를 어떻게 조합할지 결정해야 합니다.

<!-- 작성 예정: PostgreSQL 스키마 구조, RLS 정책, 커넥션 풀링 관련 내용 -->

## 결정

<!-- 작성 예정: 선택된 데이터베이스 격리 전략 -->

**초안:** Schema-per-Tenant를 기본 격리 전략으로 채택하고, RLS는 심층 방어(defense-in-depth) 메커니즘으로 추가 적용합니다.

## 고려된 대안

| 대안 | 격리 수준 | 운영 복잡도 | 비용 |
|------|-----------|------------|------|
| 완전 공유 테이블 (tenant_id 컬럼) | 낮음 | 낮음 | 낮음 |
| Schema-per-Tenant | 중간-높음 | 중간 | 낮음-중간 |
| Database-per-Tenant | 높음 | 높음 | 높음 |
| RLS 단독 | 중간 | 중간 | 낮음 |
| Schema-per-Tenant + RLS (심층 방어) | 높음 | 중간-높음 | 낮음-중간 |

## 근거

<!-- 작성 예정: 근거 상세 -->

Schema-per-Tenant는 PostgreSQL 네이티브 기능을 활용하여 상대적으로 강한 격리를 제공하면서도 Database-per-Tenant보다 비용 효율적입니다. RLS를 추가하면 서비스 레이어 버그 발생 시에도 데이터베이스 레이어에서 추가 방어가 가능합니다.

## 보안 함의

- 서비스 레이어는 항상 올바른 테넌트 스키마 컨텍스트에서 쿼리를 실행해야 함
- RLS 정책은 PostgreSQL `current_setting`으로 테넌트 컨텍스트를 읽도록 설계
- 커넥션 풀링 시 테넌트 컨텍스트 혼용 위험 주의 (search_path, session variable 관리)

## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 데이터 보호 | 테넌트 간 PHI 격리 |
| 접근 제어 | 데이터베이스 레이어 접근 제어 |

## 미해결 질문

- RDS Proxy 사용 시 커넥션 풀링과 schema-per-tenant의 세션 변수 관리 방법
- 테넌트 스키마 마이그레이션 자동화 전략 (새 테넌트 온보딩 시)
- RLS 정책이 복잡한 쿼리에서 성능에 미치는 영향
