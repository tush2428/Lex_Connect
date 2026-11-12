# Case Management Schema (BE-04)

Owner: BE-04 – Pratik Patil

## 1. Overview

This document describes the database schema for cases, case status, document metadata and access control in Lex Connect. Database: PostgreSQL. ORM: Prisma.

## 2. Tables

| Table | Purpose |
|---|---|
| User | Stores users with a role (CLIENT, ADVOCATE, ADMIN) |
| Case | A legal case, linked to one client and optionally one advocate |
| CaseStatusLog | History of every status change of a case (audit trail) |
| Document | Metadata of uploaded files (the file itself is stored in S3) |
| CaseAccess | Per-case permissions for users (VIEW, EDIT, OWNER) |

## 3. Case Status Flow

OPEN → IN_PROGRESS → UNDER_REVIEW → CLOSED (or REJECTED)

Every status change creates a row in CaseStatusLog with: old status, new status, who changed it, optional note, and time.

## 4. Relationships

- One User (client) can have many Cases.
- One User (advocate) can be assigned to many Cases.
- One Case has many Documents, many CaseStatusLog entries, and many CaseAccess entries.
- A user can have only one CaseAccess row per case (unique on caseId + userId).
- CaseStatusLog.changedBy references User.id (who changed the status).
- All ids are UUID (@db.Uuid), matching BE-01's User.id.
- Tables are mapped to: cases, case_status_logs, documents, case_access.

## 5. Access Control Model

| Role | Permissions |
|---|---|
| CLIENT | View and create own cases; upload and view documents of own cases only |
| ADVOCATE | Access only cases assigned to them; update case status; upload and view documents |
| ADMIN | View all cases; manage users; audit status logs |

Rules enforced in the backend on every request:
1. Authenticate the user (JWT).
2. Check user role.
3. For case and document APIs, check that the user is the case client, the assigned advocate, or has a CaseAccess row with a sufficient level (VIEW for read, EDIT for changes).
4. Deny by default if none of the above match.

## 6. Document Metadata

Stored in the Document table: fileName (original name), mimeType, sizeBytes, s3Key (path in S3), checksum (to detect tampering), isDeleted (soft delete), uploadedBy, createdAt.

The database never stores the file itself, only metadata.

## 7. Secure Storage Approach

1. Files are stored in a private AWS S3 bucket with Block Public Access enabled.
2. Only the s3Key is stored in the database.
3. Upload and download use pre-signed URLs that expire in 15 minutes, generated only after the access check passes.
4. Server-side encryption (SSE-S3 or KMS) is enabled on the bucket.
5. Bucket versioning is enabled.
6. Files are saved under a random UUID name; the original name is kept only in the database.
7. File type and size are validated on upload.
8. Documents are soft deleted (isDeleted = true) so they can be audited.
9. AWS keys and DB credentials are kept only in environment variables or a secrets manager. They are never committed to Git.

## 8. Credentials

The .env file is listed in .gitignore. No password, key or secret appears in code, docs or screenshots.

## 9. Open Items

- Confirm the User model with the team (BE-01) to avoid conflicts.
- Final S3 bucket name and region to be decided with DevOps.

| # | Item | Owner to confirm | Status |
|---|---|---|---|
| 1 | User model (id type, role enum) matches Case, Document, CaseAccess foreign keys | BE-01 (Tushar) | Pending |
| 2 | Case.advocateId references User.id; AdvocateProfile links via userId | BE-02 (Tejas) | Pending |
| 3 | Appointment and Payment may reference Case.id | BE-03 (Jay) | Pending |
| 4 | Repo, branch naming and PR rules | BE-05 (Yashvant) | Pending |
| 5 | Final S3 bucket name and region | BE-05 (Yashvant) / DevOps | Pending |

- User model (id type, role enum) confirmed with BE-01 (Tushar): UUID, UserRole enum matches.