import { defineConfig } from 'vitepress'

const koSidebar = [
  {
    text: '1. 시작하기',
    items: [
      { text: '1.1 개요', link: '/ko/' },
      { text: '1.2 시스템 컨텍스트 & 가정', link: '/ko/01-system-context' },
      { text: '1.3 레퍼런스 아키텍처', link: '/ko/02-reference-architecture' },
    ],
  },
  {
    text: '2. 시나리오 기반 보안 설계',
    items: [
      { text: '2.1 시나리오 카탈로그', link: '/ko/02-scenarios/' },
      {
        text: '2.2 비즈니스 시나리오',
        collapsed: false,
        items: [
          { text: 'S1. 환자 진료 기록 작성', link: '/ko/02-scenarios/patient-record-creation' },
          { text: 'S2. 환자 진료 기록 조회', link: '/ko/02-scenarios/patient-record-retrieval' },
          { text: 'S3. 연구 데이터셋 생성', link: '/ko/02-scenarios/research-dataset-generation' },
        ],
      },
      {
        text: '2.3 운영 시나리오',
        collapsed: false,
        items: [
          { text: 'S4. Tenant 온보딩', link: '/ko/02-scenarios/s4-tenant-onboarding' },
          { text: 'S5. Tenant 오프보딩', link: '/ko/02-scenarios/s5-tenant-offboarding' },
        ],
      },
      {
        text: '2.4 비상 / 장애 대응',
        collapsed: false,
        items: [
          { text: 'S6. 운영자 비상 접근 (Break-glass)', link: '/ko/02-scenarios/s6-break-glass' },
          { text: 'S7. 데이터베이스 장애 및 복구', link: '/ko/02-scenarios/s7-db-recovery' },
        ],
      },
    ],
  },
  {
    text: '3. 멀티테넌트 설계 전략 (ADR)',
    items: [
      { text: '3.1 ADR 개요 및 작성 원칙', link: '/ko/03-adr/' },
      { text: '3.2 멀티테넌트 전략', link: '/ko/03-adr/multitenant-strategy' },
      { text: '3.3 인증 / 인가 전략', link: '/ko/03-adr/auth-strategy' },
      { text: '3.4 데이터 및 스토리지 전략', link: '/ko/03-adr/data-storage-strategy' },
      { text: '3.5 로깅 및 감사 전략', link: '/ko/03-adr/logging-strategy' },
      { text: '3.6 운영 및 라이프사이클 전략', link: '/ko/03-adr/operations-strategy' },
    ],
  },
  {
    text: '4. 컴플라이언스',
    items: [
      { text: '4.1 적용 규제 범위', link: '/ko/04-compliance#적용-규제-범위' },
      { text: '4.2 책임 공유 및 계약 범위', link: '/ko/04-compliance#책임-공유-및-계약-범위' },
      { text: '4.3 통제 영역별 매핑', link: '/ko/04-compliance#통제-영역별-매핑' },
      { text: '4.4 보안 요구사항 총정리', link: '/ko/04-compliance#보안-요구사항-총정리' },
    ],
  },
  {
    text: '5. 위협 모델링',
    items: [
      { text: '5.1 보안 목표', link: '/ko/05-threat-modeling#보안-목표' },
      { text: '5.2 위협 모델링', link: '/ko/05-threat-modeling#위협-모델링' },
    ],
  },
  {
    text: '6. 운영 가이드 (Runbook)',
    items: [
      { text: '6.1 Tenant 라이프사이클', link: '/ko/06-runbook#tenant-라이프사이클' },
      { text: '6.2 자격증명 및 키 관리', link: '/ko/06-runbook#자격증명-및-키-관리' },
      { text: '6.3 사고 대응', link: '/ko/06-runbook#사고-대응' },
      { text: '6.4 정기 점검 및 검증', link: '/ko/06-runbook#정기-점검-및-검증' },
    ],
  },
  {
    text: '7. 참고 자료',
    items: [
      { text: '7.1 규제 및 표준 문서', link: '/ko/07-references#규제-및-표준-문서' },
      { text: '7.2 아키텍처 및 보안 레퍼런스', link: '/ko/07-references#아키텍처-및-보안-레퍼런스' },
      { text: '7.3 외부 기술 자료', link: '/ko/07-references#외부-기술-자료' },
      { text: '7.4 변경 이력', link: '/ko/07-references#변경-이력' },
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
              { text: '위협 모델링', link: '/ko/05-threat-modeling' },
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
    logo: '/logo.svg',
    logoLink: '/beavers-ehr-saas-docs/',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/8parks/beavers-ehr-saas-docs' },
    ],
    search: { provider: 'local' },
  },
})
