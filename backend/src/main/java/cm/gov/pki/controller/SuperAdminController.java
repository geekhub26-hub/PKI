package cm.gov.pki.controller;

import cm.gov.pki.entity.Parametre;
import cm.gov.pki.repository.ParametreRepository;
import cm.gov.pki.service.RecepissService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    private final ParametreRepository parametreRepository;
    private final RecepissService recepissService;

    public SuperAdminController(ParametreRepository parametreRepository,
                                RecepissService recepissService) {
        this.parametreRepository = parametreRepository;
        this.recepissService     = recepissService;
    }

    @GetMapping("/parametres")
    public ResponseEntity<List<Map<String, String>>> listerParametres() {
        List<Map<String, String>> result = parametreRepository.findAll().stream()
                .map(p -> Map.of(
                        "cle",         p.getCle(),
                        "valeur",      p.getValeur(),
                        "description", p.getDescription() != null ? p.getDescription() : ""
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/parametres/{cle}")
    public ResponseEntity<?> updateParametre(@PathVariable String cle,
                                             @RequestBody Map<String, String> body) {
        String valeur = body.getOrDefault("valeur", "").trim();
        if (valeur.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La valeur ne peut pas être vide."));
        }
        if ("delai_expiration_defaut".equals(cle)) {
            try {
                int v = Integer.parseInt(valeur);
                if (v < 1 || v > 365) throw new NumberFormatException();
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le délai doit être un entier entre 1 et 365 jours."));
            }
        }
        Parametre p = parametreRepository.findById(cle)
                .orElse(new Parametre(cle, valeur, null));
        p.setValeur(valeur);
        parametreRepository.save(p);
        return ResponseEntity.ok(Map.of("cle", cle, "valeur", valeur));
    }

    @GetMapping("/recepisses/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(recepissService.getStats());
    }
}
