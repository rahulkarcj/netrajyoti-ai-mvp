# NetraJyoti clinical demo dataset v1

## Purpose

This package is a **demo data model** for the target PostgreSQL-backed clinical knowledge base described in the HLD. It shows how the product can store source metadata, deterministic screening criteria, and patient-facing guidance separately.

## Critical safety status

Every record in this package is marked `DEMO_ONLY_NOT_CLINICALLY_APPROVED`.

- It is suitable for a capstone demonstration and engineering integration only.
- It is **not** suitable for clinical use, real patient screening, diagnosis, or treatment advice.
- It must not be copied into the running production RAG corpus until an authorised ophthalmologist or clinical governance group reviews, approves, versions, and signs off every pathway.
- The source documents are evidence references, not automatically approved pathway logic.

## Files

- `clinical_sources_demo.json`: source register and reuse notes.
- `clinical_pathways_demo.json`: pathway, criteria, guidance, and audit examples.
- `postgresql-demo-schema-and-seed.sql`: a PostgreSQL schema and seed data for a local demo database.

## How to use for a demo

1. Review the JSON files locally; do not claim that the content is clinically approved.
2. Create a separate demo database, then execute `postgresql-demo-schema-and-seed.sql`.
3. Let Java use only the `clinical_criterion` rows for deterministic routing.
4. Let the RAG layer retrieve only `clinical_guidance` rows whose status is `DEMO_ONLY_NOT_CLINICALLY_APPROVED` in a clearly labelled demo environment.
5. Keep the existing fixed Java safety fallback active.

## Before a real pilot

Replace every demo record with a version that contains: a named qualified reviewer, approval date, next review due date, evidence section/page, source rights decision, clinician-created test cases, and an operational escalation/referral plan.
