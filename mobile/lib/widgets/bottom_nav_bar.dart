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
    final Color iconColor = isSelected ? Colors.white : Colors.grey[400]!;

    return MouseRegion(
      onEnter: (_) => setState(() => _hoveredIndex = index),
      onExit: (_) => setState(() => _hoveredIndex = null),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(6),
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
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        height: 75,
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BottomNavigationBar(
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.transparent,
            elevation: 0,
            currentIndex: widget.currentIndex,
            onTap: widget.onTap,
            selectedItemColor: Colors.white,
            unselectedItemColor: Colors.grey[400],
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
                icon: _buildIcon(Icons.location_on_rounded, 2),
                label: 'Địa chỉ',
              ),
              BottomNavigationBarItem(
                icon: _buildIcon(Icons.message_outlined, 3),
                label: 'Tin nhắn',
              ),
              BottomNavigationBarItem(
                icon: _buildIcon(Icons.person_rounded, 4),
                label: 'Tài khoản',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
