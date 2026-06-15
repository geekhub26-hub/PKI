import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'models.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({this.baseUrl = const String.fromEnvironment('API_URL', defaultValue: 'https://pki-1.onrender.com/api')});

  final String baseUrl;

  Uri _uri(String path, [Map<String, String>? query]) => Uri.parse('$baseUrl$path').replace(queryParameters: query);

  String _extractError(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map && decoded['error'] != null) return decoded['error'].toString();
      if (decoded is Map && decoded['message'] != null) return decoded['message'].toString();
    } catch (_) {}
    return body.isEmpty ? 'Erreur serveur' : body;
  }

  Future<http.Response> _safeGet(Uri uri, {Map<String, String>? headers}) async {
    try {
      return await http.get(uri, headers: headers).timeout(const Duration(seconds: 35));
    } on SocketException {
      throw ApiException('Connexion reseau impossible. Verifiez Internet puis reessayez.');
    } on http.ClientException {
      throw ApiException('Serveur indisponible temporairement. Reessayez dans quelques secondes.');
    } on TimeoutException {
      throw ApiException('Le serveur met trop de temps a repondre. Reessayez.');
    }
  }

  Future<http.Response> _safePost(Uri uri, {Map<String, String>? headers, Object? body}) async {
    try {
      return await http.post(uri, headers: headers, body: body).timeout(const Duration(seconds: 35));
    } on SocketException {
      throw ApiException('Connexion reseau impossible. Verifiez Internet puis reessayez.');
    } on http.ClientException {
      throw ApiException('Serveur indisponible temporairement. Reessayez dans quelques secondes.');
    } on TimeoutException {
      throw ApiException('Le serveur met trop de temps a repondre. Reessayez.');
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _safePost(
      _uri('/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode >= 400) throw ApiException(_extractError(res.body));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register(String firstName, String lastName, String email, String password) async {
    final res = await _safePost(
      _uri('/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
      }),
    );
    if (res.statusCode >= 400) throw ApiException(_extractError(res.body));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<AppUser> getMe(String token) async {
    final res = await _safeGet(_uri('/user/me'), headers: {'Authorization': 'Bearer $token'});
    if (res.statusCode >= 400) throw ApiException(_extractError(res.body));
    return AppUser.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<List<CertificateRequestItem>> getMyRequests(String token) async {
    final res = await _safeGet(_uri('/user/certificate-requests'), headers: {'Authorization': 'Bearer $token'});
    if (res.statusCode >= 400) throw ApiException(_extractError(res.body));
    final arr = jsonDecode(res.body) as List<dynamic>;
    return arr.map((e) => CertificateRequestItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<CertificateItem>> getMyCertificates(String token) async {
    final res = await _safeGet(_uri('/user/certificates'), headers: {'Authorization': 'Bearer $token'});
    if (res.statusCode >= 400) throw ApiException(_extractError(res.body));
    final arr = jsonDecode(res.body) as List<dynamic>;
    return arr.map((e) => CertificateItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> submitInitialRequest({
    required String token,
    required Map<String, String> fields,
    required List<File> documents,
  }) async {
    final request = http.MultipartRequest('POST', _uri('/user/certificate-requests'));
    request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll(fields);
    for (final f in documents) {
      request.files.add(await http.MultipartFile.fromPath('documents', f.path));
    }
    final streamed = await request.send();
    final responseBody = await streamed.stream.bytesToString();
    if (streamed.statusCode >= 400) throw ApiException(_extractError(responseBody));
  }

  Future<void> submitCsr({
    required String token,
    required String requestId,
    String? csrText,
    File? csrFile,
  }) async {
    final request = http.MultipartRequest('POST', _uri('/user/certificate-requests/$requestId/submit-csr'));
    request.headers['Authorization'] = 'Bearer $token';
    if (csrText != null && csrText.trim().isNotEmpty) {
      request.fields['csr'] = csrText.trim();
    }
    if (csrFile != null) {
      request.files.add(await http.MultipartFile.fromPath('csrFile', csrFile.path));
    }
    final streamed = await request.send();
    final responseBody = await streamed.stream.bytesToString();
    if (streamed.statusCode >= 400) throw ApiException(_extractError(responseBody));
  }

  Future<void> generateCsr({
    required String token,
    required String requestId,
    required Map<String, String> payload,
  }) async {
    final res = await _safePost(
      _uri('/user/certificate-requests/$requestId/generate-csr', payload),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode >= 400) throw ApiException(_extractError(res.body));
  }

  Future<Map<String, dynamic>> validateToken({
    required String token,
    required String requestId,
    required String validationToken,
  }) async {
    final res = await _safePost(
      _uri('/user/certificate-requests/$requestId/validate-token', {'token': validationToken}),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode >= 400) throw ApiException(_extractError(res.body));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<int>> downloadCertificate({
    required String token,
    required String certId,
    required String format,
    String? password,
  }) async {
    if (format.toLowerCase() == 'p12' || format.toLowerCase() == 'pfx') {
      final res = await _safePost(
        _uri('/user/certificates/$certId/download-p12'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'password': password ?? ''}),
      );
      if (res.statusCode >= 400) throw ApiException(_extractError(utf8.decode(res.bodyBytes)));
      return res.bodyBytes;
    }

    final query = <String, String>{'format': format};
    final res = await _safeGet(
      _uri('/user/certificates/$certId/download', query),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode >= 400) throw ApiException(_extractError(utf8.decode(res.bodyBytes)));
    return res.bodyBytes;
  }
}
