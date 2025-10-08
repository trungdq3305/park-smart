import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

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
  static const _storage = FlutterSecureStorage();

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
            // Handle WebView error
          },
          onNavigationRequest: (NavigationRequest request) {
            // Kiểm tra URL callback để lấy token
            if (request.url.contains('park-smart://login-success')) {
              // Extract token từ URL
              final uri = Uri.parse(request.url);
              final token = uri.queryParameters['token'];

              if (token != null) {
                widget.onSuccess(token);
                Navigator.of(context).pop(true);
                return NavigationDecision.prevent;
              }
            }

            return NavigationDecision.navigate;
          },
        ),
      );

    // Clear session và load URL với tham số force account selection
    _loadLoginUrl();
  }

  Future<void> _loadLoginUrl() async {
    try {
      // Kiểm tra xem có cần clear session không
      final shouldClearSession = await _storage.read(
        key: 'clearWebViewSession',
      );

      if (shouldClearSession == 'true') {
        // Clear cookies và session trước khi load
        await _controller.clearCache();
        await _controller.clearLocalStorage();

        // Xóa flag sau khi đã clear
        await _storage.delete(key: 'clearWebViewSession');
      }

      // Thêm tham số để force account selection
      String loginUrl = widget.url;
      if (loginUrl.contains('?')) {
        loginUrl += '&prompt=select_account';
      } else {
        loginUrl += '?prompt=select_account';
      }

      await _controller.loadRequest(Uri.parse(loginUrl));
    } catch (e) {
      // Handle error loading login URL
    }
  }

  Future<void> _checkForJsonResponse() async {
    try {
      // Lấy nội dung HTML của trang hiện tại
      final html = await _controller.runJavaScriptReturningResult(
        'document.body.innerText',
      );
      final content = html.toString();

      // Kiểm tra nếu chứa JSON response với message "Đăng nhập thành công"
      if (content.contains('Đăng nhập thành công') &&
          content.contains('data')) {
        // Xử lý content để loại bỏ escape characters
        String cleanContent = content;

        // Nếu content bắt đầu và kết thúc bằng dấu ngoặc kép, loại bỏ chúng
        if (cleanContent.startsWith('"') && cleanContent.endsWith('"')) {
          cleanContent = cleanContent.substring(1, cleanContent.length - 1);
        }

        // Thay thế các escape characters
        cleanContent = cleanContent.replaceAll('\\"', '"');
        cleanContent = cleanContent.replaceAll('\\n', '\n');
        cleanContent = cleanContent.replaceAll('\\t', '\t');
        cleanContent = cleanContent.replaceAll('\\\\', '\\');

        try {
          // Parse JSON để lấy token
          final Map<String, dynamic> jsonData = json.decode(cleanContent);
          final token = jsonData['data'] as String?;

          if (token != null && token.isNotEmpty) {
            widget.onSuccess(token);
            Navigator.of(context).pop(true);
          }
        } catch (jsonError) {
          // Fallback: thử extract token bằng regex nếu JSON parsing thất bại
          final tokenMatch = RegExp(
            r'"data":"([^"]+)"',
          ).firstMatch(cleanContent);
          if (tokenMatch != null) {
            final token = tokenMatch.group(1);
            if (token != null) {
              widget.onSuccess(token);
              Navigator.of(context).pop(true);
            }
          }
        }
      }
    } catch (e) {
      // Handle error checking JSON response
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
      // body: Stack(
      //   children: [
      //     WebViewWidget(controller: _controller),
      //     if (_isLoading)
      //       const Center(
      //         child: CircularProgressIndicator(
      //           valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
      //         ),
      //       ),
      //   ],
      // ),
    );
  }
}
