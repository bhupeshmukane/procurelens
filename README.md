# ProcureLens

> Evidence-grounded procurement decision intelligence.

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Audit Status](https://img.shields.io/badge/Pre--Demo%20Audit-100%25%20PASS-brightgreen.svg)]()

---

## Overview

**ProcureLens** is an enterprise decision-intelligence platform that transforms complex multi-vendor RFP proposals into explainable, auditable procurement decisions.

It combines AI-assisted proposal extraction, quote-level source evidence verification, deterministic 3-year total cost of ownership (TCO) modeling, mandatory kill-criteria compliance gating, explainable multi-criteria weighted scoring, an interactive what-if decision simulator, and tactical negotiation playbooks.

The core governing principle of ProcureLens is:

> **The cheapest vendor is not necessarily the eligible winner.**

---

## The Problem

Enterprise software procurement evaluations require reviewing hundreds of pages across multiple vendor proposals while simultaneously analyzing:

1. **Mandatory Security & Regulatory Compliance**: SOC 2 Type II, ISO 27001, data residency, and enterprise encryption.
2. **Hidden Commercial & Contractual Risks**: Compounding annual price escalators, short liability caps, and restrictive auto-renewal notice traps.
3. **Multi-Year True Cost of Ownership**: Implementation onboarding fees, user licensing growth, support tiers, and year-over-year compounding inflation.
4. **Negotiation Leverage**: Identifying vendor-specific contractual concessions to de-risk contracts and capture concrete budget savings before signing.

In traditional procurement, a vendor with a low headline price can obscure severe security deficiencies or aggressive renewal escalators that multiply costs over 3 years.

---

## Solution

ProcureLens enforces a strict, transparent architectural boundary between AI document extraction and deterministic business math:

`mermaid
flowchart LR
    A[Vendor Proposals<br/>PDF Ingestion] --> B[AI-Assisted<br/>Extraction]
    B --> C[Verified Evidence<br/>Page & Quote Offsets]
    C --> D[Deterministic Analysis<br/>Pure Python 3-Yr TCO]
    D --> E[Mandatory Compliance Gate<br/>Kill-Criteria Enforcement]
    E --> F[Explainable Decision<br/>Score Contributions]
    F --> G[Negotiation Action<br/>Quantified Savings]
`

Every metric displayed on executive dashboards traces back to an exact page number and verbatim quote in the original proposal document.

---

## Key Features

### 1. Evidence-Grounded Proposal Analysis
- Ingests multi-page enterprise vendor proposals (PDF).
- Extracts commercial fees, technical architecture specifications, contractual clauses, and SLA commitments.
- Anchors every finding with exact page numbers, section titles, verbatim quotes, and character offsets.

### 2. Mandatory Compliance Gating (Kill-Criteria Gate)
- Enforces non-negotiable enterprise requirements before weighted ranking calculations.
- A vendor that fails a mandatory requirement (*e.g., active SOC 2 Type II certification*) is immediately **DISQUALIFIED** and barred from winning, regardless of nominal pricing.

### 3. Deterministic 3-Year TCO Modeling
- Calculates true multi-year financial commitments in pure Python (zero LLM calculation latency or hallucination).
- Models implementation fees, Year 1 subscription/support base, compounding annual price escalation ( = Y_1 \times (1 + r)$,  = Y_2 \times (1 + r)$), and flags missing cost items.

### 4. Vendor Red-Team Risk Intelligence
- Automatically detects unilateral contract risks across 4 distinct categories:
  - **Commercial / Financial**: Time & materials cost uncertainty, uncapped renewal escalators.
  - **Contractual / Legal**: 3-month fee liability caps, 90-day auto-renewal notice traps.
  - **SLA / Operational**: Sub-standard availability SLAs (<99.9%), missing financial credits.
  - **Security / Compliance**: Incomplete audits, pending certifications.

### 5. Explainable Multi-Criteria Scoring
- Decomposes vendor scores into exact mathematical point contributions across Commercial (35%), Technical (25%), Compliance (20%), Contract Risk (10%), and SLA Reliability (10%).
- Provides 100% transparency into how every decimal point of the final score was computed.

### 6. Procurement Decision Simulator (What-If Engine)
- Enables procurement leaders to test priority shifts, weight rebalancing, escalation caps, and requirement policy overrides in real-time (<1ms calculation latency).
- Immutability guarantee: All simulations run ephemerally in memory without modifying the canonical baseline database.

### 7. Negotiation Intelligence & Playbooks
- Translates identified contract risks into structured negotiation playbooks.
- Supplies current vendor positions, target positions, fallback positions, buyer/vendor rationales, and tactical probing questions.
- Calculates exact dollar savings unlocked by contractual concessions (*e.g., capping a 7% annual escalator to 3% US CPI*).

### 8. Decision Room / Judge Mode
- High-density executive cockpit presenting the complete 60–90 second procurement justification on a single screen.
- Features the Award Recommendation, 4 Justification Pillars, the **Why Not The Cheapest?** callout, the 7-stage decision chain, and instant links to source evidence.

### 9. Executive Decision Pack Export
- Generates a comprehensive, print-ready 6-page procurement decision memorandum:
  - **Page 1**: Executive Award Recommendation & Decision Pillars.
  - **Page 2**: Vendor Comparison & Qualification Matrix.
  - **Page 3**: Decision Trace & Deterministic Score Contributions.
  - **Page 4**: Risk Intelligence & Red-Team Summary.
  - **Page 5**: Negotiation Priorities & Quantified Savings.
  - **Page 6**: Verified Evidence Index & Source Citations.

---

## Canonical Demonstration Scenario

The standard demonstration scenario evaluates three vendors for an *Enterprise Cloud Analytics RFP*:

| Vendor | Qualification Status | Final Score | 3-Year True TCO | Annual Escalator | Key Differentiator |
|---|:---:|:---:|:---:|:---:|---|
| **CloudCore** | **Rank #1 Qualified** | **74.0 / 100** | **,000.00** | **0.0% (Fixed)** | Passed 100% mandatory compliance, zero critical risks, predictable budget lock. |
| **Vertex Systems** | **Rank #2 Qualified** | **71.9 / 100** | **,384.00** | **7.0% (Compound)** | High technical fit, but aggressive 7% escalator adds +,384 in compounding inflation. |
| **Nexus Cloud** | **Rank #3 DISQUALIFIED** | **87.2 nominal** | **,726.00** | **3.0%** | Lowest nominal headline price, but **FAILED** mandatory SOC 2 Type II certification. |

### Why Did CloudCore Win Over Nexus Cloud?
Nexus Cloud submitted the lowest nominal price (,726.00 vs ,000.00). However, Nexus Cloud failed the mandatory enterprise specification **SOC 2 Type II Certified** (audit in progress / Type I only).

Under ProcureLens kill-criteria gating rules:
1. Mandatory compliance requirements override weighted pricing scores.
2. Nexus Cloud was disqualified and relegated to bottom rank.
3. CloudCore was deterministically awarded Rank #1 as the highest-scoring qualified vendor.

---

## Technology Stack

- **Backend**:
  - Python 3.10+
  - FastAPI (Async REST API)
  - SQLite (WAL mode, relational integrity)
  - PyPDF (PDF text extraction & character offset indexing)
  - ReportLab (Automated demo proposal generation)
  - Pydantic v2 (Strict data validation)
- **Frontend**:
  - React 18 with TypeScript
  - Vite 5 (Fast build & HMR)
  - Tailwind CSS (Enterprise Design System)
  - Material Symbols (Visual icons)
- **Architecture Principle**:
  - Pure Python deterministic computation for all math (TCO, scoring, gating, rebalancing).
  - 100% offline demo reproducibility with optional live LLM provider integration (Gemini, OpenAI, Anthropic).

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone the Repository
`ash
git clone https://github.com/bhupeshmukane/procurelens.git
cd procurelens
`

### 2. Backend Setup
`ash
cd backend
python -m venv venv

# Windows:
venv\\Scripts\\activate
# Linux / macOS:
# source venv/bin/activate

pip install -r requirements.txt
`

### 3. Frontend Setup
`ash
cd ../frontend
npm install
npm run build
`

### 4. Run ProcureLens
`ash
# Start the unified backend server (serves both FastAPI API and production frontend)
cd ../backend
python run.py
`
Open **http://127.0.0.1:8000/** in your browser.

> **Tip**: Click **[Load 3-Vendor Demo]** in the top navigation bar to automatically seed the 3 vendor proposal PDFs, execute the analytical pipeline, and open the Decision Room.

---

## Verification & Audit Test Suites

ProcureLens includes comprehensive engineering audit and regression test suites:

`ash
cd backend

# 1. Full Decision Simulator 17-Point Harness
python test_decision_simulator.py

# 2. Phase 1 Features Suite (Red-Team, Compliance Matrix, Negotiation)
python test_phase1_features.py

# 3. Backend End-to-End Smoke Test
python smoke_test.py

# 4. Pre-Demo Engineering Audit (12 Verification Checks)
python final_audit.py

# 5. Phase 1 Adversarial & Prompt Injection Audit (17 Checks)
python adversarial_audit.py

# 6. Phase 3 Demo Reproducibility & Script Benchmark (17 Steps)
python test_phase3_demo_script.py

# 7. Phase 4 Decision Trace & Compliance Anchoring Audit (10 Tests, 74 Assertions)
python test_phase4_decision_trace.py
`

---

## License

This project is licensed under the [MIT License](LICENSE).
