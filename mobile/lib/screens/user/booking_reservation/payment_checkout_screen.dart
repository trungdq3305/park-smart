import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PaymentCheckoutScreen extends StatefulWidget {
  final String checkoutUrl;
  final String? paymentId;
  final Function(bool success, String? paymentId)? onPaymentComplete;

  const PaymentCheckoutScreen({
    super.key,
    required this.checkoutUrl,
    this.paymentId,
    this.onPaymentComplete,
  });

  @override
  State<PaymentCheckoutScreen> createState() => _PaymentCheckoutScreenState();
}

class _PaymentCheckoutScreenState extends State<PaymentCheckoutScreen> {
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
            // Update loading progress if needed
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

            // Check for payment completion indicators
            _checkPaymentStatus(url);
          },
          onWebResourceError: (WebResourceError error) {
            print('❌ WebView error: ${error.description}');
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Lỗi tải trang: ${error.description}'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            // Check for payment success/failure URLs
            final url = request.url.toLowerCase();
            
            // Xendit success indicators
            if (url.contains('success') || 
                url.contains('completed') || 
                url.contains('paid')) {
              _handlePaymentSuccess();
              return NavigationDecision.prevent;
            }
            
            // Xendit failure indicators
            if (url.contains('failed') || 
                url.contains('error') || 
                url.contains('cancelled') ||
                url.contains('expired')) {
              _handlePaymentFailure();
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  void _checkPaymentStatus(String url) {
    // Check URL for payment status indicators
    final lowerUrl = url.toLowerCase();
    
    if (lowerUrl.contains('success') || 
        lowerUrl.contains('completed') || 
        lowerUrl.contains('paid')) {
      _handlePaymentSuccess();
    } else if (lowerUrl.contains('failed') || 
               lowerUrl.contains('error') || 
               lowerUrl.contains('cancelled')) {
      _handlePaymentFailure();
    }
  }

  void _handlePaymentSuccess() {
    print('✅ Payment successful');
    if (widget.onPaymentComplete != null) {
      widget.onPaymentComplete!(true, widget.paymentId);
    }
    if (mounted) {
      Navigator.of(context).pop(true);
    }
  }

  void _handlePaymentFailure() {
    print('❌ Payment failed or cancelled');
    if (widget.onPaymentComplete != null) {
      widget.onPaymentComplete!(false, widget.paymentId);
    }
    if (mounted) {
      Navigator.of(context).pop(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            // Show confirmation dialog before closing
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Hủy thanh toán?'),
                content: const Text(
                  'Bạn có chắc chắn muốn hủy thanh toán? Giao dịch sẽ không được hoàn tất.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Tiếp tục thanh toán'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop(); // Close dialog
                      Navigator.of(context).pop(false); // Close WebView
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.red,
                    ),
                    child: const Text('Hủy thanh toán'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            Container(
              color: Colors.white,
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

