import 'package:flutter/material.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      showSelectedLabels: false,
      showUnselectedLabels: false,
      items: [
        BottomNavigationBarItem(
          icon: Image.asset(
            'assets/wired-outline-63-home-hover-3d-roll.png',
            width: 40,
            height: 40,
          ),
          label: 'Trang chủ',
        ),
        BottomNavigationBarItem(
          icon: Image.asset(
            'assets/wired-outline-19-magnifier-zoom-search-hover-spin.png',
            width: 40,
            height: 40,
          ),
          label: 'Tìm kiếm',
        ),
        BottomNavigationBarItem(
          icon: Image.asset(
            'assets/wired-outline-19-magnifier-zoom-search-hover-spin.png',
            width: 40,
            height: 40,
          ),
          label: 'Trò chuyện',
        ),
        BottomNavigationBarItem(
          icon: Image.asset(
            'assets/wired-outline-45-clock-time-hover-pinch.png',
            width: 40,
            height: 40,
          ),
          label: 'Gần đây',
        ),
        BottomNavigationBarItem(
          icon: Image.asset(
            'assets/wired-outline-981-consultation-hover-conversation.png',
            width: 40,
            height: 40,
          ),
          label: 'Tài khoản',
        ),
      ],
    );
  }
}
