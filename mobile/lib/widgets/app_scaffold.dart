import 'package:flutter/material.dart';
import 'bottom_nav_bar.dart';

class AppScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final bool showBottomNav;
  final int currentIndex;
  final ValueChanged<int>? onTapBottomNav;
  final Color? backgroundColor;
  final Widget? floatingActionButton;

  const AppScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.showBottomNav = false,
    this.currentIndex = 0,
    this.onTapBottomNav,
    this.backgroundColor,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor ?? Colors.white,
      appBar: appBar,
      body: body,
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: showBottomNav
          ? BottomNavBar(
              currentIndex: currentIndex,
              onTap: (index) => onTapBottomNav?.call(index),
            )
          : null,
    );
  }
}
