import 'package:flutter/material.dart';

class ReservationTimeSelector extends StatelessWidget {
  final TimeOfDay? userExpectedTime;
  final TimeOfDay? estimatedEndTime;
  final Function(TimeOfDay) onStartTimeSelected;
  final Function(TimeOfDay) onEndTimeSelected;

  const ReservationTimeSelector({
    super.key,
    required this.userExpectedTime,
    required this.estimatedEndTime,
    required this.onStartTimeSelected,
    required this.onEndTimeSelected,
  });

  @override
  Widget build(BuildContext context) {
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
          Row(
            children: [
              Icon(Icons.access_time, color: Colors.blue.shade600, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Thời gian đặt chỗ',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _TimePickerCard(
                  label: 'Thời gian vào',
                  icon: Icons.login,
                  iconColor: Colors.green,
                  selectedTime: userExpectedTime,
                  onTap: () async {
                    final TimeOfDay? picked = await showTimePicker(
                      context: context,
                      initialTime: userExpectedTime ?? TimeOfDay.now(),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: ColorScheme.light(
                              primary: Colors.green,
                              onPrimary: Colors.white,
                              onSurface: Colors.black,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (picked != null) {
                      onStartTimeSelected(picked);
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _TimePickerCard(
                  label: 'Thời gian ra',
                  icon: Icons.logout,
                  iconColor: Colors.orange,
                  selectedTime: estimatedEndTime,
                  onTap: () async {
                    if (userExpectedTime == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Vui lòng chọn thời gian vào trước'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                      return;
                    }
                    final TimeOfDay? picked = await showTimePicker(
                      context: context,
                      initialTime: estimatedEndTime ??
                          TimeOfDay(
                            hour: (userExpectedTime!.hour + 2) % 24,
                            minute: userExpectedTime!.minute,
                          ),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: ColorScheme.light(
                              primary: Colors.orange,
                              onPrimary: Colors.white,
                              onSurface: Colors.black,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (picked != null) {
                      // Validate end time is after start time
                      final startMinutes =
                          userExpectedTime!.hour * 60 + userExpectedTime!.minute;
                      final endMinutes = picked.hour * 60 + picked.minute;
                      if (endMinutes <= startMinutes) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Thời gian ra phải sau thời gian vào'),
                            backgroundColor: Colors.red,
                          ),
                        );
                        return;
                      }
                      onEndTimeSelected(picked);
                    }
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TimePickerCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color iconColor;
  final TimeOfDay? selectedTime;
  final VoidCallback onTap;

  const _TimePickerCard({
    required this.label,
    required this.icon,
    required this.iconColor,
    required this.selectedTime,
    required this.onTap,
  });

  String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selectedTime != null ? iconColor : Colors.grey.shade300,
            width: selectedTime != null ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
            children: [
              Icon(
                icon,
                color: iconColor,
                size: 20,
              ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              selectedTime != null
                  ? _formatTimeOfDay(selectedTime!)
                  : 'Chọn thời gian',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: selectedTime != null
                    ? Colors.black87
                    : Colors.grey.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

