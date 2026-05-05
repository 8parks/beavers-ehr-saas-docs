---
title: ADR-006. KMS-based Signing and Encryption Strategy
---

# ADR-006. KMS-based Signing and Encryption Strategy

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-006-kms-signing) for the full documentation.

## Status

Proposed

## Summary

Defines how AWS KMS asymmetric keys are used to digitally sign medical records (Sign/Verify API) and how KMS CMKs are used to encrypt PHI at rest.
