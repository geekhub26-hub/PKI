import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';
import 'models.dart';

class AppState extends ChangeNotifier {
  final ApiClient api;
  AppState(this.api);

  static const _tokenKey = 'mobile_access_token';
  static const _seenNotifKey = 'mobile_seen_notifications';
  static const _dismissedNotifKey = 'mobile_dismissed_notifications';

  String? _token;
  AppUser? user;
  bool loading = false;

  List<CertificateRequestItem> requests = [];
  List<CertificateItem> certificates = [];
  Set<String> seenNotifications = {};
  Set<String> dismissedNotifications = {};

  bool get isLoggedIn => _token != null && user != null;
  String? get token => _token;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    seenNotifications = (prefs.getStringList(_seenNotifKey) ?? []).toSet();
    dismissedNotifications = (prefs.getStringList(_dismissedNotifKey) ?? []).toSet();
    if (_token == null) {
      notifyListeners();
      return;
    }
    try {
      user = await api.getMe(_token!);
      await refreshUserData();
    } catch (_) {
      await logout();
    }
    notifyListeners();
  }

  Future<void> refreshUserData() async {
    if (_token == null) return;
    try {
      requests = await api.getMyRequests(_token!);
    } catch (_) {
      // Keep previous data when backend is temporarily unavailable.
    }
    try {
      certificates = await api.getMyCertificates(_token!);
    } catch (_) {
      // Keep previous data when backend is temporarily unavailable.
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    loading = true;
    notifyListeners();
    try {
      final res = await api.login(email, password);
      final accessToken = (res['accessToken'] ?? res['token'] ?? '').toString();
      if (accessToken.isEmpty) throw ApiException('Token absent');
      _token = accessToken;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, _token!);
      user = await api.getMe(_token!);
      // Do not block login if some optional endpoints (requests/certificates)
      // are temporarily failing on the server.
      await refreshUserData();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> register(String firstName, String lastName, String email, String password) async {
    loading = true;
    notifyListeners();
    try {
      await api.register(firstName, lastName, email, password);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _token = null;
    user = null;
    requests = [];
    certificates = [];
    seenNotifications = {};
    dismissedNotifications = {};
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_seenNotifKey);
    await prefs.remove(_dismissedNotifKey);
    notifyListeners();
  }

  Future<void> submitInitialRequest({
    required Map<String, String> fields,
    required List<File> documents,
  }) async {
    if (_token == null) throw ApiException('Session invalide');
    await api.submitInitialRequest(token: _token!, fields: fields, documents: documents);
    await refreshUserData();
  }

  Future<void> submitCsr({
    required String requestId,
    String? csrText,
    File? csrFile,
  }) async {
    if (_token == null) throw ApiException('Session invalide');
    await api.submitCsr(token: _token!, requestId: requestId, csrText: csrText, csrFile: csrFile);
    await refreshUserData();
  }

  Future<void> generateCsr({
    required String requestId,
    required Map<String, String> payload,
  }) async {
    if (_token == null) throw ApiException('Session invalide');
    await api.generateCsr(token: _token!, requestId: requestId, payload: payload);
    await refreshUserData();
  }

  Future<Map<String, dynamic>> validateToken({
    required String requestId,
    required String validationToken,
  }) async {
    if (_token == null) throw ApiException('Session invalide');
    final res = await api.validateToken(token: _token!, requestId: requestId, validationToken: validationToken);
    await refreshUserData();
    return res;
  }

  Future<File> downloadCertificate({
    required String certId,
    required String format,
    String? password,
    required Directory outputDir,
  }) async {
    if (_token == null) throw ApiException('Session invalide');
    final bytes = await api.downloadCertificate(token: _token!, certId: certId, format: format, password: password);
    final file = File('${outputDir.path}/certificate-$certId.$format');
    await file.writeAsBytes(bytes);
    return file;
  }

  List<AppNotificationItem> get notifications {
    return requests
        .where((r) => r.status != 'PENDING' && r.status != 'PENDING_REVIEW')
        .map(
          (r) => AppNotificationItem(
            id: 'req-${r.id}-${r.status}',
            title: 'Mise a jour de demande',
            message: 'Demande ${r.id.substring(0, 8)} : ${r.status}',
            timestamp: r.submittedAt,
          ),
        )
        .where((n) => !dismissedNotifications.contains(n.id))
        .toList();
  }

  int get unreadCount => notifications.where((n) => !seenNotifications.contains(n.id)).length;

  Future<void> markNotificationRead(String id) async {
    seenNotifications.add(id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_seenNotifKey, seenNotifications.toList());
    notifyListeners();
  }

  Future<void> markAllNotificationsRead() async {
    for (final n in notifications) {
      seenNotifications.add(n.id);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_seenNotifKey, seenNotifications.toList());
    notifyListeners();
  }

  Future<void> dismissNotification(String id) async {
    dismissedNotifications.add(id);
    seenNotifications.remove(id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_dismissedNotifKey, dismissedNotifications.toList());
    await prefs.setStringList(_seenNotifKey, seenNotifications.toList());
    notifyListeners();
  }

  Future<void> restoreDismissedNotifications() async {
    dismissedNotifications.clear();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_dismissedNotifKey);
    notifyListeners();
  }

  Future<void> dismissAllNotifications() async {
    for (final n in notifications) {
      dismissedNotifications.add(n.id);
      seenNotifications.remove(n.id);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_dismissedNotifKey, dismissedNotifications.toList());
    await prefs.setStringList(_seenNotifKey, seenNotifications.toList());
    notifyListeners();
  }

  String exportStateSnapshot() {
    return jsonEncode({
      'user': user?.email,
      'requests': requests.length,
      'certificates': certificates.length,
      'unreadNotifications': unreadCount,
    });
  }
}
