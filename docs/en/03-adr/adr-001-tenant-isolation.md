---
title: ADR-001. Tenant Isolation Strategy
---

# ADR-001. Tenant Isolation Strategy

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-001-tenant-isolation) for the full documentation.

## Status

Proposed

## Summary

Defines how the platform prevents cross-tenant data access in a multi-tenant EHR SaaS environment. Draft approach: service-layer tenant validation + schema-per-tenant database isolation + Row-Level Security as defense-in-depth.
