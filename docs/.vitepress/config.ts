import { defineConfig } from 'vitepress'

const koSidebar = [
  {
    text: '시작하기',
    items: [
      { text: '개요', link: '/ko/' },
      { text: '시스템 컨텍스트 & 가정', link: '/ko/01-system-context' },
      { text: '레퍼런스 아키텍처', link: '/ko/02-reference-architecture' },
    ],
  },
  {
    text: '시나리오 기반 보안 설계',
    items: [
      { text: '시나리오 카탈로그', link: '/ko/02-scenarios/' },
      {
        text: '비즈니스 시나리오',
        collapsed: false,
        items: [
          { text: 'S1. 환자 진료 기록 작성', link: '/ko/02-scenarios/patient-record-creation' },
          { text: 'S2. 환자 진료 기록 조회', link: '/ko/02-scenarios/patient-record-retrieval' },
          { text: 'S3. 연구 데이터셋 생성', link: '/ko/02-scenarios/research-dataset-generation' },
        ],
      },
      {
        text: '운영 시나리오',
        collapsed: false,
        items: [
          { text: 'S4. Tenant 온보딩', link: '/ko/02-scenarios/s4-tenant-onboarding' },
          { text: 'S5. Tenant 오프보딩', link: '/ko/02-scenarios/s5-tenant-offboarding' },
        ],
      },
      {
        text: '비상 / 장애 대응',
        collapsed: false,
        items: [
          { text: 'S6. 운영자 비상 접근 (Break-glass)', link: '/ko/02-scenarios/s6-break-glass' },
          { text: 'S7. 데이터베이스 장애 및 복구', link: '/ko/02-scenarios/s7-db-recovery' },
        ],
      },
    ],
  },
  {
    text: '멀티테넌트 설계 전략 (ADR)',
    items: [
      { text: 'ADR 개요 및 작성 원칙', link: '/ko/03-adr/' },
      { text: '멀티테넌트 전략', link: '/ko/03-adr/multitenant-strategy' },
      { text: '인증 / 인가 전략', link: '/ko/03-adr/auth-strategy' },
      { text: '데이터 및 스토리지 전략', link: '/ko/03-adr/data-storage-strategy' },
      { text: '로깅 및 감사 전략', link: '/ko/03-adr/logging-strategy' },
      { text: '운영 및 라이프사이클 전략', link: '/ko/03-adr/operations-strategy' },
    ],
  },
  {
    text: '컴플라이언스',
    items: [
      { text: '적용 규제 범위', link: '/ko/04-compliance#적용-규제-범위' },
      { text: '책임 공유 및 계약 범위', link: '/ko/04-compliance#책임-공유-및-계약-범위' },
      { text: '통제 영역별 매핑', link: '/ko/04-compliance#통제-영역별-매핑' },
      { text: '보안 요구사항 총정리', link: '/ko/04-compliance#보안-요구사항-총정리' },
    ],
  },
  {
    text: '위협 모델링',
    items: [
      { text: '개요', link: '/ko/05-threat-modeling/' },
      { text: '보안 목표', link: '/ko/05-threat-modeling/01-security-objectives' },
      { text: '위협 모델링 방법론', link: '/ko/05-threat-modeling/02-methodology' },
      { text: '자산 식별', link: '/ko/05-threat-modeling/03-assets' },
      { text: '신뢰 경계', link: '/ko/05-threat-modeling/04-trust-boundaries' },
      { text: '위협 시나리오 카탈로그', link: '/ko/05-threat-modeling/05-threat-scenarios/' },
      { text: 'T-01 Cross-Tenant Access', link: '/ko/05-threat-modeling/05-threat-scenarios/t-001-cross-tenant-access' },
      { text: 'T-02 동일 테넌트 내부 권한 상승', link: '/ko/05-threat-modeling/05-threat-scenarios/t-002-intra-tenant-privilege-escalation' },
      { text: 'T-03 의료 기록 무단 수정 및 전자서명 우회', link: '/ko/05-threat-modeling/05-threat-scenarios/t-003-record-tampering-and-signature-bypass' },
      { text: 'T-04 Presigned URL 및 객체 경로 남용', link: '/ko/05-threat-modeling/05-threat-scenarios/t-004-presigned-url-and-object-path-abuse' },
      { text: 'T-05 인증 토큰 재사용 및 Claim 불일치', link: '/ko/05-threat-modeling/05-threat-scenarios/t-005-token-reuse-and-claim-mismatch' },
      { text: 'T-06 재식별 공격', link: '/ko/05-threat-modeling/05-threat-scenarios/t-006-re-identification-attack' },
      { text: 'T-07 비밀정보 및 자격증명 노출', link: '/ko/05-threat-modeling/05-threat-scenarios/t-007-secret-and-credential-exposure' },
      { text: 'T-08 KMS 권한 남용', link: '/ko/05-threat-modeling/05-threat-scenarios/t-008-kms-privilege-abuse' },
      { text: 'T-09 Break-glass 남용', link: '/ko/05-threat-modeling/05-threat-scenarios/t-009-break-glass-misuse' },
      { text: 'T-10 감사 증적 상실', link: '/ko/05-threat-modeling/05-threat-scenarios/t-010-audit-evidence-loss' },
      { text: 'T-11 tenant_registry 오염 및 온보딩 오류', link: '/ko/05-threat-modeling/05-threat-scenarios/t-011-tenant-registry-corruption-and-provisioning-error' },
      { text: 'T-12 오프보딩 실패 및 잔존 접근', link: '/ko/05-threat-modeling/05-threat-scenarios/t-012-offboarding-failure-and-residual-access' },
      { text: 'T-13 데이터베이스 장애 및 복구 시 격리 붕괴', link: '/ko/05-threat-modeling/05-threat-scenarios/t-013-db-failure-and-recovery-isolation-breakdown' },
      { text: 'T-14 PHI 유출 사고 대응 실패', link: '/ko/05-threat-modeling/05-threat-scenarios/t-014-phi-incident-response-failure' },
      { text: '위협별 대응 전략', link: '/ko/05-threat-modeling/06-mitigations' },
    ],
  },
  {
    text: '운영 가이드 (Runbook)',
    items: [
      { text: 'Tenant 라이프사이클', link: '/ko/06-runbook#tenant-라이프사이클' },
      { text: '자격증명 및 키 관리', link: '/ko/06-runbook#자격증명-및-키-관리' },
      { text: '사고 대응', link: '/ko/06-runbook#사고-대응' },
      { text: '정기 점검 및 검증', link: '/ko/06-runbook#정기-점검-및-검증' },
    ],
  },
  {
    text: '참고 자료',
    items: [
      { text: '규제 및 표준 문서', link: '/ko/07-references#규제-및-표준-문서' },
      { text: '아키텍처 및 보안 레퍼런스', link: '/ko/07-references#아키텍처-및-보안-레퍼런스' },
      { text: '외부 기술 자료', link: '/ko/07-references#외부-기술-자료' },
      { text: '다이어그램', link: '/ko/diagrams' },
      { text: '변경 이력', link: '/ko/07-references#변경-이력' },
    ],
  },
]

const enSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Overview', link: '/en/' },
      { text: 'System Context & Assumptions', link: '/en/01-system-context' },
      { text: 'Reference Architecture', link: '/en/02-reference-architecture' },
    ],
  },
  {
    text: 'Scenario-Based Security Design',
    items: [
      { text: 'Scenarios Overview', link: '/en/06-scenario-design/' },
    ],
  },
  {
    text: 'Architectural Decision Records (ADR)',
    items: [
      { text: 'ADR Index', link: '/en/03-adr/' },
    ],
  },
  {
    text: 'Compliance',
    items: [
      { text: 'Compliance Scope & Regulatory Mapping', link: '/en/05-compliance-mapping' },
    ],
  },
  {
    text: 'Threat Modeling',
    items: [
      { text: 'Security Requirements & Threat Modeling', link: '/en/04-threat-modeling' },
    ],
  },
  {
    text: 'References',
    items: [
      { text: 'References', link: '/en/11-references' },
    ],
  },
]

export default defineConfig({
  title: 'Baby Beavers EHR SaaS',
  description: 'AWS Native EHR SaaS 보안 아키텍처 가이드',
  base: '/beavers-ehr-saas-docs/',

  locales: {
    ko: {
      label: '한국어',
      lang: 'ko-KR',
      themeConfig: {
        nav: [
          {
            text: '문서',
            items: [
              { text: '시나리오', link: '/ko/02-scenarios/' },
              { text: 'ADR', link: '/ko/03-adr/' },
              { text: '컴플라이언스', link: '/ko/04-compliance' },
              { text: '5. 위협 모델링', link: '/ko/05-threat-modeling/' },
              { text: '운영 가이드', link: '/ko/06-runbook' },
              { text: '참고 자료', link: '/ko/07-references' },
            ],
          },
        ],
        sidebar: { '/ko/': koSidebar },
        outlineTitle: '이 페이지',
        docFooter: { prev: '이전', next: '다음' },
        darkModeSwitchLabel: '다크 모드',
        sidebarMenuLabel: '메뉴',
        returnToTopLabel: '맨 위로',
        langMenuLabel: '언어 선택',
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          {
            text: 'Documentation',
            items: [
              { text: 'System Context', link: '/en/01-system-context' },
              { text: 'Reference Architecture', link: '/en/02-reference-architecture' },
              { text: 'ADRs', link: '/en/03-adr/' },
              { text: 'Threat Modeling', link: '/en/04-threat-modeling' },
              { text: 'Compliance Mapping', link: '/en/05-compliance-mapping' },
              { text: 'Scenario Design', link: '/en/06-scenario-design/' },
            ],
          },
        ],
        sidebar: { '/en/': enSidebar },
      },
    },
  },

  themeConfig: {
    siteTitle: '4aaS',
    logoLink: '/beavers-ehr-saas-docs/',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/8parks/beavers-ehr-saas-docs' },
    ],
    search: { provider: 'local' },
  },
})
