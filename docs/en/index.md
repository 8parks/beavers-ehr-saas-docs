---
title: Overview
---

# Baby Beavers EHR SaaS Security Architecture Guide

> Architectural decision records and security design documentation for an AWS-native multi-tenant EHR SaaS platform.

::: info English version is in progress.
Please refer to the [Korean version](/ko/) for the full documentation.
This English version will be expanded gradually for portfolio and international readability purposes.
:::

## Purpose

This guide organizes architectural decisions, security design guidelines, threat modeling, and compliance mapping for a hypothetical AWS-native Electronic Health Record (EHR) SaaS platform.

The project focuses on designing a secure, multi-tenant SaaS architecture for healthcare environments.

> This guide does not claim full legal compliance. It translates selected regulatory and security requirements into architecture-level design considerations for an AWS-native EHR SaaS reference model.

## Key Design Goals

| Goal | Description |
|------|-------------|
| Multi-Tenant Isolation | Prevent cross-tenant PHI access |
| PHI Protection | Encryption, key management, secure auth |
| Auditability & Log Integrity | CloudTrail, S3 Object Lock, KMS |
| Compliance-Aware Architecture | HIPAA, Korean privacy law, ISO 27001 |
| Secure Automation & Remediation | Config, Security Hub, EventBridge, SSM |

## Architecture Narrative

```
Architecture-first → Threat-aware → Compliance-mapped → Verification-ready
```

## Documentation Status

| Section | Status |
|---------|--------|
| Overview | In progress |
| System Context & Assumptions | Placeholder |
| Reference Architecture | Placeholder |
| Architectural Decision Records | Placeholder |
| Security Requirements & Threat Modeling | Placeholder |
| Compliance Scope & Regulatory Mapping | Placeholder |
| Scenario-Based Security Design | Placeholder |
| Security Control Catalog | Placeholder |
| Verification Checklist | Placeholder |
| Diagrams | Placeholder |
| Limitations & Future Work | Placeholder |
| References | Placeholder |
