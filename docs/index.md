---
layout: home

hero:
  name: Baby Beavers EHR SaaS
  text: 보안 아키텍처 가이드
  tagline: AWS Native Multi-Tenant EHR SaaS를 위한 아키텍처 설계 문서
  actions:
    - theme: brand
      text: 한국어 가이드라인
      link: /ko/
    - theme: alt
      text: English Guideline (TBD)
      link: /en/

features:
  - title: 아키텍처 설계
    details: 멀티테넌트 EHR SaaS를 위한 AWS 기반 아키텍처를 "왜" 이렇게 설계했는지를 중심으로 설계 결정 근거를 체계적으로 정리합니다.
  - title: 컴플라이언스 연계
    details: HIPAA, 개인정보보호법, ISO 27001, 의료법의 핵심 요구사항을 아키텍처 설계 단계에서 어떻게 반영했는지 구체적으로 기술합니다.
  - title: 위협 모델링
    details: 자산, 위협 행위자, 신뢰 경계, 위협 시나리오를 도출하고 각각에 대응하는 AWS 보안 컨트롤과의 연결 관계를 정리합니다.
  - title: 검증 및 체크리스트
    details: 설계 사항을 검증 체크리스트 형태로 구조화하여 실제 보안 엔지니어링 실무 수준에서 점검할 수 있도록 합니다.
---

<div class="about-section">

## About this Project

<img src="/beavers-ehr-saas-docs/babybeavers logo.png" alt="Baby Beavers" class="about-logo" />

[Beaver Dam 커뮤니티](https://beaver-dam.net/kr) 지원으로 [Baby Beavers 1기](https://baby.beaver-dam.net/kr)로 만나게 된 팀이 함께 진행한 프로젝트입니다.

안전한 아키텍처와 보안, 규제 준수를 함께 깊이 파고들어 보고 싶었고, 그 과정에서 멀티테넌트 SaaS 구조가 궁금해졌습니다. 도메인으로 의료를 선택한 이유는 간단합니다. 아키텍처 설계의 복합도가 높고, 민감 정보를 다루는 만큼 엄격한 규제가 존재하며, 다양한 공격 표면이 존재하기 때문입니다. 가상의 EHR SaaS를 가정하고, 실제로 이런 시스템을 만든다면 어떤 결정을 내려야 하는지를 처음부터 끝까지 고민해봤습니다.

## About Us

**4aaS**

<div class="team-grid">

<div class="team-member">
<div class="member-name">이수민</div>
<div class="member-role">PM · 아키텍처 · 컴플라이언스</div>
<a href="https://www.linkedin.com/in/miinglina" target="_blank" rel="noopener noreferrer" class="member-linkedin"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
</div>

<div class="team-member">
<div class="member-name">박시원</div>
<div class="member-role">아키텍처 · 컴플라이언스</div>
<a href="https://www.linkedin.com/in/nowismi" target="_blank" rel="noopener noreferrer" class="member-linkedin"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
</div>

<div class="team-member">
<div class="member-name">김진호</div>
<div class="member-role">아키텍처 · 오펜시브</div>
<a href="https://www.linkedin.com/in/oscar-jinho-kim" target="_blank" rel="noopener noreferrer" class="member-linkedin"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
</div>

</div>

<div class="team-grid mentor-grid">

<div class="team-member">
<div class="member-name">김동현</div>
<div class="member-role">멘토</div>
<a href="https://www.linkedin.com/in/ben-dh-kim" target="_blank" rel="noopener noreferrer" class="member-linkedin"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
</div>

<div class="team-member">
<div class="member-name">용시우</div>
<div class="member-role">PL</div>
<a href="https://www.linkedin.com/in/siu-yong-249800287" target="_blank" rel="noopener noreferrer" class="member-linkedin"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
</div>

</div>

</div>
