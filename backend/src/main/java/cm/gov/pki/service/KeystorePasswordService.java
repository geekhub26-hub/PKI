package cm.gov.pki.service;

import cm.gov.pki.entity.CAConfiguration;

public interface KeystorePasswordService {
    /** Retourne le mot de passe du keystore pour la CA (char[] pour sécurité). */
    char[] getPassword(CAConfiguration ca);
}
