import 'package:flutter/material.dart';
import 'package:mobile/services/report_service.dart';

/// Hiển thị flow báo cáo:
/// 1. Lấy danh sách category
/// 2. Hiển thị bottom sheet cho user chọn category
/// 3. Mở dialog nhập lý do + gửi báo cáo
Future<void> showParkingLotReportFlow(
  BuildContext context, {
  required String parkingLotId,
  required String parkingLotName,
}) async {
  try {
    final response = await ReportService.getReportCategories();
    final dynamic data = response['data'];

    final List<Map<String, dynamic>> categories;
    if (data is List) {
      categories = data
          .map<Map<String, dynamic>>(
            (item) => Map<String, dynamic>.from(item as Map),
          )
          .toList();
    } else {
      categories = const [];
    }

    if (categories.isEmpty) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Hiện chưa có loại báo cáo nào để chọn.'),
        ),
      );
      return;
    }

    if (!context.mounted) return;

    // Bước 1: chọn category
    final selectedCategory =
        await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
              top: 16,
              left: 16,
              right: 16,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Chọn loại báo cáo',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  parkingLotName,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: categories.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final category = categories[index];
                      final name =
                          (category['name'] ?? 'Không có tên').toString();
                      final description =
                          (category['description'] ?? '').toString();

                      return InkWell(
                        onTap: () => Navigator.of(ctx).pop(category),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: Colors.blue.shade100,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  Icons.report_problem,
                                  size: 20,
                                  color: Colors.blue.shade700,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    if (description.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        description,
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right,
                                color: Colors.grey,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );

    if (selectedCategory == null || !context.mounted) return;

    final categoryId =
        selectedCategory['_id']?.toString() ?? selectedCategory['id']?.toString();
    final categoryName =
        (selectedCategory['name'] ?? 'Loại báo cáo').toString();
    final categoryDescription =
        (selectedCategory['description'] ?? '').toString();

    if (categoryId == null || categoryId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không xác định được loại báo cáo, vui lòng thử lại.'),
        ),
      );
      return;
    }

    final result = await ReportDialog.show(
      context,
      parkingLotId: parkingLotId,
      parkingLotName: parkingLotName,
      defaultCategoryId: categoryId,
      categoryName: categoryName,
      categoryDescription: categoryDescription,
    );

    if (result == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Gửi báo cáo thành công. Cảm ơn bạn đã phản hồi!'),
        ),
      );
    }
  } catch (e) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Không thể tải danh sách loại báo cáo: $e'),
        backgroundColor: Colors.red,
      ),
    );
  }
}

class ReportDialog extends StatefulWidget {
  final String parkingLotId;
  final String parkingLotName;
  final String? defaultCategoryId;
  final String? categoryName;
  final String? categoryDescription;

  const ReportDialog({
    super.key,
    required this.parkingLotId,
    required this.parkingLotName,
    this.defaultCategoryId,
    this.categoryName,
    this.categoryDescription,
  });

  static Future<bool?> show(
    BuildContext context, {
    required String parkingLotId,
    required String parkingLotName,
    String? defaultCategoryId,
    String? categoryName,
    String? categoryDescription,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => ReportDialog(
        parkingLotId: parkingLotId,
        parkingLotName: parkingLotName,
        defaultCategoryId: defaultCategoryId,
        categoryName: categoryName,
        categoryDescription: categoryDescription,
      ),
    );
  }

  @override
  State<ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<ReportDialog> {
  final TextEditingController _reasonController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorText;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      setState(() {
        _errorText = 'Vui lòng nhập lý do báo cáo.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });

    try {
      final categoryId = widget.defaultCategoryId ?? 'GENERAL';
      await ReportService.createReport(
        parkingLotId: widget.parkingLotId,
        categoryId: categoryId,
        reason: reason,
      );

      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorText = 'Gửi báo cáo thất bại: $e';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        widget.categoryName ?? 'Báo cáo bãi đỗ xe',
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.parkingLotName,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (widget.categoryDescription != null &&
              widget.categoryDescription!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              widget.categoryDescription!,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade700,
              ),
            ),
          ],
          const SizedBox(height: 8),
          TextField(
            controller: _reasonController,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'Lý do báo cáo',
              hintText: 'Mô tả vấn đề bạn gặp phải...',
              errorText: _errorText,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: (_) {
              if (_errorText != null) {
                setState(() {
                  _errorText = null;
                });
              }
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red.shade600,
            foregroundColor: Colors.white,
          ),
          child: _isSubmitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('Gửi báo cáo'),
        ),
      ],
    );
  }
}


