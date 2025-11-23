import 'package:flutter/material.dart';

class SubscriptionCalendar extends StatefulWidget {
  final Map<String, dynamic> availabilityData;
  final DateTime? selectedDate;
  final Function(DateTime) onDateSelected;
  final bool isLoading;

  const SubscriptionCalendar({
    super.key,
    required this.availabilityData,
    this.selectedDate,
    required this.onDateSelected,
    this.isLoading = false,
  });

  @override
  State<SubscriptionCalendar> createState() => _SubscriptionCalendarState();
}

class _SubscriptionCalendarState extends State<SubscriptionCalendar> {
  late DateTime _currentMonth;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _currentMonth = DateTime.now();
    _selectedDate = widget.selectedDate ?? DateTime.now();
  }

  @override
  void didUpdateWidget(SubscriptionCalendar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedDate != null && widget.selectedDate != _selectedDate) {
      _selectedDate = widget.selectedDate!;
      _currentMonth = DateTime(_selectedDate.year, _selectedDate.month);
    }
  }

  /// Format date to yyyy-MM-dd string
  String _formatDate(DateTime date) {
    final year = date.year.toString();
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  /// Get availability for a specific date
  Map<String, dynamic>? _getAvailabilityForDate(DateTime date) {
    final dateKey = _formatDate(date);
    return widget.availabilityData[dateKey];
  }

  /// Check if date has availability data
  bool _hasAvailabilityData(DateTime date) {
    final dateKey = _formatDate(date);
    return widget.availabilityData.containsKey(dateKey);
  }

  /// Check if date is available
  bool _isDateAvailable(DateTime date) {
    final availability = _getAvailabilityForDate(date);
    return availability?['isAvailable'] == true;
  }

  /// Get remaining slots for a date
  int _getRemaining(DateTime date) {
    final availability = _getAvailabilityForDate(date);
    return availability?['remaining'] ?? 0;
  }

  /// Check if date is fully booked (has data but not available)
  bool _isFullyBooked(DateTime date) {
    if (!_hasAvailabilityData(date)) return false;
    return !_isDateAvailable(date);
  }

  /// Check if date is in the past
  bool _isPastDate(DateTime date) {
    final today = DateTime.now();
    final todayOnly = DateTime(today.year, today.month, today.day);
    final dateOnly = DateTime(date.year, date.month, date.day);
    return dateOnly.isBefore(todayOnly);
  }

  /// Get days in month
  List<DateTime> _getDaysInMonth(DateTime month) {
    final firstDay = DateTime(month.year, month.month, 1);
    final lastDay = DateTime(month.year, month.month + 1, 0);
    final daysInMonth = lastDay.day;

    // Get first day of week (Monday = 1, Sunday = 7)
    int firstWeekday = firstDay.weekday;
    // Convert to Sunday = 0, Monday = 1, ..., Saturday = 6
    firstWeekday = firstWeekday == 7 ? 0 : firstWeekday;

    final days = <DateTime>[];

    // Add empty cells for days before the first day of month
    for (int i = 0; i < firstWeekday; i++) {
      days.add(DateTime(month.year, month.month, 0 - i));
    }

    // Add all days in month
    for (int i = 1; i <= daysInMonth; i++) {
      days.add(DateTime(month.year, month.month, i));
    }

    return days;
  }

  void _previousMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
    });
  }

  /// Format month and year in Vietnamese
  String _formatMonthYear(DateTime date) {
    const months = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ];
    return '${months[date.month - 1]} ${date.year}';
  }

  void _selectDate(DateTime date) {
    if (_isPastDate(date)) return;
    if (!_hasAvailabilityData(date)) return;
    if (!_isDateAvailable(date)) return;

    setState(() {
      _selectedDate = date;
    });
    widget.onDateSelected(date);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return Container(
        padding: const EdgeInsets.all(24),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final days = _getDaysInMonth(_currentMonth);
    final monthName = _formatMonthYear(_currentMonth);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with month navigation
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: _previousMonth,
                color: Colors.green,
              ),
              Text(
                monthName,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: _nextMonth,
                color: Colors.green,
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Weekday headers
          Row(
            children: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                .map((day) => Expanded(
                      child: Center(
                        child: Text(
                          day,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 8),
          // Calendar grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1,
              crossAxisSpacing: 4,
              mainAxisSpacing: 4,
            ),
            itemCount: days.length,
            itemBuilder: (context, index) {
              final date = days[index];
              final isCurrentMonth = date.month == _currentMonth.month;
              final isSelected = isCurrentMonth &&
                  date.year == _selectedDate.year &&
                  date.month == _selectedDate.month &&
                  date.day == _selectedDate.day;
              final isPast = _isPastDate(date);
              final hasData = _hasAvailabilityData(date);
              final isAvailable = _isDateAvailable(date);
              final isFullyBooked = _isFullyBooked(date);
              final remaining = _getRemaining(date);

              // Skip rendering if not in current month
              if (!isCurrentMonth) {
                return const SizedBox.shrink();
              }

              // Determine cell style based on date status
              Color cellColor;
              Color textColor;
              String? statusText;

              if (isPast) {
                cellColor = Colors.grey.shade100;
                textColor = Colors.grey.shade400;
              } else if (isSelected) {
                cellColor = Colors.green.shade100;
                textColor = Colors.green.shade700;
              } else if (!hasData) {
                // No data available (beyond 15 days)
                cellColor = Colors.grey.shade50;
                textColor = Colors.grey.shade600;
                statusText = '?';
              } else if (isFullyBooked) {
                // Has data but fully booked
                cellColor = Colors.red.shade50;
                textColor = Colors.red.shade700;
              } else if (isAvailable) {
                // Has data and available
                cellColor = Colors.green.shade50;
                textColor = Colors.black87;
              } else {
                // Fallback
                cellColor = Colors.grey.shade50;
                textColor = Colors.grey.shade600;
              }

              return InkWell(
                onTap: (isPast || !hasData || !isAvailable)
                    ? null
                    : () => _selectDate(date),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  decoration: BoxDecoration(
                    color: cellColor,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected
                          ? Colors.green.shade600
                          : Colors.transparent,
                      width: isSelected ? 2 : 0,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '${date.day}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: textColor,
                        ),
                      ),
                      if (hasData && isAvailable && !isPast && remaining > 0) ...[
                        const SizedBox(height: 2),
                        Text(
                          '$remaining',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                      if (statusText != null && !isPast) ...[
                        const SizedBox(height: 2),
                        Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          // Legend
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              _buildLegendItem(
                Colors.green.shade50,
                Colors.green.shade600,
                'Còn chỗ',
              ),
              _buildLegendItem(
                Colors.red.shade50,
                Colors.red.shade600,
                'Hết chỗ',
              ),
              _buildLegendItem(
                Colors.grey.shade50,
                Colors.grey.shade600,
                'Chưa có thông tin',
              ),
              _buildLegendItem(
                Colors.grey.shade100,
                Colors.grey.shade400,
                'Quá khứ',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color bgColor, Color textColor, String label) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: textColor, width: 1),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade700,
          ),
        ),
      ],
    );
  }
}

