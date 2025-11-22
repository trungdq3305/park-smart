import 'package:flutter/material.dart';
import '../../../widgets/app_scaffold.dart';
import '../../../services/parking_lot_service.dart';
import '../../../widgets/booking/card/parking_lot_info_card.dart';
import '../../../widgets/booking/card/pricing_table_card.dart';
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
  List<Map<String, dynamic>> _pricingLinks = [];
  String? _selectedPricingPolicyId;
  Map<String, dynamic> _availabilityData = {};
  DateTime? _selectedStartDate;
  bool _isPackageType = false;
  BookingMethod? _selectedBookingMethod;
  TimeOfDay? _userExpectedTime;
  TimeOfDay? _estimatedEndTime;

  @override
  void initState() {
    super.initState();
    _loadPricingLinks();
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
        print('❌ Deselected pricing policy: $pricingPolicyId');
      } else {
        _selectedPricingPolicyId = pricingPolicyId;
        print('✅ Selected pricing policy: $pricingPolicyId');

        // Check if this is a PACKAGE type or RESERVATION
        final pricingPolicy = link['pricingPolicyId'];
        final basisId = pricingPolicy?['basisId'];
        final basisName = basisId?['basisName'] ?? basisId?['name'] ?? '';

        if (_selectedBookingMethod == BookingMethod.reservation) {
          // For reservation, load reservation availability
          _isPackageType = false;
          _loadReservationAvailability();
        } else if (basisName == 'PACKAGE') {
          // For subscription, load subscription availability
          _isPackageType = true;
          _loadSubscriptionAvailability();
        } else {
          _isPackageType = false;
          _availabilityData = {};
          _selectedStartDate = null;
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

    setState(() {
      _isLoadingAvailability = true;
    });

    try {
      final availabilityMap =
          await BookingAvailabilityHelper.loadReservationAvailability(
            parkingLotId: parkingLotId,
          );

      setState(() {
        _availabilityData = availabilityMap;
        _isLoadingAvailability = false;
      });
    } catch (e) {
      print('❌ Error loading reservation availability: $e');
      setState(() {
        _isLoadingAvailability = false;
        _availabilityData = {};
      });

      if (mounted) {
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

    setState(() {
      _isLoadingAvailability = true;
    });

    try {
      final availabilityMap =
          await BookingAvailabilityHelper.loadSubscriptionAvailability(
            parkingLotId: parkingLotId,
          );

      setState(() {
        _availabilityData = availabilityMap;
        _isLoadingAvailability = false;
      });
    } catch (e) {
      print('❌ Error loading subscription availability: $e');
      setState(() {
        _isLoadingAvailability = false;
        _availabilityData = {};
      });

      if (mounted) {
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
    );

    if (mounted) {
      setState(() {
        _isCreating = false;
      });
    }
  }
}
