import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors

# Brand palette
NAVY   = colors.HexColor("#0F1B2D")
NAVY2  = colors.HexColor("#162236")
TEAL   = colors.HexColor("#00D4AA")
CREAM  = colors.HexColor("#F8F4EF")
GRAY   = colors.HexColor("#6B7280")
RED    = colors.HexColor("#EF4444")
AMBER  = colors.HexColor("#F59E0B")

NOTE_TYPE_LABELS = {
    "ambulatory": "Consulta ambulatoria",
    "emergency":  "Urgencias",
    "discharge":  "Informe de alta",
    "unknown":    "Nota clínica",
}

SOAP_LABELS = {
    "S": "Subjetivo — Anamnesis",
    "O": "Objetivo — Exploración y pruebas",
    "A": "Valoración diagnóstica",
    "P": "Plan terapéutico",
}

SEVERITY_LABEL = {"critical": "CRÍTICA", "warning": "ADVERTENCIA", "info": "INFORMATIVA"}
SEVERITY_COLOR = {"critical": RED, "warning": AMBER, "info": GRAY}


def _styles():
    base = getSampleStyleSheet()

    def make(name, parent="Normal", **kw):
        return ParagraphStyle(name, parent=base[parent], **kw)

    return {
        "title": make("CTitle", "Normal",
                      fontSize=18, fontName="Helvetica-Bold",
                      textColor=CREAM, alignment=TA_LEFT, spaceAfter=2),
        "subtitle": make("CSub", "Normal",
                         fontSize=10, textColor=colors.HexColor("#9CA3AF"),
                         alignment=TA_LEFT, spaceAfter=0),
        "section": make("CSec", "Normal",
                        fontSize=11, fontName="Helvetica-Bold",
                        textColor=TEAL, spaceBefore=14, spaceAfter=4),
        "label": make("CLabel", "Normal",
                      fontSize=8, fontName="Helvetica-Bold",
                      textColor=colors.HexColor("#9CA3AF"), spaceAfter=2),
        "body": make("CBody", "Normal",
                     fontSize=9, textColor=CREAM,
                     leading=14, spaceAfter=6),
        "bullet": make("CBullet", "Normal",
                       fontSize=9, textColor=CREAM,
                       leading=13, leftIndent=12, spaceAfter=3),
        "meta": make("CMeta", "Normal",
                     fontSize=8, textColor=colors.HexColor("#9CA3AF"),
                     alignment=TA_RIGHT),
        "disclaimer": make("CDisc", "Normal",
                           fontSize=7, textColor=colors.HexColor("#6B7280"),
                           alignment=TA_CENTER, leading=10),
        "alert_crit": make("ACrit", "Normal",
                           fontSize=8, textColor=RED, leading=12),
        "alert_warn": make("AWarn", "Normal",
                           fontSize=8, textColor=AMBER, leading=12),
        "alert_info": make("AInfo", "Normal",
                           fontSize=8, textColor=GRAY, leading=12),
    }


def generate_case_pdf(case_data: dict, clinic_name: str = "CLINOTE", doctor_name: str = "") -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=1.5*cm,
        bottomMargin=2*cm,
        title="Informe Clínico — CLINOTE",
    )

    S = _styles()
    story = []
    W = A4[0] - 4*cm  # usable width

    # ── HEADER ──────────────────────────────────────────────────────────────
    created_at = case_data.get("created_at", "")
    try:
        dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        formatted_date = dt.strftime("%d/%m/%Y %H:%M")
    except Exception:
        formatted_date = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M")

    note_type = case_data.get("note_type", "unknown")
    note_label = NOTE_TYPE_LABELS.get(note_type, "Nota clínica")

    header_data = [[
        Paragraph(f"<b>{clinic_name}</b>", S["title"]),
        Paragraph(f"{note_label}<br/>{formatted_date}", S["meta"]),
    ]]
    header_table = Table(header_data, colWidths=[W * 0.65, W * 0.35])
    header_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), NAVY2),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [NAVY2]),
        ("TOPPADDING",  (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (0, -1), 14),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 14),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    story.append(header_table)
    if doctor_name:
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"Responsable: {doctor_name}", S["subtitle"]))
    story.append(Spacer(1, 16))

    # ── SOAP ────────────────────────────────────────────────────────────────
    soap = case_data.get("soap_structured") or {}
    if any(soap.get(k) for k in "SOAP"):
        story.append(Paragraph("ESTRUCTURA SOAP", S["section"]))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#1D2E45")))
        story.append(Spacer(1, 6))

        for key in "SOAP":
            text = (soap.get(key) or "").strip()
            if text:
                story.append(Paragraph(SOAP_LABELS[key].upper(), S["label"]))
                story.append(Paragraph(text.replace("\n", "<br/>"), S["body"]))

    # ── ENTITIES ────────────────────────────────────────────────────────────
    entities = case_data.get("entities") or {}

    diagnoses = [d for d in (entities.get("diagnoses") or []) if not d.get("negated")]
    if diagnoses:
        story.append(Paragraph("DIAGNÓSTICOS ACTIVOS", S["section"]))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#1D2E45")))
        story.append(Spacer(1, 6))
        for d in diagnoses:
            tag = " (histórico)" if d.get("temporal") == "historical" else ""
            story.append(Paragraph(f"• {d.get('display', '')}{tag}", S["bullet"]))

    medications = entities.get("medications") or []
    if medications:
        story.append(Paragraph("TRATAMIENTO FARMACOLÓGICO", S["section"]))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#1D2E45")))
        story.append(Spacer(1, 6))
        for m in medications:
            parts = [m.get("name", "").title()]
            if m.get("dose"):      parts.append(m["dose"])
            if m.get("frequency"): parts.append(m["frequency"])
            if m.get("route"):     parts.append(f"vía {m['route']}")
            story.append(Paragraph(f"• {' — '.join(parts)}", S["bullet"]))

    vitals = entities.get("vitals") or []
    labs   = entities.get("lab_values") or []
    if vitals or labs:
        story.append(Paragraph("CONSTANTES Y ANALÍTICA", S["section"]))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#1D2E45")))
        story.append(Spacer(1, 6))
        for v in vitals:
            story.append(Paragraph(
                f"• {v.get('type','')} {v.get('value','')} {v.get('unit','')}".strip(),
                S["bullet"]))
        for l in labs:
            flag = f" ⚠ ({l.get('flag','')})" if l.get("flag") and l["flag"] != "normal" else ""
            story.append(Paragraph(
                f"• {l.get('name','')} {l.get('value','')} {l.get('unit','')}{flag}".strip(),
                S["bullet"]))

    allergies = entities.get("allergies") or []
    if allergies:
        story.append(Paragraph("ALERGIAS E INTOLERANCIAS", S["section"]))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#1D2E45")))
        story.append(Spacer(1, 6))
        for a in allergies:
            story.append(Paragraph(
                f"• {a.get('substance','')} — {a.get('reaction','')} ({a.get('severity','')})",
                S["bullet"]))

    # ── ALERTS ──────────────────────────────────────────────────────────────
    # cases router embeds alerts as list under key "alerts"
    alerts = case_data.get("alerts") or []
    critical_alerts = [a for a in alerts if a.get("severity") == "critical"]
    other_alerts    = [a for a in alerts if a.get("severity") != "critical"]

    if alerts:
        story.append(Paragraph("ALERTAS CLÍNICAS", S["section"]))
        story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#1D2E45")))
        story.append(Spacer(1, 6))
        for alert in critical_alerts + other_alerts:
            sev   = alert.get("severity", "info")
            label = SEVERITY_LABEL.get(sev, sev.upper())
            color = SEVERITY_COLOR.get(sev, GRAY)
            sty   = S.get(f"alert_{sev}", S["alert_info"])
            msg   = alert.get("message", "")
            detail = alert.get("detail", "")
            text = f"[{label}] {msg}"
            if detail:
                text += f" — {detail}"
            story.append(Paragraph(text, sty))

    # ── DISCLAIMER ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#1D2E45")))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Documento generado con apoyo de inteligencia artificial por CLINOTE. "
        "Su contenido es responsabilidad exclusiva del profesional sanitario que lo revisa y suscribe. "
        "CLINOTE no constituye un dispositivo médico certificado. "
        f"Generado el {formatted_date}.",
        S["disclaimer"]
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
