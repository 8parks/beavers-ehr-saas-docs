---
title: ADR-005. Audit Log Retention and Integrity
---

# ADR-005. Audit Log Retention and Integrity

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-005-audit-log-integrity) for the full documentation.

## Status

Proposed

## Summary

Defines how audit logs are collected (CloudTrail + CloudWatch), stored with tamper-protection (S3 Object Lock), and encrypted (KMS).
