---
title: "시나리오: 감사 로그 수집 & 무결성 검증"
---

# 시나리오: 감사 로그 수집 & 무결성 검증

## 1. 비즈니스 로직 정의

EHR 플랫폼에서 발생하는 주요 이벤트(PHI 접근, 관리자 활동, 보안 이벤트)를 수집하고, 로그의 무결성을 보장하며, 장기 보존하는 흐름입니다.

## 2. 보안 목표

- 주요 보안 및 애플리케이션 이벤트가 빠짐없이 기록되어야 합니다.
- 감사 로그는 변조가 불가능해야 합니다.
- 로그는 규정에서 요구하는 기간 동안 보존되어야 합니다.
- 로그 분석이 가능해야 합니다.

## 3. 감사 이벤트 유형

| 이벤트 유형 | 소스 | 수집 방법 |
|------------|------|---------|
| AWS API 호출 | 모든 AWS 서비스 | AWS CloudTrail |
| 애플리케이션 이벤트 | Lambda, 애플리케이션 | Amazon CloudWatch Logs |
| PHI 접근 이벤트 | Lambda 애플리케이션 | CloudWatch Logs (구조화 로그) |
| 보안 이상 탐지 | AWS Config, Security Hub | Security Hub 결과 |
| 데이터베이스 활동 | RDS/Aurora | RDS 감사 로그 (옵션) |

## 4. 아키텍처 흐름

<!-- 작성 예정 -->

```
CloudTrail + CloudWatch Logs
         ↓
     Amazon S3 (Object Lock)
         ↓
   Amazon Athena (분석)
```

## 5. 로그 무결성 메커니즘

| 메커니즘 | AWS 서비스 | 설명 |
|---------|-----------|------|
| WORM 불변성 | S3 Object Lock | 보존 기간 전 삭제/수정 불가 |
| 암호화 | KMS | 미사용 로그 암호화 |
| CloudTrail 로그 파일 검증 | CloudTrail | 로그 파일 해시 검증 |
| 로그 비활성화 탐지 | AWS Config, CloudWatch | CloudTrail 비활성화 시 알람 |

## 6. 보안 컨트롤

| 컨트롤 | 구현 방법 | 관련 위협 |
|--------|---------|---------|
| 로그 불변성 | S3 Object Lock Compliance 모드 | T-003 로그 수정/삭제 |
| 로그 암호화 | KMS CMK | 로그 무단 접근 |
| 로그 비활성화 탐지 | AWS Config 규칙 | T-010 CloudTrail 비활성화 |

## 7. 컴플라이언스 매핑

| 요구사항 범주 | 설계 대응 |
|--------------|---------|
| 감사 추적성 | CloudTrail, CloudWatch, S3 |
| 데이터 무결성 | S3 Object Lock, CloudTrail 검증 |
| 데이터 보존 | S3 Object Lock 보존 정책 |

## 8. 설계 체크리스트

- [ ] CloudTrail이 모든 AWS 계정 및 리전에서 활성화되어 있습니다.
- [ ] 로그 버킷에 S3 Object Lock이 적용되어 있습니다.
- [ ] 로그 버킷에 공개 접근 차단이 적용되어 있습니다.
- [ ] CloudTrail 로그 파일 검증이 활성화되어 있습니다.
- [ ] CloudTrail 비활성화 시 CloudWatch 알람이 발생합니다.
- [ ] AWS Config 규칙이 로그 구성 준수 여부를 지속 평가합니다.
- [ ] Athena를 통한 로그 쿼리 접근 권한이 제한되어 있습니다.

## 9. 미해결 질문

- 규정 요구 최소 보존 기간 (법률 검토 필요)
- 보존 기간 만료 후 자동 삭제 정책
- 감사자 역할의 로그 조회 권한 범위
