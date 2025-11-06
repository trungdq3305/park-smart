import 'dart:async';

// No external bloc deps; keeping lightweight

import '../../services/term_policy_service.dart';

class TermPolicyState {
  final bool isLoading;
  final String? errorMessage;
  final List<Map<String, dynamic>> items;
  final String query;

  const TermPolicyState({
    required this.isLoading,
    required this.items,
    this.errorMessage,
    this.query = '',
  });

  List<Map<String, dynamic>> get filteredItems {
    if (query.isEmpty) return items;
    final lower = query.toLowerCase();
    return items
        .where((e) {
          final title = (e['title'] ?? e['name'] ?? '')
              .toString()
              .toLowerCase();
          final content = (e['content'] ?? e['description'] ?? '')
              .toString()
              .toLowerCase();
          return title.contains(lower) || content.contains(lower);
        })
        .toList(growable: false);
  }

  TermPolicyState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<Map<String, dynamic>>? items,
    String? query,
    bool clearError = false,
  }) {
    return TermPolicyState(
      isLoading: isLoading ?? this.isLoading,
      items: items ?? this.items,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      query: query ?? this.query,
    );
  }
}

class TermPolicyBloc {
  final _stateController = StreamController<TermPolicyState>.broadcast();
  TermPolicyState _state = const TermPolicyState(isLoading: false, items: []);

  Stream<TermPolicyState> get stream => _stateController.stream;
  TermPolicyState get state => _state;

  Timer? _debounce;

  void _emit(TermPolicyState newState) {
    _state = newState;
    _stateController.add(newState);
  }

  Future<void> load({int page = 1, int pageSize = 100}) async {
    _emit(_state.copyWith(isLoading: true, clearError: true));
    try {
      final res = await TermPolicyService.getAllTermPolicies(
        page: page,
        pageSize: pageSize,
      );
      // Expect structure: { data: [...] } OR [...]
      List<Map<String, dynamic>> items = [];
      final data = res['data'];
      if (data is List) {
        items = List<Map<String, dynamic>>.from(data);
      } else if (res.isNotEmpty && res.values.first is List) {
        items = List<Map<String, dynamic>>.from(res.values.first);
      }
      _emit(_state.copyWith(isLoading: false, items: items));
    } catch (e) {
      _emit(_state.copyWith(isLoading: false, errorMessage: '$e'));
    }
  }

  void onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _emit(_state.copyWith(query: query));
    });
  }

  void dispose() {
    _debounce?.cancel();
    _stateController.close();
  }
}
