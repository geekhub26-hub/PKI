class AppUser {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;

  AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: (json['id'] ?? '').toString(),
        email: (json['email'] ?? '').toString(),
        firstName: (json['firstName'] ?? '').toString(),
        lastName: (json['lastName'] ?? '').toString(),
        role: (json['role'] ?? '').toString(),
      );
}

class CertificateRequestItem {
  final String id;
  final String status;
  final String commonName;
  final String organization;
  final String email;
  final String submittedAt;
  final String? rejectionReason;

  CertificateRequestItem({
    required this.id,
    required this.status,
    required this.commonName,
    required this.organization,
    required this.email,
    required this.submittedAt,
    this.rejectionReason,
  });

  factory CertificateRequestItem.fromJson(Map<String, dynamic> json) => CertificateRequestItem(
        id: (json['id'] ?? '').toString(),
        status: (json['status'] ?? '').toString(),
        commonName: (json['commonName'] ?? '').toString(),
        organization: (json['organization'] ?? '').toString(),
        email: (json['email'] ?? '').toString(),
        submittedAt: (json['submittedAt'] ?? '').toString(),
        rejectionReason: json['rejectionReason']?.toString(),
      );
}

class CertificateItem {
  final String id;
  final String serialNumber;
  final String subjectDN;
  final String status;
  final String notAfter;

  CertificateItem({
    required this.id,
    required this.serialNumber,
    required this.subjectDN,
    required this.status,
    required this.notAfter,
  });

  factory CertificateItem.fromJson(Map<String, dynamic> json) => CertificateItem(
        id: (json['id'] ?? '').toString(),
        serialNumber: (json['serialNumber'] ?? '').toString(),
        subjectDN: (json['subjectDN'] ?? '').toString(),
        status: (json['status'] ?? '').toString(),
        notAfter: (json['notAfter'] ?? '').toString(),
      );
}

class AppNotificationItem {
  final String id;
  final String title;
  final String message;
  final String timestamp;

  AppNotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
  });
}

class RecepissItem {
  final String id;
  final String numero;
  final String statut;
  final String dateGeneration;
  final String? dateExpiration;
  final String? requestId;

  RecepissItem({
    required this.id,
    required this.numero,
    required this.statut,
    required this.dateGeneration,
    this.dateExpiration,
    this.requestId,
  });

  factory RecepissItem.fromJson(Map<String, dynamic> json) => RecepissItem(
        id: (json['id'] ?? '').toString(),
        numero: (json['numero'] ?? '').toString(),
        statut: (json['statut'] ?? '').toString(),
        dateGeneration: (json['dateGeneration'] ?? json['createdAt'] ?? '').toString(),
        dateExpiration: json['dateExpiration']?.toString(),
        requestId: json['requestId']?.toString(),
      );
}
