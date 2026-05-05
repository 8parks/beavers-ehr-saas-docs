---
title: ADR-009. Research Dataset Generation and Pseudonymization
---

# ADR-009. Research Dataset Generation and Pseudonymization

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-009-pseudonymization) for the full documentation.

## Status

Proposed

## Summary

Defines how PHI is pseudonymized for research use cases using KMS-based hashing and a separately protected mapping table, with the full pipeline auditable via Lambda and CloudTrail.
