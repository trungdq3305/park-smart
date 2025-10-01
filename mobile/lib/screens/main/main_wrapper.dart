import 'package:flutter/material.dart';
import 'package:mobile/screens/user/home_screen.dart';
import 'package:mobile/screens/user/parking_lot_screen.dart';
import 'package:mobile/screens/user/chat_screen.dart';
import 'package:mobile/screens/user/recent_screen.dart';
import 'package:mobile/screens/user/profile_screen.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class MainWrapper extends StatefulWidget {
  const MainWrapper({super.key});

  @override
  State<MainWrapper> createState() => _MainWrapperState();
}

class _MainWrapperState extends State<MainWrapper> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomeScreen(),
    const ChatScreen(),
    const ParkingLotScreen(),
    const RecentScreen(),
    const ProfileScreen(),
  ];

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
      onTapBottomNav: (index) {
        setState(() {
          _currentIndex = index;
        });
      },
    );
  }
}
