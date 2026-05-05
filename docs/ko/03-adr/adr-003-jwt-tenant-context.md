---
title: ADR-003. JWT 기반 테넌트 컨텍스트 및 인가
---

# ADR-003. JWT 기반 테넌트 컨텍스트 및 인가

## 상태

제안됨

## 컨텍스트

멀티 테넌트 시스템에서 API 요청마다 테넌트 컨텍스트와 사용자 역할을 안전하게 전달하고 검증해야 합니다. Amazon Cognito를 통한 인증 후, 서비스 레이어에서 어떻게 테넌트 컨텍스트를 처리할 것인지 결정해야 합니다.

<!-- 작성 예정: Cognito User Pool, Custom Claims, API Gateway Authorizer 연관성 -->

## 결정

<!-- 작성 예정: 선택된 JWT 기반 테넌트 컨텍스트 설계 -->

**초안:** Cognito JWT 토큰의 Custom Attribute로 `tenant_id`와 `role` 클레임을 포함하고, Lambda Authorizer 또는 서비스 레이어에서 이를 검증합니다.

## 고려된 대안

| 대안 | 설명 |
|------|------|
| 요청 헤더로 tenant_id 전달 | 클라이언트가 tenant_id를 헤더에 포함 (위변조 가능) |
| JWT Custom Claims | Cognito 발급 JWT에 tenant_id, role 포함 (권장) |
| 별도 세션 서비스 | 별도 서비스에서 세션/컨텍스트 관리 |

## 근거

<!-- 작성 예정: 근거 상세 -->

## 보안 함의

- JWT는 서명 검증을 통해 위변조 감지 가능
- 서비스 레이어에서 JWT 클레임 유효성 검증 필수
- 토큰 만료, 취소(revocation) 메커니즘 설계 필요
- 로그에 tenant_id 포함 시 PHI 로깅 여부 주의

## 컴플라이언스 매핑

| 요구사항 범주 | 관련 설계 결정 |
|--------------|--------------|
| 인증 | Cognito 기반 안전한 인증 |
| 접근 제어 | JWT 클레임 기반 테넌트/역할 인가 |

## 미해결 질문

- Cognito Custom Attribute와 User Pool 그룹 중 어느 것을 역할 관리에 사용할 것인가?
- JWT 토큰 만료 시간 정책 (짧은 만료 + 리프레시 토큰 전략)
- 토큰 취소(revocation) 시나리오 처리 방법
