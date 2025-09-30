import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:convert';

class WebViewLoginScreen extends StatefulWidget {
  final String url;
  final Function(String) onSuccess;

  const WebViewLoginScreen({
    super.key,
    required this.url,
    required this.onSuccess,
  });

  @override
  State<WebViewLoginScreen> createState() => _WebViewLoginScreenState();
}

class _WebViewLoginScreenState extends State<WebViewLoginScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading progress
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });

            // Kiểm tra nếu trang hiện tại chứa JSON response
            _checkForJsonResponse();
          },
          onWebResourceError: (WebResourceError error) {
            print('WebView error: ${error.description}');
          },
          onNavigationRequest: (NavigationRequest request) {
            print('Navigation to: ${request.url}');

            // Kiểm tra URL callback để lấy token
            if (request.url.contains('park-smart://login-success')) {
              // Extract token từ URL
              final uri = Uri.parse(request.url);
              final token = uri.queryParameters['token'];

              if (token != null) {
                print('Token received: $token');
                widget.onSuccess(token);
                Navigator.of(context).pop(true);
                return NavigationDecision.prevent;
              }
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  Future<void> _checkForJsonResponse() async {
    try {
      // Lấy nội dung HTML của trang hiện tại
      final html = await _controller.runJavaScriptReturningResult(
        'document.body.innerText',
      );
      final content = html.toString();

      print('Page content: $content');

      // Kiểm tra nếu chứa JSON response với message "Đăng nhập thành công"
      if (content.contains('Đăng nhập thành công') &&
          content.contains('data')) {
        print('Detected successful login JSON response');

        // Extract token từ JSON content (không remove quotes)
        final tokenMatch = RegExp(r'"data":"([^"]+)"').firstMatch(content);
        if (tokenMatch != null) {
          final token = tokenMatch.group(1);
          print('Extracted token: $token');

          if (token != null) {
            widget.onSuccess(token);
            Navigator.of(context).pop(true);
          }
        } else {
          print('Failed to extract token from content');
        }
      }
    } catch (e) {
      print('Error checking JSON response: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đăng nhập Google'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(false),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
              ),
            ),
        ],
      ),
    );
  }
}
