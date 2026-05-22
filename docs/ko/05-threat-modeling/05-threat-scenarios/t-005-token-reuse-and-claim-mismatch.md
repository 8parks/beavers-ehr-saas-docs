---
title: T-05 인증 토큰 재사용 및 Claim 불일치
outline: [2, 4]
---

# T-05 인증 토큰 재사용 및 Claim 불일치

## 위협 개요

| 항목 | 내용 |
|------|------|
| 위험도 | 높음 |
| 관련 워크로드 | `S1`, `S2`, `S3`, `S6` |
| 관련 자산 | `A-06`, `A-10` |
| 관련 경계 | `TB-01`, `TB-02`, `TB-07` |
| 대표 행위자 | 탈취된 토큰 사용 주체, 오프보딩 대상 사용자, 역할 변경 직후 사용자 |

인증 토큰 자체가 정상 발급되었더라도, 계정 상태와 claim 일관성이 깨진 상태에서 계속 사용되면 중대한 권한 우회가 발생합니다.

## 검토 대상

- Cognito user pool authorizer와 API Gateway route별 scope 설정
- Pre Token Generation trigger 또는 동등한 claim 조정 경로
- Cognito claim의 tenant, role, tenant type, group 속성과 `scope`
- 환자 조회, 진료 기록 조회, 진료 기록 생성, 데이터셋 요청, 데이터셋 승인, 데이터셋 생성 애플리케이션 함수
- 계정 비활성화, 역할 변경, tenant suspend 시 세션 회수 절차

## 공격 성립 조건

- access token과 ID token을 혼용함.
- token TTL이 길고 revocation 전략이 없음.
- role claim, tenant type claim, group claim, `scope` 간 불일치가 허용됨.
- 사용자 비활성화, tenant suspend, 역할 변경 후 세션 무효화가 즉시 수행되지 않음.

## 위협 시나리오

1. 사용자가 정상적으로 발급된 access token 또는 refresh token을 보유한 상태에서 병원 이동, 역할 변경, 계정 비활성화, tenant 중지 조치를 받음.
2. 토큰 회수나 세션 무효화가 즉시 수행되지 않거나, route authorizer가 ID token과 access token을 혼용해 처리함.
3. Lambda가 `tenant_id`, `tenant_type`, `role`, `group`, `scope`의 정합성을 다시 확인하지 않으면 예전 권한이 그대로 남음.
4. 사용자는 이미 회수되어야 할 차트 조회, 기록 작성, 데이터셋 요청·승인·생성 경로를 계속 호출할 수 있게 됨.

## 필수 예방 사항

- authorizer는 access token과 필요한 scope만 허용해야 합니다.
- Lambda는 `tenant_id`, `tenant_type`, `role`, `group`, `scope`의 일관성을 재검증해야 합니다.
- 계정 비활성화와 역할 변경 시 세션 폐기 절차를 반드시 수행해야 합니다.
- break-glass 또는 비상 계정은 일반 사용자와 별도 token 정책을 사용해야 합니다.

## 필수 탐지 사항

- 만료 또는 회수된 토큰 재사용 시도를 경보화합니다.
- 동일 계정의 비정상 위치, 비정상 단말, 비정상 시간대 접근을 탐지합니다.
- 오프보딩 대상 계정의 API 호출이 계속되는지 모니터링합니다.

## 대응 요구사항

- 관련 사용자 세션과 refresh token을 전면 무효화합니다.
- role/group/claim 동기화 경로를 점검합니다.
- 이미 수행된 조회, 수정, 생성 범위를 조사합니다.

## 검증 기준

- user disable, role change, tenant suspend 후 기존 token이 실제로 차단되어야 합니다.
- claim 불일치 토큰은 authorizer 또는 Lambda 중 최소 한 단계에서 반드시 거부되어야 합니다.
- 비상 회수 시나리오가 runbook으로 존재해야 합니다.

특히 `access token`과 `ID token`의 혼용은 구현상 자주 발생하는 오류입니다. route authorizer가 scope를 검증한다는 사실만으로 충분하지 않으며, Lambda 단계에서도 `tenant_id`, `tenant_type`, `role`, `group`의 정합성을 다시 확인해야 합니다.

## 운영 점검 항목 및 주기

| 증빙 항목 | 최소 내용 | 주기 |
|----------|----------|------|
| route-scope 설정 증빙 | 각 API route의 authorizer, scope, 허용 token type 설정 | 매 릴리스 |
| 계정 상태 회귀 테스트 | user disable, role change, tenant suspend 후 기존 세션 차단 결과 | 매 릴리스 |
| claim coherence 테스트 | 불일치하는 role/group/scope/tenant_type 조합에 대한 차단 결과 | 매 릴리스 |
| 세션 회수 절차 증빙 | refresh token 회수, 강제 로그아웃, incident 시 전면 무효화 절차 | 분기별 점검 |
