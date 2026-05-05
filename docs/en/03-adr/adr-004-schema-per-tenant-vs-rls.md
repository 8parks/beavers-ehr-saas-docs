---
title: ADR-004. Schema-per-Tenant vs Row-Level Security
---

# ADR-004. Schema-per-Tenant vs Row-Level Security

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-004-schema-per-tenant-vs-rls) for the full documentation.

## Status

Proposed

## Summary

Compares database-level tenant isolation strategies in Aurora PostgreSQL. Draft: schema-per-tenant as the primary isolation strategy, with RLS as an additional defense-in-depth layer.
