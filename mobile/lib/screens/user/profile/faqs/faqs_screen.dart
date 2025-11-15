import 'package:flutter/material.dart';
import '../../../../services/faq_service.dart';
import '../../../../widgets/app_scaffold.dart';
import 'faq_detail_screen.dart';

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
      final response = await FaqService.getFaqs(
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

  void _navigateToDetail(Map<String, dynamic> faq) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => FaqDetailScreen(faq: faq)),
    );
  }

  Widget _buildFaqCard(Map<String, dynamic> faq) {
    final question = faq['question'] ?? 'Không có câu hỏi';

    return InkWell(
      onTap: () => _navigateToDetail(faq),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
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
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.help_outline,
                color: Colors.green.shade700,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    question,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade900,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Chạm để xem chi tiết',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade500,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey.shade400),
          ],
        ),
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
                        'Hiện tại chưa có câu hỏi thường gặp nào',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                        textAlign: TextAlign.center,
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
      ),
    );
  }
}
