import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

import 'api_client.dart';
import 'app_state.dart';
import 'models.dart';

class AppPalette {
  static const lightPrimary = Color(0xFF4F79FF);
  static const lightBackground = Color(0xFFF5F8FF);
  static const lightCard = Color(0xFFFFFFFF);
  static const lightAccent = Color(0xFF22D3EE);
  static const darkPrimary = Color(0xFF4F79FF);
  static const darkBackground = Color(0xFF050B24);
  static const darkCard = Color(0xFF0B163A);
  static const darkAccent = Color(0xFF22D3EE);
  static const darkBorder = Color(0xFF2A3B70);
  static const darkText = Color(0xFFEAF0FF);
  static const darkMuted = Color(0xFF9FB2D9);
  static const title = TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF));
  static const subtitle = TextStyle(fontSize: 15, color: Color(0xFFAFC0E8), height: 1.35);
}

void main() {
  final state = AppState(ApiClient());
  runApp(MyApp(state: state));
}

class MyApp extends StatefulWidget {
  final AppState state;
  const MyApp({super.key, required this.state});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    widget.state.init();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: widget.state,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'PKI SOUVERAIN',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: AppPalette.lightPrimary, brightness: Brightness.light),
          scaffoldBackgroundColor: AppPalette.lightBackground,
          cardTheme: const CardThemeData(color: AppPalette.lightCard, elevation: 1.2),
          appBarTheme: const AppBarTheme(centerTitle: false, elevation: 0, scrolledUnderElevation: 0),
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppPalette.lightPrimary, width: 1.6),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          navigationBarTheme: NavigationBarThemeData(
            height: 76,
            labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            indicatorColor: AppPalette.lightPrimary.withValues(alpha: 0.16),
          ),
          useMaterial3: true,
        ),
        darkTheme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: AppPalette.darkPrimary, brightness: Brightness.dark),
          scaffoldBackgroundColor: AppPalette.darkBackground,
          cardTheme: CardThemeData(
            color: AppPalette.darkCard,
            elevation: 0.6,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: const BorderSide(color: AppPalette.darkBorder, width: 1),
            ),
          ),
          appBarTheme: const AppBarTheme(
            centerTitle: false,
            elevation: 0,
            scrolledUnderElevation: 0,
            backgroundColor: Color(0xFF051542),
            foregroundColor: Color(0xFFEAF0FF),
          ),
          textTheme: const TextTheme(
            bodyLarge: TextStyle(color: AppPalette.darkText),
            bodyMedium: TextStyle(color: AppPalette.darkText),
            titleLarge: TextStyle(color: AppPalette.darkText),
          ),
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppPalette.darkBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppPalette.darkPrimary, width: 1.6),
            ),
            filled: true,
            fillColor: const Color(0xFF081233),
            labelStyle: const TextStyle(color: AppPalette.darkMuted),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          ),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              backgroundColor: AppPalette.darkPrimary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          navigationBarTheme: NavigationBarThemeData(
            height: 76,
            backgroundColor: const Color(0xFF0A1847),
            labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            indicatorColor: AppPalette.darkPrimary.withValues(alpha: 0.25),
          ),
          useMaterial3: true,
        ),
        themeMode: ThemeMode.dark,
        home: const AuthGate(),
      ),
    );
  }
}

class AppScope extends InheritedNotifier<AppState> {
  final AppState state;
  const AppScope({super.key, required this.state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    if (scope == null) throw Exception('AppScope manquant');
    return scope.state;
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    if (state.isLoggedIn) return const HomeShell();
    return const LandingScreen();
  }
}

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020B2E),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                children: [
                  Row(
                    children: [
                      const Text(
                        'shield VaultID',
                        style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7C96FF),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Get Started', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0A1333))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0D1D4C),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF244184)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified_outlined, size: 14, color: Color(0xFF7CD8FF)),
                        SizedBox(width: 6),
                        Text('TRUSTED PKI SOUVERAIN ECOSYSTEM', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF8FB3FF))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Secure\nSovereign\nAccess',
                    style: TextStyle(fontSize: 56, height: 1.0, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Cryptographic\nExcellence',
                    style: TextStyle(fontSize: 54, height: 1.0, fontWeight: FontWeight.w800, color: Color(0xFF45DBFF)),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Experience absolute digital sovereignty with VaultID. Manage your full certificate lifecycle through our high-assurance identity management portal, powered by state-of-the-art encryption.',
                    style: TextStyle(fontSize: 14, height: 1.4, color: Color(0xFFB6C6EA)),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF6D88FF),
                        foregroundColor: const Color(0xFF0A1333),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                      child: const Text('Get Started Now  ->', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Color(0xFF2C4F99)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LandingDocsScreen())),
                      child: const Text('View Documentation', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    height: 240,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF08174A), Color(0xFF030F35), Color(0xFF0A2263)],
                      ),
                      border: Border.all(color: const Color(0xFF234481)),
                    ),
                    child: const Center(
                      child: Icon(Icons.monitor_heart_outlined, size: 120, color: Color(0xFF3FAAFF)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'A Transparent 3-Step\nWorkflow',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Our rigorous process ensures the highest level of security and compliance for every certificate issued.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFFAFC1E8), height: 1.4),
                  ),
                  const SizedBox(height: 18),
                  const _LandingStep(
                    number: '1.',
                    title: 'Identity Submission',
                    body: 'Complete your profile with personal data and required identity documents for verification.',
                    icon: Icons.security_outlined,
                  ),
                  const _LandingStep(
                    number: '2.',
                    title: 'Admin Review',
                    body: 'Our specialized administrators perform high-assurance vetting of your submitted credentials.',
                    icon: Icons.verified_user_outlined,
                  ),
                  const _LandingStep(
                    number: '3.',
                    title: 'CSR Generation',
                    body: 'Once approved, generate or submit your CSR to receive your cryptographically signed certificate.',
                    icon: Icons.description_outlined,
                  ),
                  const SizedBox(height: 16),
                  const _LandingFeatureCard(
                    title: 'Multi-Layered Protection',
                    subtitle: 'Our PKI infrastructure leverages military-grade encryption and secure hardware modules to protect your digital identity at every stage.',
                    badge: 'SECURE ARCHITECTURE',
                  ),
                  const SizedBox(height: 12),
                  const _LandingFeatureCard(
                    title: 'Mobile-First Control',
                    subtitle: 'Manage certificates, track requests, and receive notifications on the go.',
                  ),
                  const SizedBox(height: 12),
                  const _LandingFeatureCard(
                    title: 'Key Management',
                    subtitle: 'Advanced PKCS#12 export options.',
                  ),
                  const SizedBox(height: 12),
                  const _LandingFeatureCard(
                    title: 'Instant Alerts',
                    subtitle: 'Stay updated on approval statuses.',
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0A1949),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF33559C)),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Ready to secure your\ndigital sovereignty?',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Join the high-assurance network of VaultID and experience the next generation of PKI management.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFFAAC0EE), height: 1.4),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF7F97FF),
                              foregroundColor: const Color(0xFF0A1333),
                              padding: const EdgeInsets.symmetric(vertical: 15),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                            child: const Text('Create Account', style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Color(0xFF36579A)),
                              padding: const EdgeInsets.symmetric(vertical: 15),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                            child: const Text('Login to Portal', style: TextStyle(fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
              decoration: const BoxDecoration(color: Color(0xFF020B2E), border: Border(top: BorderSide(color: Color(0xFF203D7A)))),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _LandingFooterItem(icon: Icons.home_outlined, label: 'Home', active: true, onTap: () {}),
                  _LandingFooterItem(
                    icon: Icons.description_outlined,
                    label: 'Docs',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LandingDocsScreen())),
                  ),
                  _LandingFooterItem(
                    icon: Icons.login_outlined,
                    label: 'Login',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                  ),
                  _LandingFooterItem(
                    icon: Icons.person_add_outlined,
                    label: 'Sign Up',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

class _LandingStep extends StatelessWidget {
  final String number;
  final String title;
  final String body;
  final IconData icon;
  const _LandingStep({required this.number, required this.title, required this.body, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF4CCBFF), width: 2),
              color: const Color(0xFF0C1F57),
            ),
            child: Icon(icon, color: const Color(0xFF85D9FF)),
          ),
          const SizedBox(height: 8),
          Text('$number $title', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 5),
          Text(body, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFFAEC0E8), height: 1.35)),
        ],
      ),
    );
  }
}

class _LandingFeatureCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? badge;
  const _LandingFeatureCard({required this.title, required this.subtitle, this.badge});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF091949),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF284A8F)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (badge != null) ...[
            Text(badge!, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF49D8FF))),
            const SizedBox(height: 6),
          ],
          Text(title, style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: Colors.white)),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: Color(0xFFB8C8ED), height: 1.35)),
          if (badge != null) ...[
            const SizedBox(height: 10),
            const Text('Learn about our protocol  ->', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
          ]
        ],
      ),
    );
  }
}

class _LandingFooterItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _LandingFooterItem({required this.icon, required this.label, required this.onTap, this.active = false});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: active ? const Color(0xFF28D6FF).withValues(alpha: 0.2) : Colors.transparent,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 18, color: active ? const Color(0xFF39DEFF) : const Color(0xFF9FB2D9)),
          ),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 11, color: active ? const Color(0xFF39DEFF) : const Color(0xFF9FB2D9))),
        ],
      ),
    );
  }
}

class LandingDocsScreen extends StatelessWidget {
  const LandingDocsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const heading = TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white);
    const body = TextStyle(color: Color(0xFFB8C8ED), height: 1.45);
    return Scaffold(
      backgroundColor: const Color(0xFF020B2E),
      appBar: AppBar(title: const Text('Documentation')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('PKI SOUVERAIN Mobile', style: heading),
          const SizedBox(height: 6),
          const Text(
            'Guide complet de l application mobile utilisateur : parcours, fonctions, securite et API.',
            style: body,
          ),
          SizedBox(height: 10),
          _DocsCard(
            title: '1. Objectif',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('L application mobile est concue pour le role USER.', style: body),
                SizedBox(height: 6),
                Text('Elle couvre : inscription, connexion, soumission de demande, phase CSR, validation token, suivi et telechargement des certificats.', style: body),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _DocsCard(
            title: '2. Workflow utilisateur',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                _DocsStep('1', 'Inscription / Connexion'),
                _DocsStep('2', 'Soumission des informations identite + pieces'),
                _DocsStep('3', 'Attente verification par admin'),
                _DocsStep('4', 'Phase 3 : soumettre ou generer CSR'),
                _DocsStep('5', 'Validation du jeton recu par email'),
                _DocsStep('6', 'Emission puis telechargement certificat'),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _DocsCard(
            title: '3. Services disponibles',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('- Upload pieces: jpg, jpeg, png, pdf', style: body),
                Text('- Upload CSR: csr, pem', style: body),
                Text('- Download certificat: crt, pem, p12', style: body),
                Text('- Notifications lu / non-lu', style: body),
                Text('- Navigation responsive mobile/tablette', style: body),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _DocsCard(
            title: '4. Endpoints backend',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Auth:', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                Text('POST /auth/login', style: body),
                Text('POST /auth/register', style: body),
                SizedBox(height: 6),
                Text('Profil:', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                Text('GET /user/me', style: body),
                SizedBox(height: 6),
                Text('Demandes:', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                Text('GET /user/certificate-requests', style: body),
                Text('POST /user/certificate-requests', style: body),
                Text('POST /user/certificate-requests/{id}/submit-csr', style: body),
                Text('POST /user/certificate-requests/{id}/generate-csr', style: body),
                Text('POST /user/certificate-requests/{id}/validate-token', style: body),
                SizedBox(height: 6),
                Text('Certificats:', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
                Text('GET /user/certificates', style: body),
                Text('GET /user/certificates/{id}/download', style: body),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _DocsCard(
            title: '5. Securite et stockage',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('- Token Bearer utilise pour toutes les routes privees.', style: body),
                Text('- Token sauvegarde dans le stockage securise de la plateforme.', style: body),
                Text('- Les fichiers telecharges sont stockes dans ApplicationDocumentsDirectory.', style: body),
                Text('- Le role ADMIN n est pas expose dans l app mobile.', style: body),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _DocsCard(
            title: '6. Etats et statuts',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Statuts majeurs: PENDING, PENDING_REVIEW, REVIEW_APPROVED.', style: body),
                SizedBox(height: 6),
                Text('Acces phase 3 CSR seulement si la demande est REVIEW_APPROVED.', style: body),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _DocsCard(
            title: '7. Support',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Si un endpoint ne repond pas, l app affiche des messages reseau adaptes (timeout, serveur indisponible, etc.).', style: body),
                SizedBox(height: 8),
                Text('Version API cible: https://pki-1.onrender.com/api', style: TextStyle(color: Color(0xFF62D7FF), fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DocsCard extends StatelessWidget {
  final String title;
  final Widget child;
  const _DocsCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF091949),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF284A8F)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _DocsStep extends StatelessWidget {
  final String n;
  final String label;
  const _DocsStep(this.n, this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(color: Color(0xFF4F79FF), shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(n, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(label, style: const TextStyle(color: Color(0xFFB8C8ED), height: 1.35))),
        ],
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFF050B24),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF0A1748),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF2A4A8D)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Welcome back', textAlign: TextAlign.center, style: TextStyle(fontSize: 44, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
                    const SizedBox(height: 8),
                    const Text('Login to your PKI SOUVERAIN account', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFFB8C8ED), fontSize: 17)),
                    const SizedBox(height: 18),
                    const Text('Email', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFEAF0FF))),
                    const SizedBox(height: 8),
                    TextField(controller: _email, decoration: const InputDecoration(hintText: 'm@example.com')),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Expanded(child: Text('Password', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFEAF0FF)))),
                        TextButton(
                          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password reset will be available soon.'))),
                          child: const Text('Forgot your password?'),
                        ),
                      ],
                    ),
                    TextField(controller: _password, obscureText: true),
                    const SizedBox(height: 14),
                    FilledButton(
                      onPressed: state.loading
                          ? null
                          : () async {
                              setState(() => _error = null);
                              try {
                                await state.login(_email.text.trim(), _password.text);
                              } catch (e) {
                                if (!mounted) return;
                                setState(() => _error = e.toString());
                              }
                            },
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(double.infinity, 52),
                        backgroundColor: const Color(0xFF6F8DFF),
                        foregroundColor: const Color(0xFF0A1333),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(state.loading ? 'Connexion...' : 'Login', style: const TextStyle(fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(height: 14),
                    const Row(
                      children: [
                        Expanded(child: Divider(color: Color(0xFF2A4A8D))),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 10),
                          child: Text('Or continue with', style: TextStyle(color: Color(0xFFA9B9DF))),
                        ),
                        Expanded(child: Divider(color: Color(0xFF2A4A8D))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: OutlinedButton(onPressed: () {}, child: const Text('Apple'))),
                        const SizedBox(width: 8),
                        Expanded(child: OutlinedButton(onPressed: () {}, child: const Text('Google'))),
                        const SizedBox(width: 8),
                        Expanded(child: OutlinedButton(onPressed: () {}, child: const Text('Meta'))),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Don\'t have an account? ', style: TextStyle(color: Color(0xFFAFC0E8))),
                        TextButton(
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                          child: const Text('Sign up'),
                        ),
                      ],
                    ),
                    if (_error != null)
                      Container(
                        margin: const EdgeInsets.only(top: 6),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3A1620),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF8A2E45)),
                        ),
                        child: Text(_error!, style: const TextStyle(color: Color(0xFFFF9DB5))),
                      ),
                    const SizedBox(height: 12),
                    const Text(
                      'By clicking continue, you agree to our Terms of Service and Privacy Policy.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF90A4D8), height: 1.35),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullName = TextEditingController();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String? _message;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFF050B24),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF0A1748),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF2A4A8D)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Create your account', textAlign: TextAlign.center, style: TextStyle(fontSize: 44, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
                    const SizedBox(height: 8),
                    const Text('Enter your email below to create your account', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFFB8C8ED), fontSize: 17)),
                    const SizedBox(height: 20),
                    const Text('Full Name', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFEAF0FF))),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _fullName,
                      decoration: const InputDecoration(hintText: 'John Doe'),
                    ),
                    const SizedBox(height: 12),
                    const Text('Email', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFEAF0FF))),
                    const SizedBox(height: 8),
                    TextField(controller: _email, decoration: const InputDecoration(hintText: 'm@example.com')),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Expanded(child: Text('Password', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFEAF0FF)))),
                        const SizedBox(width: 12),
                        const Expanded(child: Text('Confirm Password', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFEAF0FF)))),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: TextField(controller: _password, obscureText: true)),
                        const SizedBox(width: 12),
                        Expanded(child: TextField(controller: _confirm, obscureText: true)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text('Must be at least 8 characters long.', style: TextStyle(color: Color(0xFFAFC0E8))),
                    const SizedBox(height: 14),
                    FilledButton(
                      onPressed: () async {
                        setState(() {
                          _error = null;
                          _message = null;
                        });
                        if (_password.text.length < 8) {
                          setState(() => _error = 'Le mot de passe doit contenir au moins 8 caracteres.');
                          return;
                        }
                        if (_password.text != _confirm.text) {
                          setState(() => _error = 'Les mots de passe ne correspondent pas.');
                          return;
                        }
                        final full = _fullName.text.trim();
                        final parts = full.split(RegExp(r'\s+'));
                        final first = parts.isEmpty ? '' : parts.first;
                        final last = parts.length > 1 ? parts.sublist(1).join(' ') : '';
                        try {
                          await state.register(first, last, _email.text.trim(), _password.text);
                          if (!mounted) return;
                          setState(() => _message = 'Compte cree. Connectez-vous.');
                        } catch (e) {
                          if (!mounted) return;
                          setState(() => _error = e.toString());
                        }
                      },
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(double.infinity, 52),
                        backgroundColor: const Color(0xFF6F8DFF),
                        foregroundColor: const Color(0xFF0A1333),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Create Account', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Already have an account? ', style: TextStyle(color: Color(0xFFAFC0E8))),
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Sign in'),
                        ),
                      ],
                    ),
                    if (_message != null)
                      Container(
                        margin: const EdgeInsets.only(top: 6),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0C2D24),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF2F8E71)),
                        ),
                        child: Text(_message!, style: const TextStyle(color: Color(0xFF6FFFC8))),
                      ),
                    if (_error != null)
                      Container(
                        margin: const EdgeInsets.only(top: 6),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3A1620),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF8A2E45)),
                        ),
                        child: Text(_error!, style: const TextStyle(color: Color(0xFFFF9DB5))),
                      ),
                    const SizedBox(height: 12),
                    const Text(
                      'By clicking continue, you agree to our Terms of Service and Privacy Policy.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF90A4D8), height: 1.35),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;

  final pages = const [
    DashboardPage(),
    RequestsPage(),
    CertificatesPage(),
    NewRequestPage(),
    SettingsPage(),
  ];

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final isWide = MediaQuery.of(context).size.width >= 980;

    return HomeNavScope(
      onTab: (v) => setState(() => index = v),
      child: Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: Color(0xFFDCE6FF)),
            SizedBox(width: 8),
            Text('VaultID', style: TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
            },
            icon: Badge(
              isLabelVisible: state.unreadCount > 0,
              label: Text(state.unreadCount > 99 ? '99+' : '${state.unreadCount}'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
          IconButton(
            onPressed: () => state.logout(),
            icon: const CircleAvatar(
              radius: 14,
              backgroundColor: Color(0xFF203570),
              child: Icon(Icons.person, size: 16, color: Color(0xFFE1EAFF)),
            ),
          ),
        ],
      ),
      body: isWide
          ? Row(
              children: [
                NavigationRail(
                  selectedIndex: index,
                  onDestinationSelected: (v) => setState(() => index = v),
                  labelType: NavigationRailLabelType.all,
                  destinations: const [
                    NavigationRailDestination(icon: Icon(Icons.dashboard_outlined), label: Text('Accueil')),
                    NavigationRailDestination(icon: Icon(Icons.list_alt_outlined), label: Text('Demandes')),
                    NavigationRailDestination(icon: Icon(Icons.workspace_premium_outlined), label: Text('Certifs')),
                    NavigationRailDestination(icon: Icon(Icons.badge_outlined), label: Text('Identity')),
                    NavigationRailDestination(icon: Icon(Icons.settings_outlined), label: Text('Settings')),
                  ],
                ),
                const VerticalDivider(width: 1),
                Expanded(child: pages[index]),
              ],
            )
          : pages[index],
      bottomNavigationBar: isWide
          ? null
          : NavigationBar(
              selectedIndex: index,
              onDestinationSelected: (v) => setState(() => index = v),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
                NavigationDestination(icon: Icon(Icons.list_alt_outlined), label: 'Demandes'),
                NavigationDestination(icon: Icon(Icons.workspace_premium_outlined), label: 'Certificates'),
                NavigationDestination(icon: Icon(Icons.badge_outlined), label: 'Identity'),
                NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
              ],
            ),
      ),
    );
  }
}

class HomeNavScope extends InheritedWidget {
  final ValueChanged<int> onTab;
  const HomeNavScope({super.key, required this.onTab, required super.child});

  static HomeNavScope? maybeOf(BuildContext context) => context.dependOnInheritedWidgetOfExactType<HomeNavScope>();

  @override
  bool updateShouldNotify(HomeNavScope oldWidget) => false;
}

void goHomeTab(BuildContext context, int tabIndex) {
  final nav = HomeNavScope.maybeOf(context);
  if (nav != null) {
    nav.onTab(tabIndex);
  }
}

class AppPageShell extends StatelessWidget {
  final List<Widget> children;
  final Future<void> Function()? onRefresh;
  const AppPageShell({super.key, required this.children, this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final media = MediaQuery.of(context);
    final content = ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
      children: children,
    );
    return MediaQuery(
      data: media.copyWith(textScaler: media.textScaler.clamp(minScaleFactor: 1.0, maxScaleFactor: 1.12)),
      child: Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [scheme.primary.withValues(alpha: 0.07), Colors.transparent],
            ),
          ),
          child: onRefresh == null ? content : RefreshIndicator(onRefresh: onRefresh!, child: content),
        ),
      ),
    );
  }
}

class SectionCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget child;
  const SectionCard({super.key, required this.title, this.subtitle, required this.child});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(subtitle!, style: TextStyle(color: scheme.onSurfaceVariant)),
            ],
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final pendingReview = state.requests.where((e) => e.status == 'PENDING_REVIEW').length;
    final phase3 = state.requests.where((e) => e.status == 'REVIEW_APPROVED').length;
    final issued = state.certificates.length;
    final recent = state.notifications.take(3).toList();
    return AppPageShell(
      onRefresh: state.refreshUserData,
      children: [
        const Text('Digital Sovereignty Dashboard', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Color(0xFFE8EEFF), letterSpacing: 0.2)),
        const SizedBox(height: 6),
        const Text(
          'Manage your cryptographic identity and certificate lifecycle.',
          style: TextStyle(fontSize: 17, color: Color(0xFFAFC0E8), height: 1.35),
        ),
        const SizedBox(height: 14),
        const SizedBox(height: 4),
        _DashMetricCard(
          icon: Icons.mark_email_unread_outlined,
          value: pendingReview.toString().padLeft(2, '0'),
          label: 'Requests in Review',
          badge: 'PENDING_REVIEW',
          badgeColor: const Color(0xFF0A4B73),
        ),
        _DashMetricCard(
          icon: Icons.check_circle_outline,
          value: phase3.toString().padLeft(2, '0'),
          label: 'Ready for CSR Submission',
          badge: 'REVIEW_APPROVED',
          badgeColor: const Color(0xFF0A4B73),
        ),
        _DashMetricCard(
          icon: Icons.verified_user_outlined,
          value: issued.toString().padLeft(2, '0'),
          label: 'Total Certificates Issued',
          badge: 'ACTIVE',
          badgeColor: const Color(0xFF2A356F),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF2D4F94)),
            gradient: const LinearGradient(colors: [Color(0xFF0B1E57), Color(0xFF061544)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Start a New Identity\nRequest', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 8),
              const Text(
                'Begin the secure 3-phase process to generate your sovereign digital certificate.',
                style: TextStyle(color: Color(0xFFAFC1E8), height: 1.35),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => goHomeTab(context, 3),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFB7C5FF),
                  foregroundColor: const Color(0xFF10214D),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  minimumSize: const Size(170, 52),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                ),
                child: const Text('New Request', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0A1748),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF2A4A8D)),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  const Text('Recent Activity', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                  const Spacer(),
                  TextButton(
                    onPressed: () => goHomeTab(context, 1),
                    child: const Text('View All', style: TextStyle(color: Color(0xFF4FD7FF), fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              ...recent.map((n) => _ActivityRow(
                    title: n.title,
                    subtitle: n.message,
                    time: n.timestamp,
                    onTap: () => goHomeTab(context, 1),
                  )),
              if (recent.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text('No recent activity yet.', style: TextStyle(color: Color(0xFFAFC1E8))),
                ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0A1748),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF2A4A8D)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('System Status', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF49D9FF))),
              SizedBox(height: 10),
              _StatusRow(label: 'PKI Core', value: 'Online'),
              _StatusRow(label: 'CSR Gateway', value: 'Online'),
              _StatusRow(label: 'HSM Cluster', value: 'Ready'),
              SizedBox(height: 10),
              Divider(color: Color(0xFF274282)),
              SizedBox(height: 10),
              Text('API Endpoint: https://pki-1.onrender.com/api', style: TextStyle(color: Color(0xFFAFC1E8))),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0A1949),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF3EE0FF), width: 1.4),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('SECURE ACTION', style: TextStyle(color: Color(0xFF49D9FF), fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(
                phase3 > 0
                    ? 'You have $phase3 request pending CSR submission. Access Phase 3 to complete the process.'
                    : 'No request is currently waiting for CSR submission.',
                style: const TextStyle(color: Color(0xFFC2D0EE), height: 1.35),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const Phase3CsrPage())),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF42DDFF),
                  side: const BorderSide(color: Color(0xFF42DDFF)),
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Go to Phase 3', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DashMetricCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final String badge;
  final Color badgeColor;
  const _DashMetricCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.badge,
    required this.badgeColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0A1748),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2A4A8D)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF4CDEFF), size: 22),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: badgeColor, borderRadius: BorderRadius.circular(14)),
                child: Text(badge, style: const TextStyle(color: Color(0xFF62D8FF), fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 50, fontWeight: FontWeight.w800, color: Colors.white)),
          Text(label, style: const TextStyle(fontSize: 16, color: Color(0xFFC0CDEE))),
        ],
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final String time;
  final VoidCallback? onTap;
  const _ActivityRow({required this.title, required this.subtitle, required this.time, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CircleAvatar(
                radius: 22,
                backgroundColor: Color(0xFF182D73),
                child: Icon(Icons.check_circle_outline, color: Color(0xFF4CDFFF)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.white)),
                    const SizedBox(height: 2),
                    Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFB8C8ED))),
                    Text(time, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF8FA4D8))),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: Color(0xFF7F95C9)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final String label;
  final String value;
  const _StatusRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(label, style: const TextStyle(fontSize: 18, color: Color(0xFFD2DBF4))),
          const Spacer(),
          const Icon(Icons.circle, size: 9, color: Color(0xFF4FEEFF)),
          const SizedBox(width: 6),
          Text(value, style: const TextStyle(color: Color(0xFF68EEFF), fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class NewRequestPage extends StatefulWidget {
  const NewRequestPage({super.key});

  @override
  State<NewRequestPage> createState() => _NewRequestPageState();
}

class _NewRequestPageState extends State<NewRequestPage> {
  final firstName = TextEditingController();
  final lastName = TextEditingController();
  final birthDate = TextEditingController();
  final birthPlace = TextEditingController();
  final nationality = TextEditingController(text: 'CM');
  final idType = TextEditingController(text: 'CNI');
  final idNumber = TextEditingController();
  final idExpiry = TextEditingController();
  final commonName = TextEditingController();
  final organization = TextEditingController();
  final locality = TextEditingController();
  final country = TextEditingController(text: 'CM');
  final email = TextEditingController();
  List<File> docs = [];
  String? info;
  String? err;
  final List<String> idTypeOptions = const ['CNI', 'PASSPORT', 'CARTE_SEJOUR'];

  Future<void> _pickDocs() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result == null) return;
    setState(() => docs = result.paths.whereType<String>().map(File.new).toList());
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    if (email.text.isEmpty) email.text = state.user?.email ?? '';
    if (firstName.text.isEmpty) firstName.text = state.user?.firstName ?? '';
    if (lastName.text.isEmpty) lastName.text = state.user?.lastName ?? '';

    return AppPageShell(
      children: [
        Row(
          children: const [
            Icon(Icons.shield_outlined, color: Color(0xFFDCE6FF)),
            SizedBox(width: 8),
            Text('VaultID', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFE8EEFF))),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            const _StepChip(number: '1', label: 'Personal\nIdentity', active: true),
            const SizedBox(width: 6),
            const Icon(Icons.chevron_right, color: Color(0xFF9CB0DE)),
            const SizedBox(width: 6),
            const _StepChip(number: '2', label: 'Certificate\nDetails', active: false),
          ],
        ),
        const SizedBox(height: 14),
        _RequestCard(
          title: 'Step 1: Identity Profile',
          icon: Icons.person_outline,
          child: Column(
            children: [
              TextField(controller: firstName, decoration: const InputDecoration(labelText: 'First Name', hintText: 'e.g. Jean')),
              const SizedBox(height: 8),
              TextField(controller: lastName, decoration: const InputDecoration(labelText: 'Last Name', hintText: 'e.g. Dupont')),
              const SizedBox(height: 8),
              TextField(controller: birthDate, decoration: const InputDecoration(labelText: 'Date of Birth', hintText: 'mm/dd/yyyy')),
              const SizedBox(height: 8),
              TextField(controller: birthPlace, decoration: const InputDecoration(labelText: 'Place of Birth', hintText: 'City of birth')),
              const SizedBox(height: 8),
              TextField(controller: nationality, decoration: const InputDecoration(labelText: 'Nationality', hintText: 'France')),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: idType.text.isEmpty ? null : idType.text,
                decoration: const InputDecoration(labelText: 'ID Type'),
                dropdownColor: const Color(0xFF0B1B52),
                items: idTypeOptions.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                onChanged: (value) => setState(() => idType.text = value ?? 'CNI'),
              ),
              const SizedBox(height: 8),
              TextField(controller: idNumber, decoration: const InputDecoration(labelText: 'ID Number', hintText: 'Enter document identifier')),
              const SizedBox(height: 8),
              TextField(controller: idExpiry, decoration: const InputDecoration(labelText: 'ID Expiry', hintText: 'mm/dd/yyyy')),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _RequestCard(
          title: 'Step 2: Certificate & Files',
          icon: Icons.description_outlined,
          child: Column(
            children: [
              TextField(controller: commonName, decoration: const InputDecoration(labelText: 'Common Name (CN)', hintText: 'e.g. Jean Dupont')),
              const SizedBox(height: 8),
              TextField(controller: organization, decoration: const InputDecoration(labelText: 'Organization (O)', hintText: 'e.g. Individual')),
              const SizedBox(height: 8),
              TextField(controller: locality, decoration: const InputDecoration(labelText: 'Locality (L)', hintText: 'e.g. Yaounde')),
              const SizedBox(height: 8),
              TextField(controller: country, decoration: const InputDecoration(labelText: 'Country (C)', hintText: 'CM')),
              const SizedBox(height: 8),
              TextField(controller: email, decoration: const InputDecoration(labelText: 'Email Address', hintText: 'email@example.com')),
              const SizedBox(height: 8),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('Upload Identity Documents (JPG, PNG, PDF)', style: TextStyle(color: Color(0xFFC0CEEE))),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickDocs,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF4E649E), style: BorderStyle.solid),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.upload_file_outlined, color: Color(0xFF9CB7ED), size: 28),
                      const SizedBox(height: 8),
                      Text(
                        docs.isEmpty ? 'Click or drag and drop files here' : '${docs.length} file(s) selected',
                        style: const TextStyle(color: Color(0xFFD0DAF6), fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 3),
                      const Text('Maximum size 10MB per file', style: TextStyle(color: Color(0xFF9CB0DE), fontSize: 12)),
                    ],
                  ),
                ),
              ),
              if (docs.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: docs
                      .map((f) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF102D63),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFF2D5FAA)),
                            ),
                            child: Text(path.basename(f.path), style: const TextStyle(color: Color(0xFFD8E5FF), fontSize: 12)),
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Draft saved locally')));
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  side: const BorderSide(color: Color(0xFF3B5391)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  foregroundColor: const Color(0xFFD8E2FF),
                ),
                child: const Text('Save Draft', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: FilledButton.icon(
                onPressed: () async {
                  setState(() {
                    err = null;
                    info = null;
                  });
                  try {
                    await state.submitInitialRequest(
                      fields: {
                        'firstName': firstName.text.trim(),
                        'lastName': lastName.text.trim(),
                        'birthDate': birthDate.text.trim(),
                        'birthPlace': birthPlace.text.trim(),
                        'nationality': nationality.text.trim(),
                        'identityDocumentType': idType.text.trim(),
                        'identityDocumentNumber': idNumber.text.trim(),
                        'identityDocumentExpiry': idExpiry.text.trim(),
                        'commonName': commonName.text.trim(),
                        'organization': organization.text.trim(),
                        'locality': locality.text.trim(),
                        'country': country.text.trim(),
                        'email': email.text.trim(),
                      },
                      documents: docs,
                    );
                    if (!mounted) return;
                    setState(() => info = 'Request submitted for review.');
                  } catch (e) {
                    if (!mounted) return;
                    setState(() => err = e.toString());
                  }
                },
                style: FilledButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  backgroundColor: const Color(0xFF6F8DFF),
                  foregroundColor: const Color(0xFF0D1E4A),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                ),
                icon: const Icon(Icons.send_outlined),
                label: const Text('Submit Request', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _RequestCard(
          title: 'Sovereign Summary',
          icon: Icons.security_outlined,
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SummaryRow(icon: Icons.shield_outlined, title: 'Security Level', value: 'Standard Citizen (L1)'),
              SizedBox(height: 10),
              _SummaryRow(icon: Icons.lock_outline, title: 'Encryption', value: 'RSA 4096-bit (Requested)'),
              SizedBox(height: 12),
              _StatusPanel(),
            ],
          ),
        ),
        if (info != null) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0C2D24),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF2F8E71)),
            ),
            child: Text(info!, style: const TextStyle(color: Color(0xFF6FFFC8))),
          ),
        ],
        if (err != null) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF3A1620),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF8A2E45)),
            ),
            child: Text(err!, style: const TextStyle(color: Color(0xFFFF9DB5))),
          ),
        ],
      ],
    );
  }
}

class _StepChip extends StatelessWidget {
  final String number;
  final String label;
  final bool active;
  const _StepChip({required this.number, required this.label, required this.active});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 11,
                backgroundColor: active ? const Color(0xFF6D8AFF) : const Color(0xFF20366E),
                child: Text(number, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
              const SizedBox(width: 6),
              Text(label, style: TextStyle(color: active ? const Color(0xFFEAF0FF) : const Color(0xFF8EA5D9), fontSize: 15, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 6),
          Container(height: 4, width: double.infinity, decoration: BoxDecoration(color: active ? const Color(0xFF6D8AFF) : const Color(0xFF2A3C70), borderRadius: BorderRadius.circular(4))),
        ],
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;
  const _RequestCard({required this.title, required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0A1748),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2A4A8D)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF54DCFF)),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Colors.white)),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  const _SummaryRow({required this.icon, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF4EDBFF), size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Color(0xFFAAC0EE))),
              Text(value, style: const TextStyle(color: Color(0xFFEAF0FF), fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatusPanel extends StatelessWidget {
  const _StatusPanel();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF06123A),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Status', style: TextStyle(color: Color(0xFFA9BCEB), fontSize: 12)),
          SizedBox(height: 4),
          Text('PHASE 1 & 2 DRAFTING', style: TextStyle(color: Color(0xFFEAF0FF), fontWeight: FontWeight.w800)),
          SizedBox(height: 10),
          Text(
            'Your submission will enter the PENDING_REVIEW state. An administrator will verify your identity documents within 24-48 hours.',
            style: TextStyle(color: Color(0xFF64D6FF), height: 1.35),
          ),
        ],
      ),
    );
  }
}

class Phase3CsrPage extends StatefulWidget {
  const Phase3CsrPage({super.key});

  @override
  State<Phase3CsrPage> createState() => _Phase3CsrPageState();
}

class _Phase3CsrPageState extends State<Phase3CsrPage> {
  String? selectedRequestId;
  final csrText = TextEditingController();
  File? csrFile;
  final cn = TextEditingController();
  final o = TextEditingController();
  final ou = TextEditingController();
  final l = TextEditingController();
  final st = TextEditingController();
  final c = TextEditingController(text: 'CM');
  final mail = TextEditingController();
  String? info;
  String? err;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final width = MediaQuery.of(context).size.width;
    final titleSize = width < 380 ? 30.0 : 39.0;
    final phase3Requests = state.requests.where((r) => r.status == 'REVIEW_APPROVED').toList();
    selectedRequestId ??= phase3Requests.isNotEmpty ? phase3Requests.first.id : null;
    final shortReq = selectedRequestId != null && selectedRequestId!.length >= 8 ? selectedRequestId!.substring(0, 8) : '----';

    return AppPageShell(
      children: [
        Row(
          children: const [
            Icon(Icons.shield_outlined, color: Color(0xFFDCE6FF)),
            SizedBox(width: 8),
            Text('VaultID', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFE8EEFF))),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 4,
          runSpacing: 2,
          children: const [
            Text('Requests >', style: TextStyle(color: Color(0xFF9FB2D9))),
            Text('Phase 3 CSR', style: TextStyle(color: Color(0xFF4FD7FF), fontWeight: FontWeight.w700)),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Certificate Signing\nRequest',
          style: TextStyle(fontSize: titleSize, height: 1.0, fontWeight: FontWeight.w800, color: const Color(0xFFEAF0FF)),
        ),
        const SizedBox(height: 8),
        Text(
          'Your request #$shortReq has been approved.\nPlease finalize the cryptographic setup.',
          style: TextStyle(fontSize: width < 380 ? 14 : 16, color: const Color(0xFFB8C8ED), height: 1.35),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: const Color(0xFF0A4B73),
            border: Border.all(color: const Color(0xFF2A6EA0)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.settings, size: 14, color: Color(0xFF6ADFFF)),
              SizedBox(width: 8),
              Text('REVIEW_APPROVED', style: TextStyle(color: Color(0xFF7BE6FF), fontWeight: FontWeight.w800)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (phase3Requests.isEmpty)
          const SectionCard(
            title: 'Aucune demande prete',
            subtitle: 'Attendez la validation admin avant de soumettre la CSR.',
            child: SizedBox.shrink(),
          )
        else ...[
          _RequestCard(
            title: 'External CSR',
            icon: Icons.file_open_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Submit your own PEM block', style: TextStyle(color: Color(0xFF9FB2D9))),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: selectedRequestId,
                  items: phase3Requests
                      .map((r) => DropdownMenuItem(value: r.id, child: Text('${r.commonName} (${r.id.substring(0, 8)})')))
                      .toList(),
                  onChanged: (v) => setState(() => selectedRequestId = v),
                  decoration: const InputDecoration(labelText: 'Demande'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: csrText,
                  maxLines: 7,
                  decoration: const InputDecoration(labelText: 'CSR PEM Text', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () async {
                    final result = await FilePicker.platform.pickFiles(allowedExtensions: ['csr', 'pem'], type: FileType.custom);
                    if (result != null && result.files.single.path != null) {
                      setState(() => csrFile = File(result.files.single.path!));
                    }
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF4E649E)),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.add_circle_outline, color: Color(0xFF98B7F0)),
                        const SizedBox(height: 6),
                        Text(
                          csrFile == null ? 'Upload .csr or .pem file' : csrFile!.path.split(Platform.pathSeparator).last,
                          style: const TextStyle(color: Color(0xFFD0DAF6)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                FilledButton(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(double.infinity, 52),
                    backgroundColor: const Color(0xFFB7C5FF),
                    foregroundColor: const Color(0xFF10214D),
                  ),
                  onPressed: () async {
                    if (selectedRequestId == null) return;
                    setState(() {
                      err = null;
                      info = null;
                    });
                    try {
                      await state.submitCsr(requestId: selectedRequestId!, csrText: csrText.text, csrFile: csrFile);
                      if (!mounted) return;
                      setState(() => info = 'CSR soumise.');
                    } catch (e) {
                      if (!mounted) return;
                      setState(() => err = e.toString());
                    }
                  },
                  child: const Text('Submit Existing CSR', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFF1A2D67), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFF325196))),
            child: const Text(
              'A secure keypair will be generated in your profile and handled on the server.',
              style: TextStyle(color: Color(0xFFAEC0EA), height: 1.35),
            ),
          ),
          const SizedBox(height: 10),
          _RequestCard(
            title: 'Server-Side Generation',
            icon: Icons.developer_board_outlined,
            child: Column(
              children: [
                TextField(controller: cn, decoration: const InputDecoration(labelText: 'CN')),
                const SizedBox(height: 8),
                TextField(controller: o, decoration: const InputDecoration(labelText: 'O')),
                const SizedBox(height: 8),
                TextField(controller: ou, decoration: const InputDecoration(labelText: 'OU')),
                const SizedBox(height: 8),
                TextField(controller: l, decoration: const InputDecoration(labelText: 'L')),
                const SizedBox(height: 8),
                TextField(controller: st, decoration: const InputDecoration(labelText: 'ST')),
                const SizedBox(height: 8),
                TextField(controller: c, decoration: const InputDecoration(labelText: 'C')),
                const SizedBox(height: 8),
                TextField(controller: mail, decoration: const InputDecoration(labelText: 'Email')),
                const SizedBox(height: 8),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 52),
                    side: const BorderSide(color: Color(0xFF42DDFF), width: 1.5),
                    foregroundColor: const Color(0xFF42DDFF),
                  ),
                  onPressed: () async {
                    if (selectedRequestId == null) return;
                    setState(() {
                      err = null;
                      info = null;
                    });
                    try {
                      await state.generateCsr(
                        requestId: selectedRequestId!,
                        payload: {
                          'cn': cn.text.trim(),
                          'o': o.text.trim(),
                          'ou': ou.text.trim(),
                          'l': l.text.trim(),
                          'st': st.text.trim(),
                          'c': c.text.trim(),
                          'email': mail.text.trim(),
                        },
                      );
                      if (!mounted) return;
                      setState(() => info = 'CSR generee et soumise.');
                    } catch (e) {
                      if (!mounted) return;
                      setState(() => err = e.toString());
                    }
                  },
                  child: const Text('Generate CSR on Secure Server', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: 8),
                const Text('Note: A PKCS#12 bundle will be available for download upon issuance.', style: TextStyle(color: Color(0xFF9FB2D9))),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFF07143D), borderRadius: BorderRadius.circular(10)),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Final Step: Token Validation', style: TextStyle(color: Color(0xFFEAF0FF), fontWeight: FontWeight.w700)),
                      SizedBox(height: 3),
                      Text('Validate your identity token to issue the certificate.', style: TextStyle(color: Color(0xFF9FB2D9))),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                FilledButton(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(double.infinity, 52),
                    backgroundColor: const Color(0xFF26D6F7),
                    foregroundColor: const Color(0xFF0A1333),
                  ),
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TokenValidationPage())),
                  child: const Text('Validate Token', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
        ],
        if (info != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0C2D24),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF2F8E71)),
            ),
            child: Text(info!, style: const TextStyle(color: Color(0xFF6FFFC8))),
          ),
        ],
        if (err != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF3A1620),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF8A2E45)),
            ),
            child: Text(err!, style: const TextStyle(color: Color(0xFFFF9DB5))),
          ),
        ],
      ],
    );
  }
}

class RequestsPage extends StatelessWidget {
  const RequestsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    Color statusColor(String s) {
      final up = s.toUpperCase();
      if (up.contains('REVIEW_APPROVED')) return const Color(0xFF57F1FF);
      if (up.contains('PENDING')) return const Color(0xFFB9C8ED);
      if (up.contains('REJECT') || up.contains('FAILED')) return const Color(0xFFFFA7A7);
      return const Color(0xFF8CB7FF);
    }

    return AppPageShell(
      onRefresh: state.refreshUserData,
      children: [
        Row(
          children: const [
            Icon(Icons.shield_outlined, color: Color(0xFFDCE6FF)),
            SizedBox(width: 8),
            Text('shield VaultID', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFE8EEFF))),
          ],
        ),
        const SizedBox(height: 8),
        const Text('Portal  >  Requests', style: TextStyle(color: Color(0xFF9FB2D9))),
        const SizedBox(height: 6),
        const Text('Identity Requests', style: TextStyle(fontSize: 34, height: 1.0, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
        const SizedBox(height: 8),
        const Text('Track the status of your enrollment and certificate pipeline.', style: TextStyle(color: Color(0xFFB8C8ED), height: 1.35)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: state.refreshUserData,
                style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 46)),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Refresh'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FilledButton.icon(
                onPressed: () => goHomeTab(context, 3),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(double.infinity, 46),
                  backgroundColor: const Color(0xFFB7C5FF),
                  foregroundColor: const Color(0xFF0F1E4B),
                ),
                icon: const Icon(Icons.add),
                label: const Text('New Request'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (state.requests.isEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF0A1748),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF2A4A8D)),
            ),
            child: const Text('No requests yet. Start a new identity request from the Identity tab.', style: TextStyle(color: Color(0xFFB9C8ED))),
          ),
        ...state.requests.map((r) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(0),
              decoration: BoxDecoration(
                color: const Color(0xFF0A1748),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF2A4A8D)),
              ),
              child: Column(
                children: [
                  Container(
                    height: 3,
                    decoration: BoxDecoration(
                      color: statusColor(r.status),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: const Color(0xFF182D73),
                          child: Icon(Icons.assignment_outlined, color: statusColor(r.status)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r.commonName.isEmpty ? r.id : r.commonName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 6),
                              Text(r.submittedAt, style: const TextStyle(color: Color(0xFF90A4D8), fontSize: 12)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF102D63),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: statusColor(r.status)),
                          ),
                          child: Text(r.status, style: TextStyle(color: statusColor(r.status), fontWeight: FontWeight.w700, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TokenValidationPage())),
                            child: const Text('Validate'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton(
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const Phase3CsrPage())),
                            child: const Text('Phase 3'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }
}

class CertificatesPage extends StatefulWidget {
  const CertificatesPage({super.key});

  @override
  State<CertificatesPage> createState() => _CertificatesPageState();
}

class _CertificatesPageState extends State<CertificatesPage> {
  String? message;
  String? error;

  Future<void> _download(AppState state, CertificateItem cert, String format, [String? password]) async {
    setState(() {
      message = null;
      error = null;
    });
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = await state.downloadCertificate(certId: cert.id, format: format, password: password, outputDir: dir);
      if (!mounted) return;
      setState(() => message = 'Telecharge: ${file.path}');
    } catch (e) {
      if (!mounted) return;
      setState(() => error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final active = state.certificates.where((c) => c.status.toUpperCase() == 'ACTIVE').length;
    final expiring = state.certificates.where((c) => c.status.toUpperCase().contains('EXPIR')).length;
    final revoked = state.certificates.where((c) => c.status.toUpperCase() == 'REVOKED').length;
    Color certStatusColor(String status) {
      final up = status.toUpperCase();
      if (up.contains('EXPIR')) return const Color(0xFFF4D084);
      if (up.contains('REVOK')) return const Color(0xFFFFA2A2);
      return const Color(0xFF64E8FF);
    }
    return AppPageShell(
      children: [
        Row(
          children: const [
            Icon(Icons.shield_outlined, color: Color(0xFFDCE6FF)),
            SizedBox(width: 8),
            Text('shield VaultID', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFE8EEFF))),
          ],
        ),
        const SizedBox(height: 8),
        const Text('Portal  >  Certificates Vault', style: TextStyle(color: Color(0xFF9FB2D9))),
        const SizedBox(height: 6),
        const Text('Issued Certificates', style: TextStyle(fontSize: 36, height: 1.0, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
        const SizedBox(height: 8),
        const Text(
          'Manage your sovereign cryptographic identities. You can download your public keys in multiple formats or generate a password-protected P12 bundle for local import.',
          style: TextStyle(color: Color(0xFFB8C8ED), height: 1.35),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: state.refreshUserData,
                style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 50), side: const BorderSide(color: Color(0xFF355A9C))),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Sync Vault'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FilledButton.icon(
                onPressed: () => goHomeTab(context, 3),
                style: FilledButton.styleFrom(minimumSize: const Size(double.infinity, 50), backgroundColor: const Color(0xFFB7C5FF), foregroundColor: const Color(0xFF0F1E4B)),
                icon: const Icon(Icons.add),
                label: const Text('New Request'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0A1748),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF2A4A8D)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.account_balance_wallet_outlined, color: Color(0xFF3DE0FF)),
                  SizedBox(width: 8),
                  Text('Vault Analytics', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 8),
              const Text('You currently have active cryptographic identities in your vault.', style: TextStyle(color: Color(0xFFB8C8ED))),
              const SizedBox(height: 12),
              _StatusLine(label: 'Active', value: active.toString().padLeft(2, '0'), color: Color(0xFF64E8FF)),
              _StatusLine(label: 'Expiring Soon', value: expiring.toString().padLeft(2, '0'), color: Color(0xFFF7D98D)),
              _StatusLine(label: 'Revoked', value: revoked.toString().padLeft(2, '0'), color: Color(0xFFFFA2A2)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ...state.certificates.map((cert) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF0A1748),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF2A4A8D)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: const Color(0xFF1A2D6C),
                        child: Icon(
                          cert.status.toUpperCase().contains('EXPIR') ? Icons.warning_amber_outlined : Icons.settings,
                          color: cert.status.toUpperCase().contains('EXPIR') ? const Color(0xFFF4D084) : const Color(0xFF8CB7FF),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF102D63),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: certStatusColor(cert.status)),
                        ),
                        child: Text(cert.status.toUpperCase(), style: TextStyle(color: certStatusColor(cert.status), fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(cert.subjectDN.split(',').first, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text('SN: ${cert.serialNumber}', style: const TextStyle(fontSize: 12, color: Color(0xFF9FB2D9))),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: const Color(0xFF091D58), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFF355792))),
                    child: Text('SUBJECT DN\n${cert.subjectDN}', style: const TextStyle(color: Color(0xFFD2DEF8))),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: const Color(0xFF091D58), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFF355792))),
                    child: Text('VALID UNTIL\n${cert.notAfter}', style: const TextStyle(color: Color(0xFFD2DEF8))),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => _download(state, cert, 'crt'),
                        icon: const Icon(Icons.download, size: 16),
                        label: const Text('.CRT'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () => _download(state, cert, 'pem'),
                        icon: const Icon(Icons.description_outlined, size: 16),
                        label: const Text('.PEM'),
                      ),
                      FilledButton(
                        onPressed: () async {
                          final controller = TextEditingController();
                          final p = await showDialog<String>(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: const Text('Mot de passe .p12'),
                              content: TextField(controller: controller, obscureText: true),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Annuler')),
                                FilledButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text('OK')),
                              ],
                            ),
                          );
                          if (p != null && p.length >= 8) {
                            await _download(state, cert, 'p12', p);
                          }
                        },
                        style: FilledButton.styleFrom(backgroundColor: const Color(0xFF7F97FF), foregroundColor: const Color(0xFF0E1D4A)),
                        child: const Text('Download .P12'),
                      ),
                    ],
                  ),
                ],
              ),
            )),
        if (message != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0C2D24),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF2F8E71)),
            ),
            child: Text(message!, style: const TextStyle(color: Color(0xFF6FFFC8))),
          ),
        ],
        if (error != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF3A1620),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF8A2E45)),
            ),
            child: Text(error!, style: const TextStyle(color: Color(0xFFFF9DB5))),
          ),
        ],
      ],
    );
  }
}

class _StatusLine extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatusLine({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(label, style: const TextStyle(color: Color(0xFFD2DBF4), fontSize: 18)),
          const Spacer(),
          Text(value, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class TokenValidationPage extends StatefulWidget {
  const TokenValidationPage({super.key});

  @override
  State<TokenValidationPage> createState() => _TokenValidationPageState();
}

class _TokenValidationPageState extends State<TokenValidationPage> {
  final requestId = TextEditingController();
  final token = TextEditingController();
  String? info;
  String? error;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final width = MediaQuery.of(context).size.width;
    final recentAlerts = state.notifications.take(5).toList();
    return AppPageShell(
      children: [
        Row(
          children: [
            Icon(Icons.shield_outlined, color: Color(0xFFDCE6FF)),
            const SizedBox(width: 8),
            const Text('VaultID', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFFE8EEFF))),
            const Spacer(),
            IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())), icon: const Icon(Icons.notifications_none)),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Validate Authority Token',
          style: TextStyle(fontSize: width < 380 ? 32 : 42, height: 1.0, fontWeight: FontWeight.w800, color: const Color(0xFFEAF0FF)),
        ),
        const SizedBox(height: 8),
        Text(
          'Enter the cryptographic token sent to your registered email to finalize the Phase 3 CSR process and authorize certificate issuance.',
          style: TextStyle(fontSize: width < 380 ? 14 : 16, color: const Color(0xFFB8C8ED), height: 1.35),
        ),
        const SizedBox(height: 12),
        _RequestCard(
          title: 'Token Verification',
          icon: Icons.verified_outlined,
          child: Column(
            children: [
              TextField(controller: requestId, decoration: const InputDecoration(labelText: 'Request ID', hintText: 'e.g. 7d611af8-...')),
              const SizedBox(height: 8),
              TextField(
                controller: token,
                decoration: const InputDecoration(labelText: 'Validation Token', hintText: 'Paste token from email'),
                obscureText: true,
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  backgroundColor: const Color(0xFF6F8DFF),
                  foregroundColor: const Color(0xFF0A1333),
                ),
                onPressed: () async {
                  setState(() {
                    info = null;
                    error = null;
                  });
                  try {
                    final res = await state.validateToken(requestId: requestId.text.trim(), validationToken: token.text.trim());
                    if (!mounted) return;
                    setState(() => info = 'Token valide. Certificat: ${res['certificateId']}');
                  } catch (e) {
                    if (!mounted) return;
                    setState(() => error = e.toString());
                  }
                },
                icon: const Icon(Icons.settings),
                label: const Text('Verify', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
              const SizedBox(height: 10),
              const Divider(color: Color(0xFF2A4A8D)),
              const SizedBox(height: 10),
              Text('Awaiting validation for ${state.requests.where((r) => r.status == 'REVIEW_APPROVED').length} request', style: const TextStyle(color: Color(0xFF57E3FF))),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Resend action will be added with backend support.'))),
                child: const Text('Resend token?', style: TextStyle(color: Color(0xFFEAF0FF))),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        if (info != null)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0C2D24),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF2F8E71)),
            ),
            child: Text(info!, style: const TextStyle(color: Color(0xFF6FFFC8))),
          ),
        if (error != null)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF3A1620),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF8A2E45)),
            ),
            child: Text(error!, style: const TextStyle(color: Color(0xFFFF9DB5))),
          ),
        const SizedBox(height: 16),
        Row(
          children: [
            const Icon(Icons.history, color: Color(0xFFAFC1E8)),
            const SizedBox(width: 8),
            const Expanded(
              child: Text('Recent Activity & Alerts', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
            ),
            TextButton(onPressed: state.markAllNotificationsRead, child: const Text('Mark all as read')),
          ],
        ),
        const SizedBox(height: 8),
        ...recentAlerts.map((n) {
          final unread = !state.seenNotifications.contains(n.id);
          return _AlertCard(
            title: n.title,
            message: n.message,
            time: n.timestamp,
            unread: unread,
            kind: _alertKind(n),
            onTap: () async {
              await state.markNotificationRead(n.id);
              if (!context.mounted) return;
              if (n.message.contains('REVIEW_APPROVED')) {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const Phase3CsrPage()));
              } else if (n.message.toLowerCase().contains('certificate')) {
                goHomeTab(context, 2);
              } else {
                goHomeTab(context, 1);
              }
            },
          );
        }),
      ],
    );
  }
}

String _alertKind(AppNotificationItem n) {
  final t = '${n.title} ${n.message}'.toLowerCase();
  if (t.contains('failed') || t.contains('error')) return 'failed';
  if (t.contains('approved') || t.contains('review')) return 'approved';
  if (t.contains('certificate') || t.contains('issued')) return 'certificate';
  return 'default';
}

class _AlertCard extends StatelessWidget {
  final String title;
  final String message;
  final String time;
  final bool unread;
  final String kind;
  final VoidCallback onTap;
  final VoidCallback? onDelete;
  const _AlertCard({required this.title, required this.message, required this.time, required this.unread, required this.kind, required this.onTap, this.onDelete});

  @override
  Widget build(BuildContext context) {
    final accent = switch (kind) {
      'failed' => const Color(0xFFFFA99A),
      'approved' => const Color(0xFF57F1FF),
      'certificate' => const Color(0xFFC2CCFF),
      _ => const Color(0xFF6F8DFF),
    };
    final actionText = switch (kind) {
      'failed' => 'Correct Request',
      'approved' => 'Go to Phase 3',
      'certificate' => 'Download files',
      _ => 'Open details',
    };
    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(0),
        decoration: BoxDecoration(
          color: const Color(0xFF0A1748),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: unread ? accent : const Color(0xFF2A4A8D)),
        ),
        child: Row(
          children: [
            Container(width: 3, height: 168, decoration: BoxDecoration(color: accent, borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)))),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      backgroundColor: unread ? const Color(0xFF102D63) : const Color(0xFF1A2D73),
                      child: Icon(unread ? Icons.notification_important_outlined : Icons.mark_email_read_outlined, color: accent),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFFEAF0FF)))),
                              const SizedBox(width: 8),
                              Flexible(child: Text(time, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF9FB2D9)))),
                              if (onDelete != null) ...[
                                const SizedBox(width: 2),
                                IconButton(
                                  onPressed: onDelete,
                                  icon: const Icon(Icons.delete_outline, color: Color(0xFFFFA7A7), size: 20),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                                  tooltip: 'Supprimer',
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(message, maxLines: 4, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFB8C8ED), height: 1.35)),
                          const SizedBox(height: 10),
                          Text(actionText, style: TextStyle(color: accent, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    Future<void> openDetails(AppNotificationItem n) async {
      await state.markNotificationRead(n.id);
      if (!context.mounted) return;
      await showModalBottomSheet(
        context: context,
        backgroundColor: const Color(0xFF0A1748),
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
        builder: (_) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(n.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
              const SizedBox(height: 8),
              Text(n.message, style: const TextStyle(color: Color(0xFFB8C8ED))),
              const SizedBox(height: 6),
              Text(n.timestamp, style: const TextStyle(color: Color(0xFF8FA4D8))),
              const SizedBox(height: 14),
              FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  final k = _alertKind(n);
                  if (k == 'approved') {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const Phase3CsrPage()));
                  } else if (k == 'certificate') {
                    goHomeTab(context, 2);
                    Navigator.pop(context);
                  } else {
                    goHomeTab(context, 1);
                    Navigator.pop(context);
                  }
                },
                style: FilledButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                child: const Text('Open details'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF050B24),
      body: SafeArea(
        child: AppPageShell(
          children: [
        Row(
          children: [
            const Icon(Icons.shield_outlined, color: Color(0xFFDCE6FF)),
            const SizedBox(width: 8),
            const Text('shield VaultID', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFFE8EEFF))),
            const Spacer(),
            const Icon(Icons.notifications_none, color: Color(0xFFC7D8FF)),
            const SizedBox(width: 12),
            const CircleAvatar(radius: 15, backgroundColor: Color(0xFF1A2E67), child: Icon(Icons.person, size: 16, color: Color(0xFFDCE6FF))),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Notifications', style: TextStyle(fontSize: 44, height: 0.95, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
                  SizedBox(height: 4),
                  Text('Stay updated on your secure identity status', style: TextStyle(color: Color(0xFFB8C8ED), fontSize: 16)),
                ],
              ),
            ),
            TextButton(onPressed: state.markAllNotificationsRead, child: const Text('Mark all as read')),
          ],
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: const [
              _NotifFilterChip(label: 'All', active: true),
              SizedBox(width: 8),
              _NotifFilterChip(label: 'Security'),
              SizedBox(width: 8),
              _NotifFilterChip(label: 'System'),
              SizedBox(width: 8),
              _NotifFilterChip(label: 'Requests'),
            ],
          ),
        ),
        const SizedBox(height: 14),
        if (state.notifications.isEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF0A1748),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF2A4A8D)),
            ),
            child: const Text('Aucune notification pour le moment.', style: TextStyle(color: Color(0xFFB8C8ED))),
          ),
        ...state.notifications.asMap().entries.map((entry) {
          final idx = entry.key;
          final n = entry.value;
          final unread = !state.seenNotifications.contains(n.id);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (idx == 4) const Padding(
                padding: EdgeInsets.only(top: 10, bottom: 10),
                child: Text('YESTERDAY', style: TextStyle(color: Color(0xFF8FA4D8), fontWeight: FontWeight.w700, letterSpacing: 1.4)),
              ),
              _NotificationRichCard(
                title: n.title,
                message: n.message,
                time: _prettyNotifTime(n.timestamp),
                unread: unread,
                kind: _alertKind(n),
                onTap: () => openDetails(n),
                onDelete: null,
              ),
            ],
          );
        }),
          ],
        ),
      ),
    );
  }
}

String _prettyNotifTime(String raw) {
  try {
    final dt = DateTime.parse(raw).toLocal();
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  } catch (_) {
    return raw.length > 16 ? '${raw.substring(0, 16)}...' : raw;
  }
}

class _NotifFilterChip extends StatelessWidget {
  final String label;
  final bool active;
  const _NotifFilterChip({required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 11),
      decoration: BoxDecoration(
        color: active ? const Color(0xFF6F8DFF) : const Color(0xFF1A2E6B),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Text(label, style: TextStyle(fontSize: 14, color: active ? const Color(0xFF0B1538) : const Color(0xFFD1DCFA), fontWeight: FontWeight.w700)),
    );
  }
}

class _NotificationRichCard extends StatelessWidget {
  final String title;
  final String message;
  final String time;
  final bool unread;
  final String kind;
  final VoidCallback onTap;
  final VoidCallback? onDelete;
  const _NotificationRichCard({
    required this.title,
    required this.message,
    required this.time,
    required this.unread,
    required this.kind,
    required this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final accent = switch (kind) {
      'failed' => const Color(0xFFFFA99A),
      'approved' => const Color(0xFF57F1FF),
      'certificate' => const Color(0xFFC2CCFF),
      _ => const Color(0xFF6F8DFF),
    };
    final actionText = switch (kind) {
      'failed' => 'Review Activity',
      'approved' => 'Approve',
      'certificate' => 'Open details',
      _ => 'Open details',
    };
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0A1748),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: unread ? accent : const Color(0xFF3A4F85), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: const Color(0xFF1A2D73),
                child: Icon(kind == 'failed' ? Icons.warning_amber_rounded : Icons.mark_email_unread_outlined, color: accent, size: 24),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFEAF0FF), fontWeight: FontWeight.w800, fontSize: 20, height: 1.1)),
              ),
              const SizedBox(width: 6),
              SizedBox(
                width: 52,
                child: Text(time, textAlign: TextAlign.right, style: const TextStyle(color: Color(0xFF9FB2D9))),
              ),
              if (onDelete != null)
                IconButton(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline, color: Color(0xFFFFA7A7), size: 20),
                  constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                  padding: EdgeInsets.zero,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(message, maxLines: 4, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFB8C8ED), fontSize: 17, height: 1.35)),
          const SizedBox(height: 10),
          Row(
            children: [
              FilledButton(
                onPressed: onTap,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFB7C5FF),
                  foregroundColor: const Color(0xFF10214D),
                  minimumSize: const Size(160, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(actionText),
              ),
              if (kind == 'failed') ...[
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: onTap,
                  style: OutlinedButton.styleFrom(minimumSize: const Size(150, 48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Secure Account'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final unreadCount = state.notifications.where((n) => !state.seenNotifications.contains(n.id)).length;
    return AppPageShell(
      children: [
        Row(
          children: [
            const Icon(Icons.settings, color: Color(0xFF61E8FF)),
            const SizedBox(width: 8),
            const Text('Settings', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: Color(0xFFEAF0FF))),
          ],
        ),
        const SizedBox(height: 12),
        _RequestCard(
          title: 'Account Profile',
          icon: Icons.person_outline,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: const Color(0xFF102D63),
                    child: Text(
                      ((state.user?.firstName ?? 'U').isNotEmpty ? (state.user?.firstName ?? 'U')[0] : 'U').toUpperCase(),
                      style: const TextStyle(color: Color(0xFFBFE8FF), fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${state.user?.firstName ?? ''} ${state.user?.lastName ?? ''}', style: const TextStyle(color: Color(0xFFEAF0FF), fontSize: 18, fontWeight: FontWeight.w700)),
                        Text(state.user?.email ?? '-', style: const TextStyle(color: Color(0xFFB4C7EA))),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        _RequestCard(
          title: 'Notifications',
          icon: Icons.notifications_active_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Unread: $unreadCount', style: const TextStyle(color: Color(0xFF61E8FF), fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              FilledButton.tonal(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                style: FilledButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                child: const Text('Open Notifications'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: state.markAllNotificationsRead,
                style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                child: const Text('Mark all as read'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        _RequestCard(
          title: 'Quick Actions',
          icon: Icons.tune,
          child: Column(
            children: [
              FilledButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LandingDocsScreen())),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                  backgroundColor: const Color(0xFF6F8DFF),
                  foregroundColor: const Color(0xFF081331),
                ),
                child: const Text('Open Documentation'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TokenValidationPage())),
                style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                child: const Text('Open Token Validation'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: state.logout,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                  side: const BorderSide(color: Color(0xFFFF9A9A)),
                  foregroundColor: const Color(0xFFFFB5B5),
                ),
                child: const Text('Logout'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
