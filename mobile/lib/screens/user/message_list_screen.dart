import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/services/user_service.dart';
import 'package:mobile/services/chat_service.dart';
import 'chat/message_chat_screen.dart';
import 'chat/chatbot_chat_screen.dart';

class MessageListScreen extends StatefulWidget {
  const MessageListScreen({super.key});

  @override
  State<MessageListScreen> createState() => _MessageListScreenState();
}

class _MessageListScreenState extends State<MessageListScreen> {
  String? _currentUserId;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  Map<String, dynamic>? _searchResult;
  bool _isSearching = false;
  List<Map<String, dynamic>> _suggestions = [];

  @override
  void initState() {
    super.initState();
    _loadUserId();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim();
    setState(() {
      _searchQuery = query.toLowerCase();
      if (query.isEmpty) {
        _searchResult = null;
        _isSearching = false;
        _suggestions = [];
      }
    });

    if (query.isNotEmpty &&
        RegExp(r'^[0-9]+$').hasMatch(query) &&
        query.length >= 8) {
      _searchByPhone(query);
    }
  }

  Future<void> _searchByPhone(String phone) async {
    setState(() => _isSearching = true);
    try {
      final result = await ChatService.getAccountByPhone(phone: phone);
      if (mounted) {
        setState(() {
          _searchResult = result;
          _isSearching = false;
          _suggestions = _extractSuggestions(result);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  List<Map<String, dynamic>> _extractSuggestions(Map<String, dynamic> result) {
    final data = result['data'];
    if (data is List)
      return data.map((e) => Map<String, dynamic>.from(e)).toList();
    if (data is Map<String, dynamic>) return [data];
    return [];
  }

  Future<void> _loadUserId() async {
    final userId = await UserService.getUserId();
    if (mounted) setState(() => _currentUserId = userId);
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUserId == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Tin nhắn'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
        ),
        body: Stack(
          children: [
            Column(
              children: [
                _buildSearchBar(),
                Expanded(
                  child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                    stream: FirebaseFirestore.instance
                        .collection('chatRooms')
                        .doc(_currentUserId!)
                        .collection('rooms')
                        .orderBy('updatedAt', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData)
                        return const Center(child: CircularProgressIndicator());

                      var chats = snapshot.data!.docs
                          .where((doc) => doc.id != 'ai_chatbot')
                          .toList();

                      return ListView.builder(
                        itemCount: chats.length + 1, // +1 cho AI Assistant
                        itemBuilder: (context, index) {
                          if (index == 0) return _buildAiChatItem();

                          final chatData = chats[index - 1].data();
                          final updatedAt = chatData['updatedAt'] as Timestamp?;

                          return ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: Colors.green,
                              child: Icon(Icons.person, color: Colors.white),
                            ),
                            title: Text(
                              chatData['peerName'] ?? 'Người dùng',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Text(
                              chatData['lastMessage'] ?? '',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                if (updatedAt != null)
                                  Text(
                                    _formatTime(updatedAt.toDate()),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                if ((chatData['unreadCount'] ?? 0) > 0)
                                  Badge(
                                    label: Text(
                                      chatData['unreadCount'].toString(),
                                    ),
                                    backgroundColor: Colors.green,
                                  ),
                              ],
                            ),
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => MessageChatScreen(
                                  peerUserId: chatData['peerId'],
                                  peerDisplayName: chatData['peerName'],
                                ),
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
            if (_suggestions.isNotEmpty) _buildSuggestionsOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildAiChatItem() {
    return ListTile(
      leading: const CircleAvatar(
        backgroundColor: Colors.blue,
        child: Icon(Icons.smart_toy, color: Colors.white),
      ),
      title: const Text(
        'Trợ lý AI',
        style: TextStyle(fontWeight: FontWeight.bold),
      ),
      subtitle: const Text('Hỏi tôi về ứng dụng...'),
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ChatbotChatScreen()),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(8),
      color: Colors.green,
      child: TextField(
        controller: _searchController,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: 'Tìm số điện thoại...',
          hintStyle: const TextStyle(color: Colors.white70),
          prefixIcon: const Icon(Icons.search, color: Colors.white),
          filled: true,
          fillColor: Colors.white.withOpacity(0.2),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(25),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildSuggestionsOverlay() {
    return Positioned(
      top: 60,
      left: 10,
      right: 10,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: _suggestions
              .map(
                (s) => ListTile(
                  title: Text(s['fullName'] ?? 'User'),
                  subtitle: Text(s['phone'] ?? ''),
                  onTap: () {
                    setState(() => _suggestions = []);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MessageChatScreen(
                          peerUserId: s['_id'],
                          peerDisplayName: s['fullName'] ?? 'User',
                        ),
                      ),
                    );
                  },
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    if (now.difference(dateTime).inDays == 0)
      return '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    if (now.difference(dateTime).inDays == 1) return 'Hôm qua';
    return '${dateTime.day}/${dateTime.month}';
  }
}
