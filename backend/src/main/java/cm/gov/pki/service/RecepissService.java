package cm.gov.pki.service;

import cm.gov.pki.entity.CertificateRequest;
import cm.gov.pki.entity.Recepisse;
import cm.gov.pki.entity.User;
import cm.gov.pki.repository.CertificateRequestRepository;
import cm.gov.pki.repository.ParametreRepository;
import cm.gov.pki.repository.RecepissRepository;
import cm.gov.pki.repository.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class RecepissService {

    private static final Logger log = LoggerFactory.getLogger(RecepissService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter NUM_FMT  = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final RecepissRepository recepissRepository;
    private final CertificateRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final ParametreRepository parametreRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final PdfSigningService pdfSigningService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public RecepissService(RecepissRepository recepissRepository,
                           CertificateRequestRepository requestRepository,
                           UserRepository userRepository,
                           ParametreRepository parametreRepository,
                           AuditService auditService,
                           EmailService emailService,
                           SmsService smsService,
                           PdfSigningService pdfSigningService) {
        this.recepissRepository  = recepissRepository;
        this.requestRepository   = requestRepository;
        this.userRepository      = userRepository;
        this.parametreRepository = parametreRepository;
        this.auditService        = auditService;
        this.emailService        = emailService;
        this.smsService          = smsService;
        this.pdfSigningService   = pdfSigningService;
    }

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /** Génère un récépissé pour une demande validée. */
    @Transactional
    public Recepisse generer(UUID requestId, UUID agentId) {
        CertificateRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable"));

        recepissRepository.findByCertificateRequestId(requestId).ifPresent(existing -> {
            if ("VALIDE".equals(existing.getStatut()) || "EXPIRE".equals(existing.getStatut())) {
                throw new IllegalStateException("Un récépissé actif existe déjà pour cette demande.");
            }
        });

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable"));

        int delai = getDelai();
        LocalDateTime now = LocalDateTime.now();

        Recepisse rec = new Recepisse();
        rec.setNumero(genererNumero(now));
        rec.setCertificateRequest(req);
        rec.setDemandeur(req.getUser());
        rec.setAgent(agent);
        rec.setNomComplet(buildNomComplet(req));
        rec.setTypeCertificat(req.getOrganization() != null ? req.getOrganization() : "Certificat Qualifié");
        rec.setDateGeneration(now);
        rec.setDateExpiration(now.plusDays(delai));
        rec.setStatut("VALIDE");

        rec = recepissRepository.save(rec);

        try {
            byte[] pdf = buildPdf(rec);
            String hash = sha256(pdf);
            rec.setHashSha256(hash);

            Path pdfPath = savePdf(rec.getNumero(), pdf);
            rec.setCheminPdf(pdfPath.toString());
            rec = recepissRepository.save(rec);
        } catch (Exception e) {
            log.error("Erreur génération PDF récépissé {}", rec.getNumero(), e);
        }

        auditService.log(agent, "RECEPISSE_GENERE", "recepisse", rec.getId(), Map.of("numero", rec.getNumero()));
        notifierGeneration(rec);
        return rec;
    }

    /** Régénère un récépissé expiré → crée un nouveau, marque l'ancien REMPLACE. */
    @Transactional
    public Recepisse regenerer(UUID recepissId, UUID agentId) {
        Recepisse ancien = recepissRepository.findById(recepissId)
                .orElseThrow(() -> new IllegalArgumentException("Récépissé introuvable"));

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable"));

        int delai = getDelai();
        LocalDateTime now = LocalDateTime.now();

        Recepisse nouveau = new Recepisse();
        nouveau.setNumero(genererNumero(now));
        nouveau.setCertificateRequest(ancien.getCertificateRequest());
        nouveau.setDemandeur(ancien.getDemandeur());
        nouveau.setAgent(agent);
        nouveau.setNomComplet(ancien.getNomComplet());
        nouveau.setTypeCertificat(ancien.getTypeCertificat());
        nouveau.setDateGeneration(now);
        nouveau.setDateExpiration(now.plusDays(delai));
        nouveau.setStatut("VALIDE");
        nouveau.setRecepisseRemplace(ancien);

        nouveau = recepissRepository.save(nouveau);

        try {
            byte[] pdf = buildPdf(nouveau, "Remplace " + ancien.getNumero());
            String hash = sha256(pdf);
            nouveau.setHashSha256(hash);
            nouveau.setCheminPdf(savePdf(nouveau.getNumero(), pdf).toString());
            nouveau = recepissRepository.save(nouveau);
        } catch (Exception e) {
            log.error("Erreur génération PDF regen {}", nouveau.getNumero(), e);
        }

        ancien.setStatut("REMPLACE");
        recepissRepository.save(ancien);

        auditService.log(agent, "RECEPISSE_REGENERE", "recepisse", nouveau.getId(), Map.of("numero", nouveau.getNumero(), "remplace", ancien.getNumero()));
        notifierRegeneration(nouveau, ancien.getNumero());
        return nouveau;
    }

    /** Annule un récépissé avec un motif obligatoire. */
    @Transactional
    public Recepisse annuler(UUID recepissId, String motif, UUID agentId) {
        if (motif == null || motif.isBlank()) {
            throw new IllegalArgumentException("Le motif d'annulation est obligatoire.");
        }
        Recepisse rec = recepissRepository.findById(recepissId)
                .orElseThrow(() -> new IllegalArgumentException("Récépissé introuvable"));

        rec.setStatut("ANNULE");
        rec.setDateAnnulation(LocalDateTime.now());
        rec.setMotifAnnulation(motif);
        rec = recepissRepository.save(rec);

        User agent = userRepository.findById(agentId).orElse(null);
        auditService.log(agent, "RECEPISSE_ANNULE", "recepisse", rec.getId(), Map.of("numero", rec.getNumero(), "motif", motif));
        return rec;
    }

    /** Vérification publique par numéro. */
    @Transactional(readOnly = true)
    public Map<String, Object> verifier(String numero) {
        Optional<Recepisse> opt = recepissRepository.findByNumero(numero);
        Map<String, Object> result = new LinkedHashMap<>();
        if (opt.isEmpty()) {
            result.put("found", false);
            result.put("message", "Aucun récépissé trouvé avec ce numéro.");
            return result;
        }
        Recepisse rec = opt.get();
        refreshStatutSiExpire(rec);

        result.put("found", true);
        result.put("numero", rec.getNumero());
        result.put("statut", rec.getStatut());
        result.put("nomComplet", rec.getNomComplet());
        result.put("typeCertificat", rec.getTypeCertificat());
        result.put("dateGeneration", rec.getDateGeneration().format(DATE_FMT));
        result.put("dateExpiration", rec.getDateExpiration().format(DATE_FMT));
        result.put("hashSha256", rec.getHashSha256());
        if ("ANNULE".equals(rec.getStatut())) {
            result.put("motifAnnulation", rec.getMotifAnnulation());
        }
        if ("REMPLACE".equals(rec.getStatut()) && rec.getRecepisseRemplace() != null) {
            result.put("remplacePar", rec.getNumero());
        }
        return result;
    }

    /** Liste de tous les récépissés (admin). */
    @Transactional(readOnly = true)
    public List<Recepisse> listerTous() {
        List<Recepisse> list = recepissRepository.findAllByOrderByDateGenerationDesc();
        list.forEach(this::refreshStatutSiExpire);
        return list;
    }

    /** Liste des récépissés d'un usager. */
    @Transactional(readOnly = true)
    public List<Recepisse> listerPourUsager(UUID userId) {
        List<Recepisse> list = recepissRepository.findByDemandeurIdOrderByDateGenerationDesc(userId);
        list.forEach(this::refreshStatutSiExpire);
        return list;
    }

    /** Retourne les bytes du PDF d'un récépissé. */
    public byte[] getPdfBytes(UUID recepissId) throws IOException {
        Recepisse rec = recepissRepository.findById(recepissId)
                .orElseThrow(() -> new IllegalArgumentException("Récépissé introuvable"));
        if (rec.getCheminPdf() != null) {
            Path p = Path.of(rec.getCheminPdf());
            if (Files.exists(p)) return Files.readAllBytes(p);
        }
        // Régénère le PDF à la volée si le fichier n'existe plus
        try {
            return buildPdf(rec);
        } catch (DocumentException | WriterException e) {
            throw new IOException("Impossible de générer le PDF", e);
        }
    }

    public byte[] getSignedPdfBytes(UUID recepissId) throws Exception {
        return pdfSigningService.sign(getPdfBytes(recepissId));
    }

    // ─────────────────────────────────────────────
    // Scheduler : marque EXPIRE à minuit
    // ─────────────────────────────────────────────

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void marquerExpires() {
        List<Recepisse> expired = recepissRepository.findExpiredToUpdate(LocalDateTime.now());
        expired.forEach(r -> r.setStatut("EXPIRE"));
        if (!expired.isEmpty()) recepissRepository.saveAll(expired);
        if (!expired.isEmpty()) log.info("{} récépissé(s) marqué(s) EXPIRE", expired.size());
    }

    /** Rappels email quotidiens J-15, J-7, J-1 avant expiration (chaque matin à 8h). */
    @Scheduled(cron = "0 0 8 * * *")
    public void envoyerRappelsExpiration() {
        LocalDateTime now = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        int[] joursAlerte = {15, 7, 1};
        for (int j : joursAlerte) {
            LocalDateTime debut = now.plusDays(j);
            LocalDateTime fin   = debut.plusDays(1);
            List<Recepisse> aRappeler = recepissRepository.findExpiringBetween(debut, fin);
            for (Recepisse rec : aRappeler) {
                User dem = rec.getDemandeur();
                if (dem == null || dem.getEmail() == null) continue;
                String sujet = "Récépissé " + rec.getNumero() + " — expiration dans " + j + " jour(s)";
                String corps = "Bonjour " + rec.getNomComplet() + ",\n\n"
                        + "Votre récépissé électronique " + rec.getNumero()
                        + " expire le " + rec.getDateExpiration().format(DATE_FMT) + ".\n"
                        + "Merci de contacter un administrateur pour le renouveler avant cette date.\n\n"
                        + "Cordialement,\nL'équipe ANTIC";
                try {
                    emailService.sendSimpleEmail(dem.getEmail(), sujet, corps);
                    log.info("Rappel J-{} envoyé pour {} à {}", j, rec.getNumero(), dem.getEmail());
                } catch (Exception e) {
                    log.warn("Impossible d'envoyer le rappel J-{} pour {} : {}", j, rec.getNumero(), e.getMessage());
                }
                if (dem.getTelephone() != null) {
                    smsService.sendRappelExpiration(
                        dem.getTelephone(), rec.getNumero(), j,
                        rec.getDateExpiration().format(DATE_FMT)
                    );
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Stats
    // ─────────────────────────────────────────────

    public byte[] exportCsv() {
        List<Recepisse> all = recepissRepository.findAllByOrderByDateGenerationDesc();
        all.forEach(this::refreshStatutSiExpire);
        StringBuilder sb = new StringBuilder();
        sb.append("Numéro,Nom complet,Type certificat,Statut,Date génération,Date expiration,Hash SHA-256\n");
        for (Recepisse r : all) {
            sb.append(csv(r.getNumero())).append(',')
              .append(csv(r.getNomComplet())).append(',')
              .append(csv(r.getTypeCertificat())).append(',')
              .append(csv(r.getStatut())).append(',')
              .append(csv(r.getDateGeneration().format(DATE_FMT))).append(',')
              .append(csv(r.getDateExpiration().format(DATE_FMT))).append(',')
              .append(csv(r.getHashSha256())).append('\n');
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    /** Export Excel (.xlsx) de tous les récépissés. */
    public byte[] exportExcel() {
        List<Recepisse> all = recepissRepository.findAllByOrderByDateGenerationDesc();
        all.forEach(this::refreshStatutSiExpire);

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = wb.createSheet("Récépissés");

            // Style en-tête
            org.apache.poi.ss.usermodel.CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"Numéro", "Nom complet", "Type certificat", "Statut", "Date génération", "Date expiration", "Hash SHA-256"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Recepisse r : all) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getNumero() != null ? r.getNumero() : "");
                row.createCell(1).setCellValue(r.getNomComplet() != null ? r.getNomComplet() : "");
                row.createCell(2).setCellValue(r.getTypeCertificat() != null ? r.getTypeCertificat() : "");
                row.createCell(3).setCellValue(r.getStatut() != null ? r.getStatut() : "");
                row.createCell(4).setCellValue(r.getDateGeneration() != null ? r.getDateGeneration().format(DATE_FMT) : "");
                row.createCell(5).setCellValue(r.getDateExpiration() != null ? r.getDateExpiration().format(DATE_FMT) : "");
                row.createCell(6).setCellValue(r.getHashSha256() != null ? r.getHashSha256() : "");
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erreur export Excel récépissés", e);
            throw new RuntimeException("Impossible de générer l'export Excel", e);
        }
    }

    private static String csv(String v) {
        if (v == null) return "";
        if (v.contains(",") || v.contains("\"") || v.contains("\n"))
            return "\"" + v.replace("\"", "\"\"") + "\"";
        return v;
    }

    public Map<String, Object> getStats() {
        List<Recepisse> all = recepissRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        // Actualise les statuts expirés en mémoire (sans transaction)
        all.forEach(r -> {
            if ("VALIDE".equals(r.getStatut()) && r.getDateExpiration().isBefore(now)) {
                r.setStatut("EXPIRE");
            }
        });

        long total = all.size();

        Map<String, Long> parStatut = new LinkedHashMap<>();
        parStatut.put("VALIDE",   0L);
        parStatut.put("EXPIRE",   0L);
        parStatut.put("ANNULE",   0L);
        parStatut.put("REMPLACE", 0L);
        all.forEach(r -> parStatut.merge(r.getStatut(), 1L, Long::sum));

        long remplace  = parStatut.get("REMPLACE");
        long expire    = parStatut.get("EXPIRE");
        double tauxRegen = (remplace + expire) > 0
                ? Math.round(remplace * 1000.0 / (remplace + expire)) / 10.0
                : 0.0;

        java.time.YearMonth moisCourant = java.time.YearMonth.now();
        long totalCeMois = all.stream()
                .filter(r -> java.time.YearMonth.from(r.getDateGeneration()).equals(moisCourant))
                .count();
        long totalAujourdhui = all.stream()
                .filter(r -> r.getDateGeneration().toLocalDate().equals(now.toLocalDate()))
                .count();

        List<Map<String, Object>> volumesMois = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.YearMonth m = moisCourant.minusMonths(i);
            long count = all.stream()
                    .filter(r -> java.time.YearMonth.from(r.getDateGeneration()).equals(m))
                    .count();
            volumesMois.add(Map.of("mois", m.toString(), "count", count));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total",           total);
        result.put("parStatut",       parStatut);
        result.put("tauxRegen",       tauxRegen);
        result.put("totalCeMois",     totalCeMois);
        result.put("totalAujourdhui", totalAujourdhui);
        result.put("volumesMois",     volumesMois);
        return result;
    }

    // ─────────────────────────────────────────────
    // Génération du numéro unique
    // ─────────────────────────────────────────────

    private synchronized String genererNumero(LocalDateTime now) {
        String entite = parametreRepository.findById("entite_code")
                .map(p -> p.getValeur()).orElse("ANTIC");
        String dateStr = now.format(NUM_FMT);
        String prefix  = "REC-" + dateStr + "-" + entite + "-";

        long count = recepissRepository.countByDateAndPrefix(now, prefix);
        String seq = String.format("%06d", count + 1);
        return prefix + seq;
    }

    // ─────────────────────────────────────────────
    // Génération du PDF A4 (logo ANTIC + QR code)
    // ─────────────────────────────────────────────

    private byte[] buildPdf(Recepisse rec) throws DocumentException, IOException, WriterException {
        return buildPdf(rec, null);
    }

    private byte[] buildPdf(Recepisse rec, String mention) throws DocumentException, IOException, WriterException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 50, 50, 60, 60);
        PdfWriter writer = PdfWriter.getInstance(doc, out);

        doc.open();

        // ── En-tête : logo ANTIC + titre ──────────────────────
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{1.5f, 4f});
        header.setSpacingAfter(15);

        // Logo
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        try {
            byte[] logoBytes = loadLogoBytes();
            if (logoBytes != null) {
                Image logo = Image.getInstance(logoBytes);
                logo.scaleToFit(80, 80);
                logoCell.addElement(logo);
            }
        } catch (Exception ignored) {}
        header.addCell(logoCell);

        // Titre
        PdfPCell titreCell = new PdfPCell();
        titreCell.setBorder(Rectangle.NO_BORDER);
        titreCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titreCell.setPaddingLeft(10);

        Font titleFont = new Font(Font.HELVETICA, 13, Font.BOLD, new Color(0, 90, 160));
        Font subFont   = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

        titreCell.addElement(new Paragraph("AGENCE NATIONALE DES TECHNOLOGIES", titleFont));
        titreCell.addElement(new Paragraph("DE L'INFORMATION ET DE LA COMMUNICATION", titleFont));
        Paragraph sub = new Paragraph("REPUBLIC OF CAMEROON - ANTICERT", subFont);
        sub.setSpacingBefore(4);
        titreCell.addElement(sub);
        header.addCell(titreCell);
        doc.add(header);

        // ── Ligne séparatrice ──
        LineSeparator line = new LineSeparator(1, 100, new Color(0, 90, 160), Element.ALIGN_CENTER, -2);
        doc.add(new Chunk(line));
        doc.add(Chunk.NEWLINE);

        // ── Titre du document ──────────────────────────────────
        Font recFont = new Font(Font.HELVETICA, 15, Font.BOLD, new Color(0, 90, 160));
        Paragraph recTitle = new Paragraph("RÉCÉPISSÉ DE DEMANDE DE CERTIFICAT ÉLECTRONIQUE", recFont);
        recTitle.setAlignment(Element.ALIGN_CENTER);
        recTitle.setSpacingAfter(4);
        doc.add(recTitle);

        Font numFont = new Font(Font.HELVETICA, 11, Font.BOLD, Color.DARK_GRAY);
        Paragraph numPara = new Paragraph("N° " + rec.getNumero(), numFont);
        numPara.setAlignment(Element.ALIGN_CENTER);
        numPara.setSpacingAfter(16);
        doc.add(numPara);

        if (mention != null) {
            Font mentionFont = new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(180, 60, 0));
            Paragraph mentionPara = new Paragraph("(" + mention + ")", mentionFont);
            mentionPara.setAlignment(Element.ALIGN_CENTER);
            mentionPara.setSpacingAfter(10);
            doc.add(mentionPara);
        }

        // ── Corps : informations demandeur ─────────────────────
        Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
        Font valueFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{2f, 3f});
        infoTable.setSpacingBefore(8);
        infoTable.setSpacingAfter(16);

        addRow(infoTable, "Nom complet :", rec.getNomComplet(), labelFont, valueFont);
        addRow(infoTable, "Type de certificat :", rec.getTypeCertificat(), labelFont, valueFont);
        addRow(infoTable, "Date de génération :", rec.getDateGeneration().format(DATE_FMT), labelFont, valueFont);
        addRow(infoTable, "Date d'expiration :", rec.getDateExpiration().format(DATE_FMT), labelFont, valueFont);
        addRow(infoTable, "Statut :", rec.getStatut(), labelFont, valueFont);
        if (rec.getAgent() != null) {
            String agentName = rec.getAgent().getFirstName() + " " + rec.getAgent().getLastName();
            addRow(infoTable, "Agent initiateur :", agentName, labelFont, valueFont);
        }
        doc.add(infoTable);

        // ── Intégrité SHA-256 ──────────────────────────────────
        Font hashLabelFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.GRAY);
        Font hashFont      = new Font(Font.COURIER, 8, Font.NORMAL, Color.DARK_GRAY);
        PdfPTable hashTable = new PdfPTable(1);
        hashTable.setWidthPercentage(100);
        hashTable.setSpacingAfter(16);
        PdfPCell hashCell = new PdfPCell();
        hashCell.setBorderColor(new Color(200, 200, 200));
        hashCell.setBackgroundColor(new Color(248, 248, 248));
        hashCell.setPadding(8);
        hashCell.addElement(new Paragraph("Empreinte SHA-256 :", hashLabelFont));
        hashCell.addElement(new Paragraph(rec.getHashSha256() != null ? rec.getHashSha256() : "En cours de calcul...", hashFont));
        hashTable.addCell(hashCell);
        doc.add(hashTable);

        // ── QR Code + légende ──────────────────────────────────
        String verifyUrl = frontendUrl + "/#/verify?numero=" + rec.getNumero();
        try {
            byte[] qrBytes = generateQrCode(verifyUrl, 150);
            Image qr = Image.getInstance(qrBytes);
            qr.scaleToFit(110, 110);
            qr.setAlignment(Element.ALIGN_CENTER);

            PdfPTable qrTable = new PdfPTable(1);
            qrTable.setWidthPercentage(35);
            qrTable.setHorizontalAlignment(Element.ALIGN_CENTER);
            qrTable.setSpacingAfter(4);

            PdfPCell qrCell = new PdfPCell(qr);
            qrCell.setBorder(Rectangle.NO_BORDER);
            qrCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            qrTable.addCell(qrCell);
            doc.add(qrTable);

            Font qrLegend = new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY);
            Paragraph qrPara = new Paragraph("Scannez ce QR code ou rendez-vous sur " + frontendUrl + "/#/verify", qrLegend);
            qrPara.setAlignment(Element.ALIGN_CENTER);
            qrPara.setSpacingAfter(16);
            doc.add(qrPara);
        } catch (Exception e) {
            log.warn("QR code non généré : {}", e.getMessage());
        }

        // ── Pied de page ──────────────────────────────────────
        LineSeparator line2 = new LineSeparator(0.5f, 100, new Color(180, 180, 180), Element.ALIGN_CENTER, -2);
        doc.add(new Chunk(line2));

        Font footerFont = new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY);
        Paragraph footer = new Paragraph(
            "Ce document est émis électroniquement par l'ANTIC Cameroun. " +
            "Toute falsification est passible de poursuites conformément à la loi n°2010/012 du Cameroun.",
            footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(6);
        doc.add(footer);

        doc.close();
        return out.toByteArray();
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, labelFont));
        l.setBorderColor(new Color(220, 220, 220));
        l.setPadding(6);
        l.setBackgroundColor(new Color(245, 247, 250));

        PdfPCell v = new PdfPCell(new Phrase(value != null ? value : "—", valueFont));
        v.setBorderColor(new Color(220, 220, 220));
        v.setPadding(6);

        table.addCell(l);
        table.addCell(v);
    }

    private byte[] generateQrCode(String content, int size) throws WriterException, IOException {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size);
        BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
    }

    private byte[] loadLogoBytes() {
        // Essaie de charger le logo depuis classpath ou chemin connu
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("static/logo.jpeg")) {
            if (is != null) return is.readAllBytes();
        } catch (Exception ignored) {}
        // Fallback : chemin absolu en développement
        try {
            Path p = Path.of(System.getProperty("user.dir")).resolve("logo.jpeg");
            if (Files.exists(p)) return Files.readAllBytes(p);
        } catch (Exception ignored) {}
        return null;
    }

    private Path savePdf(String numero, byte[] bytes) throws IOException {
        String configured = System.getenv("PKI_UPLOAD_DIR");
        Path base = configured != null && !configured.isBlank()
                ? Path.of(configured)
                : Path.of(System.getProperty("user.dir"), "uploads");
        Path dir = base.resolve("recepisses");
        Files.createDirectories(dir);
        Path file = dir.resolve(numero + ".pdf");
        Files.write(file, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return file;
    }

    private String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private String buildNomComplet(CertificateRequest req) {
        String fn = req.getFirstName() != null ? req.getFirstName() : "";
        String ln = req.getLastName()  != null ? req.getLastName()  : "";
        String full = (fn + " " + ln).trim();
        return full.isBlank() ? req.getCommonName() : full;
    }

    private int getDelai() {
        return parametreRepository.findById("delai_expiration_defaut")
                .map(p -> {
                    try { return Integer.parseInt(p.getValeur()); } catch (NumberFormatException e) { return 15; }
                }).orElse(15);
    }

    private void refreshStatutSiExpire(Recepisse rec) {
        if ("VALIDE".equals(rec.getStatut()) && rec.isExpire()) {
            rec.setStatut("EXPIRE");
            recepissRepository.save(rec);
        }
    }

    private void notifierGeneration(Recepisse rec) {
        if (rec.getDemandeur() == null) return;
        try {
            String subject = "Votre récépissé N°" + rec.getNumero() + " est disponible";
            String body = "Bonjour " + rec.getNomComplet() + ",\n\n"
                    + "Votre récépissé de demande de certificat électronique a été généré.\n"
                    + "Numéro : " + rec.getNumero() + "\n"
                    + "Date d'expiration : " + rec.getDateExpiration().format(DATE_FMT) + "\n\n"
                    + "Connectez-vous à la plateforme pour le télécharger.\n\nANTIC Cameroun";
            emailService.sendSimpleEmail(rec.getDemandeur().getEmail(), subject, body);
        } catch (Exception e) {
            log.warn("Notification email non envoyée : {}", e.getMessage());
        }
        if (rec.getDemandeur().getTelephone() != null) {
            smsService.sendRecepisseGenere(
                rec.getDemandeur().getTelephone(),
                rec.getNumero(),
                rec.getDateExpiration().format(DATE_FMT)
            );
        }
    }

    private void notifierRegeneration(Recepisse nouveau, String ancienNumero) {
        if (nouveau.getDemandeur() == null) return;
        try {
            String subject = "Nouveau récépissé N°" + nouveau.getNumero() + " disponible";
            String body = "Bonjour " + nouveau.getNomComplet() + ",\n\n"
                    + "Un nouveau récépissé a été généré en remplacement de " + ancienNumero + ".\n"
                    + "Numéro : " + nouveau.getNumero() + "\n"
                    + "Date d'expiration : " + nouveau.getDateExpiration().format(DATE_FMT) + "\n\n"
                    + "Connectez-vous à la plateforme pour le télécharger.\n\nANTIC Cameroun";
            emailService.sendSimpleEmail(nouveau.getDemandeur().getEmail(), subject, body);
        } catch (Exception e) {
            log.warn("Notification regen non envoyée : {}", e.getMessage());
        }
        if (nouveau.getDemandeur().getTelephone() != null) {
            smsService.sendRecepisseGenere(
                nouveau.getDemandeur().getTelephone(),
                nouveau.getNumero(),
                nouveau.getDateExpiration().format(DATE_FMT)
            );
        }
    }
}
