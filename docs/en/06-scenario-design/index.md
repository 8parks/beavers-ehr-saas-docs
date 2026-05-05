---
title: Scenario-Based Security Design
---

# Scenario-Based Security Design

> English version is in progress.
> Please refer to the [Korean version](/ko/06-scenario-design/) for the full documentation.

## Scenarios

| Scenario | Key Security Goal |
|----------|------------------|
| [Patient Record Creation & Signing](./patient-record-creation) | Integrity, authorization, audit |
| [Patient Record Retrieval](./patient-record-retrieval) | Tenant isolation, authorization, audit |
| [Research Dataset Generation](./research-dataset-generation) | Pseudonymization, data protection |
| [Cross-Tenant Access Prevention](./cross-tenant-prevention) | Tenant isolation, access control |
| [Audit Log Collection & Integrity](./audit-log-integrity) | Log immutability, traceability |
| [Security Detection & Remediation](./security-remediation) | Config drift detection, auto-remediation |
| [Admin Account Separation](./admin-account-separation) | Account boundary, least privilege |
