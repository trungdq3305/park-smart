import 'package:flutter/material.dart';

class BottomNavBar extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  State<BottomNavBar> createState() => _BottomNavBarState();
}

class _BottomNavBarState extends State<BottomNavBar> {
  int? _hoveredIndex;

  Widget _buildIcon(IconData icon, int index) {
    final bool isSelected = widget.currentIndex == index;
    final bool isHovered = _hoveredIndex == index;
    final Color hoverColor = Colors.green.shade400;
    final Color iconColor = isSelected ? Colors.white : Colors.black87;

    return MouseRegion(
      onEnter: (_) => setState(() => _hoveredIndex = index),
      onExit: (_) => setState(() => _hoveredIndex = null),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isSelected
              ? hoverColor
              : (isHovered ? hoverColor.withOpacity(0.35) : Colors.transparent),
        ),
        child: Icon(icon, size: 26, color: iconColor),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      backgroundColor: Colors.white,
      elevation: 8,
      currentIndex: widget.currentIndex,
      onTap: widget.onTap,
      selectedItemColor: Colors.black,
      unselectedItemColor: Colors.black54,
      selectedIconTheme: const IconThemeData(size: 26),
      unselectedIconTheme: const IconThemeData(size: 26),
      showSelectedLabels: false,
      showUnselectedLabels: false,
      items: [
        BottomNavigationBarItem(
          icon: _buildIcon(Icons.home_rounded, 0),
          label: 'Trang chủ',
        ),
        BottomNavigationBarItem(
          icon: _buildIcon(Icons.search_rounded, 1),
          label: 'Tìm kiếm',
        ),
        BottomNavigationBarItem(
          icon: _buildIcon(Icons.chat_bubble_rounded, 2),
          label: 'Trò chuyện',
        ),
        BottomNavigationBarItem(
          icon: _buildIcon(Icons.history_rounded, 3),
          label: 'Gần đây',
        ),
        BottomNavigationBarItem(
          icon: _buildIcon(Icons.person_rounded, 4),
          label: 'Tài khoản',
        ),
      ],
    );
  }
}
