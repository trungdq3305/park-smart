import 'package:flutter/material.dart';
import 'package:mobile/screens/user/home_screen.dart';
import 'package:mobile/screens/user/parking_lot_screen.dart';
import 'package:mobile/screens/user/profile_screen.dart';
import 'package:mobile/screens/user/message_list_screen.dart';
import 'package:mobile/screens/user/notification_screen.dart';
import 'package:mobile/services/notification_service.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class MainWrapper extends StatefulWidget {
  const MainWrapper({super.key});

  @override
  State<MainWrapper> createState() => _MainWrapperState();
}

class _MainWrapperState extends State<MainWrapper> {
  int _currentIndex = 0;
  int? _unreadNotificationCount;

  // 1. Khai báo danh sách nhưng không khởi tạo giá trị ngay
  late List<Widget> _pages;

  @override
  void initState() {
    super.initState();

    // 2. Khởi tạo danh sách tại đây
    _pages = [
      HomeScreen(
        onNavigateToTab: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
      const MessageListScreen(),
      const ParkingLotScreen(),
      const NotificationScreen(),
      const ProfileScreen(),
    ];

    _loadUnreadCount();
    _startPeriodicRefresh();
  }

  void _startPeriodicRefresh() {
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) {
        _loadUnreadCount();
        _startPeriodicRefresh();
      }
    });
  }

  Future<void> _loadUnreadCount() async {
    try {
      final response = await NotificationService.getUnreadCount();
      final data = response['data'];
      int? count;

      if (data is Map) {
        count = data['unreadCount'] ?? data['count'];
      } else if (data is int) {
        count = data;
      }

      if (mounted) {
        setState(() {
          _unreadNotificationCount = count ?? 0;
        });
      }
    } catch (e) {
      print('❌ Error loading unread count: $e');
      // Don't show error to user, just log it
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        transitionBuilder: (child, animation) {
          final offsetAnimation = Tween<Offset>(
            begin: const Offset(0.05, 0),
            end: Offset.zero,
          ).animate(animation);
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(position: offsetAnimation, child: child),
          );
        },
        child: KeyedSubtree(
          key: ValueKey<int>(_currentIndex),
          child: _pages[_currentIndex],
        ),
      ),
      showBottomNav: true,
      currentIndex: _currentIndex,
      unreadNotificationCount: _unreadNotificationCount,
      onTapBottomNav: (index) {
        setState(() {
          _currentIndex = index;
        });
        // Refresh unread count when navigating to notification screen
        if (index == 3) {
          _loadUnreadCount();
        }
      },
    );
  }
}
