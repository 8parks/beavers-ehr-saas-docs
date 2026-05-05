---
title: ADR-007. Security Automation with Config, Security Hub, and SSM
---

# ADR-007. Security Automation with Config, Security Hub, and SSM

> English version is in progress.
> Please refer to the [Korean version](/ko/03-adr/adr-007-security-automation) for the full documentation.

## Status

Proposed

## Summary

Defines the AWS-native security automation pipeline: Config → Security Hub → EventBridge → Lambda → SSM Automation Runbook for detecting and remediating security findings.
