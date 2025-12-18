import 'package:flutter/material.dart';
import '../../../widgets/app_scaffold.dart';
import '../../../services/parking_lot_service.dart';
import '../../../services/promotion_service.dart';
import '../../../services/favourities_service.dart';
import '../../../widgets/booking/card/parking_lot_info_card.dart';
import '../../../widgets/booking/card/pricing_table_card.dart';
import '../../../widgets/booking/card/promotion_card.dart';
import '../../../widgets/booking/card/payment_summary_card.dart';
import '../../../widgets/booking/comment_parkinglot/comments_section.dart';
import '../../../widgets/booking/celendar/subscription_calendar.dart';
import '../../../widgets/booking/card/booking_method_card.dart';
import '../../../widgets/booking/celendar/reservation_time_selector.dart';
import '../../../widgets/booking/button_booking/booking_submit_button.dart';
import '../../../widgets/booking/helpers/booking_availability_helper.dart';
import '../../../widgets/booking/helpers/booking_flow_helper.dart';

class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> parkingLot;

  const BookingScreen({super.key, required this.parkingLot});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();

  bool _isLoadingPricing = false;
  bool _isCreating = false;
  bool _isLoadingAvailability = false;
  bool _isLoadingPromotions = false;
  bool _isAddingFavourite = false;
  bool _isFavourite = false;
  List<Map<String, dynamic>> _pricingLinks = [];
  List<Map<String, dynamic>> _promotions = [];
  Map<String, dynamic>? _selectedPromotion;
  String? _selectedPricingPolicyId;
  Map<String, dynamic> _availabilityData = {};
  DateTime? _selectedStartDate;
  bool _isPackageType = false;
  BookingMethod? _selectedBookingMethod;
  TimeOfDay? _userExpectedTime;
  TimeOfDay? _estimatedEndTime;
  String? _lastLoadedParkingLotId;
  BookingMethod? _lastLoadedBookingMethod;

  @override
  void initState() {
    super.initState();
    _loadPricingLinks();
    _loadPromotions();
    _loadFavouriteStatus();
  }

  /// Load promotions for the parking lot operator
  Future<void> _loadPromotions() async {
    final operatorId =
        widget.parkingLot['parkingLotOperatorId']?.toString() ??
        widget.parkingLot['operatorId']?.toString();

    if (operatorId == null || operatorId.isEmpty) {
      print('⚠️ Cannot load promotions: Operator ID is null');
      return;
    }

    setState(() {
      _isLoadingPromotions = true;
    });

    try {
      print('🎁 Loading promotions for operator: $operatorId');

      final response = await PromotionService.getPromotionsByOperator(
        operatorId: operatorId,
      );

      final promotionsData = response['data'];
      List<Map<String, dynamic>> promotions = [];

      if (promotionsData is List) {
        promotions = List<Map<String, dynamic>>.from(promotionsData);
      }

      setState(() {
        _promotions = promotions;
        _isLoadingPromotions = false;
      });

      print('✅ Loaded ${promotions.length} promotions');
    } catch (e) {
      setState(() {
        _isLoadingPromotions = false;
        _promotions = [];
      });
      print('❌ Error loading promotions: $e');

      // Don't show error snackbar for promotions, just log it
      // Promotions are not critical for booking flow
    }
  }

  /// Toggle favourite status for current parking lot
  Future<void> _handleToggleFavourite() async {
    final parkingLotId =
        widget.parkingLot['_id']?.toString() ??
        widget.parkingLot['id']?.toString();

    if (parkingLotId == null || parkingLotId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID bãi đỗ xe'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isAddingFavourite = true;
    });

    try {
      if (_isFavourite) {
        await FavouritiesService.removeFromFavourites(
          parkingLotId: parkingLotId,
        );
        if (!mounted) return;
        setState(() {
          _isFavourite = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã xóa khỏi danh sách yêu thích'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        await FavouritiesService.addToFavourites(parkingLotId: parkingLotId);
        if (!mounted) return;
        setState(() {
          _isFavourite = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã thêm bãi đỗ vào danh sách yêu thích'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      if (e.toString().contains('409') || e.toString().contains('đã có')) {
        setState(() {
          _isFavourite = true;
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không thể thêm vào yêu thích: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        _isAddingFavourite = false;
      });
    }
  }

  /// Check if current parking lot is already in favourites
  Future<void> _loadFavouriteStatus() async {
    final parkingLotId =
        widget.parkingLot['_id']?.toString() ??
        widget.parkingLot['id']?.toString();

    if (parkingLotId == null || parkingLotId.isEmpty) return;

    try {
      final res = await FavouritiesService.getMyFavourites();
      final data = res['data'];
      if (data is List) {
        final exists = data.any(
          (item) => (item?['parkingLotId'] ?? '').toString() == parkingLotId,
        );
        if (mounted) {
          setState(() {
            _isFavourite = exists;
          });
        }
      }
    } catch (e) {
      debugPrint('Không thể tải trạng thái yêu thích: $e');
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
          actions: [
            IconButton(
              tooltip: _isFavourite
                  ? 'Xóa khỏi yêu thích'
                  : 'Thêm vào yêu thích',
              onPressed: _isAddingFavourite ? null : _handleToggleFavourite,
              icon: _isAddingFavourite
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(
                      _isFavourite ? Icons.favorite : Icons.favorite_border,
                      color: Colors.white,
                    ),
            ),
          ],
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

                // Booking method selection card
                BookingMethodCard(
                  selectedMethod: _selectedBookingMethod,
                  onMethodSelected: (method) {
                    setState(() {
                      _selectedBookingMethod = method;
                      // Reset selection when changing method
                      _selectedPricingPolicyId = null;
                      _isPackageType = false;
                      _availabilityData = {};
                      _selectedStartDate = null;
                      _selectedPromotion = null;
                      _userExpectedTime = null;
                      _estimatedEndTime = null;
                      // Reset cache when changing booking method
                      if (_lastLoadedBookingMethod != method) {
                        _lastLoadedParkingLotId = null;
                        _lastLoadedBookingMethod = null;
                      }
                    });
                    // Auto-load reservation availability when selecting "Đặt chỗ"
                    if (method == BookingMethod.reservation) {
                      _loadReservationAvailability();
                    }
                  },
                ),

                const SizedBox(height: 24),

                // Pricing table card (show for both methods)
                PricingTableCard(
                  pricingLinks: _getFilteredPricingLinks(),
                  isLoading: _isLoadingPricing,
                  selectedPricingPolicyId: _selectedPricingPolicyId,
                  onPricingSelected: _onPricingSelected,
                ),

                // Calendar for reservations (show immediately when selected)
                if (_selectedBookingMethod == BookingMethod.reservation) ...[
                  const SizedBox(height: 24),
                  SubscriptionCalendar(
                    availabilityData: _availabilityData,
                    selectedDate: _selectedStartDate,
                    onDateSelected: _onDateSelected,
                    isLoading: _isLoadingAvailability,
                  ),
                  // Time selection for reservation
                  if (_selectedStartDate != null) ...[
                    const SizedBox(height: 24),
                    ReservationTimeSelector(
                      userExpectedTime: _userExpectedTime,
                      estimatedEndTime: _estimatedEndTime,
                      selectedDate: _selectedStartDate,
                      tieredRateSetId: _getTieredRateSetId(),
                      onStartTimeSelected: (time) {
                        setState(() {
                          _userExpectedTime = time;
                          // Auto-set end time to 2 hours later if not set
                          if (_estimatedEndTime == null) {
                            final endHour = (time.hour + 2) % 24;
                            _estimatedEndTime = TimeOfDay(
                              hour: endHour,
                              minute: time.minute,
                            );
                          }
                        });
                      },
                      onEndTimeSelected: (time) {
                        setState(() {
                          _estimatedEndTime = time;
                        });
                      },
                    ),
                  ],
                ],

                // Calendar for package type subscriptions (show after selecting package)
                if (_isPackageType &&
                    _selectedBookingMethod == BookingMethod.subscription &&
                    _selectedPricingPolicyId != null) ...[
                  const SizedBox(height: 24),
                  SubscriptionCalendar(
                    availabilityData: _availabilityData,
                    selectedDate: _selectedStartDate,
                    onDateSelected: _onDateSelected,
                    isLoading: _isLoadingAvailability,
                  ),
                ],

                // Promotion card (show after calendar)
                if ((_selectedBookingMethod == BookingMethod.reservation &&
                        _selectedStartDate != null) ||
                    (_isPackageType &&
                        _selectedBookingMethod == BookingMethod.subscription &&
                        _selectedPricingPolicyId != null)) ...[
                  const SizedBox(height: 24),
                  PromotionCard(
                    promotions: _promotions,
                    isLoading: _isLoadingPromotions,
                    selectedPromotion: _selectedPromotion,
                    onPromotionSelected: (promotion) {
                      setState(() {
                        // Toggle promotion selection
                        final promotionId =
                            promotion['_id']?.toString() ??
                            promotion['id']?.toString();
                        final selectedId =
                            _selectedPromotion?['_id']?.toString() ??
                            _selectedPromotion?['id']?.toString();

                        if (selectedId == promotionId) {
                          _selectedPromotion = null;
                        } else {
                          _selectedPromotion = promotion;
                        }
                      });
                    },
                  ),
                ],

                // Payment summary card
                if (_shouldShowPaymentSummary()) ...[
                  const SizedBox(height: 24),
                  PaymentSummaryCard(
                    originalPrice:
                        _selectedBookingMethod == BookingMethod.subscription
                        ? _getOriginalPrice()
                        : null,
                    selectedPromotion: _selectedPromotion,
                    promotionName: _selectedPromotion?['name']?.toString(),
                    selectedDate:
                        _selectedBookingMethod == BookingMethod.reservation
                        ? _selectedStartDate
                        : null,
                    userExpectedTime:
                        _selectedBookingMethod == BookingMethod.reservation
                        ? _userExpectedTime
                        : null,
                    estimatedEndTime:
                        _selectedBookingMethod == BookingMethod.reservation
                        ? _estimatedEndTime
                        : null,
                    tieredRateSetId:
                        _selectedBookingMethod == BookingMethod.reservation
                        ? _getTieredRateSetId()
                        : null,
                  ),
                ],

                const SizedBox(height: 24),

                // Submit button
                BookingSubmitButton(
                  isLoading: _isCreating,
                  bookingMethod: _selectedBookingMethod,
                  onPressed: _selectedBookingMethod == BookingMethod.reservation
                      ? _handleCreateReservation
                      : _handleCreateSubscription,
                ),

                const SizedBox(height: 16),

                // Comments section
                Builder(
                  builder: (context) {
                    final parkingLotId =
                        widget.parkingLot['_id'] ??
                        widget.parkingLot['id'] ??
                        '';
                    if (parkingLotId.isEmpty) {
                      print(
                        '⚠️ Warning: Parking lot ID is empty in BookingScreen',
                      );
                      print('  Parking lot data: ${widget.parkingLot.keys}');
                    } else {
                      print('✅ Parking lot ID for comments: $parkingLotId');
                    }
                    return CommentsSection(parkingLotId: parkingLotId);
                  },
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Filter pricing links based on selected booking method
  List<Map<String, dynamic>> _getFilteredPricingLinks() {
    if (_selectedBookingMethod == null) {
      return []; // Don't show any pricing if no method is selected
    }

    return _pricingLinks.where((link) {
      final pricingPolicy = link['pricingPolicyId'];
      final basisId = pricingPolicy?['basisId'];
      final basisName = basisId?['basisName'] ?? basisId?['name'] ?? '';

      if (_selectedBookingMethod == BookingMethod.reservation) {
        // For reservation, only show TIERED pricing
        return basisName == 'TIERED';
      } else if (_selectedBookingMethod == BookingMethod.subscription) {
        // For subscription, only show PACKAGE pricing
        return basisName == 'PACKAGE';
      }

      return false;
    }).toList();
  }

  /// Handle pricing policy selection (toggle)
  void _onPricingSelected(String pricingPolicyId, Map<String, dynamic> link) {
    setState(() {
      // If clicking on already selected item, deselect it
      if (_selectedPricingPolicyId == pricingPolicyId) {
        _selectedPricingPolicyId = null;
        _isPackageType = false;
        _availabilityData = {};
        _selectedStartDate = null;
        _lastLoadedParkingLotId = null;
        _lastLoadedBookingMethod = null;
        print('❌ Deselected pricing policy: $pricingPolicyId');
      } else {
        _selectedPricingPolicyId = pricingPolicyId;
        print('✅ Selected pricing policy: $pricingPolicyId');

        // Check if this is a PACKAGE type or RESERVATION
        final pricingPolicy = link['pricingPolicyId'];
        final basisId = pricingPolicy?['basisId'];
        final basisName = basisId?['basisName'] ?? basisId?['name'] ?? '';

        if (_selectedBookingMethod == BookingMethod.reservation) {
          // For reservation, load reservation availability (only if not already loaded)
          _isPackageType = false;
          // Only load if we don't have data or parking lot changed
          final parkingLotId =
              widget.parkingLot['_id'] ?? widget.parkingLot['id'];
          if (_lastLoadedParkingLotId != parkingLotId ||
              _lastLoadedBookingMethod != BookingMethod.reservation ||
              _availabilityData.isEmpty) {
            _loadReservationAvailability();
          }
        } else if (basisName == 'PACKAGE') {
          // For subscription, load subscription availability (only if not already loaded)
          _isPackageType = true;
          final parkingLotId =
              widget.parkingLot['_id'] ?? widget.parkingLot['id'];
          if (_lastLoadedParkingLotId != parkingLotId ||
              _lastLoadedBookingMethod != BookingMethod.subscription ||
              _availabilityData.isEmpty) {
            _loadSubscriptionAvailability();
          }
        } else {
          _isPackageType = false;
          _availabilityData = {};
          _selectedStartDate = null;
          _lastLoadedParkingLotId = null;
          _lastLoadedBookingMethod = null;
        }
      }
    });
  }

  /// Load reservation availability for the selected parking lot
  Future<void> _loadReservationAvailability() async {
    final parkingLotId = widget.parkingLot['_id'] ?? widget.parkingLot['id'];
    if (parkingLotId == null) {
      print('⚠️ Cannot load reservation availability: Parking lot ID is null');
      return;
    }

    // Prevent duplicate calls: check if already loading or already loaded for this parking lot
    if (_isLoadingAvailability) {
      print('⏸️ Already loading availability, skipping...');
      return;
    }

    // Check if we already have data for this parking lot and booking method
    if (_lastLoadedParkingLotId == parkingLotId &&
        _lastLoadedBookingMethod == BookingMethod.reservation &&
        _availabilityData.isNotEmpty) {
      print('✅ Availability already loaded for this parking lot, skipping...');
      return;
    }

    setState(() {
      _isLoadingAvailability = true;
    });

    try {
      print(
        '📅 Loading reservation availability for parking lot: $parkingLotId',
      );
      final availabilityMap =
          await BookingAvailabilityHelper.loadReservationAvailability(
            parkingLotId: parkingLotId,
          );

      if (mounted) {
        setState(() {
          _availabilityData = availabilityMap;
          _isLoadingAvailability = false;
          _lastLoadedParkingLotId = parkingLotId;
          _lastLoadedBookingMethod = BookingMethod.reservation;
        });
        print(
          '✅ Loaded reservation availability: ${availabilityMap.length} days',
        );
      }
    } catch (e) {
      print('❌ Error loading reservation availability: $e');
      if (mounted) {
        setState(() {
          _isLoadingAvailability = false;
          _availabilityData = {};
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải lịch đặt chỗ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Load subscription availability for the selected parking lot
  Future<void> _loadSubscriptionAvailability() async {
    final parkingLotId = widget.parkingLot['_id'] ?? widget.parkingLot['id'];
    if (parkingLotId == null) {
      print('⚠️ Cannot load availability: Parking lot ID is null');
      return;
    }

    // Prevent duplicate calls: check if already loading
    if (_isLoadingAvailability) {
      print('⏸️ Already loading availability, skipping...');
      return;
    }

    // Check if we already have data for this parking lot and booking method
    if (_lastLoadedParkingLotId == parkingLotId &&
        _lastLoadedBookingMethod == BookingMethod.subscription &&
        _availabilityData.isNotEmpty) {
      print('✅ Availability already loaded for this parking lot, skipping...');
      return;
    }

    setState(() {
      _isLoadingAvailability = true;
    });

    try {
      print(
        '📅 Loading subscription availability for parking lot: $parkingLotId',
      );
      final availabilityMap =
          await BookingAvailabilityHelper.loadSubscriptionAvailability(
            parkingLotId: parkingLotId,
          );

      if (mounted) {
        setState(() {
          _availabilityData = availabilityMap;
          _isLoadingAvailability = false;
          _lastLoadedParkingLotId = parkingLotId;
          _lastLoadedBookingMethod = BookingMethod.subscription;
        });
        print('✅ Loaded subscription availability');
      }
    } catch (e) {
      print('❌ Error loading subscription availability: $e');
      if (mounted) {
        setState(() {
          _isLoadingAvailability = false;
          _availabilityData = {};
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải lịch: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Handle date selection from calendar
  void _onDateSelected(DateTime date) {
    setState(() {
      _selectedStartDate = date;
      // Reset time when date changes
      _userExpectedTime = null;
      _estimatedEndTime = null;
    });
    print('📅 Selected start date: $date');
  }

  /// Get tieredRateSetId from selected pricing policy
  dynamic _getTieredRateSetId() {
    if (_selectedPricingPolicyId == null) {
      return null;
    }

    final selectedLink = _pricingLinks.firstWhere((link) {
      final pricingPolicy = link['pricingPolicyId'];
      final pricingPolicyId = pricingPolicy?['_id'] ?? pricingPolicy?['id'];
      return pricingPolicyId == _selectedPricingPolicyId;
    }, orElse: () => <String, dynamic>{});

    if (selectedLink.isEmpty) {
      return null;
    }

    final pricingPolicy = selectedLink['pricingPolicyId'];
    return pricingPolicy?['tieredRateSetId'];
  }

  /// Check if payment summary should be shown
  bool _shouldShowPaymentSummary() {
    if (_selectedBookingMethod == BookingMethod.reservation) {
      return _selectedStartDate != null &&
          _userExpectedTime != null &&
          _estimatedEndTime != null &&
          _getTieredRateSetId() != null;
    } else if (_selectedBookingMethod == BookingMethod.subscription) {
      return _selectedPricingPolicyId != null;
    }
    return false;
  }

  /// Get original price based on booking method (only for subscription)
  int _getOriginalPrice() {
    if (_selectedBookingMethod == BookingMethod.subscription) {
      // Get price from selected pricing link
      if (_selectedPricingPolicyId == null) {
        return 0;
      }

      final selectedLink = _pricingLinks.firstWhere((link) {
        final pricingPolicy = link['pricingPolicyId'];
        final pricingPolicyId = pricingPolicy?['_id'] ?? pricingPolicy?['id'];
        return pricingPolicyId == _selectedPricingPolicyId;
      }, orElse: () => <String, dynamic>{});

      if (selectedLink.isEmpty) {
        return 0;
      }

      final pricingPolicy = selectedLink['pricingPolicyId'];

      // Get price from packageRateId (for PACKAGE type subscriptions)
      final packageRate = pricingPolicy?['packageRateId'];

      if (packageRate != null && packageRate is Map) {
        final price = packageRate['price'];
        if (price is num && price > 0) {
          print('✅ Found subscription price from packageRateId: $price');
          return price.toInt();
        }
      }

      // Fallback: try fixedPrice if available
      if (pricingPolicy != null) {
        final fixedPrice = pricingPolicy['fixedPrice'];
        if (fixedPrice is num && fixedPrice > 0) {
          print('✅ Found subscription price from fixedPrice: $fixedPrice');
          return fixedPrice.toInt();
        }
        final price = pricingPolicy['price'];
        if (price is num && price > 0) {
          print('✅ Found subscription price from price: $price');
          return price.toInt();
        }
      }

      print(
        '⚠️ Could not find subscription price. PricingPolicy: ${pricingPolicy?.keys.toList()}',
      );
      return 0;
    }
    return 0;
  }

  /// Handle create reservation
  Future<void> _handleCreateReservation() async {
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

    if (_selectedStartDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn ngày đặt chỗ'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_userExpectedTime == null || _estimatedEndTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn thời gian vào và thời gian ra'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_selectedPricingPolicyId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn bảng giá'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Find the selected pricing link
    final selectedLink = _pricingLinks.firstWhere((link) {
      final pricingPolicy = link['pricingPolicyId'];
      final pricingPolicyId = pricingPolicy?['_id'] ?? pricingPolicy?['id'];
      return pricingPolicyId == _selectedPricingPolicyId;
    }, orElse: () => <String, dynamic>{});

    if (selectedLink.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy thông tin bảng giá đã chọn'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isCreating = true;
    });

    await BookingFlowHelper.createReservation(
      context: context,
      parkingLotId: parkingLotId,
      pricingPolicyId: _selectedPricingPolicyId!,
      selectedDate: _selectedStartDate!,
      userExpectedTime: _userExpectedTime!,
      estimatedEndTime: _estimatedEndTime!,
      selectedLink: selectedLink,
      parkingLot: widget.parkingLot,
      selectedPromotion: _selectedPromotion,
    );

    if (mounted) {
      setState(() {
        _isCreating = false;
      });
    }
  }

  /// Handle create subscription
  Future<void> _handleCreateSubscription() async {
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

    if (_selectedPricingPolicyId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn gói thuê bao'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_isPackageType && _selectedStartDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn ngày bắt đầu cho gói thuê bao'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Find the selected pricing link
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

    setState(() {
      _isCreating = true;
    });

    await BookingFlowHelper.createSubscription(
      context: context,
      parkingLotId: parkingLotId,
      pricingPolicyId: _selectedPricingPolicyId!,
      selectedLink: selectedLink,
      parkingLot: widget.parkingLot,
      selectedStartDate: _selectedStartDate,
      selectedPromotion: _selectedPromotion,
    );

    if (mounted) {
      setState(() {
        _isCreating = false;
      });
    }
  }
}
