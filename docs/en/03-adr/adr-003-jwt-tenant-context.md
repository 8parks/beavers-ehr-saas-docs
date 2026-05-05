---
title: ADR-003. JWT-based Tenant Context and Authorization
---

# ADR-003. JWT-based Tenant Context and Authorization

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-003-jwt-tenant-context) for the full documentation.

## Status

Proposed

## Summary

Defines how tenant context (`tenant_id`) and role claims are embedded in Cognito-issued JWTs and validated at the service layer on every request.
