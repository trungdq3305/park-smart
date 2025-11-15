import 'package:flutter/material.dart';
import '../../../services/faq_service.dart';
import '../../../widgets/app_scaffold.dart';

class FaqsScreen extends StatefulWidget {
  const FaqsScreen({super.key});

  @override
  State<FaqsScreen> createState() => _FaqsScreenState();
}

class _FaqsScreenState extends State<FaqsScreen> {
  List<Map<String, dynamic>> _faqs = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;
  int _currentPage = 1;
  int _pageSize = 10;
  bool _hasMore = true;
  Set<String> _expandedFaqIds = {};

  @override
  void initState() {
    super.initState();
    _loadFaqs();
  }

  Future<void> _loadFaqs({bool loadMore = false}) async {
    if (loadMore) {
      if (!_hasMore || _isLoadingMore) return;
      setState(() {
        _isLoadingMore = true;
      });
    } else {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
        _currentPage = 1;
        _hasMore = true;
      });
    }

    try {
      final response = await FaqService.getMyFaqs(
        page: _currentPage,
        pageSize: _pageSize,
      );

      // Handle nested data structure
      dynamic faqsData = response['data'];
      List<Map<String, dynamic>> newFaqs = [];

      if (faqsData is Map && faqsData.containsKey('data')) {
        final nestedData = faqsData['data'];
        if (nestedData is List) {
          newFaqs = List<Map<String, dynamic>>.from(nestedData);
        }
        final totalPages = faqsData['totalPages'] ?? 1;

        setState(() {
          if (loadMore) {
            _faqs.addAll(newFaqs);
          } else {
            _faqs = newFaqs;
          }
          _hasMore = _currentPage < totalPages;
          if (_hasMore) {
            _currentPage++;
          }
          _isLoading = false;
          _isLoadingMore = false;
        });
      } else if (faqsData is List) {
        newFaqs = List<Map<String, dynamic>>.from(faqsData);
        final pagination = response['pagination'];
        final totalPages = pagination?['totalPages'] ?? 1;

        setState(() {
          if (loadMore) {
            _faqs.addAll(newFaqs);
          } else {
            _faqs = newFaqs;
          }
          _hasMore = _currentPage < totalPages;
          if (_hasMore) {
            _currentPage++;
          }
          _isLoading = false;
          _isLoadingMore = false;
        });
      } else {
        setState(() {
          if (loadMore) {
            // No more data
          } else {
            _faqs = [];
          }
          _hasMore = false;
          _isLoading = false;
          _isLoadingMore = false;
        });
      }

      print(
        '✅ Loaded ${newFaqs.length} FAQs (page ${loadMore ? _currentPage - 1 : _currentPage})',
      );
    } catch (e) {
      print('❌ Error loading FAQs: $e');
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
        _isLoadingMore = false;
      });

      if (mounted && !loadMore) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải FAQs: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadMoreFaqs() async {
    await _loadFaqs(loadMore: true);
  }

  void _toggleExpand(String faqId) {
    setState(() {
      if (_expandedFaqIds.contains(faqId)) {
        _expandedFaqIds.remove(faqId);
      } else {
        _expandedFaqIds.add(faqId);
      }
    });
  }

  Future<void> _showAddEditFaqDialog({Map<String, dynamic>? faq}) async {
    final questionController = TextEditingController(
      text: faq?['question'] ?? '',
    );
    final answerController = TextEditingController(text: faq?['answer'] ?? '');
    final formKey = GlobalKey<FormState>();
    bool isSubmitting = false;

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 500),
            padding: const EdgeInsets.all(24),
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      Icon(
                        faq == null ? Icons.add_circle : Icons.edit,
                        color: Colors.green.shade600,
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          faq == null ? 'Thêm FAQ mới' : 'Chỉnh sửa FAQ',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: isSubmitting
                            ? null
                            : () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Question field
                  TextFormField(
                    controller: questionController,
                    decoration: InputDecoration(
                      labelText: 'Câu hỏi',
                      hintText: 'Nhập câu hỏi...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixIcon: const Icon(Icons.help_outline),
                    ),
                    maxLines: 2,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Vui lòng nhập câu hỏi';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Answer field
                  TextFormField(
                    controller: answerController,
                    decoration: InputDecoration(
                      labelText: 'Câu trả lời',
                      hintText: 'Nhập câu trả lời...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixIcon: const Icon(Icons.info_outline),
                    ),
                    maxLines: 5,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Vui lòng nhập câu trả lời';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: isSubmitting
                            ? null
                            : () => Navigator.pop(context),
                        child: const Text('Hủy'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                if (!formKey.currentState!.validate()) return;

                                setDialogState(() {
                                  isSubmitting = true;
                                });

                                try {
                                  if (faq == null) {
                                    await FaqService.createFaq(
                                      question: questionController.text.trim(),
                                      answer: answerController.text.trim(),
                                    );
                                  } else {
                                    await FaqService.updateFaq(
                                      id: faq['_id'] ?? faq['id'],
                                      question: questionController.text.trim(),
                                      answer: answerController.text.trim(),
                                    );
                                  }

                                  if (mounted) {
                                    Navigator.pop(context);
                                    await _loadFaqs();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          faq == null
                                              ? 'Đã thêm FAQ thành công'
                                              : 'Đã cập nhật FAQ thành công',
                                        ),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  setDialogState(() {
                                    isSubmitting = false;
                                  });
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Lỗi: $e'),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                        ),
                        child: isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : Text(faq == null ? 'Thêm' : 'Cập nhật'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    questionController.dispose();
    answerController.dispose();
  }

  Future<void> _deleteFaq(String faqId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: const Text('Bạn có chắc chắn muốn xóa FAQ này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await FaqService.deleteFaq(id: faqId);
      await _loadFaqs();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã xóa FAQ thành công'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi xóa FAQ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildFaqCard(Map<String, dynamic> faq) {
    final faqId = faq['_id'] ?? faq['id'] ?? '';
    final question = faq['question'] ?? 'Không có câu hỏi';
    final answer = faq['answer'] ?? 'Không có câu trả lời';
    final isExpanded = _expandedFaqIds.contains(faqId);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 0,
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Question header
          InkWell(
            onTap: () => _toggleExpand(faqId),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              topRight: Radius.circular(16),
            ),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.green.shade50, Colors.green.shade100],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isExpanded
                      ? Radius.zero
                      : const Radius.circular(16),
                  bottomRight: isExpanded
                      ? Radius.zero
                      : const Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.shade200,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.help_outline,
                      color: Colors.green.shade700,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      question,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade900,
                      ),
                    ),
                  ),
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: Colors.green.shade700,
                  ),
                ],
              ),
            ),
          ),

          // Answer (expandable)
          if (isExpanded)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 20,
                        color: Colors.blue.shade600,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Câu trả lời',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    answer,
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.grey.shade800,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton.icon(
                        onPressed: () => _showAddEditFaqDialog(faq: faq),
                        icon: const Icon(Icons.edit, size: 18),
                        label: const Text('Sửa'),
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.blue.shade600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton.icon(
                        onPressed: () => _deleteFaq(faqId),
                        icon: const Icon(Icons.delete, size: 18),
                        label: const Text('Xóa'),
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.red.shade600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Câu hỏi thường gặp'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
          actions: [
            IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'Thêm FAQ mới',
              onPressed: () => _showAddEditFaqDialog(),
            ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                ),
              )
            : _errorMessage != null && _faqs.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red.shade400,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Không thể tải FAQs',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton.icon(
                        onPressed: () => _loadFaqs(),
                        icon: const Icon(Icons.refresh, size: 20),
                        label: const Text(
                          'Thử lại',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : _faqs.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.question_answer_outlined,
                        size: 64,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Chưa có FAQ nào',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Hãy thêm FAQ mới để bắt đầu',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton.icon(
                        onPressed: () => _showAddEditFaqDialog(),
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm FAQ mới'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : RefreshIndicator(
                onRefresh: () => _loadFaqs(),
                color: Colors.green.shade600,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _faqs.length + (_hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _faqs.length) {
                      if (_isLoadingMore) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.green,
                              ),
                            ),
                          ),
                        );
                      }
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        _loadMoreFaqs();
                      });
                      return const SizedBox.shrink();
                    }

                    return _buildFaqCard(_faqs[index]);
                  },
                ),
              ),
        floatingActionButton: _faqs.isNotEmpty
            ? FloatingActionButton(
                onPressed: () => _showAddEditFaqDialog(),
                backgroundColor: Colors.green,
                child: const Icon(Icons.add, color: Colors.white),
              )
            : null,
      ),
    );
  }
}
