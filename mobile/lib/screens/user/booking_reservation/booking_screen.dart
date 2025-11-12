import 'package:flutter/material.dart';
import '../../../widgets/app_scaffold.dart';
import '../../../services/parking_lot_service.dart';
import '../../../services/subcription_service.dart';
import '../../../services/payment_service.dart';
import '../../../widgets/booking/parking_lot_info_card.dart';
import '../../../widgets/booking/electric_car_message.dart';
import '../../../widgets/booking/pricing_table_card.dart';
import 'payment_checkout_screen.dart';

class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> parkingLot;

  const BookingScreen({super.key, required this.parkingLot});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _durationController = TextEditingController();

  bool _isLoading = false;
  bool _isLoadingSpaces = false;
  bool _isLoadingPricing = false;
  bool _isCreatingSubscription = false;
  List<Map<String, dynamic>> _parkingSpaces = [];
  List<Map<String, dynamic>> _pricingLinks = [];
  String? _selectedSpaceId;
  String? _selectedPricingPolicyId;
  int _selectedLevel = 1;
  List<int> _availableLevels = [];
  bool _isSelectedSpaceElectric = false;

  @override
  void initState() {
    super.initState();
    _initializeLevels();
    _loadParkingSpaces();
    _loadPricingLinks();
  }

  /// Initialize available levels from parking lot data
  void _initializeLevels() {
    final totalLevel = widget.parkingLot['totalLevel'] ?? 1;
    _availableLevels = List.generate(totalLevel, (index) => index + 1);
    print('🏢 Available levels from parking lot: $_availableLevels');
  }

  @override
  void dispose() {
    _durationController.dispose();
    super.dispose();
  }

  /// Load parking spaces for the selected level
  Future<void> _loadParkingSpaces() async {
    setState(() {
      _isLoadingSpaces = true;
    });

    try {
      final parkingLotId = widget.parkingLot['_id'] ?? widget.parkingLot['id'];
      if (parkingLotId == null) {
        throw Exception('Không tìm thấy ID bãi đỗ xe');
      }

      print('🅿️ Loading parking spaces for level $_selectedLevel...');

      final response = await ParkingLotService.getParkingSpaces(
        parkingLotId: parkingLotId,
        level: _selectedLevel,
        pageSize: 1000, // Get all spaces for the level
      );

      final spacesData = response['data'];
      List<Map<String, dynamic>> spaces = [];

      if (spacesData is List) {
        spaces = List<Map<String, dynamic>>.from(spacesData);
      }

      setState(() {
        _parkingSpaces = spaces;
        _isLoadingSpaces = false;
      });

      print(
        '✅ Loaded ${spaces.length} parking spaces for level $_selectedLevel',
      );
      print('📊 Available levels: $_availableLevels');

      // Debug: Print first few spaces to see the data structure
      if (spaces.isNotEmpty) {
        print('🔍 Sample space data:');
        for (int i = 0; i < (spaces.length > 3 ? 3 : spaces.length); i++) {
          print('  Space $i: ${spaces[i]}');
        }
      }
    } catch (e) {
      setState(() {
        _isLoadingSpaces = false;
      });
      print('❌ Error loading parking spaces: $e');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải vị trí đỗ xe: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Load pricing links for the parking lot
  Future<void> _loadPricingLinks() async {
    setState(() {
      _isLoadingPricing = true;
    });

    try {
      final parkingLotId = widget.parkingLot['_id'] ?? widget.parkingLot['id'];
      if (parkingLotId == null) {
        throw Exception('Không tìm thấy ID bãi đỗ xe');
      }

      print('💰 Loading pricing links for parking lot...');

      final response =
          await ParkingLotService.getActiveParkingLotLinksByParkingLot(
            parkingLotId,
          );

      final linksData = response['data'];
      List<Map<String, dynamic>> links = [];

      if (linksData is List) {
        links = List<Map<String, dynamic>>.from(linksData);
      }

      setState(() {
        _pricingLinks = links;
        _isLoadingPricing = false;
      });

      print('✅ Loaded ${links.length} pricing links');
    } catch (e) {
      setState(() {
        _isLoadingPricing = false;
      });
      print('❌ Error loading pricing links: $e');

      // Don't show error snackbar for pricing, just log it
      // Pricing is not critical for booking flow
    }
  }

  /// Change selected level and reload spaces
  void _changeLevel(int level) {
    if (level != _selectedLevel) {
      setState(() {
        _selectedLevel = level;
        _selectedSpaceId = null; // Reset selection
        _isSelectedSpaceElectric = false; // Reset electric car status
      });
      _loadParkingSpaces();
    }
  }

  /// Get selected space information
  String _getSelectedSpaceInfo() {
    if (_selectedSpaceId == null) return '';

    final selectedSpace = _parkingSpaces.firstWhere(
      (space) => (space['_id'] ?? space['id']) == _selectedSpaceId,
      orElse: () => {},
    );

    if (selectedSpace.isEmpty) return 'Không xác định';

    final spaceCode =
        selectedSpace['code'] ??
        selectedSpace['spaceNumber'] ??
        selectedSpace['number'] ??
        '?';
    final row = selectedSpace['row'] ?? 'A';

    // Update electric car status
    _isSelectedSpaceElectric = selectedSpace['isElectricCar'] ?? false;

    return 'Tầng $_selectedLevel - Hàng $row - Vị trí $spaceCode';
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Đặt chỗ đỗ xe'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Parking lot info card
                ParkingLotInfoCard(parkingLot: widget.parkingLot),

                const SizedBox(height: 24),

                // Pricing table card
                PricingTableCard(
                  pricingLinks: _pricingLinks,
                  isLoading: _isLoadingPricing,
                  selectedPricingPolicyId: _selectedPricingPolicyId,
                  onPricingSelected: _onPricingSelected,
                ),

                const SizedBox(height: 24),

                // Electric car message
                ElectricCarMessage(
                  isVisible:
                      _selectedSpaceId != null && _isSelectedSpaceElectric,
                ),

                // Submit button for subscription
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: (_isLoading || _isCreatingSubscription)
                        ? null
                        : _createSubscription,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: (_isLoading || _isCreatingSubscription)
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text(
                            'Đăng ký gói thuê bao',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _calculateEstimatedCost() {
    final duration = int.tryParse(_durationController.text);
    if (duration == null || duration <= 0) return '0';

    // Placeholder calculation - will be updated with actual pricing logic
    const basePrice = 5000; // VND per hour
    final total = duration * basePrice;

    return total.toString();
  }

  /// Handle pricing policy selection (toggle)
  void _onPricingSelected(String pricingPolicyId, Map<String, dynamic> link) {
    setState(() {
      // If clicking on already selected item, deselect it
      if (_selectedPricingPolicyId == pricingPolicyId) {
        _selectedPricingPolicyId = null;
        print('❌ Deselected pricing policy: $pricingPolicyId');
      } else {
        _selectedPricingPolicyId = pricingPolicyId;
        print('✅ Selected pricing policy: $pricingPolicyId');
      }
    });
  }

  /// Create subscription with selected pricing policy and payment
  Future<void> _createSubscription() async {
    // Validate parking lot ID
    final parkingLotId = widget.parkingLot['_id'] ?? widget.parkingLot['id'];
    if (parkingLotId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID bãi đỗ xe'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Validate pricing policy selection
    if (_selectedPricingPolicyId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn gói thuê bao'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Find the selected pricing link to get pricing policy details
    final selectedLink = _pricingLinks.firstWhere((link) {
      final pricingPolicy = link['pricingPolicyId'];
      final pricingPolicyId = pricingPolicy?['_id'] ?? pricingPolicy?['id'];
      return pricingPolicyId == _selectedPricingPolicyId;
    }, orElse: () => <String, dynamic>{});

    if (selectedLink.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy thông tin gói thuê bao đã chọn'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Extract pricing policy and package rate information
    final pricingPolicy = selectedLink['pricingPolicyId'];
    final packageRate = pricingPolicy?['packageRateId'];

    if (pricingPolicy == null || packageRate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thông tin gói thuê bao không đầy đủ'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Get required data for payment
    final entityId = pricingPolicy['_id'] ?? pricingPolicy['id'];
    final amount = packageRate['price'] as int? ?? 0;
    final operatorId = widget.parkingLot['parkingLotOperatorId'] as String?;

    if (entityId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID của gói thuê bao'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Giá gói thuê bao không hợp lệ'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isCreatingSubscription = true;
    });

    try {
      // Step 1: Create payment
      print('💳 Creating payment:');
      print('  Entity ID (Pricing Policy): $entityId');
      print('  Type: Subscription');
      print('  Amount: $amount');
      print('  Operator ID: $operatorId');

      final paymentResponse = await PaymentService.createPayment(
        entityId: entityId,
        type: 'Subscription',
        amount: amount,
        operatorId: operatorId,
      );

      print('📦 Payment response type: ${paymentResponse.runtimeType}');
      print('📦 Payment response: $paymentResponse');

      // Safely extract payment data - handle both Map and List responses
      dynamic paymentData;
      try {
        paymentData = paymentResponse['data'];
        print('📦 Payment data type: ${paymentData?.runtimeType}');

        // If data is a List, take the first item
        if (paymentData is List && paymentData.isNotEmpty) {
          paymentData = paymentData[0]; // Take first item if it's a list
          print(
            '📦 Payment data (after List extraction): ${paymentData.runtimeType}',
          );
        }
      } catch (e) {
        print('⚠️ Error extracting payment data: $e');
        paymentData = null;
      }

      // Payment ID may not be available immediately, will be in callback URL
      String? paymentId;
      try {
        if (paymentData is Map) {
          paymentId = paymentData['_id'] ?? paymentData['id'];
        }
        paymentId ??= paymentResponse['_id'] ?? paymentResponse['id'];
      } catch (e) {
        print('⚠️ Error extracting payment ID: $e');
        paymentId = null;
      }

      print('✅ Payment created successfully.');
      if (paymentId != null) {
        print('  Payment ID (from response): $paymentId');
      } else {
        print('  Payment ID will be available in callback URL after payment');
      }

      // Get checkout URL from payment response
      String? checkoutUrl;
      try {
        if (paymentData is Map) {
          checkoutUrl = paymentData['checkoutUrl']?.toString();
        }
        checkoutUrl ??= paymentResponse['checkoutUrl']?.toString();
      } catch (e) {
        print('⚠️ Error extracting checkout URL: $e');
        checkoutUrl = null;
      }

      if (checkoutUrl == null || checkoutUrl.toString().isEmpty) {
        throw Exception('Không nhận được checkout URL từ server');
      }

      print('🔗 Checkout URL: $checkoutUrl');
      print('🔗 Checkout URL type: ${checkoutUrl.runtimeType}');
      print('🔗 Checkout URL toString: ${checkoutUrl.toString()}');

      // Step 2: Create subscription
      final now = DateTime.now();
      final startDate = DateTime(
        now.year,
        now.month,
        now.day,
      ).toUtc().toIso8601String();

      print('📝 Creating subscription:');
      print('  Parking Lot ID: $parkingLotId');
      print('  Pricing Policy ID: $_selectedPricingPolicyId');
      print('  Start Date: $startDate');

      final subscriptionResponse = await SubscriptionService.createSubscription(
        parkingLotId: parkingLotId,
        pricingPolicyId: _selectedPricingPolicyId!,
        startDate: startDate,
      );

      print(
        '📦 Subscription response type: ${subscriptionResponse.runtimeType}',
      );
      print('📦 Subscription response: $subscriptionResponse');

      // Safely extract subscription data - handle both Map and List responses
      dynamic subscriptionData;
      try {
        subscriptionData = subscriptionResponse['data'];
        print('📦 Subscription data type: ${subscriptionData?.runtimeType}');

        // If data is a List, take the first item
        if (subscriptionData is List && subscriptionData.isNotEmpty) {
          subscriptionData =
              subscriptionData[0]; // Take first item if it's a list
          print(
            '📦 Subscription data (after List extraction): ${subscriptionData.runtimeType}',
          );
        }
      } catch (e) {
        print('⚠️ Error extracting subscription data: $e');
        subscriptionData = null;
      }

      String? subscriptionId;
      try {
        if (subscriptionData is Map) {
          subscriptionId = subscriptionData['_id'] ?? subscriptionData['id'];
        }
        subscriptionId ??=
            subscriptionResponse['_id'] ?? subscriptionResponse['id'];
      } catch (e) {
        print('⚠️ Error extracting subscription ID: $e');
        subscriptionId = null;
      }

      print(
        '✅ Subscription created successfully. Subscription ID: $subscriptionId',
      );

      // Step 3: Open payment checkout WebView
      if (mounted) {
        final finalCheckoutUrl = checkoutUrl.toString();
        print('🚀 Opening payment checkout WebView:');
        print('  Final Checkout URL: $finalCheckoutUrl');
        print('  Payment ID: $paymentId');

        final paymentResult = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) {
              print('📱 Building PaymentCheckoutScreen route');
              return PaymentCheckoutScreen(
                checkoutUrl: finalCheckoutUrl,
                paymentId: paymentId, // May be null, will get from URL callback
                onPaymentComplete: (success, returnedPaymentId) async {
                  if (success) {
                    // Step 4: Confirm payment for subscription (activate subscription)
                    // PaymentId from URL callback is required
                    final finalPaymentId = returnedPaymentId ?? paymentId;

                    if (subscriptionId != null && finalPaymentId != null) {
                      try {
                        print('💳 Confirming payment for subscription:');
                        print('  Subscription ID: $subscriptionId');
                        print('  Payment ID (from URL): $returnedPaymentId');
                        print('  Payment ID (original): $paymentId');
                        print('  Using Payment ID: $finalPaymentId');

                        await SubscriptionService.confirmPayment(
                          subscriptionId: subscriptionId,
                          paymentId: finalPaymentId,
                        );

                        print('✅ Payment confirmed and subscription activated');

                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Đăng ký gói thuê bao và thanh toán thành công!',
                              ),
                              backgroundColor: Colors.green,
                              duration: Duration(seconds: 3),
                            ),
                          );
                        }
                      } catch (confirmError) {
                        print('⚠️ Error confirming payment: $confirmError');
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Thanh toán thành công nhưng có lỗi khi kích hoạt gói: ${confirmError.toString()}',
                              ),
                              backgroundColor: Colors.orange,
                              duration: const Duration(seconds: 3),
                            ),
                          );
                        }
                      }
                    } else {
                      print('⚠️ Missing subscriptionId or paymentId');
                      print('  Subscription ID: $subscriptionId');
                      print('  Payment ID from URL: $returnedPaymentId');
                      print('  Payment ID from response: $paymentId');
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              returnedPaymentId == null
                                  ? 'Không nhận được Payment ID từ URL callback. Vui lòng thử lại.'
                                  : 'Thiếu thông tin để kích hoạt gói thuê bao.',
                            ),
                            backgroundColor: Colors.orange,
                            duration: const Duration(seconds: 3),
                          ),
                        );
                      }
                    }
                  } else {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Thanh toán đã bị hủy hoặc thất bại.'),
                          backgroundColor: Colors.orange,
                          duration: Duration(seconds: 3),
                        ),
                      );
                    }
                  }
                },
              );
            },
          ),
        );

        // Navigate back after payment process
        if (mounted && paymentResult == true) {
          // Payment successful, already handled in onPaymentComplete
          Navigator.pop(context, subscriptionResponse);
        } else if (mounted) {
          // Payment cancelled or failed
          Navigator.pop(context);
        }
      }
    } catch (e) {
      print('❌ Error creating subscription/payment: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCreatingSubscription = false;
        });
      }
    }
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (widget.parkingLot['availableSpots'] <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bãi đỗ xe đã hết chỗ trống'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_selectedSpaceId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn vị trí đỗ xe'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Implement actual booking API call
      await Future.delayed(const Duration(seconds: 2)); // Simulate API call

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Đặt chỗ thành công! Bạn sẽ nhận được thông báo xác nhận.',
            ),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate back to parking lot screen
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi đặt chỗ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}
