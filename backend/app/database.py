import sqlite3
import json
from contextlib import contextmanager
from .config import DB_PATH

@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. evaluations
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS evaluations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'draft', -- draft, documents_uploaded, processing, analyzed, completed
            pipeline_stage INTEGER DEFAULT 0,
            pipeline_status TEXT DEFAULT 'idle',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # 2. requirements
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS requirements (
            id TEXT PRIMARY KEY,
            evaluation_id TEXT NOT NULL,
            category TEXT NOT NULL, -- security, compliance, technical, sla, commercial
            title TEXT NOT NULL,
            name TEXT,
            description TEXT,
            priority TEXT DEFAULT 'MUST_HAVE', -- MUST_HAVE, SHOULD_HAVE, NICE_TO_HAVE
            is_mandatory BOOLEAN DEFAULT 0, -- Kill-criteria if 1 (synced with MUST_HAVE)
            weight INTEGER DEFAULT 1,
            evaluation_type TEXT DEFAULT 'BOOLEAN', -- BOOLEAN, SCORE, TEXT, NUMERIC
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 3. usage_assumptions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS usage_assumptions (
            id TEXT PRIMARY KEY,
            evaluation_id TEXT UNIQUE NOT NULL,
            user_count INTEGER DEFAULT 1000,
            storage_tb REAL DEFAULT 50.0,
            support_tier TEXT DEFAULT '24/7 Enterprise Platinum',
            annual_growth_rate REAL DEFAULT 0.15,
            contract_term_years INTEGER DEFAULT 3,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 4. scoring_weights
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scoring_weights (
            id TEXT PRIMARY KEY,
            evaluation_id TEXT UNIQUE NOT NULL,
            weight_tco REAL DEFAULT 35.0,
            weight_technical REAL DEFAULT 25.0,
            weight_compliance REAL DEFAULT 20.0,
            weight_risk REAL DEFAULT 10.0,
            weight_sla REAL DEFAULT 10.0,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 5. vendors
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id TEXT PRIMARY KEY,
            evaluation_id TEXT NOT NULL,
            name TEXT NOT NULL,
            logo_url TEXT,
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 6. vendor_documents
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendor_documents (
            id TEXT PRIMARY KEY,
            evaluation_id TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            page_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'uploaded', -- uploaded, parsed, extracting, verified, failed
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
        )
        """)

        # 7. document_pages
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_pages (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            text_content TEXT NOT NULL,
            char_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES vendor_documents(id) ON DELETE CASCADE
        )
        """)

        # 8. evidence
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS evidence (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            section_title TEXT,
            quote TEXT NOT NULL,
            verified BOOLEAN DEFAULT 0,
            char_offset INTEGER DEFAULT -1,
            match_confidence REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES vendor_documents(id) ON DELETE CASCADE,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
        )
        """)

        # 9. extracted_facts
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS extracted_facts (
            id TEXT PRIMARY KEY,
            vendor_id TEXT NOT NULL,
            evaluation_id TEXT NOT NULL,
            category TEXT NOT NULL, -- pricing, technical, compliance, sla, contract
            field_name TEXT NOT NULL,
            label TEXT NOT NULL,
            value_raw TEXT,
            value_normalized TEXT,
            unit TEXT,
            is_missing BOOLEAN DEFAULT 0,
            evidence_id TEXT,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
            FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE SET NULL
        )
        """)

        # 10. missing_information
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS missing_information (
            id TEXT PRIMARY KEY,
            vendor_id TEXT NOT NULL,
            evaluation_id TEXT NOT NULL,
            category TEXT NOT NULL,
            field_name TEXT NOT NULL,
            impact_level TEXT DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
            description TEXT,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 11. risks (Vendor Red-Team)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS risks (
            id TEXT PRIMARY KEY,
            vendor_id TEXT NOT NULL,
            evaluation_id TEXT NOT NULL,
            category TEXT DEFAULT 'Contractual / Legal', -- Commercial, Contractual, Security, Technical, Pricing, SLA, Data, Vendor
            risk_type TEXT NOT NULL, -- financial, contractual, compliance, operational
            severity TEXT NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            impact TEXT,
            recommended_action TEXT,
            why_it_matters TEXT,
            evidence_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
            FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE SET NULL
        )
        """)

        # 12. requirement_matches
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS requirement_matches (
            id TEXT PRIMARY KEY,
            requirement_id TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            evaluation_id TEXT NOT NULL,
            status TEXT NOT NULL, -- PASS, FAIL, PARTIAL, UNKNOWN, NOT_APPLICABLE (MET/NOT_MET legacy compatible)
            failure_reason TEXT,
            details TEXT,
            evidence_id TEXT,
            FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
            FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE SET NULL
        )
        """)

        # 13. tco_results
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tco_results (
            id TEXT PRIMARY KEY,
            vendor_id TEXT UNIQUE NOT NULL,
            evaluation_id TEXT NOT NULL,
            implementation_fee REAL DEFAULT 0.0,
            year1_license REAL DEFAULT 0.0,
            year2_license REAL DEFAULT 0.0,
            year3_license REAL DEFAULT 0.0,
            year1_support REAL DEFAULT 0.0,
            year2_support REAL DEFAULT 0.0,
            year3_support REAL DEFAULT 0.0,
            escalation_rate REAL DEFAULT 0.0,
            overage_estimate REAL DEFAULT 0.0,
            year1_total REAL DEFAULT 0.0,
            year2_total REAL DEFAULT 0.0,
            year3_total REAL DEFAULT 0.0,
            total_3yr_tco REAL DEFAULT 0.0,
            cost_per_user_year REAL DEFAULT 0.0,
            is_complete BOOLEAN DEFAULT 1,
            missing_cost_items TEXT,
            breakdown_json TEXT,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 14. score_results
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS score_results (
            id TEXT PRIMARY KEY,
            vendor_id TEXT UNIQUE NOT NULL,
            evaluation_id TEXT NOT NULL,
            total_score REAL DEFAULT 0.0,
            tco_score REAL DEFAULT 0.0,
            technical_score REAL DEFAULT 0.0,
            compliance_score REAL DEFAULT 0.0,
            risk_score REAL DEFAULT 0.0,
            sla_score REAL DEFAULT 0.0,
            rank INTEGER DEFAULT 1,
            is_disqualified BOOLEAN DEFAULT 0,
            disqualification_reason TEXT,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 15. recommendations
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id TEXT PRIMARY KEY,
            evaluation_id TEXT UNIQUE NOT NULL,
            top_vendor_id TEXT,
            executive_summary TEXT,
            recommendation_narrative TEXT,
            trade_off_analysis TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
            FOREIGN KEY (top_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
        )
        """)

        # 16. negotiation_questions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS negotiation_questions (
            id TEXT PRIMARY KEY,
            vendor_id TEXT NOT NULL,
            evaluation_id TEXT NOT NULL,
            priority TEXT DEFAULT 'HIGH', -- CRITICAL, HIGH, MEDIUM
            category TEXT NOT NULL,
            question TEXT NOT NULL,
            rationale TEXT NOT NULL,
            target_clause TEXT,
            suggested_fallback TEXT,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        )
        """)

        # 17. negotiation_items (Feature 3: Negotiation Intelligence)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS negotiation_items (
            id TEXT PRIMARY KEY,
            evaluation_id TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            priority TEXT DEFAULT 'HIGH', -- HIGH, MEDIUM, LOW
            issue TEXT NOT NULL,
            current_position TEXT NOT NULL,
            target_position TEXT NOT NULL,
            fallback_position TEXT NOT NULL,
            buyer_rationale TEXT,
            vendor_rationale TEXT,
            evidence_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
            FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE SET NULL
        )
        """)

        # Migration column checks
        try:
            cursor.execute("ALTER TABLE requirements ADD COLUMN priority TEXT DEFAULT 'MUST_HAVE'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE requirements ADD COLUMN name TEXT")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE requirements ADD COLUMN evaluation_type TEXT DEFAULT 'BOOLEAN'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE risks ADD COLUMN category TEXT DEFAULT 'Contractual / Legal'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE risks ADD COLUMN impact TEXT")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE risks ADD COLUMN recommended_action TEXT")
        except Exception:
            pass

        conn.commit()
