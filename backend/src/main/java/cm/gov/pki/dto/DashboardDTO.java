package cm.gov.pki.dto;


import java.time.LocalDateTime;

/**
 * DTOs pour le Dashboard Administrateur
 */
public class DashboardDTO {

    private Long totalUsers;
    private Long pendingRequests;
    private Long activeCertificates;
    private Long revokedCertificates;
    private CAStatus caStatus;

    public DashboardDTO() {}
    public DashboardDTO(Long totalUsers, Long pendingRequests, Long activeCertificates, Long revokedCertificates, CAStatus caStatus) {
        this.totalUsers = totalUsers;
        this.pendingRequests = pendingRequests;
        this.activeCertificates = activeCertificates;
        this.revokedCertificates = revokedCertificates;
        this.caStatus = caStatus;
    }
    public static Builder builder() { return new Builder(); }

    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { this.totalUsers = totalUsers; }
    public Long getPendingRequests() { return pendingRequests; }
    public void setPendingRequests(Long pendingRequests) { this.pendingRequests = pendingRequests; }
    public Long getActiveCertificates() { return activeCertificates; }
    public void setActiveCertificates(Long activeCertificates) { this.activeCertificates = activeCertificates; }
    public Long getRevokedCertificates() { return revokedCertificates; }
    public void setRevokedCertificates(Long revokedCertificates) { this.revokedCertificates = revokedCertificates; }
    public CAStatus getCaStatus() { return caStatus; }
    public void setCaStatus(CAStatus caStatus) { this.caStatus = caStatus; }

    public static class Builder {
        private Long totalUsers;
        private Long pendingRequests;
        private Long activeCertificates;
        private Long revokedCertificates;
        private CAStatus caStatus;

        public Builder totalUsers(Long totalUsers) { this.totalUsers = totalUsers; return this; }
        public Builder pendingRequests(Long pendingRequests) { this.pendingRequests = pendingRequests; return this; }
        public Builder activeCertificates(Long activeCertificates) { this.activeCertificates = activeCertificates; return this; }
        public Builder revokedCertificates(Long revokedCertificates) { this.revokedCertificates = revokedCertificates; return this; }
        public Builder caStatus(CAStatus caStatus) { this.caStatus = caStatus; return this; }

        public DashboardDTO build() {
            DashboardDTO d = new DashboardDTO();
            d.totalUsers = this.totalUsers;
            d.pendingRequests = this.pendingRequests;
            d.activeCertificates = this.activeCertificates;
            d.revokedCertificates = this.revokedCertificates;
            d.caStatus = this.caStatus;
            return d;
        }
    }

    // Suppression Lombok : constructeur, getters, setters
    public static class CAStatus {
        public CAStatus() {}
        public CAStatus(Boolean isActive, Boolean isInitialized, String caName, LocalDateTime validFrom, LocalDateTime validUntil, Long daysUntilExpiration, String subjectDN) {
            this.isActive = isActive;
            this.isInitialized = isInitialized;
            this.caName = caName;
            this.validFrom = validFrom;
            this.validUntil = validUntil;
            this.daysUntilExpiration = daysUntilExpiration;
            this.subjectDN = subjectDN;
        }
        public static Builder builder() { return new Builder(); }

        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        public Boolean getIsInitialized() { return isInitialized; }
        public void setIsInitialized(Boolean isInitialized) { this.isInitialized = isInitialized; }
        public String getCaName() { return caName; }
        public void setCaName(String caName) { this.caName = caName; }
        public LocalDateTime getValidFrom() { return validFrom; }
        public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }
        public LocalDateTime getValidUntil() { return validUntil; }
        public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }
        public Long getDaysUntilExpiration() { return daysUntilExpiration; }
        public void setDaysUntilExpiration(Long daysUntilExpiration) { this.daysUntilExpiration = daysUntilExpiration; }
        public String getSubjectDN() { return subjectDN; }
        public void setSubjectDN(String subjectDN) { this.subjectDN = subjectDN; }

        public static class Builder {
            private Boolean isActive;
            private Boolean isInitialized;
            private String caName;
            private LocalDateTime validFrom;
            private LocalDateTime validUntil;
            private Long daysUntilExpiration;
            private String subjectDN;

            public Builder isActive(Boolean isActive) { this.isActive = isActive; return this; }
            public Builder isInitialized(Boolean isInitialized) { this.isInitialized = isInitialized; return this; }
            public Builder caName(String caName) { this.caName = caName; return this; }
            public Builder validFrom(LocalDateTime validFrom) { this.validFrom = validFrom; return this; }
            public Builder validUntil(LocalDateTime validUntil) { this.validUntil = validUntil; return this; }
            public Builder daysUntilExpiration(Long daysUntilExpiration) { this.daysUntilExpiration = daysUntilExpiration; return this; }
            public Builder subjectDN(String subjectDN) { this.subjectDN = subjectDN; return this; }

            public CAStatus build() {
                CAStatus s = new CAStatus();
                s.isActive = this.isActive;
                s.isInitialized = this.isInitialized;
                s.caName = this.caName;
                s.validFrom = this.validFrom;
                s.validUntil = this.validUntil;
                s.daysUntilExpiration = this.daysUntilExpiration;
                s.subjectDN = this.subjectDN;
                return s;
            }
        }
        private Boolean isActive;
        private Boolean isInitialized;
        private String caName;
        private LocalDateTime validFrom;
        private LocalDateTime validUntil;
        private Long daysUntilExpiration;
        private String subjectDN;
    }
}