import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

def generate_case_pdf(case_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )

    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = TA_CENTER
    heading_style = styles['Heading2']
    normal_style = styles['Normal']
    
    # Custom tight style for lists
    tight_style = ParagraphStyle(
        'Tight',
        parent=styles['Normal'],
        spaceAfter=2,
        spaceBefore=2
    )

    story = []

    # Title
    story.append(Paragraph("Informe Clínico - CLINOTE", title_style))
    story.append(Spacer(1, 12))

    # Meta
    created_at = case_data.get("created_at", "")
    if created_at:
        try:
            # Parse ISO datetime and format it
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            formatted_date = dt.strftime("%d/%m/%Y %H:%M")
        except:
            formatted_date = created_at
    else:
        formatted_date = "Fecha no disponible"

    story.append(Paragraph(f"<b>Fecha:</b> {formatted_date}", normal_style))
    story.append(Paragraph(f"<b>Tipo de Nota:</b> {case_data.get('note_type', 'N/A').title()}", normal_style))
    story.append(Spacer(1, 24))

    # SOAP
    soap = case_data.get("soap_structured", {})
    if soap:
        story.append(Paragraph("Estructura SOAP", heading_style))
        story.append(Spacer(1, 6))

        for key, title in [("S", "Subjetivo"), ("O", "Objetivo"), ("A", "Análisis"), ("P", "Plan")]:
            if soap.get(key):
                story.append(Paragraph(f"<b>{title}:</b>", normal_style))
                story.append(Paragraph(soap.get(key).replace("\n", "<br/>"), tight_style))
                story.append(Spacer(1, 12))

    # Entities summary (Diagnoses, Medications)
    entities = case_data.get("entities", {})
    if entities:
        # Diagnoses
        diagnoses = entities.get("diagnoses", [])
        if diagnoses:
            story.append(Paragraph("Diagnósticos Detectados", heading_style))
            for diag in diagnoses:
                status = "(Histórico)" if diag.get("temporal") == "historical" else ""
                negated = " (Descartado)" if diag.get("negated") else ""
                story.append(Paragraph(f"• {diag.get('display', '')} {status}{negated}", tight_style))
            story.append(Spacer(1, 12))

        # Medications
        medications = entities.get("medications", [])
        if medications:
            story.append(Paragraph("Medicamentos Extraídos", heading_style))
            for med in medications:
                story.append(Paragraph(
                    f"• <b>{med.get('name', '').title()}</b> - {med.get('dose', '')} {med.get('frequency', '')} ({med.get('status', '')})",
                    tight_style
                ))
            story.append(Spacer(1, 12))

    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
