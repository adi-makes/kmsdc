# Production deployment

**Status:** Not started. Planned in Phase 14 (documentation only, no paid provisioning).

Scope to be covered: AWS reference architecture (Route 53, CloudFront, WAF, ECS Fargate, ALB,
RDS PostgreSQL with PITR, ElastiCache, S3, Secrets Manager, CloudWatch, AWS Backup), a cost
estimation approach, security controls, monitoring and alerting, scaling, disaster recovery,
rollback, data migration, a vendor-exit strategy and the list of preview services that must be
replaced before real clinic use.

**Hard rule:** no real patient data in any environment until the production plan, the legal review
(see [privacy-design](../security/privacy-design.md)) and the backup/restore test are complete.
