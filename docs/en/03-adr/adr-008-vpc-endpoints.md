---
title: ADR-008. Private Connectivity and VPC Endpoints
---

# ADR-008. Private Connectivity and VPC Endpoints

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-008-vpc-endpoints) for the full documentation.

## Status

Proposed

## Summary

Defines how VPC Interface Endpoints are used to keep AWS service-to-service traffic within the AWS network, avoiding internet traversal for KMS, Secrets Manager, SSM, S3, and CloudWatch.
