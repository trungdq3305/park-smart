import 'dart:async';
import 'package:flutter/material.dart';

import '../../../widgets/bloc/term_policy_bloc.dart';
import '../../../services/term_policy_service.dart';

class TermAndPolicyScreen extends StatefulWidget {
  const TermAndPolicyScreen({super.key});

  @override
  State<TermAndPolicyScreen> createState() => _TermAndPolicyScreenState();
}

class _TermAndPolicyScreenState extends State<TermAndPolicyScreen> {
  late final TermPolicyBloc _bloc;
  late final TextEditingController _searchController;
  StreamSubscription<TermPolicyState>? _sub;

  @override
  void initState() {
    super.initState();
    _bloc = TermPolicyBloc();
    _searchController = TextEditingController();
    _bloc.load(page: 1, pageSize: 100);
  }

  @override
  void dispose() {
    _sub?.cancel();
    _bloc.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Điều khoản & Chính sách'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: _bloc.onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Tìm kiếm điều khoản, chính sách...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey.shade100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 0,
                ),
              ),
            ),
          ),

          // Content
          Expanded(
            child: StreamBuilder<TermPolicyState>(
              stream: _bloc.stream,
              initialData: _bloc.state,
              builder: (context, snapshot) {
                final state = snapshot.data ?? _bloc.state;

                if (state.isLoading && state.items.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.errorMessage != null && state.items.isEmpty) {
                  return _buildError(state.errorMessage!);
                }

                final items = state.filteredItems;
                if (items.isEmpty) {
                  return _buildEmpty();
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final title =
                        (item['title'] ?? item['name'] ?? 'Không tiêu đề')
                            .toString();
                    final description =
                        (item['description'] ?? item['content'] ?? '')
                            .toString();
                    final id = (item['id'] ?? item['_id'] ?? '').toString();

                    return InkWell(
                      onTap: () => _showDetails(id, title),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.description, color: Colors.blue),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  if (description.isNotEmpty)
                                    Text(
                                      description,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade700,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.chevron_right),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, color: Colors.red.shade400, size: 40),
            const SizedBox(height: 12),
            Text(
              'Lỗi tải dữ liệu',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.red.shade400,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade700),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => _bloc.load(),
              icon: const Icon(Icons.refresh, color: Colors.white),
              label: const Text(
                'Thử lại',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.info_outline, color: Colors.blue.shade400, size: 40),
            const SizedBox(height: 12),
            const Text(
              'Không có dữ liệu điều khoản/chính sách',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'Thử thay đổi từ khóa tìm kiếm hoặc tải lại danh sách.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showDetails(String id, String title) async {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _TermPolicyDetailScreen(id: id, title: title),
      ),
    );
  }
}

class _TermPolicyDetailScreen extends StatefulWidget {
  final String id;
  final String title;
  const _TermPolicyDetailScreen({required this.id, required this.title});

  @override
  State<_TermPolicyDetailScreen> createState() =>
      _TermPolicyDetailScreenState();
}

class _TermPolicyDetailScreenState extends State<_TermPolicyDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await TermPolicyService.getTermPolicyById(widget.id);
      setState(() {
        _data = res['data'] is Map<String, dynamic>
            ? Map<String, dynamic>.from(res['data'])
            : res;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: Colors.red.shade400,
                      size: 40,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Lỗi tải chi tiết',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.red.shade400,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: _load,
                      icon: const Icon(Icons.refresh, color: Colors.white),
                      label: const Text(
                        'Thử lại',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    (_data?['title'] ?? _data?['name'] ?? widget.title)
                        .toString(),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if ((_data?['updatedAt'] ?? '').toString().isNotEmpty)
                    Text(
                      'Cập nhật: ${_data!['updatedAt']}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  const SizedBox(height: 16),
                  Text(
                    (_data?['content'] ??
                            _data?['description'] ??
                            'Không có nội dung')
                        .toString(),
                    style: const TextStyle(fontSize: 15, height: 1.5),
                  ),
                ],
              ),
            ),
    );
  }
}
