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
    text: '아키텍처 결정 기록 (ADR)',
    items: [
      { text: 'ADR 목록', link: '/ko/03-adr/' },
      { text: 'ADR-001. 테넌트 격리 전략', link: '/ko/03-adr/adr-001-tenant-isolation' },
      { text: 'ADR-002. 계정 분리 전략', link: '/ko/03-adr/adr-002-account-separation' },
      { text: 'ADR-003. JWT 기반 테넌트 컨텍스트', link: '/ko/03-adr/adr-003-jwt-tenant-context' },
      { text: 'ADR-004. Schema-per-Tenant vs RLS', link: '/ko/03-adr/adr-004-schema-per-tenant-vs-rls' },
      { text: 'ADR-005. 감사 로그 보존 & 무결성', link: '/ko/03-adr/adr-005-audit-log-integrity' },
      { text: 'ADR-006. KMS 서명 & 암호화 전략', link: '/ko/03-adr/adr-006-kms-signing' },
      { text: 'ADR-007. 보안 자동화 (Config/Hub/SSM)', link: '/ko/03-adr/adr-007-security-automation' },
      { text: 'ADR-008. 프라이빗 연결 & VPC 엔드포인트', link: '/ko/03-adr/adr-008-vpc-endpoints' },
      { text: 'ADR-009. 연구 데이터셋 & 가명처리', link: '/ko/03-adr/adr-009-pseudonymization' },
      { text: 'ADR-010. 관리 계정 & 앱 계정 분리', link: '/ko/03-adr/adr-010-account-separation' },
    ],
  },
  {
    text: '보안 & 컴플라이언스',
    items: [
      { text: '보안 요구사항 & 위협 모델링', link: '/ko/04-threat-modeling' },
      { text: '컴플라이언스 범위 & 규제 매핑', link: '/ko/05-compliance-mapping' },
    ],
  },
  {
    text: '시나리오 기반 보안 설계',
    items: [
      { text: '시나리오 개요', link: '/ko/06-scenario-design/' },
      { text: '환자 기록 생성 & 서명', link: '/ko/06-scenario-design/patient-record-creation' },
      { text: '환자 기록 조회', link: '/ko/06-scenario-design/patient-record-retrieval' },
      { text: '연구 데이터셋 생성', link: '/ko/06-scenario-design/research-dataset-generation' },
      { text: '크로스 테넌트 접근 방지', link: '/ko/06-scenario-design/cross-tenant-prevention' },
      { text: '감사 로그 수집 & 무결성 검증', link: '/ko/06-scenario-design/audit-log-integrity' },
      { text: '보안 탐지 & 자동 대응', link: '/ko/06-scenario-design/security-remediation' },
      { text: '관리 계정 & 앱 계정 분리 운영', link: '/ko/06-scenario-design/admin-account-separation' },
    ],
  },
  {
    text: '참고 자료',
    items: [
      { text: '보안 컨트롤 카탈로그', link: '/ko/07-security-control-catalog' },
      { text: '검증 체크리스트', link: '/ko/08-verification-checklist' },
      { text: '다이어그램', link: '/ko/09-diagrams' },
      { text: '한계 & 향후 과제', link: '/ko/10-limitations' },
      { text: '참고자료', link: '/ko/11-references' },
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
    text: 'Architectural Decision Records (ADR)',
    items: [
      { text: 'ADR Index', link: '/en/03-adr/' },
      { text: 'ADR-001. Tenant Isolation Strategy', link: '/en/03-adr/adr-001-tenant-isolation' },
      { text: 'ADR-002. Account Separation Strategy', link: '/en/03-adr/adr-002-account-separation' },
      { text: 'ADR-003. JWT-based Tenant Context', link: '/en/03-adr/adr-003-jwt-tenant-context' },
      { text: 'ADR-004. Schema-per-Tenant vs RLS', link: '/en/03-adr/adr-004-schema-per-tenant-vs-rls' },
      { text: 'ADR-005. Audit Log Integrity', link: '/en/03-adr/adr-005-audit-log-integrity' },
      { text: 'ADR-006. KMS Signing Strategy', link: '/en/03-adr/adr-006-kms-signing' },
      { text: 'ADR-007. Security Automation', link: '/en/03-adr/adr-007-security-automation' },
      { text: 'ADR-008. VPC Endpoints', link: '/en/03-adr/adr-008-vpc-endpoints' },
      { text: 'ADR-009. Pseudonymization Strategy', link: '/en/03-adr/adr-009-pseudonymization' },
      { text: 'ADR-010. Admin Account Separation', link: '/en/03-adr/adr-010-account-separation' },
    ],
  },
  {
    text: 'Security & Compliance',
    items: [
      { text: 'Security Requirements & Threat Modeling', link: '/en/04-threat-modeling' },
      { text: 'Compliance Scope & Regulatory Mapping', link: '/en/05-compliance-mapping' },
    ],
  },
  {
    text: 'Scenario-Based Security Design',
    items: [
      { text: 'Scenarios Overview', link: '/en/06-scenario-design/' },
      { text: 'Patient Record Creation & Signing', link: '/en/06-scenario-design/patient-record-creation' },
      { text: 'Patient Record Retrieval', link: '/en/06-scenario-design/patient-record-retrieval' },
      { text: 'Research Dataset Generation', link: '/en/06-scenario-design/research-dataset-generation' },
      { text: 'Cross-Tenant Access Prevention', link: '/en/06-scenario-design/cross-tenant-prevention' },
      { text: 'Audit Log Collection & Integrity', link: '/en/06-scenario-design/audit-log-integrity' },
      { text: 'Security Detection & Remediation', link: '/en/06-scenario-design/security-remediation' },
      { text: 'Admin Account Separation', link: '/en/06-scenario-design/admin-account-separation' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'Security Control Catalog', link: '/en/07-security-control-catalog' },
      { text: 'Verification Checklist', link: '/en/08-verification-checklist' },
      { text: 'Diagrams', link: '/en/09-diagrams' },
      { text: 'Limitations & Future Work', link: '/en/10-limitations' },
      { text: 'References', link: '/en/11-references' },
    ],
  },
]

export default defineConfig({
  title: 'Baby Beavers EHR SaaS',
  description: 'AWS Native EHR SaaS 보안 아키텍처 가이드',

  locales: {
    ko: {
      label: '한국어',
      lang: 'ko-KR',
      themeConfig: {
        nav: [
          { text: '홈', link: '/ko/' },
          {
            text: '문서',
            items: [
              { text: '시스템 컨텍스트', link: '/ko/01-system-context' },
              { text: '레퍼런스 아키텍처', link: '/ko/02-reference-architecture' },
              { text: '아키텍처 결정 기록', link: '/ko/03-adr/' },
              { text: '위협 모델링', link: '/ko/04-threat-modeling' },
              { text: '컴플라이언스 매핑', link: '/ko/05-compliance-mapping' },
              { text: '시나리오 설계', link: '/ko/06-scenario-design/' },
              { text: '보안 컨트롤 카탈로그', link: '/ko/07-security-control-catalog' },
              { text: '검증 체크리스트', link: '/ko/08-verification-checklist' },
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
              { text: 'Security Control Catalog', link: '/en/07-security-control-catalog' },
              { text: 'Verification Checklist', link: '/en/08-verification-checklist' },
            ],
          },
        ],
        sidebar: { '/en/': enSidebar },
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/beavers-ehr-saas-docs' },
    ],
    search: { provider: 'local' },
  },
})
