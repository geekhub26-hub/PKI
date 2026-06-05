// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:frontend_mobile/main.dart';
import 'package:frontend_mobile/api_client.dart';
import 'package:frontend_mobile/app_state.dart';

void main() {
  testWidgets('renders login screen by default', (WidgetTester tester) async {
    final state = AppState(ApiClient(baseUrl: 'http://localhost:8080/api'));
    await tester.pumpWidget(MyApp(state: state));
    expect(find.text('Connexion'), findsOneWidget);
  });
}
