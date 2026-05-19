---
title: "S6. 운영자 비상 접근 (Break-glass)"
---
# S6. 운영자 비상 접근 (Break-glass)

장애, 보안 사고, 긴급 운영 상황에서 SaaS 운영자가 예외적으로 Tenant 내부 데이터에 접근해야 하는 경우를 다룹니다. SaaS 운영자가 Tenant 내부 의료 데이터에 직접 접근하지 않는 것이 기본 원칙이며, 이를 Tenant별 KMS 키 기반 암호화와 CloudTrail 로그로 증빙합니다. 모든 Break-glass 접근은 MFA 재인증, 접근 사유 입력, 임시 권한, 시간 제한, 별도 감사 로그, 관리자 알림, 사후 리뷰를 필수 조건으로 합니다.

| 항목 | 내용 |
|---|---|
| 주 사용 역할 | SaaS 운영자 |
| 핵심 데이터 | 해당 Tenant 내부 데이터(접근 범위 내), 임시 자격증명, Break-glass 감사 로그 |


## 1. 비즈니스 흐름

SaaS 운영자는 인프라 접근 권한을 보유하지만, Tenant 내부 의료 데이터에는 직접 접근하지 않는 것이 기본 가정입니다. 내부자 위협 및 권한 오남용 가능성에 대비한 별도 통제를 적용합니다.

**서비스 흐름**

긴급 상황 발생 → Break-glass 접근 요청(사유 입력) → MFA 재인증 → 승인자 승인 또는 사후 보고 트리거 → AWS STS 임시 자격증명 발급(TTL 설정, 최소 범위 IAM Role) → 긴급 작업 수행 → 모든 행위 별도 감사 채널 실시간 기록 → TTL 만료 또는 수동 세션 종료 → 사후 보고서 제출 및 리뷰

**세부 설명**

- Break-glass 접근 흐름: 긴급 상황 선언 → Break-glass 접근 요청 → MFA 재인증 → 사전 승인 또는 사후 보고 트리거 → TTL이 설정된 임시 자격증명 발급 → 필요 범위 내 접근 수행 → 모든 행위 실시간 감사 로그 기록 → 작업 완료 후 자격증명 즉시 회수 → 사후 보고서 작성
- 감사 로그 분리:
  - Break-glass 접근 로그는 일반 CloudTrail·CloudWatch와 분리된 별도 Log Group에 기록
  - 운영자 자신이 해당 로그를 수정하거나 삭제할 수 없도록 저장소 쓰기 권한 분리
  - S3 Object Lock Compliance Mode 적용으로 로그 위변조 방지

<!-- 작성 예정: 아키텍처 흐름 다이어그램 -->


## 2. 보안 목표

- 평시에는 SaaS 운영자가 Tenant 내부 의료 데이터에 직접 접근 불가(KMS 키 암호화 + 접근 로그로 증빙)
- Break-glass Access는 기본 금지, 아래 적용 상황에 한해 제한적 허용
- MFA 재인증 필수
- 접근 사유 입력 필수
- 임시 권한 부여 + 시간 제한(TTL) 설정
- 최소 범위 접근(필요한 Tenant 작업 범위에만 국한)
- 일반 감사 로그와 분리된 별도 채널에 실시간 기록
- 병원 관리자에게 즉시 알림
- 사후 보고서 작성 및 검토 의무화
- 반복 사용 또는 이상 접근 패턴 탐지


## 3. 보안 설계

**기본 금지 원칙**

Break-glass Access는 기본적으로 금지하는 것을 원칙으로 하며, 응급 진료/장애 대응/보안 사고 조사와 같이 환자 안전 또는 서비스 연속성에 영향을 미치는 상황에서만 제한적으로 허용합니다. 평상시 운영자의 Tenant 내부 데이터 접근 불가 사실은 Tenant별 KMS CMK 기반 암호화와 CloudTrail 로그로 증빙합니다.

**강한 인증 + 임시 권한**

Break-glass 접근 전 MFA 재인증을 필수로 요구합니다. AWS STS를 통해 TTL이 설정된 임시 자격증명을 발급하며, Break-glass 전용 IAM Role은 긴급 상황과 관련된 Tenant와 작업 범위에만 접근을 허용하는 최소 권한 정책을 적용합니다. TTL 만료 즉시 자격증명이 회수되며, 작업 완료 시 수동으로도 세션을 종료할 수 있습니다.

**별도 감사 채널 분리**

Break-glass 접근 로그는 일반 CloudTrail·CloudWatch와 분리된 별도 Log Group에 기록합니다. 운영자 자신이 해당 로그를 수정하거나 삭제할 수 없도록 저장소 쓰기 권한을 분리하며, S3 Object Lock Compliance Mode를 적용하여 보존 기간 내 로그 위변조를 방지합니다.

**즉시 알림 + 사후 리뷰 의무화**

Break-glass 접근 발생 즉시 관리자에게 알림을 발송합니다. 모든 Break-glass 접근은 사후 보고서 작성과 리뷰를 의무화하며, 정당한 사유 없는 접근이 확인되면 징계 또는 조사 절차로 연계합니다.


## 4. 보안 통제 및 규제
<!-- 작성 예정: 규제 링크 연결 -->

| 통제 항목 | 수단 | 규제 |
|---|---|---|
| 강한 인증 | MFA 재인증(Cognito), 접근 사유 입력 필수 | |
| 임시 권한 | AWS STS 임시 자격증명(TTL 설정), Break-glass 전용 IAM Role(최소 범위) | |
| 별도 감사 채널 | Break-glass 전용 CloudWatch Log Group(쓰기 권한 분리), S3 Object Lock Compliance Mode(로그 위변조 방지) | |
| 실시간 기록 | CloudTrail(모든 API 호출), Break-glass Log Group(행위 이력) | |
| 즉시 알림 | EventBridge → SNS → Slack/이메일(관리자·보안 담당자) | |
| 이상 탐지 | CloudWatch Metric Filter(Break-glass 접근 빈도 모니터링), GuardDuty(이상 인증 패턴 탐지) | |
| 사후 리뷰 | 사후 보고서 의무화, 반복 사용 시 징계·조사 절차 연계 | |

## 5. 보안 체크리스트

- [ ] Break-glass 접근 전 MFA 재인증이 필수로 요구됩니다.
- [ ] 접근 사유 입력이 필수입니다.
- [ ] AWS STS 임시 자격증명에 TTL이 설정됩니다.
- [ ] Break-glass 전용 IAM Role이 최소 권한 정책으로 구성됩니다.
- [ ] Break-glass 로그가 일반 CloudTrail·CloudWatch와 분리된 별도 Log Group에 기록됩니다.
- [ ] 운영자가 Break-glass 로그를 수정·삭제할 수 없도록 쓰기 권한이 분리됩니다.
- [ ] Break-glass 로그에 S3 Object Lock Compliance Mode가 적용됩니다.
- [ ] Break-glass 접근 발생 즉시 관리자에게 알림이 발송됩니다.
- [ ] 모든 Break-glass 접근에 사후 보고서 작성과 리뷰가 의무화됩니다.
- [ ] 정당한 사유 없는 접근 확인 시 징계·조사 절차로 연계됩니다.