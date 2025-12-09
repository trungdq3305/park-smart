import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/services/chat_service.dart';
import 'package:mobile/services/user_service.dart';

class ChatbotChatScreen extends StatefulWidget {
  const ChatbotChatScreen({super.key});

  @override
  State<ChatbotChatScreen> createState() => _ChatbotChatScreenState();
}

class _ChatbotChatScreenState extends State<ChatbotChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;
  String? _currentUserId;
  static const String _aiBotId = 'ai_chatbot';
  static const String _aiBotName = 'Trợ lý Hướng dẫn';

  @override
  void initState() {
    super.initState();
    _loadUserId();
  }

  Future<void> _loadUserId() async {
    final userId = await UserService.getUserId();
    if (mounted) {
      setState(() {
        _currentUserId = userId;
      });
      await _initializeRoom();
    }
  }

  Future<void> _initializeRoom() async {
    if (_currentUserId == null) return;
    final roomRef = _roomRef();
    if (roomRef == null) return;

    // Create room if it doesn't exist
    final roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      await roomRef.set({
        'peerId': _aiBotId,
        'peerName': _aiBotName,
        'lastMessage': '',
        'updatedAt': FieldValue.serverTimestamp(),
        'unreadCount': 0,
      });
    }
  }

  // Get room document reference
  DocumentReference<Map<String, dynamic>>? _roomRef() {
    if (_currentUserId == null) return null;
    return FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(_currentUserId!)
        .collection('rooms')
        .doc(_aiBotId);
  }

  // Get messages subcollection reference
  CollectionReference<Map<String, dynamic>>? _messagesRef() {
    if (_currentUserId == null) return null;
    return FirebaseFirestore.instance
        .collection('chatRooms')
        .doc(_currentUserId!)
        .collection('rooms')
        .doc(_aiBotId)
        .collection('messages');
  }

  // Load history from Firestore for API
  Future<List<Map<String, String>>> _loadHistory() async {
    if (_currentUserId == null) return [];
    try {
      final messagesRef = _messagesRef();
      if (messagesRef == null) return [];

      final snapshot = await messagesRef
          .orderBy('timestamp', descending: false)
          .limit(50)
          .get();

      final history = <Map<String, String>>[];
      for (final doc in snapshot.docs) {
        final data = doc.data();
        final text = data['text']?.toString() ?? '';
        String sender = data['sender']?.toString() ?? 'user';
        // Convert 'bot' to 'model' for API (API requires 'user' or 'model')
        if (sender == 'bot') {
          sender = 'model';
        }
        if (text.isNotEmpty) {
          history.add({'text': text, 'sender': sender});
        }
      }
      return history;
    } catch (e) {
      print('Error loading history: $e');
      return [];
    }
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isSending || _currentUserId == null) return;

    final messagesRef = _messagesRef();
    final roomRef = _roomRef();
    if (messagesRef == null || roomRef == null) return;

    setState(() => _isSending = true);

    try {
      final now = FieldValue.serverTimestamp();

      // Save user message to Firestore
      await messagesRef.add({'text': text, 'sender': 'user', 'timestamp': now});

      // Update room
      await roomRef.update({'lastMessage': text, 'updatedAt': now});

      _textController.clear();
      _scrollToBottom();

      // Load history from Firestore for API
      final history = await _loadHistory();

      // Call API to get bot response
      final response = await ChatService.sendChatMessage(
        newMessage: text,
        history: history,
      );

      // Extract answer from response
      String answer = '';
      try {
        final data = response['data'];
        if (data is List && data.isNotEmpty) {
          answer = data[0]['answer']?.toString() ?? '';
        } else if (data is Map) {
          answer = data['answer']?.toString() ?? '';
        }
      } catch (e) {
        print('Error parsing response: $e');
        answer = 'Xin lỗi, tôi không thể xử lý câu hỏi này.';
      }

      if (answer.isEmpty) {
        answer = 'Xin lỗi, tôi không thể xử lý câu hỏi này.';
      }

      // Save bot response to Firestore
      await messagesRef.add({
        'text': answer,
        'sender': 'bot',
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Update room with bot's last message
      await roomRef.update({
        'lastMessage': answer,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      _scrollToBottom();
    } catch (e) {
      print('Error sending message: $e');
      // Save error message to Firestore
      final messagesRef = _messagesRef();
      if (messagesRef != null) {
        await messagesRef.add({
          'text': 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
          'sender': 'bot',
          'timestamp': FieldValue.serverTimestamp(),
        });
      }
      _scrollToBottom();
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted && _scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Trợ lý Hướng dẫn'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: _currentUserId == null
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  Expanded(
                    child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                      stream: _messagesRef()!
                          .orderBy('timestamp', descending: true)
                          .limit(200)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }

                        final docs = snapshot.data?.docs ?? [];
                        if (docs.isEmpty) {
                          return const Center(
                            child: Text(
                              'Xin chào! Tôi là Trợ lý Hướng dẫn. Hãy hỏi tôi bất cứ điều gì về ứng dụng.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey,
                              ),
                            ),
                          );
                        }

                        return ListView.builder(
                          controller: _scrollController,
                          reverse: true,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          itemCount: docs.length,
                          itemBuilder: (context, index) {
                            final data = docs[index].data();
                            final isMe = data['sender'] == 'user';
                            final text = data['text']?.toString() ?? '';
                            final ts = data['timestamp'] as Timestamp?;
                            final time = ts != null
                                ? TimeOfDay.fromDateTime(
                                    ts.toDate(),
                                  ).format(context)
                                : '';

                            return Align(
                              alignment: isMe
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                constraints: BoxConstraints(
                                  maxWidth:
                                      MediaQuery.of(context).size.width * 0.75,
                                ),
                                decoration: BoxDecoration(
                                  color: isMe
                                      ? Colors.green.shade100
                                      : Colors.grey.shade200,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: isMe
                                      ? CrossAxisAlignment.end
                                      : CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      text,
                                      style: const TextStyle(fontSize: 15),
                                    ),
                                    if (time.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        time,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                  // Input area
                  SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _textController,
                              minLines: 1,
                              maxLines: 5,
                              textInputAction: TextInputAction.newline,
                              decoration: InputDecoration(
                                hintText: 'Nhập câu hỏi...',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                              ),
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: _isSending ? null : _sendMessage,
                            style: IconButton.styleFrom(
                              backgroundColor: _isSending
                                  ? Colors.grey.shade300
                                  : Colors.green,
                              foregroundColor: Colors.white,
                            ),
                            icon: _isSending
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
                                : const Icon(Icons.send),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
