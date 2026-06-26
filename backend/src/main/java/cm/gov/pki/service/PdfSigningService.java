package cm.gov.pki.service;

import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfSignatureAppearance;
import com.lowagie.text.pdf.PdfStamper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PdfSigningService {

    private static final Logger log = LoggerFactory.getLogger(PdfSigningService.class);

    private final CAService caService;

    public PdfSigningService(CAService caService) {
        this.caService = caService;
    }

    public byte[] sign(byte[] unsignedPdf) throws Exception {
        CAService.CaSigningMaterial material = caService.getActiveSigningMaterial()
                .orElseThrow(() -> new IllegalStateException("Aucune AC active disponible pour la signature PDF"));

        PdfReader reader;
        try {
            reader = new PdfReader(unsignedPdf);
        } catch (IOException e) {
            throw new IllegalArgumentException("PDF source invalide", e);
        }

        int numPages = reader.getNumberOfPages();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfStamper stamper = PdfStamper.createSignature(reader, out, '\0');

        PdfSignatureAppearance sap = stamper.getSignatureAppearance();
        sap.setCrypto(material.privateKey(), material.chain(), null, PdfSignatureAppearance.WINCER_SIGNED);
        sap.setReason("Signature électronique — PKI Souverain du Cameroun");
        sap.setLocation("Cameroun");

        // Bloc de signature visible en bas de la dernière page (coordonnées PDF = bas-gauche)
        sap.setVisibleSignature(new Rectangle(36, 36, 300, 85), numPages, "PKI-Signature");

        stamper.close();
        log.info("PDF signé avec succès ({} pages)", numPages);
        return out.toByteArray();
    }
}
