import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';
import 'models.dart';

class AppState extends ChangeNotifier {
  final ApiClient api;
  AppState(this.api);

  static const _tokenKey = 'mobile_access_token';
  static const _refreshTokenKey = 'mobile_refresh_token';
  static const _seenNotifKey = 'mobile_seen_notifications';
  static const _dismissedNotifKey = 'mobile_dismissed_notifications';
  static const _secureStorage = FlutterSecureStorage();

  String? _token;
  String? _refreshToken;
  AppUser? user;
  bool loading = false;

  List<CertificateRequestItem> requests = [];
  List<CertificateItem> certificates = [];
  List<RecepissItem> recepisses = [];
  Set<String> seenNotifications = {};
  Set<String> dismissedNotifications = {};

  bool get isLoggedIn => _token != null && user != null;
  String? get token => _token;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = await _secureStorage.read(key: _tokenKey);
    _refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    final legacyToken = prefs.getString(_tokenKey);
    if (_token == null && legacyToken != null && legacyToken.isNotEmpty) {
      _token = legacyToken;
      await _secureStorage.write(key: _tokenKey, value: legacyToken);
      await prefs.remove(_tokenKey);
    }
    seenNotifications = (prefs.getStringList(_seenNotifKey) ?? []).toSet();
    dismissedNotifications = (prefs.getStringList(_dismissedNotifKey) ?? []).toSet();
    if (_token == null) {
      notifyListeners();
      return;
    }
    try {
      user = await api.getMe(_token!);
      await refreshUserData();
    } catch (e) {
      if (_isSessionExpiredError(e) && await _tryRefreshToken()) {
        try {
          user = await api.getMe(_token!);
          await refreshUserData();
          notifyListeners();
          return;
        } catch (_) {}
      }
      await logout();
    }
    notifyListeners();
  }

  bool _isSessionExpiredError(Object e) {
    if (e is! ApiException) return false;
    final msg = e.message.toLowerCase();
    return msg.contains('session') || msg.contains('expir') || msg.contains('token');
  }

  Future<bool> _tryRefreshToken() async {
    if (_refreshToken == null) return false;
    try {
      final res = await api.refreshToken(_refreshToken!);
      final newAccess = (res['accessToken'] ?? res['token'] ?? '').toString();
      final newRefresh = (res['refreshToken'] ?? '').toString();
      if (newAccess.isEmpty) return false;
      _token = newAccess;
      await _secureStorage.write(key: _tokenKey, value: _token!);
      if (newRefresh.isNotEmpty) {
        _refreshToken = newRefresh;
        await _secureStorage.write(key: _refreshTokenKey, value: newRefresh);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> refreshUserData() async {
    if (_token == null) return;
    try {
      requests = await api.getMyRequests(_token!);
    } catch (_) {}
    try {
      certificates = await api.getMyCertificates(_token!);
    } catch (_) {}
    try {
      recepisses = await api.getMyRecepisses(_token!);
    } catch (_) {}
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
      final refreshTokenValue = (res['refreshToken'] ?? '').toString();
      await _secureStorage.write(key: _tokenKey, value: _token!);
      if (refreshTokenValue.isNotEmpty) {
        _refreshToken = refreshTokenValue;
        await _secureStorage.write(key: _refreshTokenKey, value: refreshTokenValue);
      }
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
    _refreshToken = null;
    user = null;
    requests = [];
    certificates = [];
    recepisses = [];
    seenNotifications = {};
    dismissedNotifications = {};
    final prefs = await SharedPreferences.getInstance();
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
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

  Future<void> verifyOtp(String email, String code) async {
    loading = true;
    notifyListeners();
    try {
      await api.verifyOtp(email, code);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> forgotPassword(String email) async {
    loading = true;
    notifyListeners();
    try {
      await api.forgotPassword(email);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({required String firstName, required String lastName}) async {
    if (_token == null) throw ApiException('Session invalide');
    loading = true;
    notifyListeners();
    try {
      user = await api.updateProfile(_token!, firstName: firstName, lastName: lastName);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> changePassword({required String oldPassword, required String newPassword}) async {
    if (_token == null) throw ApiException('Session invalide');
    loading = true;
    notifyListeners();
    try {
      await api.changePassword(_token!, oldPassword: oldPassword, newPassword: newPassword);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  String exportStateSnapshot() {
    return jsonEncode({
      'user': user?.email,
      'requests': requests.length,
      'certificates': certificates.length,
      'recepisses': recepisses.length,
      'unreadNotifications': unreadCount,
    });
  }
}
