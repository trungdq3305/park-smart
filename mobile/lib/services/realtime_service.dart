import 'dart:async';
import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class RealtimeService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  IO.Socket? _socket;
  StreamController<Map<String, dynamic>>? _controller;
  final Set<String> _pendingRooms = <String>{};

  String get _httpBase => dotenv.env['BASE_URL'] ?? '';

  Future<String?> _getToken() async {
    final accessToken = await _storage.read(key: 'accessToken');
    if (accessToken != null && accessToken.isNotEmpty) return accessToken;

    final userData = await _storage.read(key: 'data');
    if (userData != null) {
      try {
        final Map<String, dynamic> data = jsonDecode(userData);
        return data['backendToken'] ?? data['idToken'] ?? data['accessToken'];
      } catch (_) {}
    }
    return null;
  }

  Uri _buildWsBaseUri() {
    final isHttps = _httpBase.startsWith('https://');
    final scheme = isHttps ? 'wss' : 'ws';
    final host = _httpBase
        .replaceFirst(RegExp(r'^https?://'), '')
        .replaceAll(RegExp(r'/$'), '');
    return Uri.parse('$scheme://$host');
  }

  Stream<Map<String, dynamic>> connectAndListen({required String roomName}) {
    _controller?.close();
    _controller = StreamController<Map<String, dynamic>>.broadcast();

    () async {
      final token = await _getToken();
      if (token == null) {
        _controller?.addError('No authentication token found');
        return;
      }

      final base = _buildWsBaseUri();
      _socket = IO.io(
        base.toString(),
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setExtraHeaders({'Authorization': 'Bearer $token'})
            .disableAutoConnect()
            .build(),
      );

      _socket!.onConnect((_) {
        // join initial room
        _socket!.emit('join-room', {'newRoom': roomName});
        // join any pending rooms queued before connection
        if (_pendingRooms.isNotEmpty) {
          for (final r in _pendingRooms) {
            _socket!.emit('join-room', {'newRoom': r});
          }
          _pendingRooms.clear();
        }
      });

      _socket!.on('parking-lot-spots-updated', (data) {
        try {
          final map = data is Map<String, dynamic>
              ? data
              : Map<String, dynamic>.from(jsonDecode(jsonEncode(data)));
          _controller?.add(map);
        } catch (_) {}
      });

      _socket!.onDisconnect((_) {});
      _socket!.onError((err) => _controller?.addError(err));

      _socket!.connect();
    }();

    return _controller!.stream;
  }

  void joinRoom(String roomName) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('join-room', {'newRoom': roomName});
    } else {
      _pendingRooms.add(roomName);
    }
  }

  void dispose() {
    _socket?.disconnect();
    _socket?.destroy();
    _socket = null;
    _controller?.close();
    _controller = null;
  }
}
