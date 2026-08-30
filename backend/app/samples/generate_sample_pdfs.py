import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_sample_pdfs(output_dir: Path):
    output_dir.mkdir(exist_ok=True, parents=True)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0040e0'),
        spaceAfter=10
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0b1c30'),
        spaceBefore=10,
        spaceAfter=4
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#213145'),
        spaceAfter=6
    )
    
    quote_style = ParagraphStyle(
        'DocQuote',
        parent=styles['Normal'],
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#0040e0'),
        leftIndent=12,
        rightIndent=12,
        spaceBefore=4,
        spaceAfter=4
    )

    # -------------------------------------------------------------
    # 1. CloudCore Proposal (Top Quality, Compliant, 0% Escalation)
    # -------------------------------------------------------------
    p1_path = output_dir / "CloudCore_Enterprise_Proposal_2024.pdf"
    doc1 = SimpleDocTemplate(str(p1_path), pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    story1 = [
        Paragraph("CloudCore Enterprise Analytics Platform Proposal", title_style),
        Paragraph("Prepared for: Enterprise Global Procurement Review | Confidential RFP Submission Ref: CC-2024-991", body_style),
        Spacer(1, 8),
        Paragraph("Executive Overview", h2_style),
        Paragraph("CloudCore provides an enterprise-grade, multi-tenant cloud analytics architecture built specifically for mission-critical procurement intelligence and automated decision support.", body_style),
        Spacer(1, 6),
        Paragraph("1. Technical Capabilities & Platform Architecture", h2_style),
        Paragraph("CloudCore delivers full enterprise REST API and GraphQL endpoints, webhook event streams, and real-time data ingestion pipelines. Single sign-on is supported natively via SAML 2.0 and automated SCIM 2.0 user lifecycle management with Okta and Azure AD.", quote_style),
        Paragraph("<b>Developer Sandbox:</b> Dedicated pre-production developer sandbox tenant is included in the base platform subscription for API testing.", quote_style),
        PageBreak(),
        # Page 2
        Paragraph("2. Information Security, Compliance & Data Sovereignty", h2_style),
        Paragraph("<b>Security Certification:</b> CloudCore maintains active SOC 2 Type II certification audited annually by Ernst & Young, covering security, confidentiality, and availability principles.", quote_style),
        Paragraph("<b>ISO 27001 Certification:</b> CloudCore holds certified Information Security Management System under ISO/IEC 27001:2022 standards.", quote_style),
        Paragraph("<b>Encryption Standards:</b> All customer data is secured with AES-256 encryption at rest and TLS 1.3 encryption in transit with customer-managed KMS keys.", quote_style),
        Paragraph("<b>Data Residency Guarantee:</b> Customer production data and backups are hosted in US AWS regions (us-east-1) with EU (Frankfurt) tenant isolation available.", quote_style),
        Paragraph("<b>Service Level Commitment (SLA):</b> CloudCore guarantees 99.95% production uptime availability backed by contractual service credits.", quote_style),
        PageBreak(),
        # Page 3
        Paragraph("3. Commercial Pricing, Fees & Contractual Terms", h2_style),
        Paragraph("<b>Implementation & Setup Fee:</b> $45,000 fixed-price onboarding package including full custom integration, data migration, and administrator training.", quote_style),
        Paragraph("<b>Annual Base License:</b> $160,000 per year enterprise subscription for 1,000 named users.", quote_style),
        Paragraph("<b>Annual Support Fee:</b> $25,000 per year for 24/7 Platinum Tier Dedicated Technical Account Manager.", quote_style),
        Paragraph("<b>Price Escalation Policy:</b> Fixed 0% annual escalation guarantee across the entire 3-year term. Year 2 and Year 3 fees remain strictly identical to Year 1.", quote_style),
        Paragraph("<b>Liability & Legal Protections:</b> Vendor aggregate liability is capped at 12 months of total fees paid under this agreement.", quote_style),
        Paragraph("<b>Contract Renewal & Notice:</b> Agreement auto-renews unless written notice of non-renewal is provided at least 30 days prior to term expiration.", quote_style),
    ]
    doc1.build(story1)

    # -------------------------------------------------------------
    # 2. Vertex Systems Proposal (7% Escalation, T&M, 3-mo Liability)
    # -------------------------------------------------------------
    p2_path = output_dir / "Vertex_Enterprise_Solution_2024.pdf"
    doc2 = SimpleDocTemplate(str(p2_path), pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    story2 = [
        Paragraph("Vertex Systems Enterprise Solution Proposal", title_style),
        Paragraph("Submitted for Global Procurement RFP Evaluation | Confidential Commercial Proposal Ref: VX-2024-402", body_style),
        Spacer(1, 8),
        Paragraph("Executive Summary", h2_style),
        Paragraph("Vertex Systems is a global provider of data infrastructure and procurement workflow acceleration technologies.", body_style),
        Spacer(1, 6),
        Paragraph("1. Technical Architecture & Platform Integrations", h2_style),
        Paragraph("Vertex delivers native REST API interfaces, enterprise webhooks, and SAML 2.0 SSO identity federation.", quote_style),
        Paragraph("<b>Developer Environments:</b> Production and sandbox staging tenants are available upon request as an additional infrastructure tier.", quote_style),
        PageBreak(),
        # Page 2
        Paragraph("2. Information Security & Compliance Framework", h2_style),
        Paragraph("<b>Security Certification:</b> Vertex maintains full SOC 2 Type II certification audited annually by KPMG.", quote_style),
        Paragraph("<b>ISO 27001 Certification:</b> Vertex holds current ISO/IEC 27001:2022 security compliance certification.", quote_style),
        Paragraph("<b>Data Encryption:</b> Standard AES-256 encryption at rest and TLS 1.3 in transit across all multi-tenant nodes.", quote_style),
        Paragraph("<b>Data Residency:</b> Customer production data is hosted in United States data centers with optional EU Frankfurt tenant data storage.", quote_style),
        Paragraph("<b>SLA Commitment:</b> Guaranteed 99.5% uptime SLA with standard service credit remedy.", quote_style),
        PageBreak(),
        # Page 3
        Paragraph("3. Commercial Pricing, Escalation & Liability Terms", h2_style),
        Paragraph("<b>Implementation Fee:</b> $35,000 estimated onboarding fee based on Time & Materials engineering services.", quote_style),
        Paragraph("<b>Annual Base License:</b> $140,000 per year base platform subscription tier.", quote_style),
        Paragraph("<b>Annual Support Fee:</b> $20,000 per year enterprise support tier.", quote_style),
        Paragraph("<b>Terms of Renewal & Escalation:</b> Upon the anniversary of the Effective Date, and annually thereafter, the base recurring fees for all licensed software and managed services shall be subject to an automatic 7% annual escalation, applied to current rates immediately preceding renewal date.", quote_style),
        Paragraph("<b>Limitation of Liability:</b> Vendor total aggregate liability arising out of or related to this Agreement shall be limited to fees paid during the prior 3 months.", quote_style),
        Paragraph("<b>Term and Termination:</b> This contract shall automatically renew for successive 36-month terms unless either party gives written notice of termination at least 90 days prior to the expiration of the then-current term.", quote_style),
    ]
    doc2.build(story2)

    # -------------------------------------------------------------
    # 3. Nexus Cloud Proposal (Disqualified - SOC2 Type II Incomplete)
    # -------------------------------------------------------------
    p3_path = output_dir / "NexusCloud_Enterprise_Proposal_2024.pdf"
    doc3 = SimpleDocTemplate(str(p3_path), pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    story3 = [
        Paragraph("Nexus Cloud AI Enterprise Platform Proposal", title_style),
        Paragraph("Proposal for Enterprise Procurement Platform | Bid Ref: NC-2024-8841", body_style),
        Spacer(1, 8),
        Paragraph("Executive Summary", h2_style),
        Paragraph("Nexus Cloud offers high-speed AI and automation infrastructure designed for modern enterprise workflows.", body_style),
        Spacer(1, 6),
        Paragraph("1. Platform Specifications & Integrations", h2_style),
        Paragraph("Nexus Cloud features REST API integrations, event webhooks, and SAML 2.0 Single Sign-On.", quote_style),
        Paragraph("<b>Sandbox Tenant:</b> Unlimited developer sandbox instances provided at no extra charge.", quote_style),
        PageBreak(),
        # Page 2
        Paragraph("2. Security Audit & Compliance Statement", h2_style),
        Paragraph("<b>Security Compliance Status:</b> Nexus Cloud currently maintains SOC 2 Type I compliance. Our comprehensive SOC 2 Type II audit is in progress with auditor fieldwork scheduled for completion in Q4 next year.", quote_style),
        Paragraph("<b>ISO Certification:</b> Nexus Cloud holds active ISO 27001 certification across global operations.", quote_style),
        Paragraph("<b>Data Encryption:</b> End-to-end AES-256 data encryption at rest and TLS 1.3 in-transit.", quote_style),
        Paragraph("<b>Data Residency:</b> Production data hosted in US East/West with EU residency planned on future product roadmap.", quote_style),
        Paragraph("<b>Service Level Agreement:</b> 99.9% uptime availability SLA across all cloud clusters.", quote_style),
        PageBreak(),
        # Page 3
        Paragraph("3. Pricing & Contractual Details", h2_style),
        Paragraph("<b>Implementation Fee:</b> $20,000 rapid deployment onboarding package.", quote_style),
        Paragraph("<b>Annual Base License:</b> $125,000 per year base subscription tier.", quote_style),
        Paragraph("<b>Annual Support Fee:</b> $15,000 per year standard enterprise support.", quote_style),
        Paragraph("<b>Renewal Terms:</b> Standard 3.0% annual escalation applied upon yearly contract renewal.", quote_style),
        Paragraph("<b>Liability Limitation:</b> Standard aggregate liability capped at 6 months of paid software subscription fees.", quote_style),
        Paragraph("<b>Auto-Renewal:</b> Contract automatically renews for 12 months with 60-day written cancellation notice.", quote_style),
    ]
    doc3.build(story3)

    return [p1_path, p2_path, p3_path]

if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "generated_pdfs"
    files = create_sample_pdfs(out)
    print(f"Generated {len(files)} sample PDFs at {out}")
